# 01 · Setup del monorepo

Obiettivo: un monorepo con pacchetti condivisi e un primo gioco che mostra "INSERT COIN" su un canvas. Alla fine `pnpm dev`, `pnpm test` e `pnpm build` funzionano.

## 1. Prerequisiti

```bash
node --version      # 22.13+ o 24 LTS (consigliata, vedi .nvmrc)
corepack enable     # attiva pnpm alla versione dichiarata in package.json
```

### Perché una versione minima di Node

Vite 8, Vitest e ESLint usano API recenti di Node, per esempio `styleText` di `node:util`. Con Node 18 o con un Node 20/22 non aggiornato, `pnpm dev` fallisce con un errore poco chiaro:

```
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
```

Per trasformarlo in un messaggio esplicito già durante `pnpm install`:

- `package.json` dichiara le versioni supportate in `engines.node` (`^22.13.0 || ^24.0.0 || >=26.0.0`, l'intersezione dei requisiti di Vite, Vitest ed ESLint);
- `.npmrc` contiene `engine-strict=true`;
- `.nvmrc` indica la versione consigliata, così con nvm basta `nvm use`.

## 2. Il workspace pnpm

`package.json` alla radice è privato (non si pubblica) e contiene solo gli script globali e gli strumenti di sviluppo. `pnpm-workspace.yaml` dice a pnpm dove cercare i pacchetti:

```yaml
packages:
  - 'packages/*'
  - 'games/*'
```

Gli strumenti si installano una volta sola alla radice:

```bash
pnpm add -Dw typescript vite vitest eslint @eslint/js typescript-eslint prettier \
  eslint-plugin-functional eslint-plugin-jsdoc
```

> Nota: `typescript-eslint` supporta TypeScript fino alla 6.0, quindi la versione è fissata a `~6.0`.

## 3. TypeScript condiviso

`tsconfig.base.json` contiene le regole comuni; ogni pacchetto lo estende con un `tsconfig.json` di due righe. Le opzioni più importanti:

| Opzione                              | Perché                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `strict`, `noUncheckedIndexedAccess` | Il compilatore trova i bug prima del browser, per esempio l'accesso a un alieno che non esiste più nell'array |
| `target: ES2022`                     | Codice moderno, nessun polyfill                                                                               |
| `moduleResolution: Bundler`          | Import risolti come fa Vite                                                                                   |
| `noEmit`                             | TypeScript controlla i tipi; il bundle lo produce Vite                                                        |

## 4. Un pacchetto condiviso

Ogni pacchetto in `packages/` ha questa forma:

```
packages/math/
├── package.json     "name": "@arcade/math", "exports": { ".": "./src/index.ts" }
├── tsconfig.json
└── src/index.ts
```

`exports` punta direttamente al sorgente TypeScript: nessun passo di build per i pacchetti, ci pensa Vite quando compila il gioco.

## 5. Il primo gioco

Un gioco dichiara i pacchetti che usa come dipendenze del workspace:

```json
"dependencies": { "@arcade/engine-core": "workspace:*" }
```

e li importa come qualsiasi libreria:

```ts
import { createGameLoop } from '@arcade/engine-core';
```

Il canvas ha la risoluzione originale del cabinato (224×256). Il CSS lo ingrandisce con `image-rendering: pixelated`, così i pixel restano quadrati e nitidi.

## 6. Un solo HTML, un solo CSS, un solo JS

`vite.config.ts` del gioco disattiva lo split del codice e fissa i nomi dei file (Vite 8 usa Rolldown come bundler, da cui `rolldownOptions`):

```ts
build: {
  target: 'es2022',
  cssCodeSplit: false,
  rolldownOptions: {
    output: { codeSplitting: false, entryFileNames: 'game.js', assetFileNames: 'game.[ext]' },
  },
},
```

Risultato di `pnpm build`:

```
dist/index.html
dist/game.css
dist/game.js
```

## 7. Test e qualità

- `pnpm test` esegue Vitest su tutti i file `*.test.ts` dei pacchetti.
- `pnpm typecheck` esegue `tsc` in ogni pacchetto.
- `pnpm lint` usa ESLint con le regole `strict` di typescript-eslint, più `eslint-plugin-functional` (stile funzionale e immutabile) ed `eslint-plugin-jsdoc` (commento obbligatorio su ogni funzione). Le regole sono spiegate in [CLAUDE.md](../CLAUDE.md).

## Verifica

```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm dev   # apri http://localhost:5173: deve comparire "INSERT COIN"
```

Prossima guida: [02 · Game loop](02-game-loop.md).
