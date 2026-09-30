# 11 · Grafica vettoriale

Obiettivo: disegnare nel browser come un monitor vettoriale Atari, con linee nitide e luminose, usando i disegni originali delle ROM. Il risultato è il pacchetto `@arcade/vector`, nato per _Asteroids_ ma pensato per tutti i giochi vettoriali (Lunar Lander, Battlezone, Tempest...).

## 1. Raster e vettori

Space Invaders e Breakout usano un monitor **raster**: il fascio di elettroni percorre tutto lo schermo riga per riga, e il gioco decide quali punti accendere. Nel codice questo diventa una griglia di pixel: sprite, font bitmap, `image-rendering: pixelated`.

Un monitor **vettoriale** funziona come un plotter: il fascio va direttamente da un punto all'altro e traccia una linea. Non esistono pixel né righe. Il programma prepara una lista di comandi ("sposta il fascio qui", "traccia una linea fin là, a questa luminosità") e un circuito, il **generatore di vettori**, la esegue sessanta volte al secondo.

Le conseguenze si vedono subito:

- le linee sono **perfettamente dritte**, senza scalini, a qualsiasi angolo;
- il fosforo **brilla** attorno alla linea e dove due linee si incrociano la luce si somma;
- un punto (un colpo) è il fascio fermo per un istante: una piccola stella luminosa;
- ogni disegno si può **ingrandire o ruotare** senza perdere qualità, perché è fatto di numeri, non di pixel.

## 2. I disegni come passi del fascio

Nella ROM di Asteroids un disegno non è un'immagine ma una sequenza di **passi**: "muovi il fascio di (dx, dy) con luminosità b". Con luminosità 0 il fascio si sposta senza disegnare. Il pacchetto usa la stessa forma, copiata numero per numero:

```ts
/** One step of the beam: how far it moves and how bright it is while moving (0 = off, 15 = max). */
export type VectorStep = readonly [dx: number, dy: number, brightness: number];

/** A drawing made of beam steps, starting from the position where it is placed. */
export type VectorShape = readonly VectorStep[];
```

Il primo asteroide della ROM (indirizzo `$11E6`) diventa così:

```ts
// $11E6
[[0, 16, 0], [16, 16, 7], [16, -16, 7], [-8, -16, 7], [8, -16, 7], [-24, -16, 8], /* ... */],
```

Il primo passo, spento, porta il fascio dal centro dell'asteroide al primo angolo; gli altri tracciano il contorno. Come nell'hardware, **la y cresce verso l'alto**.

Per trasformare un disegno in linee basta "seguire il fascio": `shapeToLines` parte dal punto dove il disegno è piazzato, somma i passi uno dopo l'altro e tiene solo quelli accesi. È una funzione pura, facile da testare:

```ts
const lines = shapeToLines(ROCK_SHAPES[0], { x: 512, y: 500, scale: 1 / 2 });
// → [{ x1, y1, x2, y2, brightness }, ...]
```

`Placement` accetta anche `angle` (rotazione in radianti) e `flipX`/`flipY`. Asteroids usa gli specchi: la ROM contiene solo 17 disegni della nave, per un quarto di giro, e il programma ricava gli altri tre quarti cambiando i segni. Un gioco futuro potrà invece ruotare liberamente con `angle`.

## 3. Il font vettoriale Atari

Anche le lettere sono disegni a passi: 8 unità di larghezza, 12 di altezza, e ogni lettera **finisce dove comincia la successiva**, con un ultimo passo spento. Scrivere un testo significa quindi mettere in fila le lettere e seguire il fascio:

```ts
export const textShape = (font: VectorFont, text: string): VectorShape =>
  [...text.toUpperCase()].flatMap((char) => glyphFor(font, char));
```

`atariVectorFont` contiene le 26 lettere, le cifre (lo zero è la lettera O, come nella ROM), lo spazio e il simbolo ©. Un alfabeto uguale o molto simile compare negli altri giochi vettoriali Atari dell'epoca, come Lunar Lander, per questo sta nel pacchetto e non nel gioco.

