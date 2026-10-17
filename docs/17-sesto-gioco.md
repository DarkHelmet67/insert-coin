# 17 · Il sesto gioco: Pac-Man

Obiettivo: costruire _Pac-Man_ (Namco, 1980), il coin-op per antonomasia, portando le routine della ROM originale in funzioni pure, sullo stesso schermo e con lo stesso chip sonoro di _Galaga_, e lavorando ancora su un branch con una pull request.

## 1. Perché Pac-Man, e come è stato costruito

Dopo Galaga, Namco era "a bordo": il chip sonoro (`@arcade/wsg`) e la grafica a tile esistevano già. Pac-Man è il passo naturale: stesso schermo verticale 224 × 288, stessa famiglia di hardware, ma un gioco tutto diverso. Non ci sono voli né formazioni: c'è un **labirinto**, e quattro fantasmi che decidono a ogni incrocio dove andare. Il fascino di Pac-Man sta tutto in quelle decisioni, e quindi nel programma.

Il metodo è quello di Galaga ([guida 16](16-quinto-gioco.md)): branch `feature/pacman`, pull request in bozza aperta al primo passo, un commit per passo, la checklist nel corpo della PR. L'autore ha approvato la checklist ("mi piace, partiamo!") e gli undici passi sono stati eseguiti di fila:

1. ricerca sull'originale, guida delle meccaniche e pagina vuota;
2. grafica, labirinto e messaggi dalle ROM;
3. Pac-Man: movimento, curve, tunnel, velocità;
4. i quattro fantasmi: bersagli, scatter e chase, Cruise Elroy, zone senza svolta;
5. la casa dei fantasmi: contatori, timer, occhi;
6. pillole energetiche, fantasmi blu, collisioni;
7. frutta, vite, morte, fine livello, game over, record, livello 256;
8. suoni dal chip emulato;
9. presentazione, demo, gettoni e intermezzi;
10. pannello touch del cabinato;
11. guide, README, scheda del sito e versioni.

## 2. Le fonti

Per Pac-Man non esiste un sorgente originale pubblicato. Le fonti, nell'ordine in cui contano:

