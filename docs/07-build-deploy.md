# 07 · Build e deploy

Obiettivo: pubblicare i giochi su **GitHub Pages**, gratis e senza server, in modo che ogni push su `main` aggiorni il sito da solo. Alla fine Space Invaders è giocabile all'indirizzo <https://darkhelmet67.github.io/insert-coin/space-invaders/>.

File coinvolti: [`games/space-invaders/vite.config.ts`](../games/space-invaders/vite.config.ts), [`scripts/assemble-site.js`](../scripts/assemble-site.js), [`site/`](../site/), [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

## 1. Cosa produce la build di un gioco

Dalla [guida 01](01-setup-monorepo.md) ogni gioco si costruisce con Vite in tre file:

```bash
pnpm build
# games/space-invaders/dist/index.html   0.4 kB
# games/space-invaders/dist/game.css     0.2 kB
# games/space-invaders/dist/game.js     ~22 kB (circa 8 kB compresso)
```

Tutto il gioco (logica, grafica, font e suoni) sta in un solo modulo JavaScript di una ventina di KB: gli sprite sono testo e i suoni sono generati al volo, quindi non ci sono immagini né file audio da scaricare.

Un dettaglio della configurazione conta molto per il deploy:

```ts
export default defineConfig({
  base: './',
  // ...
});
```

Con `base: './'` l'HTML richiama `./game.js` con un percorso **relativo**. Per questo la stessa build funziona in `http://localhost:4173/`, in `https://darkhelmet67.github.io/insert-coin/space-invaders/` o in qualsiasi altra cartella, senza configurare l'indirizzo finale.

Per provare la build di produzione in locale:

```bash
pnpm build
pnpm --filter @arcade/space-invaders preview   # http://localhost:4173
```

## 2. Un sito con più giochi

GitHub Pages pubblica **una cartella**. Il monorepo avrà più giochi, quindi il sito è organizzato così:

```
_site/
├── index.html            pagina iniziale con l'elenco dei giochi (da site/)
├── style.css
├── space-invaders.png    anteprima del gioco
└── space-invaders/       la build del gioco (da games/space-invaders/dist)
    ├── index.html
    ├── game.css
    └── game.js
```

La pagina iniziale è HTML e CSS statici nella cartella [`site/`](../site/): non serve un framework per un elenco di link.

La cartella `_site` la monta un piccolo script Node, [`scripts/assemble-site.js`](../scripts/assemble-site.js). Copia `site/` e poi la cartella `dist` di ogni gioco che ha una build:

```js
const builtGames = () =>
  readdirSync(GAMES).filter((name) => existsSync(join(GAMES, name, 'dist', 'index.html')));

rmSync(SITE, { recursive: true, force: true });
cpSync(LANDING, SITE, { recursive: true });
builtGames().forEach((name) => {
  cpSync(join(GAMES, name, 'dist'), join(SITE, name), { recursive: true });
});
```

Un nuovo gioco in `games/` finisce nel sito senza toccare lo script; basta aggiungere la sua scheda in `site/index.html`.

Lo script è in JavaScript e non in TypeScript perché Node lo esegue direttamente, senza passare dalla compilazione. Il commento `// @ts-check` in cima chiede comunque all'editor di controllarne i tipi. Nel `package.json` della root:

```json
"build:site": "pnpm build && node scripts/assemble-site.js"
```

`_site/` è nel `.gitignore` e fra i file ignorati da ESLint e Prettier: è un risultato della build, non codice da versionare.

## 3. GitHub Actions: controllo e pubblicazione automatici

Il workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) parte a ogni push su `main` e ha due job.

**`build`** ripete i controlli che facciamo prima di ogni commit, poi costruisce il sito:

```yaml
- uses: actions/checkout@v5
- uses: ./.github/actions/checks # installazione, typecheck, lint, test
- run: pnpm build:site
- uses: actions/upload-pages-artifact@v4
  with:
    path: _site
```

I controlli stanno in un'azione composta, [`.github/actions/checks/action.yml`](../.github/actions/checks/action.yml), condivisa con il workflow dei feature branch (sezione 3 bis): i due workflow non possono controllare cose diverse.

