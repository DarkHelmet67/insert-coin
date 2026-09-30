# 08 · Comandi touch

Obiettivo: giocare da smartphone e tablet con un **pannello di comandi sotto lo schermo**, come quello del cabinato, senza toccare una riga della logica di gioco.

## 1. Perché non le zone sullo schermo

L'idea più immediata è dividere lo schermo in zone: tocco a sinistra o a destra per muovere, al centro per sparare. Funziona, ma è scomoda per tre motivi:

- le dita coprono proprio la parte di schermo dove cadono le bombe;
- non c'è un confine che si sente sotto il dito, quindi si spara quando si voleva muovere;
- muoversi e sparare insieme, che in Space Invaders si fa di continuo, costringe a due dita sulla stessa area di gioco.

Le alternative valutate con l'autore:

| Proposta              | Come funziona                                                        | Scelta           |
| --------------------- | -------------------------------------------------------------------- | ---------------- |
| **Pannello cabinato** | ◀ ▶ a sinistra, FUOCO a destra, sotto lo schermo o ai lati           | ✅ adottata      |
| Trascina e spara      | il cannone segue il dito alla sua velocità originale, un tocco spara | scartata per ora |
| Zone sullo schermo    | la proposta iniziale                                                 | scartata         |

Il pannello ricalca i pulsanti veri del cabinato: le dita non stanno mai sopra il gioco, e due pollici fanno quello che facevano due mani.

## 2. L'idea: tasti virtuali

Il gioco legge già un `KeyState` (guida [03](03-input-tastiera.md)). Se ogni pulsante sullo schermo produce **lo stesso stato del tasto fisico corrispondente**, il gioco non si accorge della differenza:

```html
<button type="button" class="key key-fire" data-key="Space">FUOCO</button>
```

L'attributo `data-key` dice quale tasto "preme" il pulsante: `ArrowLeft`, `ArrowRight`, `Space`, `KeyC` (moneta), `KeyV` (colori), `KeyM` (audio). Tabella dei tasti, `readControls` e `updateGame` restano identici.

## 3. La parte pura: `pointer-keys.ts`

Sul touch non conta quale pulsante è premuto, ma **quale dito è su quale pulsante**. È ciò che rende possibile il multitouch: un pollice tiene "sinistra" mentre l'altro spara, e un pollice può scivolare da ◀ a ▶ senza staccarsi.

```ts
export type PointerKeys = ReadonlyMap<number, KeyCode>; // id del dito → tasto

movePointer(pointers, id, code); // il dito id ora è sul pulsante code (undefined: fuori dai pulsanti)
releasePointer(pointers, id); // il dito si è staccato
heldKeys(pointers); // i tasti tenuti da almeno un dito
keyChanges(before, after); // gli eventi "up"/"down" che portano da un insieme all'altro
applyPointerChange(state, before, after); // li applica al KeyState con applyKeyEvent
```

Tutte funzioni pure, testate senza browser. Il riuso di `applyKeyEvent` garantisce che i fronti `pressed` e `released` funzionino esattamente come con la tastiera.

## 4. Il guscio: `createTouchButtons`

Come `createKeyboard`, è l'unico punto con stato mutabile, privato a una closure. Ascolta i **pointer events** sul pannello:

| Evento          | Cosa fa                                                       |
| --------------- | ------------------------------------------------------------- |
| `pointerdown`   | il dito va sul pulsante sotto di lui; blocca zoom e selezione |
| `pointermove`   | il dito scivola, magari su un altro pulsante                  |
| `pointerup`     | il dito si stacca                                             |
| `pointercancel` | il sistema si prende il tocco (notifica, gesto di sistema)    |
| `contextmenu`   | bloccato: la pressione lunga aprirebbe il menu                |

Un dettaglio non ovvio: sui touch screen `event.target` resta l'elemento toccato **per primo**, anche se il dito scivola altrove. Per sapere su quale pulsante si trova il dito si usa la sua posizione:

```ts
const element = document.elementFromPoint(clientX, clientY)?.closest('[data-key]');
```

Nei test questa funzione (`keyAt`) si sostituisce con una finta, e gli eventi arrivano da un semplice `EventTarget`.

## 5. Due dispositivi, un cabinato: `mergeKeyStates`

