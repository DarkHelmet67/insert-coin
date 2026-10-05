# 13 · Un quarto gioco: Lunar Lander

Obiettivo: costruire _Lunar Lander_ (Atari, 1979) riusando il motore vettoriale di Asteroids, copiando le regole dal **codice sorgente originale** e lavorando come farebbe un collaboratore esterno, su un branch e con una pull request.

## 1. Perché Lunar Lander, e perché con una pull request

Lunar Lander è il primo gioco vettoriale di Atari e usa la stessa scheda di Asteroids: un 6502 e il generatore di vettori (DVG). Era il candidato naturale per mettere alla prova `@arcade/vector`: se il pacchetto è davvero riusabile, il quarto gioco deve costruirsi senza riscriverlo.

Questa volta è cambiato anche il **modo di lavorare**. I primi tre giochi sono stati sviluppati direttamente su `main`. Lunar Lander invece è nato sul branch `feature/lunar-lander`, con una pull request aperta in bozza al primo passo e aggiornata a ogni passo, come farebbe un contributore esterno. Due conseguenze:

- chi rivede la PR deve sapere se è verde **prima** di unirla: da qui il secondo workflow, `ci.yml`, che controlla e costruisce ogni branch e ogni PR senza pubblicare nulla (vedi la [guida 07](07-build-deploy.md));
- la PR diventa un documento: la lista dei nove passi, con un commit per passo, racconta il gioco nell'ordine in cui è stato costruito.

## 2. La fonte: il sorgente originale

