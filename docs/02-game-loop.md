# 02 · Game loop

Obiettivo: un ciclo di gioco che aggiorna la simulazione a velocità costante, indipendente dalla frequenza del monitor. Alla fine la schermata di Space Invaders fa lampeggiare "INSERT COIN" una volta al secondo, su un monitor a 60 Hz come su uno a 144 Hz.

Codice: [`packages/engine-core/src`](../packages/engine-core/src).

## 1. Il problema

Il modo più semplice di animare un canvas è aggiornare e disegnare a ogni `requestAnimationFrame`:

```ts
function frame() {
  alien.x += 1; // un pixel per frame
  draw();
  requestAnimationFrame(frame);
}
```

Funziona, ma la velocità del gioco dipende dal monitor: a 144 Hz gli alieni vanno più del doppio più veloci che a 60 Hz. I cabinati originali non avevano questo problema, perché l'hardware era sempre lo stesso.

Moltiplicare per il tempo trascorso (`alien.x += speed * dt`) risolve la velocità ma introduce un altro problema: con `dt` variabili la simulazione non è più deterministica, e le collisioni possono dipendere dal frame rate.

## 2. La soluzione: timestep fisso con accumulatore

L'idea (descritta nel classico articolo _Fix Your Timestep!_ di Glenn Fiedler) è separare il **tempo reale** dal **tempo di simulazione**:

1. A ogni frame si misura quanto tempo reale è passato e lo si aggiunge a un _accumulatore_.
2. Finché l'accumulatore contiene almeno un passo (per esempio 1/60 di secondo), si esegue `update` con quel passo fisso e lo si sottrae.
3. Si disegna una volta sola.

```
tempo reale:   |--16.7ms--|--6.9ms--|--6.9ms--|--6.9ms--|   (monitor a 144 Hz)
update 1/60:   |    ●     |         |    ●    |         |
render:        ●          ●         ●         ●
```

A 144 Hz alcuni frame non eseguono nessun update, a 30 Hz ogni frame ne esegue due: la simulazione avanza sempre di 60 passi al secondo.

## 3. La parte pura: `advanceClock`

Tutta la logica dell'accumulatore è aritmetica, senza API del browser. Per questo è una **funzione pura**: riceve la configurazione, lo stato dell'orologio e il tempo trascorso, e restituisce un nuovo stato senza modificare quello ricevuto.

```ts
export const advanceClock = (
  config: ClockConfig,
  state: ClockState,
  elapsed: number,
): ClockTick => {
  const accumulator = state.accumulator + clampFrameTime(elapsed, config.maxFrameTime);
  const steps = Math.floor((accumulator + EPSILON) / config.step);
  return {
    state: { accumulator: Math.max(0, accumulator - steps * config.step) },
    steps,
  };
};
```

Stesso input, stesso output: per testarla basta chiamarla, senza preparare nulla.

Tre dettagli importanti:

- **`maxFrameTime`** (default 0,25 s): se la scheda resta in background per un minuto, al ritorno non vogliamo eseguire 3600 update di fila (la cosiddetta _spiral of death_). Il tempo viene tagliato da `clampFrameTime`.
- **`EPSILON`**: `1/60` non è rappresentabile esattamente in virgola mobile. Senza una piccola tolleranza, 1/60 di secondo reale a volte produce 0 passi invece di 1. Il test _keeps the step count exact over many 60 Hz frames_ verifica 6000 frame consecutivi.
- **`interpolationAlpha`**: la frazione di passo rimasta nell'accumulatore (da 0 a 1). Serve per interpolare il disegno fra due stati; per un gioco pixel-art a 60 passi al secondo di solito non serve.

> Nella prima versione l'orologio era una classe con un campo privato. È stato riscritto come funzione pura quando il progetto ha adottato le [regole di sviluppo](../CLAUDE.md): il risultato è più corto e più facile da testare.

## 4. Il ciclo: `createGameLoop`

`createGameLoop` collega l'orologio a `requestAnimationFrame`. Il gioco gli passa tre cose:

```ts
const loop = createGameLoop({
  initialState, // stato iniziale del gioco
  update: (state, dt) => nextState, // funzione pura: lo stato dt secondi dopo
  render: (state) => draw(ctx, state), // disegna lo stato, non lo modifica
});
loop.start();
```

A ogni frame il ciclo esegue `update` tante volte quante ne dice l'orologio (helper `simulateSteps`) e poi `render` una volta sola.

Il ciclo è l'unico punto in cui esiste stato mutabile: lo stato del gioco, dell'orologio e l'id del frame sono variabili `let` **private alla closure** di `createGameLoop`. Nessun altro codice può modificarle; dall'esterno si legge lo stato con `loop.state()`. È il pattern _functional core, imperative shell_: logica pura al centro, effetti collaterali confinati ai bordi.

- Il primo frame dopo `start()` serve solo a fissare il riferimento temporale: nessun update (helper `elapsedSeconds`).
- `stop()` cancella il frame in attesa; un successivo `start()` azzera l'accumulatore, così il tempo passato in pausa non viene "recuperato".
- Lo _scheduler_ è iniettabile: in produzione è `requestAnimationFrame`, nei test è un finto orologio controllato a mano.

## 5. Testare il tempo senza aspettare

Nei test (`loop.test.ts`) uno scheduler finto memorizza la callback e la esegue quando chiamiamo `tick(ms)`. Lo stato del gioco di prova è un semplice numero che conta il tempo simulato:

```ts
const addTime = (time: number, dt: number): number => time + dt;

loop.start();
tick(1000); // riferimento
tick(1030); // 30 ms dopo, con step = 10 ms
expect(loop.state()).toBeCloseTo(0.03); // tre passi da 10 ms
```

Così si verifica il comportamento del ciclo in millisecondi, senza timer reali e senza test lenti o instabili.

## 6. Uso in Space Invaders

Il gioco è diviso in tre file, uno per responsabilità:

| File                                                   | Contenuto                                                 | Puro?                            |
| ------------------------------------------------------ | --------------------------------------------------------- | -------------------------------- |
| [`attract.ts`](../games/space-invaders/src/attract.ts) | Stato della schermata d'attesa e funzione `updateAttract` | Sì, testato in `attract.test.ts` |
| [`render.ts`](../games/space-invaders/src/render.ts)   | Disegno sul canvas                                        | No: modifica solo `ctx`          |
| [`main.ts`](../games/space-invaders/src/main.ts)       | Collega canvas, stato e game loop                         | No: è il guscio                  |

```ts
export const updateAttract = (state: AttractState, dt: number): AttractState => ({
  time: state.time + dt,
});

export const isInsertCoinVisible = ({ time }: AttractState): boolean =>
  time % BLINK_PERIOD < BLINK_PERIOD / 2;
```

Lo stato cambia solo in `update`, `render` si limita a leggerlo: è la regola da seguire per tutto il gioco.

## Verifica

```bash
pnpm test   # test di engine-core (orologio e ciclo) e della schermata d'attesa
pnpm dev    # "INSERT COIN" lampeggia una volta al secondo
```

Prossima guida: [03 · Input da tastiera](03-input-tastiera.md).
