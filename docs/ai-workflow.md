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

**Proposta dell'AI:** timestep fisso con accumulatore, separando la logica pura (`FixedStepClock`) dal collegamento a `requestAnimationFrame` (`createGameLoop`) per poter testare il tempo senza timer reali.

**Verifica:** 9 test unitari, fra cui uno che simula 6000 frame a 60 Hz per escludere errori di arrotondamento; controllo visivo della pagina in Chromium.

**Lavoro:** su richiesta dell'autore, durante la prima bozza i commit vanno direttamente su `main`, senza pull request.
