# 09 · Record salvato

Obiettivo: il punteggio più alto resta anche chiudendo la pagina, e superarlo durante la partita fa partire una fanfara.

## 1. Dove salvare: `localStorage`

Il browser offre a ogni sito un piccolo archivio chiave/valore, `localStorage`, che sopravvive alla chiusura della pagina. Per un numero è la scelta più semplice: niente server, niente account.

Ogni gioco usa una sua chiave, così i record non si mescolano:

```ts
const hiScores = createHiScoreStore('insert-coin/space-invaders/hi-score');
```

## 2. Il pacchetto `@arcade/storage`

Salvare un record serve a tutti i giochi del monorepo, quindi sta in un pacchetto condiviso. Il punto delicato è che `localStorage` **può fallire** in situazioni del tutto normali:

- navigazione privata in alcuni browser;
- archiviazione disattivata dall'utente;
- spazio esaurito;
- un valore modificato a mano negli strumenti del browser.

Un record non salvato non deve mai bloccare il gioco. Per questo:

```ts
/** Anything that is not a non-negative whole number counts as "no record". */
export const parseHiScore = (text: string | null): number => {
  const score = Number(text ?? '');
  return Number.isSafeInteger(score) && score > 0 ? score : 0;
};
```

e ogni accesso passa da un piccolo helper che trasforma un'eccezione in un valore di ripiego:

```ts
const attempt = <T>(action: () => T, fallback: T): T => {
  try {
    return action();
  } catch {
    return fallback;
  }
};
```

`createHiScoreStore(key, storage)` restituisce due funzioni: `load()` (il record, o 0) e `save(score)` (salva solo se batte il record). Il parametro `storage` è di tipo `Pick<Storage, 'getItem' | 'setItem'>`: nei test si passa un oggetto in memoria, o uno che lancia sempre errori per simulare il browser che rifiuta.

## 3. Il gioco resta puro

La logica di gioco non sa nulla del browser. `main.ts`, il "guscio", fa due cose:

```ts
// all'avvio: il record salvato entra nello stato iniziale
initialState: { ...initialGameState, hiScore: hiScores.load() },

// a ogni passo: se il record è cambiato, lo salva subito
if (next.hiScore > state.hiScore) hiScores.save(next.hiScore);
```

Salvare subito, invece che a fine partita, protegge il record anche se si chiude la pagina a metà.

Come sul cabinato, la riga `SCORE<1> HI-SCORE` ora compare anche nella schermata di attesa: si vede il record salvato prima ancora di inserire la moneta.

## 4. La fanfara del nuovo record

L'originale non ha un suono per il record. Quello del remake si ispira alla vita extra (tono quadro a 480 Hz) e sale in un arpeggio maggiore: 480, 600, 720 e 960 Hz, l'ultima nota tenuta. È un effetto a quattro strati con `delay`, come quelli della [guida 06](06-audio.md).

Quando suonarla? Serve sapere **qual era il record all'inizio della partita**, perché durante il gioco `hiScore` cresce insieme al punteggio. Lo stato della partita lo conserva:

```ts
{
  screen: 'playing';
  playing: PlayingState;
  recordToBeat: number;
}
```

e `soundsFor`, che deduce i suoni confrontando due stati, aggiunge una regola:

```ts
const beatRecord = (previous: GameState, next: PlayingState): boolean =>
  previous.screen === 'playing' &&
  previous.recordToBeat > 0 &&
  previous.playing.score <= previous.recordToBeat &&
  next.score > previous.recordToBeat;
```

Così la fanfara suona **una sola volta** per partita, nel momento in cui il punteggio supera il vecchio record, e non alla prima partita in assoluto (record 0: il primo alieno abbattuto non è un'impresa).

## Verifica

```bash
pnpm test   # test di @arcade/storage, di recordToBeat e della regola del suono
pnpm dev
```

Fai qualche punto, ricarica la pagina: il record è ancora lì, in alto. Nella partita successiva, quando lo superi, senti la fanfara. Negli strumenti per sviluppatori (Application → Local Storage) si vede la chiave `insert-coin/space-invaders/hi-score`; cancellandola il record torna a 0.

Prossima guida: [10 · Un secondo gioco: Breakout](10-secondo-gioco.md).
