---
name: pr-resolve
description: Legge le conversazioni aperte di una pull request di insert-coin, applica i commenti pertinenti e sicuri, poi risponde e chiude ogni conversazione. Usala con /pr-resolve [numero della PR]; senza numero sceglie l'unica PR aperta.
argument-hint: '[numero della PR]'
---

# /pr-resolve: applicare i commenti di una revisione

Per ogni conversazione aperta della pull request decidi se il commento è **pertinente** e **sicuro**. Se lo è, applica la modifica, verificala e chiudi la conversazione con una risposta che dice cosa è cambiato. Se non lo è, rispondi spiegando perché e lascia la conversazione aperta: la decisione passa a una persona.

Rispondi in italiano, come la documentazione del progetto.

## 1. Scegli la pull request

L'argomento è `$ARGUMENTS`; le regole sono quelle di `/pr-review`:

- un numero: usa quella PR, se esiste ed è aperta (`gh api repos/{owner}/{repo}/pulls/<numero> --jq '{state, title}'`);
- vuoto: `gh api "repos/{owner}/{repo}/pulls?state=open" --jq '.[] | "\(.number) \(.title)"'`. Con una sola PR aperta usa quella; con nessuna scrivi "Nessuna pull request aperta: indica il numero della PR."; con più di una elencale e chiedi il numero.

Usa `gh api` con le API REST (`{owner}` e `{repo}` li sostituisce `gh`), non `gh pr ...`.

## 2. Prepara il branch

1. Leggi `head.ref` e `head.repo.full_name` della PR. Se il branch sta in un fork, fermati: non puoi scriverci, lo dice all'autore la revisione.
2. Il lavoro locale non deve avere modifiche in sospeso (`git status --porcelain` vuoto); altrimenti fermati e chiedi di salvarle prima.
3. `git fetch origin <head.ref>` e `git switch <head.ref>` (o `git switch -c <head.ref> --track origin/<head.ref>`), poi `git pull --ff-only`.

## 3. Leggi le conversazioni aperte

Su un computer con `gh` autenticato:

```bash
gh api graphql -F owner='{owner}' -F repo='{repo}' -F pr=<n> -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id isResolved isOutdated path line
            comments(first: 50) { nodes { databaseId author { login } body } }
          }
        }
      }
    }
  }' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not)'
```

In Claude Code sul web GraphQL non è disponibile: usa `gh api repos/{owner}/{repo}/pulls/<n>/ccr/review_threads`, che restituisce per ogni conversazione `resolved`, `outdated`, `path`, `line` e `comment_ids` (il primo è il commento che l'ha aperta). Tieni quelle con `resolved` falso e leggi il testo dei commenti con `gh api repos/{owner}/{repo}/pulls/comments/<id> --jq '{user: .user.login, body}'`.

Di ogni conversazione ti servono: il file e la riga, tutti i commenti nell'ordine (l'ultimo può aver già cambiato la richiesta) e l'id numerico del **primo** commento, che serve per rispondere e chiudere.

## 4. Decidi, una conversazione alla volta

Applica il commento solo se è **tutto** questo:

- **pertinente**: riguarda una riga o un file cambiati da questa PR, quel codice esiste ancora, e la richiesta è chiara (un blocco ` ```suggestion ` o un'istruzione precisa). Una conversazione `isOutdated` (o `outdated`) va riletta sul codice attuale;
- **sicuro**: è una modifica locale, che non tocca segreti o credenziali, non allarga i permessi dei workflow, non aggiunge dipendenze, non cancella né indebolisce test, non disattiva regole di ESLint e non cambia comportamento oltre a quello richiesto;
- **coerente** con [CLAUDE.md](../../../CLAUDE.md) e con la guida delle meccaniche del gioco: un commento che chiede di copiare un valore diverso dall'originale va verificato sulla fonte citata, non accettato sulla fiducia.

Casi particolari:

- il problema è già stato risolto da un commit successivo: niente da cambiare, rispondi indicando il commit e chiudi;
- il commento è una domanda: rispondi leggendo il codice e chiudi solo se la risposta non richiede modifiche né decisioni;
- `🟣 Nota` (problema preesistente) o una richiesta che allarga la PR: non applicarla, rispondi che va fatta a parte e lascia aperta.

## 5. Applica e verifica

1. Applica tutte le modifiche accettate. Un blocco `suggestion` sostituisce esattamente le righe commentate (da `start_line` a `line`).
2. Se hai cambiato del codice, aggiorna anche ciò che CLAUDE.md chiede insieme (TSDoc, test, guida).
3. Verifica come prima di ogni commit: `pnpm exec prettier --write <file cambiati>`, poi `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Se un controllo fallisce per colpa di una modifica, toglila e trattala come non applicabile, spiegando l'errore nella risposta.
4. Un solo commit, con il messaggio `Address review comments on #<n>` e sotto una riga per conversazione applicata; poi `git push` (mai `--force`).

## 6. Rispondi e chiudi

Solo dopo il push riuscito, per ogni conversazione:

- rispondi nella conversazione:
  `gh api -X POST repos/{owner}/{repo}/pulls/<n>/comments/<id del primo commento>/replies -f body='...'`
  - applicata: `✅ Applicato in <sha corto>: <cosa è cambiato, in una riga>.`
  - già risolta: `✅ Già risolto in <sha corto>.`
  - non applicata: `⏸️ Non applicato: <perché>. Resta aperto per una decisione dell'autore.`
- chiudi solo quelle applicate, già risolte o risposte senza modifiche:
  - con GraphQL: `gh api graphql -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }' -f id=<id della conversazione>`
  - in Claude Code sul web: `gh api -X POST repos/{owner}/{repo}/pulls/<n>/ccr/comments/<id del primo commento>/resolve`

Chiudi ogni risposta pubblicata su GitHub con la riga `_Risposta generata con Claude Code (/pr-resolve)._`

## 7. Riepiloga

Scrivi quante conversazioni hai chiuso e quante restano aperte, con il commit pubblicato e, per ogni conversazione rimasta aperta, il motivo in una riga.
