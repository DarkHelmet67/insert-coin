# 12 · Un terzo gioco: Asteroids

Obiettivo: costruire _Asteroids_ (Atari, 1979), il primo gioco vettoriale del progetto, riusando i pacchetti degli altri due giochi e copiando le regole dal programma originale, istruzione per istruzione.

## 1. Perché Asteroids

Per il secondo gioco Asteroids era stato scartato: servivano un modo nuovo di disegnare e cinque pulsanti invece di tre (vedi la [guida 10](10-secondo-gioco.md)). Per il terzo quelle difficoltà sono diventate il motivo della scelta:

- **La grafica vettoriale** apre la strada a molti altri giochi (Lunar Lander, Battlezone, Tempest, Star Wars). Per questo è nata come pacchetto condiviso, `@arcade/vector`, spiegato nella [guida 11](11-grafica-vettoriale.md), e non dentro il gioco.
- **C'è un processore.** Breakout era un circuito senza programma, e molti valori andavano dedotti. Asteroids ha un 6502 e il suo programma è stato disassemblato e commentato: quasi ogni regola si può leggere nel codice originale. La [guida delle meccaniche](../games/asteroids/docs/meccaniche-originali.md) riporta per ognuna l'indirizzo dell'istruzione.

## 2. Cosa si riusa così com'è

