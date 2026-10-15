# 16 · Un quinto gioco: Galaga

Obiettivo: costruire _Galaga_ (Namco, 1981), il primo gioco del progetto con **tre processori** e un chip sonoro a forme d'onda, eseguendo le tabelle della ROM originale invece di riscriverle, e lavorando ancora come un contributore esterno, su un branch e con una pull request.

## 1. Perché Galaga, e come è stato costruito

Galaga riporta il progetto dove è cominciato: uno schermo verticale, un cannone in basso, alieni in formazione. Ma dietro la somiglianza con Space Invaders c'è un'altra epoca: gli alieni non marciano in blocco, **volano** su traiettorie curve, picchiano, catturano il caccia del giocatore. E la musica non è più fatta di circuiti analogici, ma di un piccolo sequencer che suona note su un chip a forme d'onda.

Il metodo è quello di Lunar Lander ([guida 13](13-quarto-gioco.md)): branch `feature/galaga`, pull request in bozza aperta al primo passo, un commit per passo, la checklist nel corpo della PR, e alla fine la PR pronta per la revisione con la sua anteprima su `/pr-<numero>/` ([guida 14](14-pull-request.md)). Il manutentore ha approvato la checklist e i dieci passi sono stati eseguiti di fila:

1. ricerca sull'originale e guida delle meccaniche;
2. sprite, caratteri, colori e stelle dalle ROM;
3. il caccia, i missili e l'interprete dei voli;
4. ondate di ingresso, dondolio e respiro della formazione;
5. picchiate, bombe, colpi, esplosioni e punteggio;
6. raggio traente, cattura, salvataggio e caccia doppio;
7. stage bonus, alieni clonati, vite extra e fine partita;
8. suoni dal chip emulato e schermata attract;
9. pannello touch per smartphone;
10. guide, README, scheda del sito e versioni.

## 2. Le fonti

Come per Lunar Lander c'è una fonte migliore di un disassemblato: il **sorgente Z80 commentato** di Glenn A. Neidermeier ([neiderm/arcade](https://github.com/neiderm/arcade)), che si ricompila byte per byte nelle ROM originali e dà un nome a quasi ogni routine. Accanto a lui:

