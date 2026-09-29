# 10 · Un secondo gioco: Breakout

Obiettivo: costruire un secondo gioco, _Breakout_ (Atari, 1976), riusando il più possibile i pacchetti nati con Space Invaders, e vedere che cosa manca quando il gioco cambia.

## 1. Perché Breakout

La scelta è stata fatta per ridurre il lavoro:

- **Stesso tipo di hardware:** logica discreta a righe e pixel, niente grafica vettoriale. _Asteroids_ (1979) avrebbe richiesto un disegno a linee e tre tasti in più.
- **Stesso tipo di controllo, a patto di cambiare dispositivo:** l'originale ha una manopola a potenziometro, dove ogni angolo è un punto dello schermo. Con i tasti la racchetta si guida male; **con il mouse o il dito** funziona come la manopola, perché anche loro danno una posizione assoluta.
- **Poche regole:** muri, racchetta, pallina, mattoni. Le difficoltà sono nei dettagli del circuito, non nella quantità di codice.

## 2. Cosa si riusa così com'è

| Pacchetto             | In Breakout                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `@arcade/engine-core` | lo stesso game loop a passo fisso, con `step: 1 / 60`                      |
| `@arcade/input`       | tastiera, azioni e un poll per passo                                       |
| `@arcade/render`      | `getCanvasContext`, `clearScreen`, il contesto finto per i test            |
| `@arcade/collision`   | `rectsOverlap` per pallina, racchetta e mattoni (niente pixel-perfect)     |
| `@arcade/audio`       | i suoni come dati: tre onde quadre invece dei suoni complessi degli alieni |
| `@arcade/storage`     | `createHiScoreStore('insert-coin/breakout/hi-score')`                      |
| `@arcade/math`        | `clamp`                                                                    |

Anche la struttura del gioco è la stessa: stato puro (`play.ts`, `game.ts`), disegno (`render*.ts`), collegamento (`main.ts`), suoni dedotti confrontando due stati (`soundsFor`), colori in `colors.config.ts`. Il gioco nuovo ha richiesto **nessuna modifica** ai pacchetti esistenti: solo due aggiunte.

## 3. Cosa si aggiunge ai pacchetti

Due funzioni servivano a Breakout ma non sono di Breakout, quindi sono finite nei pacchetti condivisi.

### La posizione del puntatore, in `@arcade/input`

La tastiera dice "quale tasto è premuto"; il mouse deve dire "dove si trova", nelle unità del gioco, qualunque sia la dimensione del canvas sullo schermo. La conversione è una funzione pura:

```ts
export const toLogicalX = (
  clientX: number,
  bounds: HorizontalBounds,
  logicalWidth: number,
): number => ((clientX - bounds.left) / bounds.width) * logicalWidth;
```

`createPointerPosition` ascolta `pointermove` e `pointerdown` su tutta la pagina (così sul telefono il dito può scorrere anche sotto lo schermo, senza coprire la pallina) e si legge con un `poll()` come la tastiera: restituisce la x se il puntatore si è mosso, e `pressed` se c'è stato un clic o un tocco, che il gioco usa come pulsante SERVE.

### Le cifre a sette segmenti, in `@arcade/render`

Il punteggio di Breakout non usa un font: il circuito accende i segmenti di una cifra con un decodificatore 7448. `DIGIT_SEGMENTS` dice quali segmenti accendere per ogni cifra, `drawSegmentNumber` disegna un numero con un rettangolo per segmento. Le misure stanno in un `SegmentStyle`, così un altro gioco può usare cifre più grandi o più sottili.

## 4. Pixel non quadrati

Il circuito divide lo schermo in 228 righe per 208 "passi" orizzontali, ma un passo è circa 1,48 volte più largo di una riga: i pixel dell'originale non sono quadrati. Il gioco lavora nelle unità del circuito, e il CSS allunga l'immagine alla forma vera:

