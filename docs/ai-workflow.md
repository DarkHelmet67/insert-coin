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

## 2026-09-28 · Errore `styleText` con `pnpm dev`

**Problema segnalato dall'autore:** sul suo computer `pnpm dev` falliva con `SyntaxError: ... does not provide an export named 'styleText'`.

**Diagnosi:** non era codice mancante ma un requisito non dichiarato. L'ambiente dell'AI usava Node 22.22, mentre Vite 8 richiede almeno Node 20.19 o 22.12, e Vitest ed ESLint ancora un po' di più. Il `package.json` dichiarava solo `node >= 22`, troppo permissivo, e nessuno lo verificava.

**Correzione:** `engines.node` allineato ai requisiti reali, `engine-strict=true` in `.npmrc` (verificato: con un Node non supportato `pnpm install` si ferma con `ERR_PNPM_UNSUPPORTED_ENGINE`), `.nvmrc` con Node 24 LTS, e documentazione aggiornata.

**Lezione:** quando l'AI lavora in un ambiente diverso da quello dell'utente, i requisiti di runtime vanno dichiarati e verificati esplicitamente fin dal primo commit.

**Seguito:** con Node 24 è comparso un secondo errore, `Cannot find native binding` di Rolldown. L'AI ha letto il log sul computer dell'autore tramite Remote Control, in sola lettura. Il file di installazione di pnpm mostrava `@rolldown/binding-darwin-arm64` fra i pacchetti _saltati_. Causa: la prima installazione era avvenuta con il Node vecchio, e pnpm aveva escluso quel pacchetto opzionale perché il suo `engines` richiede Node 20.19+ o 22.12+. Cambiare Node non lo reinstalla: serve cancellare `node_modules` e ripetere `pnpm install`. Aggiunto alla guida 01.

## 2026-09-28 · Rendering e sprite

**Proposta dell'AI:** niente file immagine. Sprite e font sono scritti come "ASCII art" nel codice, disegnati con un rettangolo per ogni sequenza di pixel accesi. Le funzioni di disegno dipendono da un sottoinsieme minimo del contesto canvas, così i test girano in Node con un contesto finto che registra i rettangoli.

**Grafica:** gli sprite degli alieni, del cannone e dell'UFO e il font 5×7 sono stati ridisegnati a mano nello stile dell'originale, rispettandone le dimensioni.

**Verifica:** 19 nuovi test; screenshot in Chromium della tabella dei punteggi e del cannone, usato anche nel README.

**Nota di processo:** durante questo passo il controllo di sicurezza automatico dei comandi di shell non era disponibile per qualche minuto; l'AI ha continuato scrivendo i file con gli strumenti di modifica e ha eseguito i controlli appena la shell è tornata disponibile.

## 2026-09-28 · Script `pnpm clean`

**Problema segnalato dall'autore:** dopo l'aggiunta di `@arcade/render`, `pnpm build` falliva con `Rolldown failed to resolve import "@arcade/render"`.

**Diagnosi:** il gioco dichiarava la dipendenza, ma in `games/space-invaders/node_modules/@arcade/` mancava il collegamento al nuovo pacchetto: `pnpm install` non era stato rieseguito dopo averlo aggiunto.

**Correzione:** su richiesta dell'autore, nuovo script `pnpm clean` che cancella tutti i `node_modules` e `pnpm-lock.yaml`; `pnpm clean && pnpm install` ha risolto. La guida 01 usa lo script al posto del `rm -rf` scritto a mano.

**Revisione:** l'AI ha fatto notare che cancellare `pnpm-lock.yaml` a ogni pulizia rende le installazioni non riproducibili: le versioni delle dipendenze vengono ricalcolate e possono cambiare senza che nessuno se ne accorga. Su decisione dell'autore gli script sono diventati due: `pnpm clean` cancella solo i `node_modules`, mentre `pnpm clean:all` cancella anche il lockfile, da usare solo quando si vogliono aggiornare le dipendenze di proposito. Il README ricorda di eseguire `pnpm install` dopo ogni `git pull`.

## 2026-09-28 · Collisioni

**Proposta dell'AI:** un pacchetto `@arcade/collision` con due livelli, il test dei rettangoli (AABB) e la collisione pixel per pixel limitata all'area condivisa. Il pacchetto dichiara una propria interfaccia `Bitmap` invece di importare `Sprite`: grazie alla tipizzazione strutturale di TypeScript gli sprite funzionano lo stesso, e i pacchetti restano indipendenti.

**Gioco:** formazione di 55 alieni (per ora ferma), colpo singolo, esplosioni, punteggio. Il passo di gioco è diviso in piccole funzioni pure, ognuna testata.

**Errore dell'AI corretto dai test:** il primo test del "colpo che passa fra le gambe dell'octopus" usava una colonna dello sprite che in realtà conteneva un pixel acceso, e il test falliva. L'AI ha ricontrollato lo sprite riga per riga e ha scelto una colonna davvero vuota. È un buon esempio del perché i test vanno eseguiti, non solo scritti.

**Verifica:** 28 nuovi test; partita di prova in Chromium: moneta, movimento, due colpi, un octopus distrutto, punteggio a 20.

## 2026-09-28 · Audio

**Reazione dell'autore al passo precedente:** giocato sul suo Mac, il risultato gli è sembrato "pressoché indistinguibile dall'originale giocato con il MAME".

**Proposta dell'AI:** effetti sonori descritti come dati (un tono che scivola in frequenza o un'esplosione di rumore filtrato) e sintetizzati con la Web Audio API, senza file audio. Il contesto audio nasce al primo tasto premuto, per rispettare la politica di autoplay dei browser. I suoni non vengono chiamati dalla logica di gioco: una funzione pura, `soundsFor`, li deduce confrontando lo stato prima e dopo ogni passo.

**Eccezione alle regole:** i nodi Web Audio si configurano per assegnamento, quindi la regola sull'immutabilità è disattivata solo per `synth.ts`, come già per il canvas. Documentata in `CLAUDE.md`.

**Non ancora fatto:** la marcia a quattro note degli alieni è legata al loro movimento, che non esiste ancora; arriverà insieme alla marcia della formazione.

**Verifica:** 13 nuovi test; in Chromium, con la politica di autoplay attiva, la moneta e lo sparo generano i nodi audio attesi, e dopo **M** non ne viene creato nessun altro.
