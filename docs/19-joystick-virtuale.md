# 19 · Joystick virtuale

Obiettivo: sui telefoni sostituire le frecce ◀ ▶ (e la croce di Pac-Man) con un **joystick virtuale**, come in tanti giochi per smartphone, lasciando a chi gioca la scelta fra joystick e frecce in `tuning.config.ts`. La logica dei giochi non cambia.

## 1. Il problema

Le frecce della [guida 08](08-comandi-touch.md) sono pulsanti: funzionano finché il dito resta sopra. Giocando però non si guardano le dita, si guarda lo schermo, e il pollice scivola poco a poco fuori dal pulsante. Fuori dal pulsante il tasto si rilascia e il cannone si ferma, proprio nel momento sbagliato. Luca l'ha notato provando i giochi sul telefono.

Un joystick ha due vantaggi:

- **conta la direzione, non il punto**: spingere a sinistra di poco o di tanto è sempre "sinistra";
- **il dito resta del joystick finché non si stacca**, anche se esce dalla base disegnata.

## 2. Le scelte

| Domanda                 | Scelta                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Dove sta il joystick?   | **Fisso**, dove c'erano le frecce (non si sposta dove si appoggia il dito)                          |
| Quali direzioni?        | **Quattro** per Pac-Man, **sinistra e destra** per Space Invaders, Galaga, Asteroids e Lunar Lander |
| Breakout?               | Escluso: la racchetta segue già il dito ([guida 10](10-secondo-gioco.md))                           |
| Joystick o frecce?      | Un'impostazione in `tuning.config.ts`, **joystick** come valore predefinito                         |
| Quanto è grande l'area? | **Tutta la cella del pannello** in cui stava la croce, più grande della base disegnata              |

## 3. Tasti virtuali, ancora una volta

Il joystick non inventa un nuovo tipo di input: come i pulsanti, **tiene premuti i tasti freccia**. Così `readControls`, le tabelle dei tasti e `updateGame` restano identici, e tastiera, pulsanti e joystick si uniscono con lo stesso `mergeKeyStates`.

## 4. La parte pura: `stick-direction.ts`

Due funzioni, testate senza browser.

`stickOffset` dice dov'è la manopola, in "raggi" della base (da -1 a 1). Se il dito è più lontano del raggio, la manopola resta sul bordo nella sua direzione:

```ts
export const stickOffset = (
  finger: StickPoint,
  center: StickPoint,
  radius: number,
): StickOffset => {
  if (radius <= 0) return centered;
  const x = (finger.x - center.x) / radius;
  const y = (finger.y - center.y) / radius;
  const length = Math.hypot(x, y);
  return length > 1 ? { x: x / length, y: y / length } : { x, y };
};
```

`stickKeys` trasforma la posizione in tasti:

- **zona morta**: vicino al centro (meno di `deadZone`, una frazione del raggio) nessun tasto, così un pollice appoggiato non muove nulla;
- **sinistra-destra**: conta solo lo spostamento orizzontale, la componente verticale si ignora;
- **quattro direzioni**: vince l'asse più spinto, quindi mai due frecce insieme. È ciò che fa la "gate" del joystick vero di Pac-Man, una guida a croce che impedisce le diagonali. Sulla diagonale esatta vince l'orizzontale.

```ts
const fourWayKeys = ({ x, y }: StickOffset, deadZone: number): readonly KeyCode[] => {
  if (Math.hypot(x, y) <= deadZone) return [];
  if (Math.abs(x) >= Math.abs(y)) return [x < 0 ? 'ArrowLeft' : 'ArrowRight'];
  return [y < 0 ? 'ArrowUp' : 'ArrowDown'];
};
```

## 5. Il guscio: `createVirtualJoystick`

Come `createTouchButtons`, tiene lo stato in una closure e si interroga con `poll()` una volta per passo. I punti importanti:

- **pointer capture**: al `pointerdown` il joystick chiama `setPointerCapture(id)`. Da quel momento tutti gli eventi di quel dito arrivano al joystick, ovunque sia il dito sullo schermo: è questo che risolve il problema del paragrafo 1;
- **un solo dito**: il primo dito prende il joystick; un secondo dito nella stessa area si ignora, così il pollice che spara non lo disturba;
- **ritorno al centro**: al `pointerup` (o `pointercancel`) la manopola torna in mezzo e i tasti si rilasciano;
- **i tasti cambiano solo quando cambia la direzione**: il passaggio da sinistra a giù senza staccare il dito produce un `released` di `ArrowLeft` e un `pressed` di `ArrowDown`, con lo stesso `keyChanges` dei pulsanti.

La manopola si disegna con due proprietà CSS, `--stick-x` e `--stick-y` (da -1 a 1), scritte con `style.setProperty`; il CSS la sposta con un `transform`. Nei giochi a due direzioni la manopola si muove solo in orizzontale (`shownOffset`).

