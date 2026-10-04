# 14 · Pull request: anteprime e revisione con l'AI

Obiettivo: rendere una pull request facile da provare e da rivedere. Ogni PR pronta per la revisione ha la sua **anteprima giocabile** su GitHub Pages, e due skill di Claude Code fanno il lavoro del revisore: **`/pr-review`** scrive i commenti, **`/pr-resolve`** applica quelli sicuri e chiude le conversazioni.

Tutto è nato con _Lunar Lander_, il primo gioco sviluppato su un branch con una pull request, come farebbe un collaboratore esterno.

## 1. Un'anteprima per ogni pull request

Quando una PR passa da bozza a **pronta per la revisione**, e poi a ogni nuovo push, il gioco viene pubblicato in una cartella sua:

```
https://darkhelmet67.github.io/insert-coin/              il sito di main, invariato
https://darkhelmet67.github.io/insert-coin/pr-1/         l'anteprima della PR #1
```

Un commento sulla PR riporta il link e il commit pubblicato; quando la PR viene chiusa o unita la cartella sparisce e il commento lo dice. Le PR in bozza non hanno anteprima, quelle dai fork nemmeno: pubblicherebbero codice che nessuno ha ancora letto.

### Il problema: Pages pubblica tutto insieme

GitHub Pages, con la sorgente **GitHub Actions** (vedi la [guida 07](07-build-deploy.md)), non aggiunge file al sito: ogni deploy sostituisce **l'intero** sito con una cartella nuova. Se una PR pubblicasse solo la sua build, il sito di `main` sparirebbe.

La soluzione è tenere il sito pubblicato in un branch, `gh-pages`, che fa da **archivio**:

- la radice contiene il sito di `main`;
- ogni cartella `pr-<numero>` contiene un'anteprima.

Ogni deploy parte da quello che è già pubblicato e cambia solo la sua parte: `main` sostituisce tutto tranne le cartelle `pr-*`, una PR sostituisce solo la sua cartella. Poi pubblica su Pages l'intero archivio. Lo fa un'azione composta, [`.github/actions/publish-pages`](../.github/actions/publish-pages/action.yml), usata da tutti e due i casi:

```bash
if [[ "$TARGET" == "." ]]; then
  # The main site replaces everything except the previews.
  find _pages -mindepth 1 -maxdepth 1 ! -name .git ! -name 'pr-*' -exec rm -rf {} +
  cp -R "$SITE/." _pages/
else
  rm -rf "_pages/$TARGET"
  ...
fi
```

Il branch `gh-pages` contiene solo il sito costruito, non codice: `ci.yml` lo esclude dai controlli.

### Due workflow, per sicurezza

Un'anteprima richiede di **eseguire il codice della PR** (installare le dipendenze, costruire) e di **scrivere** sul repository (il branch `gh-pages`, il commento). Dare tutte e due le cose allo stesso job vorrebbe dire dare permessi di scrittura a codice non ancora rivisto. Il lavoro è quindi diviso in due:

| Workflow                                                          | Cosa esegue                                        | Permessi                   |
| ----------------------------------------------------------------- | -------------------------------------------------- | -------------------------- |
| [`pr-preview.yml`](../.github/workflows/pr-preview.yml)           | il codice della PR: controlli e build              | solo lettura               |
| [`publish-preview.yml`](../.github/workflows/publish-preview.yml) | solo il workflow di `main`: copia i file costruiti | scrittura, Pages, commenti |

Il primo costruisce il sito e lo carica come _artifact_ insieme al numero della PR. Il secondo parte quando il primo finisce (`on: workflow_run`), e GitHub esegue sempre la versione del file che sta su `main`: una PR non può cambiarlo per sé. Prima di pubblicare controlla quello che riceve, perché viene da un run del codice della PR:

```bash
[[ "$number" =~ ^[0-9]+$ ]] || { echo "Bad number: $number" >&2; exit 1; }
# The number must belong to the commit that was built; a newer push has its own run.
head=$(gh api "repos/${{ github.repository }}/pulls/$number" --jq .head.sha)
```

Così un'anteprima non può finire nella cartella di un'altra PR, e una build vecchia non sovrascrive una più recente.