Per Asteroids si lavorava su un disassemblato: indirizzi e commenti scritti da altri, quarant'anni dopo. Per Lunar Lander c'è di meglio: nel 2021 è stato pubblicato il **codice sorgente di Atari** ([historicalsource/lunar-lander](https://github.com/historicalsource/lunar-lander)), con i nomi delle routine e i commenti di Rich Moore.

Il primo passo è stato leggerlo tutto e scrivere la [guida delle meccaniche](../games/lunar-lander/docs/meccaniche-originali.md), prima di una sola riga di gioco. Le marcature sono quelle di Asteroids, ma [P] e [R] citano le **etichette** del sorgente (`ACCEL`, `SCAPLND`, `TBMNA`) invece degli indirizzi. Nel codice ogni costante porta la stessa etichetta nel commento, così chi legge può ritrovare la riga originale.

Il sorgente ha anche risolto dubbi che la sola osservazione non avrebbe chiarito: la tabella dei "seni" che seni non sono (0,6 invece di 0,556), la rotazione che costa carburante a ogni passo con il tasto premuto, la penale per chi si schianta subito.

## 3. Cosa si riusa così com'è

| Pacchetto             | In Lunar Lander                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `@arcade/engine-core` | lo stesso game loop, ma a **41,67 passi al secondo** come il cabinato (sezione 4)          |
| `@arcade/vector`      | font, linee luminose, `syncScreen`: il modulo e il terreno sono passi del fascio della ROM |
| `@arcade/input`       | tastiera, `createTouchButtons` e `mergeKeyStates`, senza modifiche                         |
| `@arcade/audio`       | rumore filtrato per motore ed esplosione, un tono per il carburante basso                  |
| `@arcade/render`      | `getCanvasContext`, schermo intero al primo tocco e il pulsante SCHERMO INTERO             |
| `@arcade/storage`     | `createHiScoreStore('insert-coin/lunar-lander/hi-score')`                                  |

Tre cose sono passate dai giochi ai pacchetti, perché servivano a due giochi:

- **`clipLines`** in `@arcade/vector`: il DVG smette di disegnare quando il fascio esce dal quadrato 0-1023 e riprende quando rientra. Nella vista vicina il terreno esce dallo schermo, e senza il ritaglio si vedrebbe nei bordi neri. La funzione taglia ogni linea su un rettangolo (`DVG_CLIP`).
- **La luminosità del testo** in `textToLines`: le due ROM condividono l'alfabeto ma non la luminosità (Asteroids scrive a 7, Lunar Lander a 12), quindi `TextPlacement` ha ora un campo `brightness` facoltativo.
- **`showFullscreenButton`** in `@arcade/render`: il pulsante SCHERMO INTERO, nato dentro Asteroids, è passato nel pacchetto con i suoi test, e Asteroids ora lo importa da lì.

## 4. Il tempo del cabinato

Asteroids gira a 60 passi al secondo invece di 61,5: la differenza non si nota. Lunar Lander invece fa un passo ogni **24 ms**, 41,67 al secondo, e ogni velocità del programma è "per passo". Il remake tiene la frequenza originale in `tuning.config.ts`:

```ts
framesPerSecond: 1000 / 24,
```

Così gravità, spinta, consumi e timer si copiano dal sorgente senza conversioni. Il game loop a passo fisso della [guida 02](02-game-loop.md) lo permette senza modifiche: lo schermo si ridisegna a 60 Hz, la simulazione avanza a 41,67.

## 5. La fisica in interi, come nel 6502

Come in Asteroids, niente fisica moderna. La posizione sta in 4096esimi di unità del mondo, la velocità è un numero a 16 bit e il programma aggiunge alla posizione **solo i bit alti** della velocità: 8 bit persi nella vista lontana, 6 in quella vicina.

```ts
export const stepOf = (speed: number, view: View): number => {
  const mask = view === 'major' ? 0xff : 0x3f;
  return withSignOf(speed, Math.abs(speed) & ~mask);
};
```

È un dettaglio che si vede giocando: un modulo molto lento nella vista lontana sta fermo, e si muove appena l'inquadratura si stringe.

Un passo di volo è una funzione pura che segue l'ordine del programma: attrito (solo nella missione TRAINING), spinta calcolata con l'orientamento **prima** della rotazione di questo passo, rotazione, consumo di carburante, movimento.

```ts
const push = enginePush(landerOrientation(slowed), thrust, rules);
const turned = commands.steering
  ? turnModule(slowed.rotation, commands.turn, rules.rotation, hasFuel)
  : { rotation: slowed.rotation, fuel: 0 };
```

Le quattro missioni (TRAINING, CADET, PRIME, COMMAND) non sono quattro giochi diversi: sono una tabella di regole (`MISSIONS` in [`missions.ts`](../games/lunar-lander/src/missions.ts)) con gravità, motore, consumo, tipo di rotazione e attrito. Ogni funzione di volo riceve le regole come parametro.

Anche qui JavaScript ha riproposto il `-0` di Asteroids: un prodotto con segno negativo e risultato nullo. La soluzione è una sola funzione, `withSignOf(segno, modulo)`, usata ovunque serve un segno.

## 6. Un mondo e una telecamera

Il programma originale muove il modulo **sullo schermo** e fa scorrere il paesaggio quando il modulo si avvicina ai bordi. Il remake fa il contrario [N]: il modulo vive nelle coordinate del mondo (largo 4096 unità, che si richiude su se stesso) e una telecamera lo segue con le stesse soglie del programma:

- in orizzontale il modulo è libero tra x = 128 e x = 896, oltre scorre il paesaggio;
- sotto 384 unità di altitudine la vista lontana diventa vicina (zoom 4×) e il modulo si ricentra;
- sopra 520 si torna alla vista lontana;
- nella vista lontana, salendo oltre 512 unità di cielo, il modulo esce nello spazio e la missione è persa.

```ts
export const followLander = (camera: Camera, input: CameraInput): CameraFrame => {
  const sideways = followSideways(camera, input);
  return sideways.view === 'major'
    ? followWide(sideways, input)
    : { camera: followCloseUp(sideways, input), flewOff: false };
};
```

Sullo schermo il risultato è lo stesso del cabinato; nel codice fisica e inquadratura restano separate, e ognuna si testa da sola.

## 7. Dati generati dalla ROM

Il terreno della ROM sono 16 sezioni fatte di 25 "segmenti" riusati: copiarli a mano voleva dire sbagliare. Uno script ha letto le macro `VCTR` del sorgente e ha prodotto [`surface-data.ts`](../games/lunar-lander/src/surface-data.ts): 159 punti del terreno, i due campi di stelle e i punti di contatto del modulo per ognuno dei 32 orientamenti. Il file dice in testa che è generato.

Un file generato va comunque verificato. I test lo confrontano con **due fonti indipendenti** del programma:

- ogni sezione deve partire all'altezza scritta nella tabella `MINTBL`;
- tutte le 15 piazzole della tabella `TBMNA` devono cadere su tratti piatti del terreno.

Il secondo controllo ha anche scoperto una sorpresa: `TBMNA` scrive prima la y e poi la x. Letta al contrario, nessuna piazzola cadeva sul piatto.

## 8. Il caso dal tempo

Asteroids ha un generatore casuale a registro. Lunar Lander no: per scegliere le piazzole, la frase finale e i detriti dell'esplosione legge il contatore dell'interruzione da 4 ms (`INTCNT`), che avanza di 6 a ogni passo. È **il momento** in cui il giocatore preme START o tocca il suolo a decidere.

```ts
export const interruptCount = (state: GameState): number => (state.seed + state.frame * 6) & 0xff;
```

Il seme viene da `Date.now()` in `main.ts`; nei test è un numero fisso, e una partita si può rigiocare identica.

## 9. Una leva invece di un pulsante

Il cabinato non ha un pulsante di spinta ma una **leva**: resta dove la si lascia, e il programma ne divide la corsa in 16 livelli. Il remake la tiene nello stato del gioco (0-255) e la sposta in tre modi:

- **tastiera**: ↑ e ↓ la muovono a scatti di `leverStep` per passo (in `tuning.config.ts`), e lasciando il tasto resta dov'è;
- **dito**: sul telefono è un cursore verticale per il pollice destro; la posizione del dito diventa direttamente la posizione della leva;
- **ABORT** (Spazio, o il pulsante rosso) prende il comando per circa 100 passi e porta il motore a un livello che la leva non raggiunge.

La conversione dal dito alla leva è una funzione pura, testata senza browser:

```ts
export const leverFromPointer = (clientY: number, box: LeverBox): number => {
  if (box.height <= 0) return 0;
  const fromBottom = (box.top + box.height - clientY) / box.height;
  return Math.round(Math.max(0, Math.min(1, fromBottom)) * LEVER_MAX);
};
```

Il resto (ascoltare `pointerdown` e `pointermove` sul cursore, disegnare la manopola con la proprietà CSS `--lever`) sta in `createLeverTouch`, il guscio imperativo.

## 10. Le lampade del cabinato

Sotto lo schermo del cabinato ci sono quattro pulsanti illuminati, uno per missione, e START. Il remake li disegna in HTML sotto il canvas e li accende da [`cabinet-panel.ts`](../games/lunar-lander/src/cabinet-panel.ts): una funzione pura `panelView(stato)` dice quali lampade sono accese, e `showPanel` tocca la pagina solo quando qualcosa cambia. Le lampade sono anche pulsanti: toccarne una fa da SELECT e passa alla missione successiva. Il record, che il cabinato non aveva, sta accanto a loro, fuori dallo schermo vettoriale.

## 11. Sui telefoni

Come per Asteroids: in orizzontale i comandi stanno ai lati dello schermo (rotazione e ABORT a sinistra, la leva a destra), in verticale sotto, con l'invito a girare il telefono. Il primo tocco porta la pagina a schermo intero (`enterFullscreenOnTouch`), e il manifesto dichiara l'orientamento orizzontale per chi aggiunge il gioco alla schermata Home.

## 12. Provalo

```bash
pnpm test               # tutti i test, compresi quelli di Lunar Lander
pnpm dev:lunar-lander
```

All'apertura un modulo cade da solo e lampeggia INSERT COINS. **C** (o **5**) inserisce una moneta, **Tab** sceglie la missione, **Invio** parte. ← → ruotano il modulo, ↑ ↓ muovono la leva della spinta, **Spazio** è ABORT, **M** l'audio. Per un buon atterraggio serve il modulo dritto e meno di 16 sullo strumento della velocità verticale: provalo prima su TRAINING, dove l'attrito aiuta.

Il percorso completo, con le decisioni e gli errori, è nel [diario AI](ai-workflow.md); le regole dell'originale, con le fonti, nella [guida delle meccaniche](../games/lunar-lander/docs/meccaniche-originali.md).
