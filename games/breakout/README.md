# Breakout

Remake di _Breakout_ (Atari, 1976) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Per ora la pagina mostra il campo con il muro di mattoni e i punteggi; il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

| Tasto | Azione                           |
| ----- | -------------------------------- |
| **V** | Schermo monocromatico o a colori |

I valori incerti (velocità, angoli, posizioni) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts), i colori in [`src/colors.config.ts`](src/colors.config.ts).

```bash
pnpm dev:breakout   # dalla root del monorepo
pnpm build          # output in games/breakout/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo, mattoni, racchetta, pallina e suoni, ricavati dal manuale e dallo schema elettrico.
