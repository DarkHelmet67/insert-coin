# Diario AI

Registro delle decisioni prese insieme a Claude, dei prompt significativi e delle correzioni. Le voci più recenti stanno in fondo.

## 2026-09-28 · Avvio del progetto

**Richiesta:** monorepo TypeScript di remake arcade anni '80, primo gioco Space Invaders, molto documentato, funzioni generali condivise fra i giochi, output di un HTML, un CSS e un JS ES moderno.

**Phaser o Canvas?** Claude ha confrontato le due opzioni:

- Phaser (licenza MIT, nessun limite d'uso) include tastiera, scene e fisica, ma pesa circa 1 MB e nasconde proprio le parti che il progetto vuole mostrare.
- Canvas puro richiede di scrivere game loop, input e collisioni, ma sono poche centinaia di righe e diventano materiale didattico.

**Decisione:** Canvas con pacchetti condivisi `@arcade/*`.

**Nome del repository:** scartato `ai-videogames` perché generico e troppo centrato sull'AI. Fra le proposte (`arcade-from-scratch`, `coin-op-remakes-ts`, `insert-coin`, `retro-arcade-ts`) è stato scelto **`insert-coin`**.

**Correzione durante lo scaffold:** l'ultima TypeScript (7.0) non è ancora supportata da `typescript-eslint`; la versione è stata fissata a 6.0.

## 2026-09-28 · Game loop

**Richiesta:** secondo passo del piano, il pacchetto `engine-core` con il game loop.

**Proposta dell'AI:** timestep fisso con accumulatore, separando la logica pura (una classe `FixedStepClock`) dal collegamento a `requestAnimationFrame` (`createGameLoop`) per poter testare il tempo senza timer reali.

**Verifica:** 9 test unitari, fra cui uno che simula 6000 frame a 60 Hz per escludere errori di arrotondamento; controllo visivo della pagina in Chromium.

**Lavoro:** su richiesta dell'autore, durante la prima bozza i commit vanno direttamente su `main`, senza pull request.

## 2026-09-28 · Regole "code for humans"

**Richiesta:** l'autore ha portato in questo progetto la sezione _AI for humans_ delle linee guida AI usate nei suoi progetti di lavoro: il codice lo leggono persone, quindi pattern noti, niente file monolitici, tante piccole funzioni testabili, commenti sulle parti complesse. In più, per questo progetto: stile funzionale senza classi, un commento TSDoc per ogni funzione, ESLint in configurazione immutabile, arrow function al posto di `function`.

**Cosa ha fatto l'AI:**

- ha scritto le regole in [CLAUDE.md](../CLAUDE.md), il file di istruzioni che Claude legge a ogni sessione, così valgono anche per il lavoro futuro dell'AI;
- ha tradotto ogni regola in un controllo ESLint (`eslint-plugin-functional`, `eslint-plugin-jsdoc`, regole native per le arrow function), verificando con un file di prova che gli errori scattino davvero;
- ha riscritto il game loop: la classe `FixedStepClock` è diventata la funzione pura `advanceClock`, e `update` ora riceve lo stato e ne restituisce uno nuovo invece di modificare variabili esterne;
- ha diviso Space Invaders in stato puro, disegno e collegamento.

**Compromessi documentati:** l'immutabilità totale non è praticabile ai bordi del programma. Sono ammesse due eccezioni esplicite: il contesto del canvas (`ctx`), che è lo schermo, e le variabili `let` private alla closure del game loop.

## 2026-09-28 · Input da tastiera

**Precisazione dell'autore sulle regole:** trattandosi di un esercizio, le eccezioni sono benvenute quando una regola troppo rigida renderebbe il codice più complesso o meno leggibile. Le eccezioni restano documentate in [CLAUDE.md](../CLAUDE.md).

**Proposta dell'AI:** invece di reagire agli eventi `keydown`, un pacchetto `@arcade/input` con uno stato immutabile della tastiera (tasti premuti e fronti di pressione/rilascio), una tabella azioni → tasti, e un piccolo adattatore verso il browser che gestisce auto-repeat, perdita del focus e scorrimento della pagina.

**Decisione chiave:** la tastiera si legge una volta per passo di simulazione, non per frame, così ogni pressione arriva a un solo `update`.

**Verifica:** 24 nuovi test, fra pacchetto e gioco; in Chromium, dopo la moneta, tenendo premuta la freccia destra per un secondo il cannone si sposta di 60 pixel, come previsto.
