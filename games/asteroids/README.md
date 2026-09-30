# Asteroids

Remake di _Asteroids_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Per ora c'è la nave, sola nello spazio: ruota, spinge con l'inerzia dell'originale e attraversa i bordi. Il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

| Comando                  | Azione        |
| ------------------------ | ------------- |
| Frecce ← → o **A**/**D** | Ruota la nave |
| Freccia ↑ o **W**        | Spinta        |

I valori incerti (per ora l'aspetto del fascio: spessore, alone, luminosità) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:asteroids  # dalla root del monorepo
pnpm build          # output in games/asteroids/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo vettoriale, nave, asteroidi, dischi volanti, iperspazio e suoni, ricavati dal programma originale.
- [11 · Grafica vettoriale](../../docs/11-grafica-vettoriale.md): il motore vettoriale condiviso, dai disegni della ROM alle linee luminose.
