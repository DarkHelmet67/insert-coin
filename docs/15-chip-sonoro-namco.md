# 15 · Il chip sonoro Namco

Obiettivo: far suonare _Galaga_ con le sue melodie vere, lette dalla ROM, invece di imitarle a orecchio. Il risultato sono due pezzi: il pacchetto `@arcade/wsg`, che emula il chip sonoro e serve a tutti i giochi Namco della stessa famiglia (Pac-Man, Dig Dug...), e il **programma sonoro** di Galaga, riscritto in TypeScript in `games/galaga/src/sound-*.ts`.

## 1. Perché non bastano gli effetti di `@arcade/audio`

Space Invaders, Breakout e Asteroids avevano suoni fatti da **circuiti analogici**: un oscillatore che scende di tono, un rumore filtrato. Il pacchetto `@arcade/audio` li descrive come dati (`ToneSound`, `NoiseSound`) e li fa suonare a Web Audio ([guida 06](06-audio.md)).

Galaga è diverso: ha un **terzo processore** Z80 dedicato al suono, con un suo programma e le sue tabelle di note, e un chip che suona forme d'onda. Le melodie (il tema d'inizio, la musica del caccia catturato, il "perfect!") sono spartiti veri, con tempo, ottave e inviluppi. Imitarle a orecchio vorrebbe dire sbagliarle; leggerle dalla ROM le rende identiche.

## 2. Il chip: tre voci e otto forme d'onda

Il chip ha **tre voci**. Ogni voce ha tre registri:

| Registro   | Bit | Significato                                                   |
| ---------- | --- | ------------------------------------------------------------- |
| frequenza  | 20  | quanto avanza il contatore della voce a ogni campione         |
| volume     | 4   | da 0 (muta) a 15                                              |
| forma onda | 3   | quale delle 8 forme d'onda della PROM (`prom-1.1d` in Galaga) |

Ogni forma d'onda è una tabella di **32 campioni da 4 bit** (da 0 a 15, il centro è 8). Il chip produce 96 000 campioni al secondo (il quarzo da 18,432 MHz diviso per 6 e per 32, come si legge in MAME). A ogni campione il contatore di ogni voce cresce della frequenza; i suoi 5 bit più alti dicono quale campione della forma d'onda suonare. Il contatore ha 20 bit, quindi il tono in hertz è:

```
hertz = frequenza × 96 000 / 2^20
```

Il pacchetto lo fa con funzioni pure:

```ts
const waves = decodeWaveforms(WAVEFORM_PROM); // 8 forme d'onda da 32 campioni
const { chip, samples } = renderChip(newChip(), voices, waves, 400, 48000);
```

`renderChip` riceve lo stato del chip (dove si trova ogni voce nella sua forma d'onda) e restituisce i campioni insieme al nuovo stato, così due chiamate di seguito danno un'onda senza strappi. Il contatore cresce sempre della stessa quantità, quindi la sua posizione al campione _k_ si calcola direttamente (`contatore + frequenza × k`) senza un ciclo che lo aggiorni passo per passo: niente `let`, come chiedono le regole del progetto.

Il browser suona a 48 000 campioni al secondo, la metà esatta del chip: ogni campione in uscita è la **media di due campioni** del chip, un filtro semplicissimo che toglie un po' della durezza.

## 3. Il programma sonoro

Il processore del suono non decide nulla: esegue gli ordini del processore principale. La comunicazione passa da una zona di memoria condivisa, i **registri di comando** (`b_9AA0` nel sorgente commentato di Galaga): il gioco scrive 1 nel registro di un effetto e il programma sonoro lo suona. Il programma gira **120 volte al secondo** (MAME lo interrompe alle righe 64 e 192 dello schermo).

I dati sono tutti nella ROM del processore sonoro (`3700g.bin`):

- **la tabella delle note** (`d_06A9_ndat`): 12 note dell'ottava più alta, a 16 bit, più una pausa;
- **la tabella degli effetti** (`d_0703_snd_parms`): per ogni effetto, la prima traccia, quante tracce e la prima voce;
- **le tracce** (`d_0748_p_snd_fx`): ogni traccia ha un'intestazione di tre byte (inviluppo, durata piena, forma d'onda) e poi le note, in coppie di byte: la nota e la sua lunghezza in battiti;
- **i tempi** (`d_07A6`): quanti tick dura un battito, per ogni effetto.

Un byte di nota si legge così: i 4 bit bassi sono la nota nell'ottava alta, i 4 bit alti quante ottave scendere (ogni ottava dimezza la frequenza). `$0C` è una pausa, `$FF` la fine della traccia.

```ts
export const notePitch = (note: number): number =>
  soundWord(NOTE_TABLE + (note & 0x0f) * 2) >> (note >> 4);
```

