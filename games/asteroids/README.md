# Asteroids

Remake di _Asteroids_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **completo** (versione 1.0.0). La partita è quella del cabinato: nave, colpi, asteroidi che si dividono, ondate da 4 a 11, dischi volanti grandi e piccoli, tre vite con una in più ogni 10.000 punti, iperspazio, fine partita e record salvato nel browser. Ci sono anche i suoni del cabinato e la schermata di attesa. Su telefoni e tablet compare il pannello del cabinato: in orizzontale ai lati dello schermo, in verticale sotto; toccare lo schermo equivale a START e porta il gioco a schermo intero (su iPhone serve "Aggiungi alla schermata Home").

| Comando                  | Azione        |
| ------------------------ | ------------- |
| Frecce ← → o **A**/**D** | Ruota la nave |
| Freccia ↑ o **W**        | Spinta        |
| **Spazio**               | Spara         |
| Freccia ↓ o **S**        | Iperspazio    |
| **Invio** o **1**        | Nuova partita |
| **M**                    | Audio sì/no   |

Su telefoni e tablet: ⟲ ⟳ ruotano, SPINTA, FUOCO e IPER sono per il pollice destro, AUDIO e SCHERMO INTERO in alto; toccare lo schermo avvia la partita.

I valori incerti (l'aspetto del fascio, il numero di vite iniziali, i suoni) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:asteroids  # dalla root del monorepo
pnpm build          # output in games/asteroids/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo vettoriale, nave, asteroidi, dischi volanti, iperspazio e suoni, ricavati dal programma originale.
- [11 · Grafica vettoriale](../../docs/11-grafica-vettoriale.md): il motore vettoriale condiviso, dai disegni della ROM alle linee luminose.
- [12 · Un terzo gioco: Asteroids](../../docs/12-terzo-gioco.md): cosa si riusa, l'aritmetica del 6502, il caso nello stato del gioco, i comandi touch.
