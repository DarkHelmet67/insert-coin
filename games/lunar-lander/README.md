# Lunar Lander

Remake di _Lunar Lander_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **completo** (versione 1.0.0). Le regole vengono dal codice sorgente originale di Atari: la fisica del modulo con la leva della spinta, le quattro missioni (TRAINING, CADET, PRIME, COMMAND), il terreno con la vista lontana e lo zoom vicino al suolo, le 15 piazzole con il loro moltiplicatore, l'atterraggio buono, duro o lo schianto con i messaggi originali, l'ABORT, il carburante con la sua penale, i tre suoni del cabinato e la schermata di attesa. Il record è salvato nel browser. Su telefoni e tablet compaiono i comandi del cabinato; il primo tocco porta il gioco a schermo intero.

| Comando                  | Azione                                         |
| ------------------------ | ---------------------------------------------- |
| **C** o **5**            | Moneta (750 unità di carburante)               |
| **Tab**                  | Sceglie la missione                            |
| **Invio** o **1**        | START                                          |
| Frecce ← → o **A**/**D** | Ruota il modulo                                |
| Frecce ↑ ↓ o **W**/**S** | Muove la leva della spinta (resta dov'è)       |
| **Spazio**               | ABORT: raddrizza il modulo e spinge al massimo |
| **M**                    | Audio sì/no                                    |

Su telefoni e tablet (meglio in orizzontale): ⟲ ⟳ e ABORT per il pollice sinistro, la leva della spinta per il destro; sotto lo schermo le lampade delle missioni (toccarle passa alla successiva), START e MONETA; AUDIO e SCHERMO INTERO in alto. Su iPhone, per lo schermo intero: Condividi → Aggiungi alla schermata Home.

I valori incerti (la corsa della leva da tastiera, il carburante per moneta, i suoni, l'aspetto del fascio) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:lunar-lander  # dalla root del monorepo
pnpm build             # output in games/lunar-lander/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo, terreno e zoom, modulo, missioni, carburante, atterraggio, piazzole, ABORT e suoni, ricavati dal sorgente originale di Atari.
- [11 · Grafica vettoriale](../../docs/11-grafica-vettoriale.md): il motore vettoriale condiviso, dai disegni della ROM alle linee luminose.
- [13 · Un quarto gioco: Lunar Lander](../../docs/13-quarto-gioco.md): il lavoro su branch e pull request, la fisica in interi, la telecamera, i dati generati dalla ROM, la leva della spinta.
