# Pac-Man

Remake di _Pac-Man_ (Namco, 1980) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **completo** (versione 1.1.0). Le regole vengono dal programma della ROM originale, letto con un disassemblatore Z80 e con il disassemblato commentato di Ms. Pac-Man: le velocità a bit delle tabelle dei livelli, il movimento di Pac-Man con le curve anticipate, i bersagli dei quattro fantasmi (con l'errore di Pinky verso l'alto), le fasi scatter e chase, Cruise Elroy, la casa dei fantasmi con i suoi contatori, le pillole e i fantasmi blu, la frutta, la vita extra, la fine del livello e lo schermo diviso del livello 256. Il labirinto, i messaggi e la grafica sono decodificati dalle ROM; le melodie e gli effetti sono suonati dal programma del suono della ROM su un emulatore del chip Namco. Ci sono anche la presentazione dei fantasmi, l'inseguimento, la demo, i gettoni e i tre intermezzi. Il record è salvato nel browser. Su telefoni e tablet compare il pannello del cabinato sotto lo schermo.

| Comando              | Azione                       |
| -------------------- | ---------------------------- |
| **C** o **5**        | Inserisce un gettone         |
| **Invio** o **1**    | Avvia la partita (1 credito) |
| Frecce o **W A S D** | Muove Pac-Man                |
| **M**                | Audio sì/no                  |

Su telefoni e tablet: il joystick virtuale a quattro direzioni a sinistra (o la croce di frecce, a scelta in `src/tuning.config.ts`), MONETA e AUDIO al centro, START a destra; in orizzontale i comandi passano ai lati dello schermo. Il primo tocco porta la pagina a schermo intero, e il pulsante SCHERMO INTERO la riporta lì se ne esci; su iPhone, dove Safari non lo permette, si usa Condividi → Aggiungi alla schermata Home.

I valori incerti o da scegliere (vite, soglia della vita extra, volume, durata dei punti di un fantasma) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:pacman   # dalla root del monorepo
pnpm build        # output in games/pacman/dist: index.html + game.css + game.js
```

## Modalità debug

Per provare i livelli avanzati, in [`src/tuning.config.ts`](src/tuning.config.ts) c'è la sezione `debug`. Con `enabled: true` le sue opzioni valgono: con `startLevel` si parte dal livello scelto (fino al 256, lo schermo spezzato), con `godMode` i fantasmi non blu attraversano Pac-Man, con `skipIntermissions` i livelli si susseguono senza intermezzi. Con il debug acceso compare la scritta DEBUG e il record non viene salvato; nelle anteprime delle pull request è acceso da solo. Da rimettere a `false` prima di pubblicare: un test lo controlla. Tutti i dettagli nella [guida 18](../../docs/18-modalita-debug.md).

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): labirinto, velocità, fantasmi, casa, pillole, frutta, livelli, suoni, demo e intermezzi, ricostruiti dalla ROM, con le fonti.
- [17 · Il sesto gioco: Pac-Man](../../docs/17-sesto-gioco.md): la memoria video come stato, le routine della ROM in funzioni pure, `@arcade/tiles`, i dati generati dalla ROM.
