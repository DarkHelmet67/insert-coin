# 03 · Input da tastiera

Obiettivo: leggere la tastiera in modo affidabile dentro un game loop a timestep fisso. Alla fine, in Space Invaders, il tasto **C** (o **5**) inserisce una moneta e le frecce (o **A**/**D**) muovono il cannone alla velocità del cabinato originale.

Codice: [`packages/input/src`](../packages/input/src).

## 1. Perché non basta ascoltare `keydown`

L'approccio più immediato è reagire direttamente agli eventi:

```ts
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') cannon.x -= 1;
});
```

Ha quattro problemi:

1. **Il movimento dipende dall'auto-repeat del sistema operativo**: dopo la prima pressione c'è una pausa, poi eventi ripetuti a una frequenza che cambia da computer a computer.
2. **Gli eventi arrivano quando vogliono**, non al ritmo della simulazione: la logica di gioco viene eseguita fuori dal game loop.
3. **Tasti "incollati"**: se si rilascia un tasto mentre la finestra non ha il focus (per esempio dopo un Alt+Tab), il `keyup` non arriva mai.
4. **Il browser fa la sua parte**: le frecce e la barra spaziatrice fanno scorrere la pagina.

## 2. L'idea: lo stato della tastiera

Invece di reagire agli eventi, li usiamo per aggiornare uno **stato** che il gioco legge a ogni passo di simulazione:

| Campo      | Significato                        | Uso tipico                                    |
| ---------- | ---------------------------------- | --------------------------------------------- |
| `down`     | Tasti tenuti premuti adesso        | Movimento continuo (il cannone)               |
| `pressed`  | Tasti premuti dall'ultimo passo    | Azioni singole (sparare, inserire una moneta) |
| `released` | Tasti rilasciati dall'ultimo passo | Azioni al rilascio                            |

`pressed` e `released` si chiamano _fronti_ (edge): valgono per un solo passo. Così tenere premuta la barra spaziatrice spara un colpo solo, come sul cabinato.

## 3. La parte pura: `key-state.ts`

Lo stato è un oggetto immutabile di tre `ReadonlySet`. Ogni evento produce un nuovo stato:

```ts
export const applyKeyEvent = (state: KeyState, { type, code }: KeyEvent): KeyState => {
  if (type === 'down') {
    return state.down.has(code)
      ? state
      : { ...state, down: withKey(state.down, code), pressed: withKey(state.pressed, code) };
  }
  return state.down.has(code)
    ? { ...state, down: withoutKey(state.down, code), released: withKey(state.released, code) }
    : state;
};
```

Altre due funzioni pure completano il quadro:

- `clearEdges`: prepara lo stato per il passo successivo (stessi tasti premuti, fronti azzerati);
- `releaseAll`: rilascia tutto, usata quando la finestra perde il focus.

Un caso sottile, coperto da un test: se un tasto viene premuto **e** rilasciato fra due passi (un tocco molto rapido), `down` non lo contiene più ma `pressed` sì. Il colpo non va perso.

I tasti si identificano con `KeyboardEvent.code` (`KeyA`, `Space`, `ArrowLeft`), che indica la posizione fisica del tasto: WASD funziona allo stesso modo su tastiere italiane, francesi o tedesche.

## 4. Azioni invece di tasti: `bindings.ts`

Il gioco non dovrebbe sapere quali tasti usa il giocatore. Una tabella collega le **azioni** del cabinato ai tasti:

```ts
export const bindings: KeyBindings<Action> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  fire: ['Space'],
  coin: ['KeyC', 'Digit5'],
};
```

`isActionDown` e `wasActionPressed` rispondono alla domanda "il giocatore sta facendo questa azione?". Il tipo generico `KeyBindings<Action>` fa sì che TypeScript segnali un'azione dimenticata o scritta male. Cambiare i controlli, o aggiungere un gamepad in futuro, tocca solo questa tabella.

## 5. Il guscio: `createKeyboard`

`createKeyboard` è l'unica parte che parla con il browser. Tiene lo stato in una variabile privata della closure e lo aggiorna con le funzioni pure:

- ignora gli eventi con `repeat: true` (auto-repeat);
- chiama `preventDefault()` solo per i tasti del gioco (`captureKeys`), così la pagina non scorre ma Tab e le scorciatoie del browser continuano a funzionare;
- su `blur` rilascia tutti i tasti;
- `poll()` restituisce lo stato del passo corrente e azzera i fronti per il successivo.

Il target degli eventi è un parametro (`window` per default): nei test si usa un semplice `EventTarget` di Node e si simulano i tasti con `dispatchEvent`, senza browser.

## 6. Un poll per ogni passo di simulazione

Il punto più importante è **quando** leggere la tastiera. Il game loop può eseguire zero, uno o più `update` per frame (vedi [guida 02](02-game-loop.md)). Se leggessimo la tastiera una volta per frame, una pressione potrebbe essere vista da due update, o da nessuno.

Per questo `main.ts` chiama `poll()` dentro `update`:

```ts
createGameLoop({
  initialState: initialGameState,
  update: (state, dt) => updateGame(state, readControls(keyboard.poll()), dt),
  render: (state) => renderGame(ctx, state),
});
```

Ogni pressione raggiunge esattamente un passo di simulazione. `updateGame` resta pura: riceve i controlli già letti come parametro.

## 7. Uso in Space Invaders

| File                                                     | Contenuto                                                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`controls.ts`](../games/space-invaders/src/controls.ts) | Tabella dei tasti e `readControls`: da stato della tastiera a `{ direction, fire, coin }`                |
| [`cannon.ts`](../games/space-invaders/src/cannon.ts)     | Movimento del cannone: 60 pixel al secondo come l'originale (un pixel per frame a 60 Hz), fermo ai bordi |
| [`game.ts`](../games/space-invaders/src/game.ts)         | Stato del gioco come _union_ di schermate: `attract` finché non arriva una moneta, poi `playing`         |

Tenendo premute entrambe le direzioni il cannone sta fermo, come sul cabinato. Il cannone per ora è un rettangolo verde: gli sprite arrivano nella prossima guida.

## Verifica

```bash
pnpm test   # test di key-state, bindings, keyboard e dei controlli del gioco
pnpm dev    # premi C, poi muovi il cannone con le frecce o A/D
```

Prossima guida: **04 · Rendering e sprite**.
