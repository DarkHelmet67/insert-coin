# 04 · Rendering e sprite

Obiettivo: disegnare grafica pixel-art nitida senza file immagine. Alla fine Space Invaders mostra la classica tabella dei punteggi con gli alieni animati, e il cannone ha il suo sprite.

![Schermata d'attesa di Space Invaders](images/space-invaders-attract.png)

Codice: [`packages/render/src`](../packages/render/src).

## 1. Come disegnava l'hardware originale

Il cabinato di Space Invaders aveva uno schermo di 224×256 pixel e **un bit per pixel**: acceso o spento. I colori non esistevano: erano strisce di plastica colorata incollate sul vetro, rossa in alto (dove passa l'UFO) e verde in basso (dove sta il cannone).

Per un remake questo è comodo: uno sprite è solo una griglia di pixel accesi o spenti, e il colore si sceglie quando lo si disegna.

## 2. Sprite scritti come testo

Invece di file PNG, gli sprite sono scritti nel codice come "ASCII art", una stringa per riga (`X` = pixel acceso):

```ts
export const cannonSprite = parseSprite([
  '......X......',
  '.....XXX.....',
  '.....XXX.....',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
]);
```

Vantaggi:

- si vede la forma leggendo il codice, e una modifica in una pull request si capisce a colpo d'occhio;
- nessun caricamento asincrono di immagini: gli sprite sono pronti appena il modulo è importato;
- il bundle resta un solo file JavaScript, come richiesto.

`parseSprite` trasforma le righe in un oggetto immutabile `{ width, height, pixels }` e rifiuta righe di lunghezza diversa, un errore facile da fare a mano.

## 3. Disegnare in modo efficiente: le "run"

Il modo più semplice di disegnare uno sprite è un `fillRect` di 1×1 per ogni pixel acceso. Funziona, ma l'alieno più grande (l'_octopus_) ha una sessantina di pixel accesi e sullo schermo ci saranno 55 alieni.

`spriteRuns` raggruppa i pixel accesi consecutivi di ogni riga in una _run_ (x, y, lunghezza), da disegnare con un unico rettangolo:

```
riga 'XXX..XX..XXX'  →  3 run: (0, 3), (5, 2), (9, 3)  →  3 fillRect invece di 8
```

È una funzione pura, quindi testata senza canvas. `drawSprite` si limita a percorrere le run:

```ts
export const drawSprite = (ctx, sprite, x, y, color) => {
  const left = Math.round(x);
  const top = Math.round(y);
  ctx.fillStyle = color;
  spriteRuns(sprite).forEach((run) => {
    ctx.fillRect(left + run.x, top + run.y, run.length, 1);
  });
};
```

La posizione viene arrotondata: il cannone si muove di frazioni di pixel a ogni passo (60 pixel al secondo divisi in 60 passi), ma va disegnato su pixel interi per restare nitido.

## 4. Un font bitmap

Anche le lettere sono sprite: un font è una mappa carattere → sprite 5×7. [`arcade-font.ts`](../packages/render/src/arcade-font.ts) contiene lettere, cifre e i simboli della tabella punteggi, disegnati da zero.

- `textWidth` calcola la larghezza di un testo (glifi più spaziatura, senza lo spazio dopo l'ultimo carattere);
- `drawText` disegna un glifo dopo l'altro, converte le minuscole in maiuscole e lascia vuoti i caratteri sconosciuti;
- `drawCenteredText` centra un testo sullo schermo.

La spaziatura di 3 pixel riproduce le celle di 8 pixel dell'originale (5 di glifo + 3 di spazio).

## 5. Testare il disegno senza browser

Il canvas non esiste in Node. Le funzioni di disegno però usano solo tre cose del contesto: `fillStyle`, `fillRect` e le dimensioni del canvas. Il tipo `DrawingContext` dichiara esattamente questo sottoinsieme:

```ts
export type DrawingContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'> & {
  readonly canvas: { readonly width: number; readonly height: number };
};
```

Nei test, `createRecordingContext` fornisce un finto contesto che **registra** i rettangoli invece di disegnarli:

```ts
drawSprite(ctx, parseSprite(['XX.X']), 10, 5, '#0f0');
expect(ctx.rects).toEqual([
  { x: 10, y: 5, width: 2, height: 1, color: '#0f0' },
  { x: 13, y: 5, width: 1, height: 1, color: '#0f0' },
]);
```

È un esempio del principio "dipendere dal minimo indispensabile": chiedere un `CanvasRenderingContext2D` completo avrebbe reso il codice intestabile senza un browser.

## 6. Uso in Space Invaders

| File                                                                 | Contenuto                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [`sprites.ts`](../games/space-invaders/src/sprites.ts)               | I tre alieni (due fotogrammi ciascuno), il cannone e l'UFO         |
| [`palette.ts`](../games/space-invaders/src/palette.ts)               | Le palette monocromatica e a colori, lette da `colors.config.ts`   |
| [`render-attract.ts`](../games/space-invaders/src/render-attract.ts) | Titolo e tabella dei punteggi con gli alieni animati               |
| [`render-playing.ts`](../games/space-invaders/src/render-playing.ts) | Linea del terreno e cannone                                        |
| [`render.ts`](../games/space-invaders/src/render.ts)                 | Pulisce lo schermo e sceglie cosa disegnare in base alla schermata |

L'animazione degli alieni è logica pura, in `attract.ts`: `alienFrame(state)` restituisce 0 o 1 in base al tempo, e il disegno si limita a scegliere lo sprite corrispondente. Un test verifica che le dimensioni degli sprite siano quelle dell'originale (8, 11 e 12 pixel di larghezza per gli alieni, 16 per l'UFO) e che la larghezza del cannone coincida con quella usata dalla logica di movimento.

## Verifica

```bash
pnpm test   # test di sprite, run, font e disegno con il contesto finto
pnpm dev    # tabella dei punteggi animata; con C appare il cannone
```

Prossima guida: [05 · Collisioni](05-collisioni.md).