```yaml
- uses: pnpm/action-setup@v4 # legge la versione di pnpm da "packageManager"
- uses: actions/setup-node@v5
  with:
    node-version-file: .nvmrc
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm typecheck
- run: pnpm lint
- run: pnpm test
```

Tre dettagli:

- La versione di Node viene da `.nvmrc` e quella di pnpm da `packageManager`: la CI usa gli stessi strumenti di chi sviluppa, senza numeri ripetuti in due posti.
- `--frozen-lockfile` fa fallire l'installazione se `pnpm-lock.yaml` non corrisponde al `package.json`: in CI le versioni devono essere esattamente quelle provate in locale.
- Se un test fallisce, il job si ferma e **il sito resta alla versione precedente**. Un push rotto non arriva mai ai giocatori.

**`deploy`** parte solo se `build` è andato a buon fine e pubblica l'artefatto:

```yaml
deploy:
  needs: build
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - id: deployment
      uses: actions/deploy-pages@v4
```

I permessi del workflow sono i minimi necessari: `pages: write` e `id-token: write` per pubblicare, `contents: write` per salvare il sito pubblicato nel branch `gh-pages`, che dalla [guida 14](14-pull-request.md) tiene insieme il sito di `main` e le anteprime delle pull request (lo fa l'azione `publish-pages`, che carica poi su Pages la cartella `_pages`). Il blocco `concurrency` evita due deploy contemporanei.

## 3 bis. Feature branch e pull request

Finché si lavora direttamente su `main`, il deploy è anche l'unico controllo. Quando il lavoro passa da un branch e da una pull request (dal quarto gioco, _Lunar Lander_, in poi), chi rivede la PR deve sapere se è verde **prima** di unirla. Lo fa un secondo workflow, [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), che controlla e costruisce ma non pubblica:

```yaml
on:
  push:
    branches-ignore: [main] # main ha già deploy.yml
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true # un push più recente rende inutile il run precedente

jobs:
  checks:
    if: github.event_name == 'push' || github.event.pull_request.head.repo.full_name != github.repository
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/checks
      - run: pnpm build
```

- **Push su qualunque branch tranne `main`:** ogni commit di un feature branch ha il suo segno verde o rosso, anche prima che esista la PR.
- **`pull_request` solo per i fork:** una PR da un branch dello stesso repository è già controllata dal suo push, e la condizione `if` evita di farlo due volte. Una PR da un fork (un contributor esterno, che non può fare push sul repository) invece ha solo questo evento.
- **Anche la build:** un gioco che compila nei test ma non nella build di produzione romperebbe il deploy successivo.
- **Permessi minimi:** solo `contents: read`. Il workflow dei branch non può pubblicare nulla: Pages resta legato a `main`.

## 4. Attivare GitHub Pages (una volta sola)

Il workflow non può attivare Pages da solo. Serve un passaggio manuale sul repository:

1. **Settings → Pages**.
2. In **Build and deployment → Source** scegliere **GitHub Actions**.
   Nient'altro: le proposte che compaiono sotto (come _Create your own_) servono a creare un nuovo workflow, ma il nostro è già nel repository.
3. Rilanciare il deploy. Se il primo run è fallito (succede quando il workflow arriva prima dell'attivazione di Pages), basta aprirlo in **Actions** e premere **Re-run failed jobs**. In alternativa: nella colonna di sinistra di **Actions** scegliere **Deploy to GitHub Pages** e premere **Run workflow**, oppure fare un nuovo push su `main`. Da smartphone la colonna di sinistra è nascosta: meglio usare il computer.

Dopo un minuto circa il sito è online. L'indirizzo compare nel riepilogo del job `deploy` e sotto **Settings → Pages**.

## 5. Verifica

- Il job `build` è verde: typecheck, lint, test e build sono passati.
- <https://darkhelmet67.github.io/insert-coin/> mostra l'elenco dei giochi.
- <https://darkhelmet67.github.io/insert-coin/space-invaders/> si gioca: **C** per la moneta, frecce e spazio.
- Nel pannello Network del browser la pagina scarica tre file: HTML, CSS e JavaScript.

Da qui in poi pubblicare è solo `git push`.

Prossima guida: [08 · Comandi touch](08-comandi-touch.md).