Un dettaglio non ovvio: il pannello dei pulsanti ascolta gli stessi eventi, e trova il pulsante sotto il dito con `elementFromPoint`. Senza un accorgimento, il pollice che spinge il joystick verso il centro del pannello premerebbe anche MONETA o FUOCO. Per questo `createTouchButtons` ignora le dita il cui bersaglio è dentro `[data-joystick]`: con il pointer capture il bersaglio resta il joystick per tutto il tocco.

## 6. Il collegamento: `createTouchControls`

Ogni `main.ts` chiama una sola funzione al posto di `createTouchButtons`:

```ts
const touch = createTouchControls(
  document.querySelector('#touch-panel') ?? document.body,
  tuning.touchControls,
  'four-way', // 'left-right' negli altri giochi
);
```

La funzione crea i pulsanti, cerca il joystick nella pagina e, se l'impostazione lo chiede, lo aggiunge. Poi scrive la scelta sul pannello come attributo, `data-touch-controls="joystick"` o `"arrows"`: è il CSS a mostrare l'uno e nascondere le altre. Se la pagina non ha un joystick si torna alle frecce, senza errori.

## 7. L'impostazione in `tuning.config.ts`

```ts
touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
```

- `movement`: `'joystick'` oppure `'arrows'`;
- `deadZone`: la parte della spinta, da 0 a 1, che non muove ancora nulla. 0,3 [N] è un valore da provare sul telefono.

`satisfies` fa controllare a TypeScript che i valori siano validi (un errore di battitura come `'joystik'` non compila) senza perdere `as const`. Space Invaders non aveva un `tuning.config.ts`, solo `colors.config.ts`: ora ha anche questo, con la sola impostazione del touch.

## 8. La pagina e lo stile condiviso

Nella pagina il joystick sta dentro il gruppo delle frecce:

```html
<div class="pad pad-move">
  <div class="stick" data-joystick="left-right" aria-hidden="true">
    <div class="stick-base"><div class="stick-knob"></div></div>
  </div>
  <button type="button" class="key key-arrow" data-key="ArrowLeft">◀</button>
  ...
</div>
```

Lo stile è **uno solo per tutti i giochi**, in `packages/input/src/joystick.css`, esportato dal pacchetto come `@arcade/input/joystick.css`. Ogni `main.ts` lo importa e Vite lo unisce nel `game.css` del gioco, quindi ogni gioco resta una pagina, un CSS e un JS. Il gioco sceglie solo misura e colori con tre proprietà: `--stick-size`, `--stick-color` (Pac-Man usa il blu dei muri) e `--stick-fill`.

Due regole fanno il lavoro:

```css
/* Il gruppo del joystick riempie tutta la sua cella della griglia: è l'area sensibile. */
[data-touch-controls='joystick'] .pad:has(> [data-joystick]) {
  display: grid;
  grid-template: 1fr / 1fr;
  place-self: stretch;
  place-items: stretch;
}

/* Le frecce dello stesso gruppo si nascondono. */
[data-touch-controls='joystick'] .pad:has(> [data-joystick]) > :not([data-joystick]) {
  display: none;
}
```

`:has()` seleziona il gruppo che contiene il joystick, qualunque sia la sua classe (`pad-move` o, in Pac-Man, `pad-stick`). La base è rotonda per il joystick a quattro direzioni e una feritoia orizzontale per quello a due (`[data-joystick='left-right']`), così la forma dice già come si muove.

Un errore incontrato: il gruppo aveva `align-items: center` dallo stile del gioco, e l'area sensibile restava alta quanto la base. Serve anche `place-items: stretch`.

## 9. Test

- `stick-direction.test.ts`: zona morta, sinistra-destra che ignora il verticale, quattro direzioni con l'asse più forte, manopola sul bordo quando il dito esce;
- `virtual-joystick.test.ts`: tocco, dito che esce dalla base, cambio di direzione senza staccare, ritorno al centro, secondo dito ignorato, `dispose`;
- `touch-controls.test.ts`: joystick o frecce secondo l'impostazione, ritorno alle frecce senza joystick nella pagina;
- `touch-buttons.test.ts`: le dita del joystick non premono pulsanti.

## 10. Provalo

```bash
pnpm test
pnpm dev:pacman
```

Sul telefono (o con gli strumenti di sviluppo del browser in modalità dispositivo): appoggia il pollice sul joystick e fallo scivolare in giro senza guardarlo; il giocatore continua a muoversi anche se il dito esce dalla base. Per tornare alle frecce, in `tuning.config.ts` del gioco scrivi `movement: 'arrows'`.

Il percorso completo, con le decisioni, è nel [diario AI](ai-workflow.md).
