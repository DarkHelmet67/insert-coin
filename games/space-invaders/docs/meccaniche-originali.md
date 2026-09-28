# Le meccaniche dell'originale

Questa guida spiega come funziona _Space Invaders_ (Taito, 1978) "dentro": come marciano gli alieni, come scelgono chi spara, come si sgretolano i bunker e quanto vale l'UFO. Per ogni regola indica il file che la implementa e la fonte da cui viene.

Il codice del gioco originale è stato disassemblato e commentato riga per riga da appassionati: è da lì che vengono i numeri. Dove le fonti non dicono nulla, la scelta è nostra ed è segnalata come tale.

## Fonti

- [Computer Archeology · Space Invaders](https://www.computerarcheology.com/Arcade/SpaceInvaders/): il codice originale per CPU 8080, disassemblato e commentato ([codice](https://computerarcheology.com/Arcade/SpaceInvaders/Code.html), [uso della RAM](https://www.computerarcheology.com/Arcade/SpaceInvaders/RAMUse.html)).
- [Shmups Wiki · Space Invaders](https://www.shmups.wiki/library/Space_Invaders): le regole viste dal giocatore, con i trucchi noti.
- [Space Invaders Wiki · UFO](https://spaceinvaders.fandom.com/wiki/UFO): punteggi e comparsa dell'astronave.

## 1. Un alieno per frame: da dove viene l'accelerazione

L'hardware del 1978 (una CPU Intel 8080 a 2 MHz) non riusciva a ridisegnare 55 alieni a ogni frame. La soluzione di Tomohiro Nishikado: **muovere un solo alieno per frame**, a 60 frame al secondo.

- Con 55 alieni, un "passo" della formazione dura 55 frame: poco meno di un secondo.
- Con 10 alieni ne dura 10; con l'ultimo alieno rimasto, la formazione si muove a ogni frame.

La famosa accelerazione non è programmata: è un effetto collaterale di questo limite. Lo stesso vale per l'andamento "a onda" della formazione, che si vede bene in una partita al rallentatore: la riga in basso si sposta prima di quella in alto.

Codice: [`fleet.ts`](../src/fleet.ts). Lo stato della formazione tiene un **cursore**, l'indice dell'alieno che si muove al prossimo frame; `stepFleet` sposta solo quello.

```ts
export const stepFleet = (fleet: FleetState): FleetState => {
  const alien = fleet.aliens[fleet.cursor];
  // ...sposta solo `alien`, poi avanza il cursore
  return moved.cursor >= moved.aliens.length ? startNextPass(moved) : moved;
};
```

Altri dettagli dell'originale:

| Regola                                                                               | Valore                          | Dove                             |
| ------------------------------------------------------------------------------------ | ------------------------------- | -------------------------------- |
| Ordine di marcia                                                                     | dal basso, da sinistra a destra | `createFormation` in `aliens.ts` |
| Passo orizzontale                                                                    | 2 pixel                         | `STEP_X`                         |
| L'ultimo alieno: a destra 3 pixel, a sinistra 2 (un'asimmetria del codice originale) | 3 / 2                           | `LAST_ALIEN_STEP_RIGHT`          |
| Discesa quando la formazione tocca un bordo                                          | 8 pixel                         | `STEP_DOWN`                      |
| Altezza di partenza per ondata (ondate 1-8, poi il ciclo riparte)                    | sempre più in basso             | `ROUND_START_BOTTOM_Y`           |
| Fine partita se gli alieni arrivano all'altezza del cannone                          |                                 | `isGameOver` in `playing.ts`     |

Quando un alieno viene colpito, `removeAlien` corregge il cursore: l'alieno che doveva muoversi dopo continua a essere il prossimo, e la marcia non "salta un colpo".

### La marcia a quattro note

Il suono di sottofondo è una sequenza di quattro note basse, una per ogni passo completo della formazione: accelera insieme agli alieni. Le frequenze delle note sono scelte a orecchio (le fonti descrivono il circuito analogico, non le note). Per non trasformare la marcia in un ronzio quando resta un solo alieno, fra due note passano almeno 5 frame (`MIN_BEAT_FRAMES`, scelta nostra).

## 2. Le bombe degli alieni

Gli alieni hanno **tre tipi di bomba**, al massimo una per tipo sullo schermo. Codice: [`bombs.ts`](../src/bombs.ts).

| Bomba      | Aspetto            | Da quale colonna parte                             |
| ---------- | ------------------ | -------------------------------------------------- |
| _rolling_  | una vite che ruota | la colonna sopra il cannone: **mira al giocatore** |
| _plunger_  | una "T" che scorre | la colonna indicata da una tabella fissa           |
| _squiggly_ | uno zig-zag        | la stessa tabella, letta da un altro punto         |

Le regole:

- A ogni frame il gioco gestisce **un solo tipo** di bomba, a turno. Così ogni bomba si muove una volta ogni 3 frame.
- Una bomba cade di 4 pixel per passo, **5 quando restano 8 alieni o meno**.
- Parte sempre dall'alieno più in basso della colonna scelta; se la colonna è vuota, il turno passa.
- La _plunger_ smette di cadere quando resta un solo alieno.
- Una nuova bomba parte solo quando le bombe già in volo hanno percorso abbastanza strada. Questa distanza, il **ritmo di ricarica**, dipende dal punteggio: più il giocatore è bravo, più gli alieni sparano spesso.

| Punteggio    | Passi prima di una nuova bomba |
| ------------ | ------------------------------ |
| meno di 200  | 48                             |
| 200 - 999    | 16                             |
| 1000 - 1999  | 11                             |
| 2000 - 2999  | 8                              |
| 3000 e oltre | 7                              |

**Incertezza dichiarata:** le fonti confermano che la tabella delle colonne della _squiggly_ inizia con 11, 1, 6, 3; il resto della tabella in `COLUMN_FIRE_TABLE` è ricostruito a memoria dall'AI e potrebbe differire dall'originale. Il comportamento percepito (bombe che sembrano casuali ma si ripetono) non cambia.

## 3. I bunker che si sgretolano

I quattro bunker verdi sono bitmap di 22×16 pixel, a 45 pixel l'uno dall'altro. Ogni colpo li "morde": invece di togliere punti vita, **cancella i pixel** coperti dal disegno dell'esplosione.

Codice: [`shields.ts`](../src/shields.ts) e la funzione `eraseBitmap` del pacchetto [`@arcade/collision`](../../../packages/collision/src/bitmap.ts), che è generica e riusabile per qualsiasi terreno distruttibile.

```ts
/** Carves `brush` out of every shield it touches: shields crumble a little at every hit. */
export const damageShields = (shields, brush) =>
  shields.map((shield) =>
    bitmapsOverlap(shield, brush) ? { ...shield, bitmap: eraseBitmap(shield, brush) } : shield,
  );
```

Tre cose rovinano i bunker, esattamente come nell'originale:

1. Il **colpo del giocatore**, che li colpisce da sotto (sparare da sotto un bunker scava un tunnel).
2. Le **bombe** degli alieni, che li colpiscono da sopra.
3. Gli **alieni stessi**, che cancellano tutto ciò su cui passano quando scendono abbastanza.

Lo stato resta immutabile: ogni colpo produce un nuovo bitmap del bunker, il vecchio non viene toccato.

## 4. L'UFO e il trucco del 23° colpo

L'astronave rossa (il _mystery ship_) passa in alto. Codice: [`ufo.ts`](../src/ufo.ts).

- Compare ogni **0x600 = 1536 frame**, cioè 25,6 secondi.
- Compare solo se restano **almeno 8 alieni**.
- Entra da sinistra se il numero di colpi sparati è pari, da destra se è dispari.
- La velocità (1 pixel per frame) è una scelta nostra, vicina a quella percepita nell'originale.

Il punteggio **non è casuale**: dipende da quanti colpi ha sparato il giocatore. Il gioco scorre una tabella di valori a ogni colpo:

```ts
export const UFO_SCORES = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100];
export const ufoScore = (shotsFired: number): number =>
  UFO_SCORES[shotsFired % UFO_SCORES.length] ?? 100;
```

Per un errore nel codice originale la tabella ricomincia dopo 15 valori, così i 300 punti tornano ogni 15 colpi: all'8°, al 23°, al 38°... L'UFO però compare per la prima volta dopo 25 secondi, quando l'8° colpo è ormai passato: per questo i giocatori conoscono il trucco come "colpire l'UFO con il 23° colpo, e poi ogni 15".

## 5. Vite, colpi e fine partita

| Regola                                 | Valore                   | Dove                      |
| -------------------------------------- | ------------------------ | ------------------------- |
| Vite iniziali                          | 3                        | `STARTING_LIVES`          |
| Vita extra (una sola)                  | a 1500 punti             | `EXTRA_LIFE_SCORE`        |
| Colpi del giocatore sullo schermo      | uno alla volta           | `advanceShot`             |
| Velocità del colpo                     | 4 pixel per frame        | `SHOT_SPEED`              |
| Pausa durante l'esplosione del cannone | 90 frame (scelta nostra) | `CANNON_EXPLOSION_FRAMES` |

Il colpo del giocatore può anche **colpire una bomba**: si distruggono a vicenda. È una tecnica di difesa usata dai giocatori esperti.

## 6. Un frame alla volta, tutto puro

Tutta la logica avanza a frame interi (1/60 di secondo), come l'originale: `updatePlaying(state, controls)` restituisce lo stato un frame dopo. L'ordine è sempre lo stesso:

1. muove il cannone e il colpo;
2. muove formazione, bombe, UFO ed effetti (`advanceWorld`);
3. applica le **regole di collisione**, una dopo l'altra.

Le regole sono funzioni `(stato) => nuovoStato` elencate in un array, in [`collisions.ts`](../src/collisions.ts):

```ts
const COLLISION_RULES = [
  shotHitsAlien,
  shotHitsUfo,
  shotHitsBomb,
  shotHitsShield,
  bombsHitCannon,
  bombsHitShields,
  bombsHitGround,
  aliensCrushShields,
  awardExtraLife,
  nextRoundIfCleared,
];
return COLLISION_RULES.reduce((current, rule) => rule(current), moved);
```

Ogni regola si testa da sola: si costruisce uno stato con un colpo e un alieno nel punto giusto, si applica la regola e si controlla il risultato. Aggiungere una regola significa scrivere una funzione e aggiungerla alla lista.

Anche i suoni seguono lo stesso principio della [guida 06](../../../docs/06-audio.md): `soundsFor` confronta lo stato prima e dopo il frame. Un'esplosione appena nata fa partire il suono del colpo, un nuovo passo della formazione fa partire la nota successiva della marcia.

## 7. I colori delle strisce di cellophane

Il monitor originale era in bianco e nero; i colori venivano da strisce di cellophane incollate sul vetro: rossa in alto, sulla corsia dell'UFO, verde in basso, su bunker e cannone. Un oggetto che passa sotto una striscia ne prende il colore: le bombe diventano verdi vicino ai bunker, e gli alieni che scendono troppo in basso anche. La funzione `colorAt(y)` in [`palette.ts`](../src/palette.ts) riproduce l'effetto scegliendo il colore in base all'altezza.