Tutti i deploy, di `main` e delle anteprime, stanno nello stesso gruppo di `concurrency` (`pages`): uno alla volta, perché due modifiche contemporanee all'archivio si cancellerebbero a vicenda.

## 2. Una skill di Claude Code

Una **skill** è un file di istruzioni che Claude Code carica quando serve, e che si richiama come un comando: `/pr-review 1`. Le skill del progetto stanno in `.claude/skills/<nome>/SKILL.md` e sono versionate con il codice, quindi chiunque cloni il repository le ritrova. Il resto della cartella `.claude/` (note private, impostazioni locali) resta fuori da git:

```gitignore
.claude/*
!.claude/skills/
```

Un file `SKILL.md` ha un'intestazione con il nome, la descrizione (Claude la usa per capire quando la skill serve) e l'argomento atteso, poi le istruzioni in italiano semplice, come si scriverebbero per un collega:

```markdown
---
name: pr-review
description: Rivede una pull request di insert-coin come un revisore ...
argument-hint: '[numero della PR]'
---
```

Tutte e due le skill scelgono la PR allo stesso modo: il numero passato come argomento, oppure, se manca, l'unica PR aperta. Con nessuna PR aperta, o con più di una, si fermano e chiedono il numero.

Usano le API REST di GitHub con `gh api` e non `gh pr`, che passa da GraphQL: in Claude Code sul web GraphQL non è disponibile, e così le skill funzionano ovunque.

## 3. `/pr-review`: il revisore

[`/pr-review`](../.claude/skills/pr-review/SKILL.md) fa quello che fa il revisore automatico nella pagina di una PR:

1. legge le differenze **e** i file completi (un problema spesso sta fuori dalle righe cambiate);
2. le confronta con le regole di [CLAUDE.md](../CLAUDE.md) e con la guida delle meccaniche del gioco;
3. pubblica **una sola revisione** con un riepilogo e un commento su ogni riga da correggere.

Ogni commento dichiara la sua gravità: 🔴 _da correggere_, 🟡 _suggerimento_, 🟣 _nota_ su un problema che c'era già. Quando la correzione è precisa, il commento contiene un blocco `suggestion` di GitHub, che l'autore applica con un clic. La revisione è sempre di tipo `COMMENT`: l'AI non approva e non blocca, la decisione resta a una persona.

Un dettaglio delle API: un commento può stare solo su una riga presente nelle differenze. La skill spiega a Claude come leggere le intestazioni `@@ -a,b +c,d @@` per trovare le righe valide, e di spostare nel riepilogo ciò che non ci sta.

## 4. `/pr-resolve`: applicare i commenti

[`/pr-resolve`](../.claude/skills/pr-resolve/SKILL.md) legge le conversazioni aperte e, per ognuna, decide se il commento è:

- **pertinente**: riguarda codice di questa PR che esiste ancora, e la richiesta è chiara;
- **sicuro**: una modifica locale, senza segreti, permessi più ampi, nuove dipendenze, test tolti o regole di ESLint disattivate;
- **coerente** con CLAUDE.md e con l'originale: un valore "corretto" da un revisore va verificato sulla fonte, non accettato sulla fiducia.

Le modifiche accettate passano dagli stessi controlli di ogni commit (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) e finiscono in un solo commit sul branch della PR. Solo dopo il push ogni conversazione riceve una risposta con il commit (`✅ Applicato in 1a2b3c4: ...`) e viene chiusa. Quelle non applicate ricevono il motivo e restano aperte: decide l'autore.

L'ordine conta: rispondere e chiudere **dopo** il push garantisce che una conversazione chiusa corrisponda sempre a codice pubblicato.

## 5. Provalo

1. Apri una PR in bozza da un branch del repository, poi segnala che è pronta (**Ready for review**).
2. In **Actions** partono _PR preview_ e poi _Publish PR preview_; alla fine la PR riceve il commento con il link a `/pr-<numero>/`.
3. In Claude Code, nella cartella del progetto: `/pr-review`, poi leggi i commenti sulla PR.
4. `/pr-resolve`: le conversazioni applicate si chiudono, il commit compare nella PR e l'anteprima si aggiorna da sola.
5. Unisci la PR: il sito principale si aggiorna e la cartella dell'anteprima sparisce.

Il percorso, con le decisioni prese, è nel [diario AI](ai-workflow.md).