```css
#screen {
  aspect-ratio: 228 / 308;
  image-rendering: pixelated;
}
```

Il vantaggio: tutti i numeri nel codice (larghezza dei mattoni, velocità della pallina) sono quelli dello schema elettrico, senza conversioni.

## 5. I colori: pellicole sul vetro

Il monitor di Breakout era in bianco e nero; i colori erano strisce di pellicola trasparente incollate sul vetro. Il remake fa la stessa cosa: disegna tutto in bianco, poi stende sopra ogni striscia con la fusione `multiply`, dove il bianco prende il colore e il nero resta nero.

```ts
ctx.globalCompositeOperation = 'multiply';
strips.forEach(({ top, height, color }) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, top, ctx.canvas.width, height);
});
ctx.globalCompositeOperation = 'source-over';
```

Anche i muri laterali si colorano dove la striscia li attraversa, come sul cabinato. Il tasto **V** toglie le pellicole.

## 6. Un solo file per i valori incerti

Space Invaders ha un disassemblato completo; Breakout no: è un circuito senza processore, e alcuni valori vanno dedotti dallo schema elettrico o scelti. Per questo tutti i valori incerti stanno in **un solo file**, [`tuning.config.ts`](../games/breakout/src/tuning.config.ts), ognuno marcato con la sua fonte:

- **[M]** detto dal manuale;
- **[C]** letto dal circuito;
- **[N]** scelta nostra.

Cambiare la velocità della pallina, il ritmo dei suoni o la posizione delle cifre significa cambiare un numero in quel file, senza cercare nel codice. I test leggono gli stessi valori, quindi restano validi dopo una modifica.

Nello stesso file c'è `debug`: con `true` la racchetta è larga quanto lo schermo e la pallina non si perde mai, utile per provare le accelerazioni e il secondo muro senza giocare bene.

## 7. La pallina come nel circuito

La pallina non memorizza una velocità: come il circuito tiene solo la direzione, il numero di colpi e due indicatori (mattone veloce, segmento esterno della racchetta), e la velocità si ricava a ogni passo da una tabella con `speedFor`. Così le regole dell'originale (accelerazione al 4° e al 12° colpo, massimo dopo un mattone arancione o rosso) diventano righe di una tabella, non condizioni sparse nel codice.

Anche la battuta è deterministica: il ritardo, la posizione e l'angolo dipendono dal contatore dei passi nel momento in cui si preme SERVE. Per chi gioca è imprevedibile; per i test è riproducibile, senza `Math.random`.

## 8. Suoni, record e schermata di attesa

- **Suoni:** tre onde quadre (racchetta, muri, mattoni). I mattoni suonano un "tic" per ogni punto, uno ogni 5 passi: un piccolo stato in più, [`ticks.ts`](../games/breakout/src/ticks.ts), conta i punti ancora da suonare.
- **Record:** lo stesso `@arcade/storage` di Space Invaders, mostrato dove l'originale metteva il punteggio del secondo giocatore, con la fanfara quando lo si batte.
- **Schermata di attesa:** la pallina rimbalza da sola su una racchetta larga quanto lo schermo, senza rompere mattoni. È lo stesso trucco della modalità debug: la larghezza `FULL_ROW_WIDTH` serve a entrambe.

I dettagli dell'originale, con le fonti, sono nella guida [Le meccaniche dell'originale](../games/breakout/docs/meccaniche-originali.md).

## 9. Provalo

```bash
pnpm test           # tutti i test, compresi quelli di Breakout
pnpm dev:breakout
```

All'apertura il gioco è in attesa. Clic (o tocco, spazio, Invio) per iniziare, un altro per servire; la racchetta segue il mouse o il dito. Metti `debug: true` in `tuning.config.ts` e guarda la pallina accelerare da sola.

Torna all'[introduzione](00-introduzione.md) o leggi il [diario AI](ai-workflow.md) per vedere come ci si è arrivati, un passo alla volta.
