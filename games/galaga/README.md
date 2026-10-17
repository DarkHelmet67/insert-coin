# Galaga

Remake di _Galaga_ (Namco, 1981) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **completo** (versione 1.1.0). Le regole vengono dal sorgente Z80 commentato delle tre CPU del cabinato e dalle tabelle delle ROM: le traiettorie degli alieni eseguite dall'interprete di volo originale, le cinque ondate di ingresso, il dondolio e il respiro della formazione, le picchiate con le bombe mirate, il raggio traente con la cattura e il caccia doppio, gli stage bonus, gli alieni che si dividono in tre, le vite extra e le statistiche di fine partita. Le melodie e gli effetti sono suonati da un emulatore del chip sonoro Namco con i dati della ROM. Il record è salvato nel browser. Su telefoni e tablet compare il pannello del cabinato sotto lo schermo.

| Comando                  | Azione                                      |
| ------------------------ | ------------------------------------------- |
| **C** o **5**            | Moneta: avvia la partita                    |
| Frecce ← → o **A**/**D** | Muove il caccia                             |
| **Spazio** o **Z**       | Spara (un colpo per pressione, due in volo) |
| **M**                    | Audio sì/no                                 |

Su telefoni e tablet: il joystick virtuale a sinistra (o le frecce, a scelta in `src/tuning.config.ts`), MONETA e AUDIO al centro, FUOCO a destra.

I valori incerti o da scegliere (difficoltà, vite, soglie delle vite extra, volume, esplosione del caccia) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:galaga   # dalla root del monorepo
pnpm build        # output in games/galaga/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): voli, formazione, picchiate, raggio traente, stage bonus e suoni, ricostruiti dal sorgente Z80 commentato e dalle ROM, con le fonti.
- [15 · Il chip sonoro Namco](../../docs/15-chip-sonoro-namco.md): il chip a forme d'onda, il programma del suono portato dalla ROM, i campioni in coda.
- [16 · Un quinto gioco: Galaga](../../docs/16-quinto-gioco.md): tre processori in moduli puri, l'interprete dei voli, i dati generati dalla ROM, il suono emulato.