Tastiera e pulsanti sono due sorgenti indipendenti. `mergeKeyStates` le unisce come due pulsantiere collegate agli stessi fili: un tasto è giù se lo tiene almeno uno dei due, e risulta rilasciato solo se nessuno dei due lo tiene più.

```ts
const controls = readControls(mergeKeyStates(keyboard.poll(), touch.poll()));
```

## 6. Mostrare il pannello solo sui touch screen

Non si indovina il dispositivo dallo _user-agent_ (mente spesso: un iPad si presenta come un Mac). Si chiede al CSS **come si usa lo schermo**:

```css
.panel {
  display: none;
}

@media (pointer: coarse) {
  .panel {
    display: contents; /* i gruppi di pulsanti entrano nella griglia della pagina */
  }
}
```

`pointer: coarse` vale quando il puntatore principale è un dito. Con `display: contents` i tre gruppi (movimento, moneta/colori/audio, fuoco) diventano celle della griglia di `body`, così una sola pagina ha due disposizioni:

- **verticale**: schermo in alto, pannello sotto, a portata di pollice;
- **orizzontale** (`orientation: landscape`): schermo al centro, movimento a sinistra, fuoco a destra.

Altri accorgimenti: `touch-action: none` (niente zoom col doppio tocco né scroll), `user-select: none`, `100dvh` (l'altezza reale, senza la barra del browser) e `env(safe-area-inset-*)` per stare lontano da notch e barra home.

## 7. L'audio sui telefoni

I browser concedono l'audio solo dopo un gesto dell'utente. Con il dito, però, il gesto valido è **il distacco** (`pointerup`, `touchend`), non il tocco: se `createAudio` ascoltasse solo `pointerdown`, sui telefoni il gioco resterebbe muto. Per questo gli eventi di sblocco ora sono `keydown`, `pointerdown`, `pointerup` e `touchend`.

## 8. Schermo intero (aggiunto con Asteroids)

Su un telefono in orizzontale le barre del browser si mangiano circa un quarto dell'altezza. `enterFullscreenOnTouch()` di `@arcade/render` (`packages/render/src/fullscreen.ts`) chiede lo schermo intero al primo tocco, con la [Fullscreen API](https://developer.mozilla.org/it/docs/Web/API/Fullscreen_API):

- il browser la concede solo dopo un gesto dell'utente. Per il dito il gesto che conta è `touchend`: Chrome per Android **non** la concede a `pointerup`, anche se arriva un istante prima (la prima versione ascoltava `pointerup`, e su un telefono vero non funzionava);
- `touchend` lo producono solo le dita, quindi il mouse non attiva mai lo schermo intero;
- se il giocatore esce dallo schermo intero, il tocco successivo lo riporta;
- nel pannello c'è anche un pulsante esplicito, SCHERMO INTERO, visibile solo dove il browser lo permette e nascosto mentre la pagina è già a schermo intero. Il pulsante entra soltanto, non esce: se facesse le due cose, lo stesso tocco entrerebbe (con `touchend`) e poi uscirebbe (con il `click`);
- la condizione è una funzione pura, `wantsFullscreen(documento)`, testata con un documento finto.

**Safari su iPhone non ha la Fullscreen API per le pagine.** L'unico modo è **Condividi → Aggiungi alla schermata Home**: per questo la pagina ha un manifesto (`public/manifest.webmanifest`, `display: fullscreen`), un'icona e i meta `apple-mobile-web-app-*`. Aperto dall'icona, il gioco parte senza barre.

In verticale lo schermo 4:3 è largo quanto il telefono: lì il limite è la larghezza, e l'unico guadagno possibile è togliere i margini laterali.

## Verifica

```bash
pnpm test   # test di pointer-keys, merge-key-states e touch-buttons
pnpm dev    # poi, negli strumenti per sviluppatori del browser, attiva l'emulazione di un telefono
```

Sul telefono: premi MONETA, tieni ◀ con un pollice e spara con l'altro, poi fai scivolare il pollice su ▶ senza staccarlo. Ruotando il telefono i comandi passano ai lati dello schermo. Su un computer con il mouse il pannello non compare.

Un errore da evitare: la proprietà `grid-area: screen` va dichiarata solo dentro la media query, dove esiste la griglia con l'area `screen`. Scritta fuori, su desktop il nome è sconosciuto e il browser aggiunge colonne implicite: il gioco finisce spostato a destra.

Prossima guida: [09 · Record salvato](09-record-salvato.md).