- **le ROM del set MAME `pacman`**, lette con un disassemblatore Z80: sono la verità;
- il **disassemblato commentato di Ms. Pac-Man** ([BleuLlama/GameDocs](https://github.com/BleuLlama/GameDocs/blob/master/disassemble/mspac.asm)), che contiene il programma di Pac-Man quasi intatto e dà un nome a ogni indirizzo della RAM. Dove Ms. Pac-Man è stato modificato, vale la ROM di Pac-Man;
- [The Pac-Man Dossier](https://www.gamedeveloper.com/design/the-pac-man-dossier) di Jamey Pittman, per controllare che la lettura della ROM dia i comportamenti noti ai giocatori;
- [MAME](https://github.com/mamedev/mame/blob/master/src/mame/pacman/pacman.cpp) per l'hardware.

Tutto è nella [guida delle meccaniche](../games/pacman/docs/meccaniche-originali.md), scritta prima del codice. La marcatura [P] cita l'**indirizzo** della routine (per esempio `2966`, la scelta della strada), perché senza sorgente non ci sono etichette. Nel codice ogni funzione porta lo stesso indirizzo nel commento: chi legge può aprire il disassemblato e ritrovare la routine.

## 3. Cosa si riusa

| Pacchetto             | In Pac-Man                                                                           |
| --------------------- | ------------------------------------------------------------------------------------ |
| `@arcade/engine-core` | lo stesso game loop, al passo del cabinato (60,6 fotogrammi al secondo)              |
| `@arcade/render`      | `getCanvasContext`, `clearScreen`, `enterFullscreenOnTouch` e `showFullscreenButton` |
| `@arcade/tiles`       | **nuovo**: tile in _ASCII art_, specchiature, colori delle PROM, disegno (sezione 4) |
| `@arcade/input`       | tastiera, `createTouchButtons` e `mergeKeyStates`, senza modifiche                   |
| `@arcade/audio`       | `stream`, la coda dei campioni nata con Galaga                                       |
| `@arcade/wsg`         | l'emulatore del chip sonoro Namco, lo stesso di Galaga                               |
| `@arcade/storage`     | `createHiScoreStore('insert-coin/pacman/hi-score')`                                  |

Il pannello touch è quello dei giochi verticali ([guida 08](08-comandi-touch.md)), con una novità: Pac-Man ha un joystick a **quattro direzioni**, quindi le frecce formano una croce. Il dito può scivolare da una freccia all'altra senza staccarsi, come su una leva vera. Come in Asteroids e Lunar Lander, il primo tocco porta la pagina a schermo intero (`enterFullscreenOnTouch`) e un pulsante SCHERMO INTERO la riporta lì dopo esserne usciti; per iPhone ci sono il manifesto e l'icona da aggiungere alla schermata Home.

## 4. Un pacchetto nato da un gioco: `@arcade/tiles`

Galaga aveva in casa le funzioni per la grafica a tile Namco: tile a 2 bit scritti come _ASCII art_ (`.` trasparente, `1` `2` `3` i tre colori), le specchiature come le fa l'hardware, i colori letti dalle PROM con i pesi delle resistenze. Pac-Man ha la stessa grafica, con un'altra disposizione dei pixel nella ROM. Copiare quei file sarebbe stato il modo più veloce, e il peggiore: due copie divergono.

Al passo 2 le funzioni sono quindi **uscite da Galaga** e sono diventate un pacchetto, con i loro test; Galaga ora le importa da lì. È la regola del progetto: il codice condiviso sta in `packages/` e non conosce i giochi. Quello che resta nei giochi è solo ciò che è davvero diverso: la disposizione dei bit nelle ROM, che lo script di estrazione di ciascun gioco conosce.

## 5. La memoria video come stato

La scelta più importante del remake è questa: **lo stato del labirinto è la memoria video**. Il programma originale non ha una "mappa" separata: legge lo schermo. Un muro è un carattere con codice da `C0` in su, un puntino è `10`, una pillola `14`; alcune caselle hanno colori speciali che i fantasmi usano come segnali (`1A` niente svolta in su, `1B` tunnel lento).

Il remake tiene le stesse due griglie in un oggetto immutabile:

```ts
export interface Video {
  readonly tiles: readonly number[];
  readonly colors: readonly number[];
}
```

Così le routine si portano quasi riga per riga: "mangiare un puntino" è scrivere uno spazio nella cella; "il fantasma è nel tunnel?" è leggere il colore della sua casella. Il labirinto stesso non è disegnato a mano: le routine `2419`, `2448` e `24D7` lo decomprimono dalla ROM, con le stesse tabelle, nella memoria video del remake.

Anche il disegno segue l'hardware: prima i tile, poi gli sprite sopra. I tile vanno su un canvas fuori dalla pagina che conserva l'ultima immagine, e a ogni fotogramma si ridisegnano **solo le celle cambiate**: con 1008 celle e quasi nessuna che cambia, è la differenza tra un gioco fluido e uno che arranca sul telefono.

## 6. Velocità a bit, fantasmi a una casella di distanza

Due routine spiegano quasi tutto il comportamento di Pac-Man.

**La velocità** non è un numero di pixel: ogni personaggio ha 32 bit che ruotano di un posto a ogni aggiornamento, e il personaggio avanza di un pixel quando il bit che esce vale 1. La ROM sparge i bit in modo che i passi arrivino il più regolari possibile.

```ts
/** Turns the pattern one bit to the left (`ADD HL,HL` / `ADC HL,HL` / `INC (HL)` at $1818). */
export const tickSpeed = (pattern: SpeedPattern): SpeedTick => {
  const move = pattern >>> 31 === 1;
  return { pattern: ((pattern << 1) | (move ? 1 : 0)) >>> 0, move };
};
```

Le tabelle dei livelli (`330F`) danno i modelli di Pac-Man, dei fantasmi, dei fantasmi blu e nel tunnel: copiate valore per valore, danno esattamente le percentuali del Dossier (80%, 90%, 75%, 50%, 40% al livello 1). Un buon segno che la lettura della ROM è giusta.

**La scelta della strada** (`2966`): a metà di ogni casella un fantasma entra nella casella già scelta e decide subito quella dopo. Prova le direzioni libere, senza mai tornare indietro, e tiene quella che porta più vicino al bersaglio in linea d'aria. Il calcolo è un quadrato a 16 bit, e il remake lo tiene a 16 bit:

```ts
export const squaredDistance = (a: Point, b: Point): number =>
  (squaredGap(a.x, b.x) + squaredGap(a.y, b.y)) & 0xffff;
```

Anche gli "errori" famosi vengono gratis dal codice portato: il bersaglio di Pinky, quando Pac-Man guarda in su, si sposta anche di 4 caselle a sinistra perché il programma somma i due byte della posizione come una sola parola a 16 bit. Il remake fa la stessa somma, e l'errore c'è.

## 7. Un programma, non una sceneggiatura

La presentazione, la demo e gli intermezzi sembrano animazioni scritte a mano. Non lo sono: nel cabinato sono **il gioco stesso**, guidato da tabelle.

- **L'inseguimento della presentazione** costruisce un corridoio con muri invisibili (il carattere `FC`, un muro senza disegno), mette una pillola in fondo e fa girare il nucleo vero del gioco, con le velocità del livello 21.
- **Nella demo** Pac-Man è guidato dal programma come un fantasma: stessa routine di scelta, con un bersaglio calcolato da Pinky. Tutto è deterministico, quindi la demo è sempre la stessa: nel remake mangia 97 puntini e muore, come sul cabinato.
- **Gli intermezzi** sono tabelle di passi: ogni passo aspetta che un attore arrivi a una certa colonna e intanto muove gli attori di un fotogramma. Il Pac-Man gigante del primo intermezzo è fatto di quattro sprite presi in prestito dagli altri tre fantasmi e dalla frutta.

Il remake porta le tabelle e le routine, non le "scene". Per questo, quando un dettaglio non torna, la correzione è sempre la stessa: tornare alla ROM.

## 8. Dati generati dalla ROM, senza la ROM

Come per Galaga, la ROM non entra nel repository. Due script in [`scripts/pacman/`](../scripts/pacman/) la leggono da una cartella indicata da chi li lancia:

| Script                  | Produce                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `extract-rom-art.js`    | `src/art/`: 256 caratteri e 64 sprite in _ASCII art_, le PROM dei colori byte per byte               |
| `extract-rom-tables.js` | `src/rom/`: le tabelle del programma con il loro indirizzo, i 55 messaggi, i bit del caso e il suono |

Il generatore pseudo-casuale dei fantasmi blu (`2A23`) legge byte del programma a indirizzi calcolati, e ne tiene solo i 2 bit bassi: lo script copia **solo quei 2 bit** per gli 8 KB letti, impacchettati quattro per byte. Il comportamento è identico, e nel repository non c'è il programma.

## 9. Il suono, la seconda volta

Il chip è lo stesso di Galaga, ma il programma no: in Pac-Man non c'è un processore del suono, e il programma gira nell'interruzione del processore principale, una volta per fotogramma. Ogni voce ha un canale per gli effetti e uno per le canzoni, e suona la richiesta con il bit più alto. Il remake lo porta così com'è (`sound-*.ts`) e lo suona con `@arcade/wsg` e `audio.stream`: nessun pacchetto nuovo, nessuna modifica a quelli esistenti. È la prova che `@arcade/wsg` è riusabile davvero.

Una cosa nuova l'ha chiesta l'orecchio: nei silenzi della musica una voce resta ferma su un campione, e senza filtro si sentivano degli scatti. Nel cabinato un condensatore tra amplificatore e altoparlante non lascia passare la tensione costante; il remake applica un filtro passa-alto a 15 Hz (`speaker.ts`), marcato [N].

## 10. Un solo file per i valori da regolare

I valori incerti o scelti dal proprietario del cabinato stanno in [`tuning.config.ts`](../games/pacman/src/tuning.config.ts), ognuno con la sua fonte: i fotogrammi al secondo dell'hardware, la durata dei punti di un fantasma mangiato, le vite (3 di fabbrica), la soglia della vita extra (10 000 di fabbrica) e il volume.

## 11. Cosa manca, e perché

Le scelte sono marcate [N] nella guida delle meccaniche:

- **un solo giocatore**: con più crediti il cabinato scrive "1 OR 2 PLAYERS", il remake sempre "1 PLAYER ONLY";
- niente cabinato cocktail, menu dei DIP switch e test di servizio;
- il lampeggio dei fantasmi blu ha un suono che il programma accende e spegne nella stessa routine: non si sente mai, e il remake non lo chiede.

## 12. Provalo

```bash
pnpm test        # tutti i test, compresi quelli di Pac-Man e di @arcade/tiles
pnpm dev:pacman
```

All'apertura compare la presentazione dei fantasmi, poi l'inseguimento e la demo, come sul cabinato. **C** (o **5**) inserisce un gettone, **Invio** (o **1**) avvia la partita; le **frecce** (o **WASD**) guidano Pac-Man, **M** l'audio. Su smartphone il pannello del cabinato compare sotto lo schermo, con la croce a sinistra e START a destra.

Per vedere il primo intermezzo: finisci il secondo livello. Per vedere il livello 256 servono un po' di pazienza, oppure i test di `fruit.test.ts` e `screen.test.ts`.

Il percorso completo, con le decisioni e gli errori, è nel [diario AI](ai-workflow.md); le regole dell'originale, con le fonti, nella [guida delle meccaniche](../games/pacman/docs/meccaniche-originali.md).
