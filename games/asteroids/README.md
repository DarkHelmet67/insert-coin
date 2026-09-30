# Asteroids

Remake di _Asteroids_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. La partita è completa: nave, colpi, asteroidi che si dividono, ondate da 4 a 11, dischi volanti grandi e piccoli, tre vite con una in più ogni 10.000 punti, iperspazio, fine partita e record salvato nel browser. Ci sono anche i suoni del cabinato e la schermata di attesa. Su telefoni e tablet compare il pannello del cabinato: in orizzontale ai lati dello schermo, in verticale sotto; toccare lo schermo equivale a START. Il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

| Comando                  | Azione        |
| ------------------------ | ------------- |
| Frecce ← → o **A**/**D** | Ruota la nave |
| Freccia ↑ o **W**        | Spinta        |
| **Spazio**               | Spara         |
| Freccia ↓ o **S**        | Iperspazio    |
| **Invio** o **1**        | Nuova partita |
| **M**                    | Audio sì/no   |

I valori incerti (l'aspetto del fascio, il numero di vite iniziali, i suoni) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:asteroids  # dalla root del monorepo
pnpm build          # output in games/asteroids/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo vettoriale, nave, asteroidi, dischi volanti, iperspazio e suoni, ricavati dal programma originale.
- [11 · Grafica vettoriale](../../docs/11-grafica-vettoriale.md): il motore vettoriale condiviso, dai disegni della ROM alle linee luminose.