## 4. Dal mondo ai pixel

Il gioco ragiona nelle unità del generatore di vettori (per Asteroids 1024 × 768, con y verso l'alto); il canvas ha pixel con y verso il basso. Due funzioni pure fanno la conversione:

- `fitViewport(viewport, pixelWidth, pixelHeight)` calcola una scala unica e l'eventuale bordo nero per centrare l'immagine;
- `toPixel(mapping, x, y)` converte un punto e **capovolge la y**.

Per avere linee nitide anche su uno schermo Retina, il canvas deve avere **tanti pixel quanti ne occupa davvero**: dimensione CSS × `devicePixelRatio`. Lo fa `syncScreen`, chiamata prima di ogni disegno; tocca il canvas solo quando la dimensione cambia, perché ridimensionare un canvas lo cancella:

```ts
const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
```

È l'opposto di Space Invaders e Breakout: lì il canvas ha pochi pixel e il CSS li ingrandisce con `pixelated`; qui il canvas è grande quanto lo schermo e le coordinate si scalano nel codice.

## 5. La luce del fascio

`drawBeamLines` disegna le linee con tre accorgimenti:

1. **Alone:** ogni linea ha un'ombra sfocata di colore azzurrino (`shadowBlur`), come il fosforo che brilla attorno al fascio.
2. **Luce che si somma:** la modalità `globalCompositeOperation = 'lighter'` somma i colori invece di coprirli, così due linee che si incrociano diventano più luminose, come sul tubo.
3. **Luminosità:** il valore da 0 a 15 della ROM diventa un'opacità con una curva (`gamma`) che schiarisce i valori bassi. Asteroids disegna gli asteroidi a 7 e la nave a 12: con una scala lineare gli asteroidi sarebbero troppo scuri.

Le linee vengono raggruppate per luminosità: ogni gruppo è **un solo tracciato**, quindi un intero schermo costa una manciata di chiamate a `stroke()`, non una per linea.

Spessore, alone e dimensione dei punti sono in **unità del mondo**, non in pixel: l'immagine ha le stesse proporzioni su un telefono e su un monitor grande, come il punto luminoso di un tubo vero cresce con il tubo. I valori sono nel `tuning.config.ts` del gioco, perché ogni monitor era diverso:

```ts
beam: {
  color: '#f4f7ff',
  glowColor: 'rgba(150, 185, 255, 0.9)',
  coreWidth: 1.4,
  glowBlur: 6,
  dotSize: 3,
  maxBrightness: 15,
  gamma: 0.6,
},
```

## 6. Test senza browser

Tutta la parte geometrica (passi, trasformazioni, font, conversione in pixel) è fatta di funzioni pure e si testa con numeri. Per il disegno, un contesto finto registra le chiamate (`moveTo(10,90)`, `stroke(1)`...) e il test controlla che la y sia capovolta, che ogni luminosità sia disegnata una volta sola e che i punti diventino cerchi. Il canvas vero serve solo per l'ultimo controllo a occhio.

## Riepilogo del pacchetto

| Funzione                           | Cosa fa                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `shapeToLines(shape, placement)`   | segue il fascio e restituisce le linee accese           |
| `transformOffset(dx, dy, place)`   | specchi, scala e rotazione di un passo                  |
| `shapeEnd(shape)`                  | dove finisce il fascio (per lettere e icone in fila)    |
| `atariVectorFont`, `textToLines`   | il font delle ROM Atari e la scrittura di un testo      |
| `vectorTextWidth(font, text)`      | larghezza di un testo, per centrarlo                    |
| `fitViewport`, `toPixel`           | dal mondo con y verso l'alto ai pixel del canvas        |
| `syncScreen(ctx, viewport, ratio)` | canvas grande quanto lo schermo, nitido anche su Retina |
| `drawBeamLines(ctx, lines, ...)`   | linee luminose con alone, raggruppate per luminosità    |