Il volume di ogni nota segue il suo **inviluppo**: con l'inviluppo 0 la nota resta a volume 10 per un certo numero di tick, poi scende di uno a ogni tick; l'inviluppo 1 sale prima da 2 a 10, il 2 parte da 14 e scende a 10 (`envelopeVolume` in `sound-tracks.ts`).

## 4. Tre modi di suonare un effetto

Il programma ha tre routine per gli effetti, e la differenza sta in cosa vuol dire il registro di comando:

| Tipo           | Routine originale  | Effetti                                       | Comportamento                                                      |
| -------------- | ------------------ | --------------------------------------------- | ------------------------------------------------------------------ |
| **ripartenza** | `c_03F4`, `c_044A` | colpo, alieni colpiti, picchiata              | ogni comando lo fa ripartire da capo; il registro si azzera subito |
| **tenuto**     | `c_0375`           | raggio traente, caccia catturato, salvataggio | suona in ciclo finché il registro resta acceso                     |
| **melodia**    | `c_04A2`           | tema d'inizio, stage bonus, vita extra        | suona fino alla fine, poi azzera il registro da sé                 |

Le tre routine sono in `sound-effects.ts`. Qualche melodia ha un finale speciale: il "perfect!" fa partire un altro effetto, e il suono del caccia catturato colpito ("shot your ship!") spegne tutti gli altri, tranne monete e vite extra.

## 5. La priorità è l'ordine

Tre voci per una ventina di effetti: chi vince? Il programma controlla gli effetti **sempre nello stesso ordine**, e ognuno scrive le voci che usa. Un effetto più avanti nella lista copre quello prima sulla stessa voce. L'ordine è quindi la priorità, e il remake lo copia in `tickSound` (`sound-program.ts`):

```ts
const hits = RESTARTING.reduce(restarting, pulse(first, sign));
const beams = beamCapture(tractorBeam(tune(hits, EFFECT.bonusBee)));
// ...
```

Qualche effetto fa qualcosa in più delle note: il **suono pulsante** della formazione è un tono che scivola in su mentre la formazione si apre e in giù mentre si chiude; il raggio traente ha un tremolo sulla terza voce; il caccia tirato su dal raggio cambia forma d'onda ogni 28 tick.

## 6. Dal gioco agli altoparlanti

Il gioco resta puro: a ogni fotogramma `soundCommands` (`sound-commands.ts`) traduce lo stato in scritture dei registri, come farebbe il processore principale. I suoni di un istante arrivano dalla lista `sounds` dello stato; quelli che durano (il raggio, il salvataggio) si leggono dallo stato stesso, così non possono restare accesi per sbaglio.

`soundFrame` (`sound-system.ts`) applica le scritture, fa girare il programma due volte (120 tick al secondo, 60 fotogrammi) e fa suonare il chip: 800 campioni per fotogramma. Il guscio imperativo `sound-output.ts` tiene lo stato della scheda sonora tra un fotogramma e l'altro e passa i campioni a `@arcade/audio`:

```ts
audio.stream(frame.samples, SAMPLE_RATE);
```

`stream` è la novità di `@arcade/audio` per i suoni fatti dal gioco: mette i pezzi uno dopo l'altro sull'orologio audio, senza buchi. Il game loop e l'orologio audio non battono insieme, quindi i pezzi partono con un piccolo anticipo (60 ms); finché resta suono in coda il pezzo nuovo parte subito dopo, anche se manca pochissimo, perché ripartire in anticipo aggiungerebbe un silenzio; solo se la coda si esaurisce si riparte con lo stesso anticipo, se va troppo avanti (dopo una pausa della scheda del browser) il pezzo si scarta (`nextChunkStart` in `stream.ts`).

L'unico suono che non viene dal chip è l'**esplosione del caccia**: sul cabinato la fa un altro chip, il Namco 54XX, con un circuito analogico che neppure MAME emula del tutto. Il remake la imita con un `NoiseSound`, i cui valori stanno in `tuning.config.ts`.

## 7. Come si verifica

- `packages/wsg/src/chip.test.ts`: il tono giusto per una frequenza, il volume, due chiamate di seguito uguali a una sola.
- `games/galaga/src/sound-program.test.ts`: le tabelle lette dalla ROM, gli inviluppi, la durata del tema d'inizio (circa sette secondi), il tremolo, la priorità tra due effetti sulla stessa voce, il canone dei risultati dello stage bonus che entra una traccia alla volta.
- `games/galaga/src/sound-commands.test.ts`: le scritture dei registri e un fotogramma di campioni.

I dati si rigenerano dalle ROM con `node scripts/galaga/extract-rom-sound.js <cartella delle ROM>`.

Prossima guida: [16 · Un quinto gioco: Galaga](16-quinto-gioco.md).