- [MAME](https://github.com/mamedev/mame/blob/master/src/mame/namco/galaga.cpp) per l'hardware: tempi, coordinate degli sprite, generatore di stelle, chip del suono;
- [Computer Archeology](https://computerarcheology.com/Arcade/Galaga/) per la decodifica delle ROM grafiche e delle PROM dei colori;
- le ROM del set MAME, lette dagli script del passo 2 (sezione 6).

Tutto è nella [guida delle meccaniche](../games/galaga/docs/meccaniche-originali.md), scritta prima del codice. Le marcature sono le solite, con una novità: [P] cita il programma dei processori _main_ e _sub_, [S] quello del processore del suono. Nel codice ogni costante e ogni funzione porta nel commento l'etichetta del sorgente (`f_08D3`, `c_1F92`, `bmbr_stg_cfg_dat`), così chi legge ritrova la riga originale.

## 3. Cosa si riusa

| Pacchetto             | In Galaga                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `@arcade/engine-core` | lo stesso game loop, a 60 passi al secondo (il cabinato fa 60,6 fotogrammi)                   |
| `@arcade/render`      | `getCanvasContext` e lo `Sprite` monocromatico: ogni tessera a 4 colori sono tre sprite       |
| `@arcade/input`       | tastiera, `createTouchButtons` e `mergeKeyStates`, senza modifiche                            |
| `@arcade/audio`       | il rumore filtrato per l'esplosione del caccia, più un nuovo `stream` (sezione 7)             |
| `@arcade/storage`     | `createHiScoreStore('insert-coin/galaga/hi-score')`                                           |
| `@arcade/wsg`         | **nuovo**: l'emulatore del chip sonoro Namco a tre voci ([guida 15](15-chip-sonoro-namco.md)) |

Il pannello touch è quello di Space Invaders ([guida 08](08-comandi-touch.md)): frecce a sinistra, MONETA e AUDIO al centro, FUOCO a destra, visibile solo con `@media (pointer: coarse)`.

## 4. Tre processori, un solo stato

Nel cabinato tre Z80 lavorano insieme e si parlano scrivendo nella stessa RAM: il _main_ dirige la partita, il _sub_ fa volare gli alieni e controlla i colpi, il terzo suona. Il remake non emula i processori, ma tiene **la stessa divisione dei compiti** in moduli puri:

| Nel cabinato                                | Nel remake                                                          |
| ------------------------------------------- | ------------------------------------------------------------------- |
| _main_: stage, ondate, picchiate, punteggio | `program.ts`, `attack-waves.ts`, `attacks.ts`, `score.ts`           |
| _main_: i "task" della cattura              | `tractor-beam.ts`, `capture-fighter.ts`, `rescue.ts`                |
| _sub_: il volo degli alieni                 | `flight.ts`, `flight-slot.ts`, `z80-math.ts`                        |
| _sub_: missili, bombe e colpi               | `rockets.ts`, `bombs.ts`, `hits.ts`                                 |
| RAM condivisa                               | `PlayingState`: un solo oggetto immutabile, aggiornato a ogni passo |
| _sound_: registri dei comandi               | `sound-commands.ts`, che legge lo stato e accende gli effetti       |

Dove il programma originale si affida a un byte di stato condiviso tra più task (per esempio le cinque fasi della cattura), il remake ha un tipo che lo descrive ([`capture-state.ts`](../games/galaga/src/capture-state.ts)) e i test controllano le stesse transizioni.

## 5. L'interprete dei voli

Il cuore di Galaga è la routine `f_08D3`: non contiene curve, ma **esegue programmi** scritti in tabelle di byte. Un'istruzione di volo è lunga tre byte (due velocità alternate, quanto gira l'angolo a ogni fotogramma, per quanti fotogrammi); i byte da `$EF` a `$FF` sono comandi: salta, torna in formazione, mira al caccia, cattura, dividiti in tre.

Il remake **esegue gli stessi byte**, copiati dalla ROM al loro indirizzo originale, perché i programmi saltano l'uno nell'altro per indirizzo. Il passo di movimento è una piccola funzione pura che ricalca l'aritmetica dello Z80: niente seni e coseni, ma un ottagono e una moltiplicazione da 8 bit.

```ts
export const stepPosition = (position, angle, speed) => {
  if (speed === 0) return position;
  const octant = (angle >> 7) & 7;
  const yIsPrimary = ((octant ^ (octant >> 1)) & 1) === 1;
  const primary = (octant >= 3 && octant <= 6 ? -speed : speed) * 128;
  const fraction = (angle & 0x80) !== 0 ? (angle & 0x7f) ^ 0x7f : angle & 0x7f;
  // ...
  return { x: (position.x + dx) & 0xffff, y: (position.y + dy) & 0xffff };
};
```

Copiare l'aritmetica intera, invece di "migliorarla" con la trigonometria, ha un motivo: le traiettorie sono state disegnate dai progettisti Namco **con quell'aritmetica**. Con seni veri gli alieni arriverebbero qualche pixel fuori posto e i comandi "torna a casa" correggerebbero la rotta in modo diverso. I test controllano il passo ottagonale sugli assi e sulle diagonali, e che un'ape in ingresso, eseguendo il suo programma dalla ROM, arrivi al suo posto nella formazione.

Un dettaglio di robustezza: un programma che salta da un comando all'altro senza mai muoversi bloccherebbe il fotogramma. L'interprete esegue al massimo 16 comandi per alieno a passo, poi lo ferma: nella ROM non succede, ma un errore di copia non deve congelare il browser.

## 6. Dati generati dalla ROM, senza la ROM

La ROM è di Namco e non entra nel repository. Quattro script in [`scripts/galaga/`](../scripts/galaga/) la leggono da una cartella indicata da chi li lancia e scrivono TypeScript leggibile:

| Script                  | Produce                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| `extract-rom-art.js`    | `src/art/`: sprite e caratteri come _ASCII art_, le PROM dei colori byte per byte |
| `extract-rom-flight.js` | `src/rom/flight-rom.ts`: i programmi di volo, ai loro indirizzi                   |
| `extract-rom-tables.js` | `src/rom/main-rom.ts`: ondate, difficoltà, punteggi, con l'etichetta del sorgente |
| `extract-rom-sound.js`  | `src/rom/sound-rom.ts`: note, tracce e melodie, e la PROM delle forme d'onda      |

È lo stesso principio del terreno di Lunar Lander: i dati si generano, non si ricopiano a mano. Due differenze però: qui i dati sono **molti** (migliaia di byte) e il set di ROM usato (`galagamw`, Midway) ha gli stessi byte del set Namco su cui è scritto il sorgente, ma a indirizzi leggermente diversi. Ogni script lo dice in testa, e ogni tabella porta sia l'etichetta sia l'indirizzo.

Gli sprite come _ASCII art_ hanno un vantaggio pratico: una revisione della PR mostra i disegni, non numeri.

## 7. Il suono: un chip emulato

Fino a Lunar Lander ogni suono era una **descrizione**: un tono che scende, un rumore filtrato. Per Galaga non bastava: la musica d'inizio, il ronzio del raggio traente, la marcetta del caccia salvato sono melodie a tre voci, e la ROM contiene le note. Il remake quindi fa come il cabinato:

1. lo stato della partita accende i **registri degli effetti** (`soundCommands`), come il processore principale;
2. il programma del suono, portato dalla ROM, li legge 120 volte al secondo e decide frequenza, volume e forma d'onda delle tre voci (`tickSound`);
3. `@arcade/wsg` genera i campioni come il chip, 800 per fotogramma;
4. `audio.stream` li accoda sull'orologio audio, uno dopo l'altro, senza buchi.

Tutto fino al punto 3 è puro e testato senza browser; il guscio imperativo è una closure di poche righe:

```ts
export const createSoundOutput = (audio: AudioPlayer): SoundOutput => {
  let board = newSoundBoard();
  return (commands) => {
    const frame = soundFrame(board, commands);
    board = frame.board;
    audio.stream(frame.samples, SAMPLE_RATE);
    if (commands.explosion) audio.play(tuning.explosion);
  };
};
```

L'unico suono non emulato è l'esplosione del caccia: viene da un altro chip (il 54XX, con un circuito analogico) che neppure MAME riproduce del tutto. È un rumore filtrato, con i valori in `tuning.config.ts`. Il chip, il programma e la coda dei campioni sono spiegati nella [guida 15](15-chip-sonoro-namco.md).

## 8. Un solo file per i valori da regolare

Come chiede il progetto, i valori incerti o scelti dal proprietario del cabinato stanno in [`tuning.config.ts`](../games/galaga/src/tuning.config.ts), ognuno con la sua fonte:

- la difficoltà (gli interruttori DIP: livello A di fabbrica, ma le tabelle hanno anche B, C e D);
- le vite di riserva e le soglie delle vite extra;
- il volume del chip e i parametri dell'esplosione.

Tutto il resto viene dalla ROM, e non va regolato: va letto.

## 9. Cosa manca, e perché

Una PR onesta dice anche cosa non fa. Le scelte sono marcate [N] nella guida delle meccaniche:

- **un solo giocatore**: niente partita a due alternata;
- **niente crediti**: la moneta avvia direttamente la partita;
- **la schermata attract** ha la presentazione dei punti e il copyright, ma non l'allenamento e la partita dimostrativa, che sul cabinato sono programmi a parte;
- **il logo "namco"** sotto il copyright non c'è: nella ROM dei caratteri del set Midway quelle tessere disegnano altro;
- **l'esplosione del caccia** è un'imitazione (sezione 7).

## 10. Provalo

```bash
pnpm test        # tutti i test, compresi quelli di Galaga e di @arcade/wsg
pnpm dev:galaga
```

All'apertura compare la presentazione dei punti, come sul cabinato. **C** (o **5**) inserisce la moneta e la partita parte; **←** **→** muovono il caccia, **Spazio** spara (un colpo per pressione, al massimo due in volo), **M** l'audio. Su smartphone il pannello del cabinato compare sotto lo schermo.

Per vedere il caccia doppio: lasciati catturare da un Boss che picchia con il raggio, poi abbattilo **mentre scende di nuovo** in picchiata. Se lo colpisci in formazione, il tuo caccia diventa un nemico.

Il percorso completo, con le decisioni e gli errori, è nel [diario AI](ai-workflow.md); le regole dell'originale, con le fonti, nella [guida delle meccaniche](../games/galaga/docs/meccaniche-originali.md).
