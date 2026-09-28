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

## 3. La parte pura: `FixedStepClock`

Tutta la logica dell'accumulatore è aritmetica, senza API del browser. Per questo sta in una classe separata, facile da testare:

```ts
advance(elapsed: number): number {
  this.#accumulator += Math.min(Math.max(elapsed, 0), this.maxFrameTime);
  const steps = Math.floor((this.#accumulator + EPSILON) / this.step);
  this.#accumulator = Math.max(0, this.#accumulator - steps * this.step);
  return steps;
}
```

Tre dettagli importanti:

- **`maxFrameTime`** (default 0,25 s): se la scheda resta in background per un minuto, al ritorno non vogliamo eseguire 3600 update di fila (la cosiddetta _spiral of death_). Il tempo viene tagliato.
- **`EPSILON`**: `1/60` non è rappresentabile esattamente in virgola mobile. Senza una piccola tolleranza, 1/60 di secondo reale a volte produce 0 passi invece di 1. Il test _keeps the step count exact over many 60 Hz frames_ verifica 6000 frame consecutivi.
- **`alpha`**: la frazione di passo rimasta nell'accumulatore (da 0 a 1). Serve per interpolare il disegno fra due stati; per un gioco pixel-art a 60 passi al secondo di solito non serve.

## 4. Il ciclo: `createGameLoop`

`createGameLoop` collega l'orologio a `requestAnimationFrame`:

```ts
const loop = createGameLoop({
  update(dt) {
    /* avanza la simulazione di dt secondi */
  },
  render(alpha) {
    /* disegna lo stato attuale */
  },
});
loop.start();
```

- Il primo frame dopo `start()` serve solo a fissare il riferimento temporale: nessun update.
- `stop()` cancella il frame in attesa; un successivo `start()` azzera l'accumulatore, così il tempo passato in pausa non viene "recuperato".
- Lo _scheduler_ è iniettabile: in produzione è `requestAnimationFrame`, nei test è un finto orologio controllato a mano.

## 5. Testare il tempo senza aspettare

Nei test (`loop.test.ts`) uno scheduler finto memorizza la callback e la esegue quando chiamiamo `tick(ms)`:

```ts
loop.start();
tick(1000); // riferimento
tick(1030); // 30 ms dopo
expect(update).toHaveBeenCalledTimes(3); // con step = 10 ms
```

Così si verifica il comportamento del ciclo in millisecondi, senza timer reali e senza test lenti o instabili.

## 6. Uso in Space Invaders

[`games/space-invaders/src/main.ts`](../games/space-invaders/src/main.ts) conta il tempo di simulazione in `update` e lo usa in `render` per far lampeggiare la scritta:

```ts
update(dt) {
  time += dt;
},
render() {
  // ...
  if (time % BLINK_PERIOD < BLINK_PERIOD / 2) ctx.fillText('INSERT COIN', ...);
},
```

Lo stato cambia solo in `update`, `render` si limita a leggerlo: è la regola da seguire per tutto il gioco.

## Verifica

```bash
pnpm test   # 9 test di engine-core, fra clock e loop
pnpm dev    # "INSERT COIN" lampeggia una volta al secondo
```

Prossima guida: **03 · Input da tastiera**.
