# 18 · Modalità debug

Obiettivo: provare i livelli avanzati di ogni gioco senza doverci arrivare giocando bene. Si parte dal livello scelto, si può essere immortali e ogni gioco ha qualche facilitazione sua, come il carburante infinito di Lunar Lander. Tutto si accende da un solo posto, il file `tuning.config.ts` del gioco.

## 1. Dove si accende

Ogni gioco ha in cima al suo `tuning.config.ts` una sezione `debug` con la stessa forma per tutti:

```ts
const debug: PacManDebug = {
  enabled: false, // l'interruttore: se è false, il resto è ignorato
  startLevel: 1, // livello, ondata, stage, muro o missione di partenza
  godMode: true, // il giocatore non può morire
  skipIntermissions: false, // le facilitazioni del singolo gioco
};
```

Per provare il livello 256 di Pac-Man basta scrivere `enabled: true` e `startLevel: 256`, poi lanciare `pnpm dev:pacman`. Le altre opzioni restano scritte nel file anche a debug spento, così chi lo riaccende ritrova le ultime scelte.

In Space Invaders la sezione `debug` si affianca a `touchControls`, la scelta fra joystick virtuale e frecce della [guida 19](19-joystick-virtuale.md).

## 2. Le opzioni di ogni gioco

| Gioco          | `startLevel`                                         | `godMode`                                                                           | Facilitazioni                                                                                                |
| -------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Space Invaders | ondata (dalla 9ª le altezze si ripetono)             | le bombe spariscono sul cannone; invasori arrivati in fondo ricominciano l'ondata   | `noShieldDamage`: scudi indistruttibili                                                                      |
| Breakout       | 1 o 2 (secondo muro, con i suoi 448 punti già fatti) | la pallina rimbalza sul fondo                                                       | `fullPaddle`: racchetta larga quanto lo schermo; `startHits`: colpi già contati a ogni battuta (4, 8, 12...) |
| Asteroids      | ondata (4, 6, 8, 10, poi 11 asteroidi)               | asteroidi, dischi e colpi attraversano la nave                                      | `safeHyperspace`: l'iperspazio non distrugge mai la nave                                                     |
| Lunar Lander   | missione (1 TRAINING … 4 COMMAND)                    | uno schianto conta come atterraggio duro, senza perdita di carburante               | `infiniteFuel`: motore e rotazione non consumano                                                             |
| Galaga         | stage (3, 7, 11… sono stage bonus)                   | bombe e alieni non distruggono il caccia (gli alieni che lo toccano esplodono)      | `noCapture`: il raggio traente non cattura; `startDual`: ogni nuovo caccia è doppio                          |
| Pac-Man        | livello 1-256 (256 è lo schermo spezzato)            | i fantasmi attraversano Pac-Man (quelli blu si mangiano ancora); la demo resta vera | `skipIntermissions`: niente intermezzi fra i livelli                                                         |

## 3. Come è fatto: un interruttore, opzioni semplici

Il codice dei giochi non controlla mai l'interruttore. Ogni gioco ha un piccolo modulo `debug.ts` che decide **una volta sola** quali opzioni valgono:

```ts
/** The normal game: level 1, every helper off. */
export const DEBUG_OFF: PacManDebug = {
  enabled: false,
  startLevel: 1,
  godMode: false,
  skipIntermissions: false,
};

export const debug: PacManDebug = activeDebug(tuning.debug, DEBUG_OFF);
```

`activeDebug` arriva dal nuovo pacchetto `@arcade/debug`: restituisce le opzioni del file quando il debug è acceso, altrimenti `DEBUG_OFF`, cioè il gioco normale. Così le regole di gioco leggono solo valori come `debug.godMode` e non hanno casi speciali per "debug spento".

## 4. Funzioni pure con un parametro in più

Ogni opzione entra in una funzione già esistente come **parametro con valore predefinito**:

```ts
export const bombsHitCannon = (
  state: PlayingState,
  godMode: boolean = debug.godMode,
): PlayingState => {
  // ...
  if (godMode) return { ...state, bombs: removeBombs(state.bombs, [bomb]) };
  // ...
};
```

Il gioco chiama `bombsHitCannon(state)` come prima; i test chiamano `bombsHitCannon(state, true)` e `bombsHitCannon(state, false)` e provano entrambi i comportamenti senza toccare la configurazione. È lo stesso schema che Breakout usava già per la racchetta larga.

Qualche scelta che merita una spiegazione:

- **Pac-Man immortale non si ferma.** Se il fantasma incontrato venisse semplicemente ignorato dopo averlo trovato, il nucleo del gioco si fermerebbe a quel passo, a ogni passo. Per questo in god mode un fantasma non blu non conta proprio come incontro.
- **Space Invaders senza fine partita.** Gli invasori che toccano il cannone non vanno avanti fuori dallo schermo: ricominciano la loro ondata dall'alto.
- **Galaga parte da uno stage qualsiasi.** Il programma aumenta il contatore degli stage di uno prima di ognuno, quindi la partita inizia con il contatore a `startLevel − 1`.

## 5. Le protezioni

- **La scritta DEBUG.** Con il debug acceso compare un'etichetta gialla in alto a sinistra (`showDebugMark`), aggiunta alla pagina e non al canvas: nessun renderer è cambiato, e l'etichetta ignora il dito, quindi non ruba tocchi.
- **Il record non si salva.** `debugSafeHiScores` avvolge l'archivio del record: il record salvato si vede ancora, ma uno nuovo fatto da immortali non viene scritto.
- **Un test per gioco.** `debug.test.ts` controlla che `tuning.debug.enabled` sia `false`: se qualcuno lo lascia acceso per errore, la CI diventa rossa e il sito non viene pubblicato così.

## 6. Il debug nelle anteprime delle PR

Per provare i livelli avanzati sul telefono, senza un computer, le anteprime delle pull request (`/pr-N/`) sono costruite con il debug acceso. Il workflow `pr-preview.yml` imposta una variabile di build:

```yaml
- run: pnpm build:site
  env:
    VITE_ARCADE_DEBUG: 'on'
```

Vite sostituisce `import.meta.env.VITE_ARCADE_DEBUG` durante la build; `isDebugBuild()` di `@arcade/debug` la legge e `activeDebug` accende le opzioni scritte nel file. Il test del punto 5 continua a passare, perché il file dice ancora `enabled: false`; il sito di `main` è costruito senza la variabile, quindi lì il debug è sempre spento. Per questo nei file pubblicati `godMode` (e `infiniteFuel` in Lunar Lander) sono già `true`: sono i valori che l'anteprima usa.

## Come verificarlo

```bash
pnpm test                                   # i test "debug spento" e quelli di ogni opzione
VITE_ARCADE_DEBUG=on pnpm build:site        # il sito come un'anteprima: la scritta DEBUG in ogni gioco
```

Oppure si accende `enabled: true` in un `tuning.config.ts`, si avvia `pnpm dev`, e si prova: con `godMode` le bombe non distruggono il cannone, e la scritta DEBUG resta in alto a sinistra.

Torna all'[indice delle guide](../README.md#documentazione).