| Pacchetto             | In Asteroids                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `@arcade/engine-core` | lo stesso game loop a passo fisso, a 60 passi al secondo (l'originale ne faceva 61,5)       |
| `@arcade/input`       | tastiera, pulsanti touch e `mergeKeyStates`, senza modifiche                                |
| `@arcade/audio`       | i suoni come dati: toni che scendono, rumore filtrato, nessuna modifica                     |
| `@arcade/storage`     | `createHiScoreStore('insert-coin/asteroids/hi-score')`                                      |
| `@arcade/render`      | `getCanvasContext` e il nuovo schermo intero sui telefoni (sezione 8)                       |
| `@arcade/vector`      | nuovo: disegni della ROM, font Atari, linee luminose ([guida 11](11-grafica-vettoriale.md)) |

Due pacchetti invece non servono: `@arcade/collision`, perché Asteroids usa un ottagono calcolato con l'aritmetica a 8 bit (sezione 4), e la parte a sprite di `@arcade/render`, perché non ci sono pixel da disegnare.

La struttura del gioco è quella di sempre: stato puro (`game.ts`, `ship.ts`, `rocks.ts`, `saucer.ts`...), disegno (`render*.ts`), collegamento (`main.ts`), suoni dedotti dallo stato (`soundsFor`), valori incerti in `tuning.config.ts`.

## 3. Lavorare nelle unità del 6502

La scelta più importante: il remake **non** usa una fisica moderna con numeri decimali, ma la stessa aritmetica intera del programma.

- Le posizioni vanno da 0 a 8191 in orizzontale e da 0 a 6143 in verticale: 8 unità per ogni unità dello schermo.
- La velocità sta in 256esimi di unità, come nei due byte per asse del 6502, e la nave si sposta solo della parte intera.
- Seno e coseno vengono dalla tabella di 65 valori della ROM, non da `Math.sin`.

Il vantaggio è che ogni numero della guida delle meccaniche si copia senza conversioni, e il comportamento è quello del cabinato anche nei dettagli. L'attrito, per esempio, toglie il doppio del byte alto della velocità:

```ts
export const frictionAxis = (velocity: number): number => {
  if (velocity === 0) return 0;
  const high = velocity >> 8;
  return high >= 0 ? velocity - (2 * high + 1) : velocity - 2 * high;
};
```

Una nave veloce rallenta in fretta, una lenta scivola a lungo: è l'inerzia che rende Asteroids così particolare, e nasce da una riga di aritmetica, non da una formula fisica.

Un dettaglio di JavaScript da ricordare: il seno di 128 veniva `-0`, un numero che il 6502 non conosce e che faceva fallire i confronti nei test. Si corregge con `0 - valore`.

## 4. Il caso nello stato del gioco

Forme degli asteroidi, velocità, altezza del disco volante, rischio dell'iperspazio: tutto viene dal generatore casuale del programma, un registro a scorrimento di 16 bit copiato bit per bit in [`random.ts`](../games/asteroids/src/random.ts). Il generatore non è `Math.random()` ma **un valore nello stato**: ogni estrazione restituisce il numero e il generatore successivo.

```ts
export const nextRandom = (rng: Rng): Draw => {
  // ...lo stesso scorrimento del 6502
  return { value: lo, rng: { lo, hi } };
};
```

Così la logica resta pura e un test può rigiocare la stessa partita dallo stesso seme. Anche l'ordine delle estrazioni è quello originale: per dividere un asteroide il programma estrae sei numeri per figlio e ne usa solo alcuni, e il remake fa lo stesso. Un test prova tutti i 65.536 stati del generatore e conferma il rischio dell'iperspazio letto nel codice: 25% con 4 asteroidi o meno, zero da 19 in su.

Anche le collisioni seguono il programma: niente cerchi né rettangoli, ma un ottagono che un processore a 8 bit calcola con poche sottrazioni e confronti ([`collisions.ts`](../games/asteroids/src/collisions.ts)).

## 5. Posti fissi e tipi con casi

Il programma ha 27 posti per gli asteroidi, 4 per i colpi della nave, 2 per quelli del disco. Il remake li tiene come array di lunghezza fissa, con `null` per il posto libero, riempiti nello stesso ordine. Così si comportano come l'originale anche i casi limite: un asteroide colpito quando i 27 posti sono pieni sparisce senza dividersi, e l'esplosione occupa il posto dell'asteroide finché non si spegne.

Dove il 6502 usa un byte con valori speciali, il remake usa un **tipo con casi** (_discriminated union_). La vita della nave:

```ts
export type ShipLife =
  | { readonly kind: 'flying' }
  | { readonly kind: 'hidden'; readonly timer: number; readonly reason: HiddenReason }
  | { readonly kind: 'exploding'; readonly status: number; readonly age: number };
```

La nave nascosta ricorda perché lo è: attende di ricomparire, è in un salto riuscito o in un salto fatale. TypeScript obbliga a gestire tutti i casi, e il codice si legge senza conoscere i valori magici del programma.

## 6. Lo stato a pezzi, senza perdere pezzi

Lo stato del gioco è grande: nave, vite, colpi, asteroidi, disco, timer, punteggio, generatore, battito. Le funzioni che aggiornano una parte ricevono solo quello che serve, ma devono restituire tutto il resto intatto. Un primo tentativo ha perso l'esplosione della nave: due funzioni restituivano ciascuna "tutto lo stato", e unendole con due spread la seconda cancellava il lavoro della prima.

La soluzione è rendere generiche le funzioni che aggiornano una parte dello stato:

```ts
export const updateExplosion = <T extends PlayerState>(player: T, frame: number): T => /* ... */;
```

Accettano qualsiasi stato che contenga la parte che le riguarda e restituiscono lo **stesso tipo**, quindi si applicano una dopo l'altra: `updateExplosion(moveSaucer(state), frame)`. Il passo del gioco diventa una catena leggibile:

```ts
const moved = moveObjects(actorsTurn(startWaveIfDue(state), controls));
const hit = endIfNoLives({ ...moved, ...resolveHits(moved) });
```

L'errore l'ha scoperto un test sulla fine partita, non il browser.

## 7. Suoni: il battito è stato del gioco

Come in Space Invaders, quasi tutti i suoni nascono dal confronto fra lo stato prima e dopo un passo (`soundsFor`): un colpo in un posto prima vuoto è uno sparo, un asteroide diventato esplosione suona più grave se era grande. I suoni continui (la spinta, la sirena del disco) sono suonati a pezzi, uno ogni pochi passi.

Il **battito** invece è stato del gioco ([`thump.ts`](../games/asteroids/src/thump.ts)), perché nel 6502 è un piccolo automa con i suoi contatori: 4 passi di nota, poi un silenzio che parte da 48 passi a ogni ondata e perde un passo ogni 64, fino a 8. Tenerlo nello stato puro permette di testare il ritmo con i numeri. Le frequenze vengono dai modelli dei circuiti di MAME; quelle incerte sono nella sezione `sound` di [`tuning.config.ts`](../games/asteroids/src/tuning.config.ts).

## 8. Sui telefoni: un gamepad per due pollici

Il pannello di Space Invaders è pensato per un monitor verticale e tre pulsanti. Asteroids ha un monitor orizzontale e cinque pulsanti, e si ruota e si spara nello stesso momento. Il remake segue il pannello vero del cabinato, che divide i pulsanti fra le due mani:

- **in orizzontale** lo schermo 4:3 sta al centro; a sinistra le due rotazioni, a destra IPER, FUOCO e SPINTA in colonna;
- **in verticale** gli stessi gruppi stanno sotto lo schermo, con un invito a girare il telefono;
- **toccare lo schermo** è il pulsante START (il canvas ha `data-key="Enter"`).

Le prove di Luca sul telefono hanno cambiato due cose. L'iperspazio, all'inizio in un angolo per non premerlo per sbaglio, nella frenesia del gioco era irraggiungibile: ora è il terzo pulsante del pollice destro. E le barre del browser occupavano un quarto dell'altezza: il primo tocco ora porta la pagina a **schermo intero** con `enterFullscreenOnTouch` di `@arcade/render`, spiegato nella [guida 08](08-comandi-touch.md). La prima versione chiedeva lo schermo intero su `pointerup`, e Chrome per Android lo rifiutava; con `touchend` funziona. Su iPhone Safari non offre lo schermo intero alle pagine: il gioco ha un manifesto e un'icona, e aggiunto alla schermata Home si apre senza barre.

Nessuna modifica a `@arcade/input`: bastano l'HTML dei pulsanti con `data-key` e due disposizioni CSS per l'orientamento.

## 9. Provalo

```bash
pnpm test            # tutti i test, compresi quelli di Asteroids e di @arcade/vector
pnpm dev:asteroids
```

All'apertura il gioco è nella schermata di attesa: asteroidi e dischi si muovono da soli, senza suoni. **Invio** (o **1**) avvia la partita; frecce per ruotare e spingere, **Spazio** per sparare, **↓** per l'iperspazio, **M** per l'audio. Prova a lasciare la nave ferma in un angolo senza sparare: il disco volante arriverà sempre più spesso, come voleva Atari.

Il percorso completo, con le decisioni e gli errori, è nel [diario AI](ai-workflow.md); le regole dell'originale, con le fonti, nella [guida delle meccaniche](../games/asteroids/docs/meccaniche-originali.md).

Prossima guida: [13 · Un quarto gioco: Lunar Lander](13-quarto-gioco.md).
