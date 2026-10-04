---
name: pr-review
description: Rivede una pull request di insert-coin come un revisore (alla Copilot) e pubblica su GitHub una revisione con commenti sulle righe. Usala con /pr-review [numero della PR]; senza numero sceglie l'unica PR aperta.
argument-hint: '[numero della PR]'
---

# /pr-review: revisione di una pull request

Fai da revisore della pull request, come il revisore automatico di GitHub: leggi le modifiche, trova i problemi veri e pubblica **una** revisione con un riepilogo e un commento su ogni riga da correggere. Le conversazioni aperte così si chiudono poi con `/pr-resolve`.

Scrivi i commenti in italiano, come la documentazione del progetto. Non approvare e non chiedere modifiche bloccanti: la revisione è sempre di tipo `COMMENT`, perché la decisione di unire resta a una persona.

## 1. Scegli la pull request

L'argomento è `$ARGUMENTS`.

- Se è un numero, usa quella PR. Controlla che esista e sia aperta: `gh api repos/{owner}/{repo}/pulls/<numero> --jq '{state, draft, title}'`.
- Se è vuoto, elenca le PR aperte: `gh api "repos/{owner}/{repo}/pulls?state=open" --jq '.[] | "\(.number) \(.title)"'`.
  - una sola: usa quella;
  - nessuna: fermati e scrivi "Nessuna pull request aperta: indica il numero della PR da rivedere.";
  - più di una: fermati, elencale (numero e titolo) e chiedi di ripetere il comando con il numero.

Usa sempre `gh api` con le API REST: `{owner}` e `{repo}` li sostituisce `gh` leggendo il remote del repository. Non usare `gh pr ...` né GraphQL, che in Claude Code sul web non sono disponibili.

## 2. Raccogli il contesto

1. Dati della PR: `gh api repos/{owner}/{repo}/pulls/<n> --jq '{title, body, head: .head.sha, base: .base.ref, ref: .head.ref}'`. Tieni da parte `head`: è il commit da citare nella revisione.
2. File cambiati con le differenze: `gh api --paginate repos/{owner}/{repo}/pulls/<n>/files --jq '.[] | {filename, status, patch}'`. Se un file non ha `patch` (troppo grande o binario), leggilo dal commit.
3. Il codice completo, non solo le differenze: `git fetch origin pull/<n>/head` e leggi i file con `git show FETCH_HEAD:<percorso>`. Non cambiare il branch di lavoro.
4. Le regole del progetto: [CLAUDE.md](../../../CLAUDE.md), e per i giochi il file `docs/meccaniche-originali.md` del gioco toccato.
5. I commenti già presenti: `gh api --paginate repos/{owner}/{repo}/pulls/<n>/comments --jq '.[] | {path, line, body}'`. Non ripetere un problema già segnalato.

## 3. Rivedi

Cerca, in quest'ordine:

1. **Errori veri**: logica sbagliata, casi limite non gestiti, valori dell'originale copiati male rispetto alla guida delle meccaniche, test che non verificano quello che dicono, workflow di GitHub Actions che non farebbero ciò che promettono.
2. **Sicurezza**: segreti nel codice, permessi dei workflow più ampi del necessario, codice della PR eseguito con permessi di scrittura, input non controllati.
3. **Regole di CLAUDE.md**: stile funzionale senza classi, dati immutabili, arrow function, un commento TSDoc per ogni funzione e tipo, file piccoli, codice in inglese e documentazione in italiano, test Vitest per ogni funzionalità, valori incerti in `tuning.config.ts`, diario AI e prompt unico aggiornati quando la modifica è significativa.
4. **Documentazione**: guide e README che non corrispondono più al codice, link rotti.

Segnala solo ciò di cui sei sicuro dopo aver letto il codice completo: un commento sbagliato costa più di un problema non visto. Al massimo una quindicina di commenti; se ce ne sono di più, tieni i più gravi e cita gli altri nel riepilogo. Non commentare la formattazione: ci pensa Prettier.

Ogni commento inizia con la gravità:

- `🔴 Da correggere:` un errore, un problema di sicurezza o una regola di CLAUDE.md violata;
- `🟡 Suggerimento:` un miglioramento facoltativo;
- `🟣 Nota:` un problema che c'era già prima della PR, solo da sapere.

Poi spiega in poche righe il problema e il perché. Quando la correzione è precisa e sta sulle righe commentate, aggiungi un blocco di suggerimento di GitHub, che l'autore può applicare con un clic e che `/pr-resolve` applica così com'è:

````markdown
```suggestion
const delay = tuning.serveDelay;
```
````

## 4. Pubblica la revisione

Un commento può stare solo su una riga presente nelle differenze, dal lato nuovo (`RIGHT`): in una `patch`, le righe dopo `@@ -a,b +c,d @@` partono dalla riga `c` del file nuovo, e contano le righe che iniziano con `+` o con uno spazio (non quelle con `-`). Un problema su una riga non toccata dalla PR va nel riepilogo.

Scrivi la revisione in un file JSON temporaneo (fuori dal repository) e pubblicala con una sola chiamata:

```json
{
  "commit_id": "<head>",
  "event": "COMMENT",
  "body": "<riepilogo>",
  "comments": [
    { "path": "games/x/src/y.ts", "line": 42, "side": "RIGHT", "body": "🔴 Da correggere: ..." },
    {
      "path": "docs/z.md",
      "start_line": 10,
      "line": 12,
      "side": "RIGHT",
      "body": "🟡 Suggerimento: ..."
    }
  ]
}
```

```bash
gh api -X POST repos/{owner}/{repo}/pulls/<n>/reviews --input <file.json> --jq .html_url
```

Il riepilogo (`body`) dice in due o tre righe cosa fa la PR, quanti commenti ci sono per gravità e cosa conviene fare prima dell'unione. Se non hai trovato nulla, pubblica lo stesso la revisione senza `comments`, con un riepilogo che lo dice. Chiudi il riepilogo con la riga `_Revisione generata con Claude Code (/pr-review)._`

Se GitHub rifiuta un commento (`line must be part of the diff`), spostalo nel riepilogo e pubblica di nuovo.

## 5. Rispondi

Mostra il link alla revisione, il numero di commenti per gravità e i problemi principali in una riga ciascuno. Ricorda che `/pr-resolve <n>` applica le correzioni sicure e chiude le conversazioni.
