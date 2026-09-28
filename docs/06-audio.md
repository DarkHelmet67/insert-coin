# 06 · Audio

Obiettivo: effetti sonori senza file audio, generati dal browser. Alla fine Space Invaders suona quando si inserisce la moneta, quando il cannone spara e quando un alieno viene colpito; il tasto **M** toglie e rimette l'audio.

Codice: [`packages/audio/src`](../packages/audio/src).

## 1. Suoni come dati

Il cabinato originale non riproduceva registrazioni: aveva una scheda con circuiti analogici, uno per effetto. Possiamo fare qualcosa di simile con la **Web Audio API**, che genera il suono in tempo reale.

Ogni effetto è descritto da pochi numeri, come oggetto immutabile:

```ts
export const sounds = {
  coin: { kind: 'tone', wave: 'square', from: 660, to: 1320, duration: 0.15, volume: 0.15 },
  shot: { kind: 'noise', cutoff: 3500, duration: 0.2, volume: 0.25 },
  alienHit: { kind: 'tone', wave: 'square', from: 900, to: 120, duration: 0.3, volume: 0.15 },
};
```

Due tipi bastano per quasi tutti gli effetti arcade:

| Tipo    | Come funziona                                                                       | Adatto per                                |
| ------- | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| `tone`  | Un oscillatore la cui frequenza scivola da `from` a `to` mentre il volume si spegne | Bip, sirene, suoni che salgono o scendono |
| `noise` | Rumore bianco (campioni casuali) attraverso un filtro passa-basso                   | Spari, esplosioni, fruscii                |

Il vantaggio: i suoni si leggono e si modificano come qualsiasi altro codice, e non ci sono file da caricare. Il bundle resta un solo JavaScript.

## 2. Il sintetizzatore: un piccolo grafo di nodi

Web Audio funziona collegando **nodi**, come i moduli di un sintetizzatore:

```
tone:   oscillatore ─────────────────► guadagno (volume che sfuma) ─► altoparlanti
noise:  buffer di rumore ─► filtro ──► guadagno (volume che sfuma) ─► altoparlanti
```

`playSound` costruisce questo grafo a ogni chiamata. Può sembrare uno spreco, ma è il modo previsto dalla specifica: i nodi sorgente si usano una volta sola e il browser li libera appena hanno finito di suonare.

Le variazioni nel tempo non si programmano con timer JavaScript ma si **pianificano** sull'orologio audio, che è molto più preciso:

```ts
oscillator.frequency.setValueAtTime(sound.from, start);
oscillator.frequency.exponentialRampToValueAtTime(sound.to, endTime(sound, start));
```

Le rampe sono _esponenziali_ perché l'orecchio percepisce altezza e volume in modo logaritmico: una rampa lineare sembrerebbe cambiare quasi tutta alla fine. Una rampa esponenziale però non può arrivare a zero, per questo il volume finale è la costante `SILENCE` (0,0001), inudibile.

## 3. La politica di autoplay

I browser non permettono a una pagina di emettere suoni prima che l'utente interagisca (un tasto, un clic). Un `AudioContext` creato troppo presto resta _sospeso_.

`createAudio` risolve il problema aspettando il primo `keydown` o `pointerdown`: in quel momento crea il contesto, o lo riprende se il browser lo aveva sospeso. Fino ad allora `play` non fa nulla. In Space Invaders il primo gesto è quasi sempre il tasto della moneta: il suono della moneta è il primo a partire.

`createAudio` gestisce anche il muto (`toggleMute`, `isMuted`). Come la tastiera, è un piccolo guscio imperativo: lo stato (il contesto e il flag del muto) è privato della closure.

## 4. Testare l'audio senza sentirlo

Node non ha la Web Audio API. Come per il canvas nella [guida 04](04-rendering-sprite.md), il sintetizzatore dipende solo dalle funzioni che usa davvero (tipo `SynthContext`). Nei test un contesto finto **registra le chiamate** invece di produrre suono:

```ts
playSound(ctx, { kind: 'tone', wave: 'square', from: 800, to: 100, duration: 0.3, volume: 0.4 });
expect(ctx.calls).toEqual(
  expect.arrayContaining([
    ['frequency.set', 800, 0],
    ['frequency.ramp', 100, 0.3],
    ['oscillator.stop', 0.3],
  ]),
);
```

Anche il rumore bianco è testabile: `whiteNoise` riceve la sorgente casuale come parametro, e il test gliene passa una prevedibile.

## 5. Chi decide quando suonare?

La logica di gioco è pura: `updateGame` non può chiamare `audio.play`, altrimenti non sarebbe più testabile senza audio. La soluzione è **confrontare lo stato prima e dopo** il passo:

```ts
export const soundsFor = (previous: GameState, next: GameState): readonly SoundName[] => {
  if (coinInserted(previous, next)) return ['coin'];
  // ...
  const fired = previous.playing.shot === undefined && next.playing.shot !== undefined;
  const hit = next.playing.score > previous.playing.score;
  // ...
};
```

- prima non c'era un colpo e adesso sì: si è sparato;
- il punteggio è salito: un alieno è stato colpito.

`soundsFor` è a sua volta una funzione pura, con i suoi test. Il collegamento avviene in `main.ts`, l'unico punto in cui logica, tastiera e audio si incontrano:

```ts
const step = (state: GameState, dt: number): GameState => {
  const controls = readControls(keyboard.poll());
  if (controls.mute) audio.toggleMute();
  const next = updateGame(state, controls, dt);
  soundsFor(state, next).forEach((name) => {
    audio.play(sounds[name]);
  });
  return next;
};
```

Questo approccio scala bene: la marcia degli alieni, l'UFO o la morte del cannone saranno nuove righe in `soundsFor`, senza toccare la logica di gioco.

## 6. Un'eccezione alle regole

I nodi Web Audio si configurano per assegnamento (`oscillator.type = 'square'`, `source.buffer = buffer`), proprio come il contesto del canvas. La regola ESLint sull'immutabilità è quindi disattivata **solo** per `synth.ts`, e l'eccezione è documentata in [CLAUDE.md](../CLAUDE.md).

## Verifica

```bash
pnpm test   # test di suoni, sintetizzatore, autoplay e muto, e di soundsFor
pnpm dev    # C per la moneta, spazio per sparare, M per il muto
```

Prossima guida: [07 · Build e deploy](07-build-deploy.md).
