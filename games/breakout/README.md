# Breakout

Remake di _Breakout_ (Atari, 1976) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Per ora ci sono il campo con il muro di mattoni, i punteggi e la racchetta; il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

| Comando              | Azione                           |
| -------------------- | -------------------------------- |
| Mouse o dito         | Muove la racchetta               |
| Frecce o **A**/**D** | Muove la racchetta               |
| **V**                | Schermo monocromatico o a colori |

La racchetta sta dove sta il puntatore, come sul cabinato stava dove girava la manopola. Sul telefono il dito può scorrere ovunque, anche sotto lo schermo di gioco, così non copre la pallina.

I valori incerti (velocità, angoli, posizioni) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts), i colori in [`src/colors.config.ts`](src/colors.config.ts).

```bash
pnpm dev:breakout   # dalla root del monorepo
pnpm build          # output in games/breakout/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo, mattoni, racchetta, pallina e suoni, ricavati dal manuale e dallo schema elettrico.
