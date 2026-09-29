# Il prompt unico

Il progetto è nato in modo interattivo: molte domande, proposte, correzioni, tutte raccolte nel [diario AI](ai-workflow.md). Chi vuole ripetere l'esperimento non deve rifare quel percorso: il prompt qui sotto riassume **tutte le decisioni prese** e chiede a un assistente AI di ricostruire il progetto da zero, fase per fase, con le stesse regole e la stessa documentazione.

## Come usarlo

1. Crea una cartella vuota (e, se vuoi pubblicare, un repository GitHub vuoto).
2. Apri in quella cartella un assistente AI che può creare file ed eseguire comandi: il prompt è scritto per [Claude Code](https://claude.com/claude-code), ma funziona con qualsiasi agente di sviluppo con accesso al terminale.
3. Copia **tutto** il blocco qui sotto e incollalo come primo messaggio.
4. Lascia lavorare l'assistente: si ferma alla fine di ogni fase con un riepilogo. Rispondi "continua" per passare alla fase successiva, oppure correggi quello che non ti convince.

Cosa aspettarsi:

- **Il risultato non sarà identico carattere per carattere.** Un modello linguistico non è un compilatore: nomi di funzioni, disegni degli sprite o testo delle guide possono cambiare. Struttura, regole, meccaniche di gioco e numeri dell'originale invece sono fissati dal prompt.
- **Serve tempo.** Sono undici fasi, con test e verifiche a ogni passo: conviene una sessione lunga, oppure più sessioni ripartendo con "continua dalla fase N: leggi il diario AI e i file già presenti".
- **Le versioni degli strumenti invecchiano.** Il prompt indica quelle usate a settembre 2026 e chiede di verificarle prima di installarle; gli errori di compatibilità già incontrati sono elencati, così l'assistente non li ripete.
- **Le fasi 6 e 7 richiedono te.** Per pubblicare servono un repository GitHub tuo e l'attivazione di GitHub Pages, che solo il proprietario del repository può fare.

Un buon esercizio: confronta il progetto che ottieni con questo repository e annota le differenze nel tuo diario.

## Il prompt

```text
Sei il mio compagno di sviluppo. Costruisci da zero, in questa cartella vuota, il progetto "insert-coin": un monorepo TypeScript di remake di giochi arcade coin-op anni '80, su HTML5 Canvas puro, con documentazione didattica in italiano. I giochi sono due: Space Invaders (Taito, 1978), il primo, e Breakout (Atari, 1976), costruito dopo riusando i pacchetti condivisi.

Lavora per FASI, nell'ordine indicato in fondo. Alla fine di ogni fase: esegui tutti i controlli, fai un commit, aggiorna il diario AI, mostrami un breve riepilogo e aspetta il mio "continua". Se una fase fallisce, correggi e riprova prima di fermarti. Se una mia richiesta contraddice queste istruzioni, chiedimi conferma.

=====================================================================
1. OBIETTIVI
=====================================================================
- Progetto "scolastico" da portfolio: deve insegnare come ricostruire un vecchio videogioco in TypeScript con l'aiuto dell'AI. Documentazione abbondante: README generale, guide passo-passo numerate in docs/, guide specifiche del gioco, diario delle decisioni prese con l'AI.
- Tutto il codice "generale" sta in pacchetti riusabili @arcade/*: i giochi futuri li riuseranno.
- Ogni gioco si costruisce in UNA pagina HTML, UN file CSS, UN modulo JavaScript ES moderno. Nessuna compatibilità con browser vecchi.
- Nessun asset esterno: sprite e font sono "ASCII art" nel codice, i suoni sono sintetizzati con la Web Audio API. Niente immagini o audio dell'originale.
- Licenza MIT. Grafica e suoni ricreati da zero; nel README spiega che i nomi dei giochi appartengono ai rispettivi proprietari.

=====================================================================
2. STRUMENTI (versioni usate a settembre 2026: verifica le ultime compatibili prima di installare)
=====================================================================
- Node 24 LTS (supportati: "^22.13.0 || ^24.0.0 || >=26.0.0" nel campo engines), .nvmrc con "24", .npmrc con "engine-strict=true" così un Node vecchio fallisce subito con un errore chiaro.
- pnpm 10 workspaces (campo "packageManager" nel package.json). pnpm-workspace.yaml con packages/* e games/*.
- TypeScript ~6.0 (NON la 7: typescript-eslint supporta TypeScript < 6.1). tsconfig.base.json: target ES2022, module ESNext, moduleResolution Bundler, lib ES2022 + DOM + DOM.Iterable, strict, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes, isolatedModules, verbatimModuleSyntax, skipLibCheck, noEmit. Ogni pacchetto e gioco ha un tsconfig.json che lo estende.
- Vite 8 (usa Rolldown). Configurazione del gioco: base './' (percorsi relativi, così la build funziona in qualsiasi sottocartella), build.target 'es2022', cssCodeSplit false, assetsInlineLimit 0, build.rolldownOptions.output = { codeSplitting: false, entryFileNames: 'game.js', assetFileNames: 'game.[ext]' }. Non usare inlineDynamicImports: è deprecato.
- Vitest 5, un solo vitest.config.ts nella root che include packages/*/src/**/*.test.ts e games/*/src/**/*.test.ts.
- ESLint 10 flat config con typescript-eslint strict, eslint-plugin-functional, eslint-plugin-jsdoc. Prettier con { "singleQuote": true, "printWidth": 100 }; .prettierignore con pnpm-lock.yaml e _site.
- I pacchetti @arcade/* sono sorgenti TypeScript collegati con "workspace:*" (niente build dei pacchetti: il campo exports punta a src/index.ts).
- Script nella root: build (pnpm -r --filter "./games/*" build), build:site, clean (cancella tutti i node_modules), clean:all (clean + cancella pnpm-lock.yaml), dev (avvia Space Invaders), dev:breakout, format, lint, test (vitest run), typecheck (pnpm -r exec tsc -p tsconfig.json).
- Nel README ricorda di eseguire "pnpm install" dopo ogni git pull: un nuovo pacchetto @arcade/* non viene collegato finché non lo si fa (errore tipico: "Rolldown failed to resolve import @arcade/...").

=====================================================================
3. REGOLE DI SVILUPPO "AI FOR HUMANS" (scrivile in CLAUDE.md, in italiano)
=====================================================================
Il codice sarà letto da persone: "code for humans, not for AI".
- Pattern noti e best practice, niente soluzioni furbe. Niente file monolitici: file e funzioni piccoli con una sola responsabilità; un file oltre un paio di centinaia di righe va diviso. Molte piccole funzioni helper testabili. Commenti sul PERCHÉ nelle parti complesse.
- Programmazione funzionale, niente classi: dati come oggetti readonly, logica come funzioni pure (stato, input) => nuovoStato. Verificato da functional/no-classes e functional/no-this-expressions.
- Dati immutabili: functional/immutable-data, functional/readonly-type ('keyword'), functional/prefer-property-signatures, functional/no-let con allowInFunctions (let solo come stato privato di una closure).
- Solo arrow function ES6: no-restricted-syntax su FunctionDeclaration e FunctionExpression, prefer-arrow-callback, arrow-body-style 'as-needed', prefer-const, no-var.
- Un commento TSDoc su ogni funzione (anche interna), interfaccia e tipo: jsdoc/require-jsdoc con publicOnly false e contesti per ArrowFunctionExpression, TSInterfaceDeclaration, TSTypeAliasDeclaration; jsdoc/check-param-names.
- TypeScript strict, nessun any, nessun ! non giustificato.
- Eccezioni documentate (sono ammesse quando una regola renderebbe il codice più difficile da leggere; vanno scritte in CLAUDE.md, mai aggirate con eslint-disable):
  * il contesto canvas si chiama sempre ctx ed è l'unica mutazione ammessa (ignoreAccessorPattern 'ctx.*');
  * i nodi Web Audio si configurano per assegnamento: immutable-data disattivata solo per packages/audio/src/synth.ts;
  * il "guscio" imperativo (game loop, adattatori verso il browser) tiene lo stato in let privati a una closure;
  * nei file *.test.ts e test-*.ts (fixture condivise dei test) mock e fixture mutabili sono ammessi.
- Codice e commenti in inglese; documentazione (README, docs/) in italiano.
- packages/ non importa mai da games/. Ogni gioco separa stato puro (tipi e funzioni update), disegno (render) e collegamento (main.ts).
- Ogni pacchetto o funzionalità arriva con test Vitest e con la sua guida. Ogni decisione significativa va nel diario AI.
- Prima di ogni commit: pnpm typecheck && pnpm lint && pnpm test && pnpm build.

=====================================================================
4. PACCHETTI CONDIVISI (packages/, nome @arcade/<cartella>)
=====================================================================
- math: clamp(value, min, max).
- engine-core: game loop a TIMESTEP FISSO. clock.ts puro: createClockConfig({ step = 1/60, maxFrameTime }) , advanceClock(config, clock, elapsedSeconds) => { state, steps } con un accumulatore, clamp del tempo di frame (evita la "spirale della morte" dopo una tab in background) e tolleranza per la deriva dei float; interpolationAlpha. loop.ts: createGameLoop<State>({ initialState, update(state, dt), render(state, alpha), scheduler }) con scheduler iniettabile (requestAnimationFrame di default, finto nei test), simulateSteps, elapsedSeconds; start/stop/isRunning.
- input: KeyState immutabile con tasti premuti e fronti "pressed"/"released" dall'ultimo poll (applyKeyEvent, clearEdges, isDown, wasPressed, wasReleased, releaseAll). bindings.ts: KeyBindings<Action> = azione → lista di KeyboardEvent.code; isActionDown, wasActionPressed, boundKeys. keyboard.ts: createKeyboard(target, { captureKeys }) ascolta keydown/keyup, preventDefault solo sui tasti usati dal gioco, rilascia tutto su blur; poll() restituisce lo stato e azzera i fronti. Il gioco fa UN poll per passo di simulazione, così ogni pressione arriva a esattamente un update. Touch come "tasti virtuali": pointer-keys.ts puro (PointerKeys = Map id del dito → KeyCode; movePointer, releasePointer, heldKeys, keyChanges, applyPointerChange che riusa applyKeyEvent), così funzionano multitouch e pollice che scivola da un pulsante all'altro; touch-buttons.ts: createTouchButtons(panel, { keyAt }) ascolta pointerdown/move/up/cancel (preventDefault su pointerdown e contextmenu, pointermove conta solo con buttons !== 0), trova il pulsante con document.elementFromPoint(...).closest('[data-key]') perché sul touch event.target resta il primo elemento toccato; keyAt iniettabile nei test; poll() come la tastiera. merge-key-states.ts: mergeKeyStates(a, b) unisce due dispositivi (released solo se nessuno dei due tiene il tasto). pointer-position.ts: toLogicalX(clientX, bounds, logicalWidth) puro converte la x della pagina in unità del gioco; createPointerPosition({ target = window, bounds, logicalWidth }) ascolta pointermove e pointerdown su tutta la pagina (il dito può scorrere anche fuori dal canvas) e poll() restituisce PointerSnapshot { x: number | undefined (undefined se non si è mosso), pressed (clic o tocco dall'ultimo poll) }.
- render: Sprite { width, height, pixels: readonly boolean[] } creato da parseSprite(righe di testo con 'X' = acceso, '.' = spento); spriteRuns raggruppa i pixel accesi in segmenti orizzontali; drawSprite disegna un fillRect per segmento con coordinate arrotondate; clearScreen. DrawingContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'fillRect'> & { canvas: { width, height } }: il minimo indispensabile, così i test usano un contesto finto che registra i rettangoli (test-context.ts). Font bitmap 5×7 (arcadeFont: A-Z, 0-9, punteggiatura usata dal gioco, spaziatura 3 px) con createPixelFont, drawText, drawCenteredText, textWidth. getCanvasContext(selector) che lancia un errore chiaro se il canvas manca. seven-segment.ts: cifre a sette segmenti come quelle del decodificatore 7448: DIGIT_SEGMENTS (segmenti a-g accesi per ogni cifra), SegmentStyle { width, height, strokeX, strokeY }, segmentBox, drawSegmentDigit, drawSegmentNumber(ctx, digits, x, y, pitch, style, color).
- collision: Rect e rectsOverlap/intersection (AABB). Bitmap { width, height, pixels } dichiarata nel pacchetto (NON importa Sprite: grazie alla tipizzazione strutturale gli sprite sono Bitmap validi e i pacchetti restano indipendenti). PlacedBitmap { bitmap, x, y } con coordinate arrotondate come nel disegno; boundsOf; isSolidAt con controllo dei bordi (una x fuori dal bordo destro non deve leggere la riga successiva); bitmapsOverlap pixel-perfect limitato all'area condivisa; eraseBitmap(target, brush) che restituisce una nuova bitmap senza i pixel coperti dal pennello (terreno distruttibile).
- audio: suoni come DATI: ToneSound { kind 'tone', wave, from, to (Hz), sweep? 'exponential'|'linear', cutoff? (passa-basso opzionale) } e NoiseSound { kind 'noise', cutoff }, entrambi con duration, volume, hold? (secondi a volume pieno), fade? 'exponential'|'linear', delay? (secondi). SoundEffect = Sound | readonly Sound[]: un effetto può avere più strati, ognuno col suo delay; layersOf, fadeStart. synth.ts: playSound(ctx, sound) crea oscillatore (con filtro opzionale) o rumore bianco filtrato passa-basso, con volume costante fino a hold e poi rampa esponenziale fino a SILENCE = 0.0001 o lineare fino a 0; playEffect suona tutti gli strati programmandoli sull'orologio dell'AudioContext. audio.ts: createAudio() crea l'AudioContext solo al primo gesto dell'utente (keydown, pointerdown, pointerup o touchend: politica di autoplay; col dito il gesto valido è il distacco, non il tocco), lo riprende se sospeso, play() non fa nulla prima del gesto o in muto, toggleMute(). Test con un AudioContext finto.
- storage: createHiScoreStore(key, storage = window.localStorage) => { load(), save(score) }. parseHiScore accetta solo interi sicuri > 0 (altrimenti 0); ogni accesso è protetto da attempt(action, fallback) perché localStorage può lanciare (navigazione privata, archiviazione disattivata, quota piena): un record non salvato non deve mai bloccare il gioco. save scrive solo se batte il record. ScoreStorage = Pick<Storage, 'getItem' | 'setItem'> per i test in memoria.

=====================================================================
5. SPACE INVADERS (games/space-invaders)
=====================================================================
Schermo logico 224×256 come l'originale ruotato; canvas <canvas id="screen" width="224" height="256">, ingrandito via CSS con image-rendering: pixelated, centrato su sfondo nero e con altezza min(100vh, 100vw * 256 / 224). index.html in italiano che carica ./src/main.ts come modulo. Sotto il canvas un pannello #touch-panel di <button data-key="...">: ◀ (ArrowLeft) e ▶ (ArrowRight) a sinistra, MONETA (KeyC), COLORE (KeyV), AUDIO (KeyM) al centro, FUOCO (Space) grande e rosso a destra. Il pannello è nascosto e compare solo con @media (pointer: coarse) (niente user-agent sniffing): display: contents per mettere i tre gruppi nella griglia di body; grid-area: screen del canvas SOLO dentro la media query, altrimenti su desktop l'area sconosciuta crea colonne implicite e sposta il gioco a destra; in verticale schermo in alto e pannello sotto, in orizzontale movimento a sinistra e fuoco a destra dello schermo; 100dvh, touch-action: none, user-select: none, env(safe-area-inset-*), viewport-fit=cover.

Controlli (KeyboardEvent.code): frecce o A/D movimento, Spazio fuoco, C o 5 moneta (come in MAME), M muto, V mono/colori. Controls { direction -1|0|1 (0 se entrambe), fire, coin, mute, colorMode } dove fire/coin/mute sono fronti di pressione.

Tutta la logica di gioco avanza a frame interi da 1/60 s. Stato del gioco:
GameState = (attract | playing | gameOver) & { hiScore }. Attract: titolo "SPACE INVADERS", "*SCORE ADVANCE TABLE*" con UFO "= ? MYSTERY" (rosso) e alieni animati 30/20/10 POINTS, "INSERT COIN" che lampeggia (periodo 1 s), "<C> COIN". La moneta avvia la partita anche durante il game over. Game over: "GAME OVER" in rosso sopra l'ultima immagine per 300 frame, poi attract. hiScore sopravvive fra le partite della sessione.

Sprite (ASCII art, dimensioni dell'originale): squid 8×8, crab 11×8, octopus 12×8, due frame di animazione ciascuno; cannone 13×8; UFO 16×7; colpo 1×4; esplosione alieno 13×8; tre bombe 3×8 (rolling, plunger, squiggly) con 4 frame ciascuna; esplosione del colpo 8×8; esplosione della bomba 6×8; esplosione del cannone 2 frame 14×8; bunker 22×16 con angoli superiori smussati e arco in basso.

Meccaniche originali (cerca online e cita le fonti: computerarcheology.com/Arcade/SpaceInvaders/ con il disassemblato commentato e la pagina sull'uso della RAM, shmups.wiki/library/Space_Invaders, spaceinvaders.fandom.com/wiki/UFO; se una fonte non è raggiungibile dillo, e distingui SEMPRE nei documenti i valori confermati dalle scelte tue):
- Formazione 5 righe × 11: squid in alto (30 punti), 2 righe crab (20), 2 righe octopus (10), celle 16×16, bordo sinistro 24, alieni stretti centrati nella colonna. Ogni alieno ha kind, column (1-11), x, y, frame.
- MARCIA: si muove UN SOLO alieno per frame, in ordine dal basso a sinistra; l'accelerazione nasce da sola quando gli alieni diminuiscono. Passo 2 px; l'ultimo alieno rimasto fa +3 a destra e -2 a sinistra. Quando un alieno tocca il limite (8 a sinistra, 216 a destra) la formazione, al passaggio successivo, scende di 8 px e inverte direzione. Ogni alieno cambia frame quando si muove. Rimuovendo un alieno il cursore deve restare sull'alieno che doveva muoversi dopo.
- Altezza della riga più bassa all'inizio di ogni ondata: 128 nella prima (0x78 nell'originale); dalla seconda alla nona la tabella originale a 0x1DA3 (0x60, 0x50, 0x48, 0x48, 0x48, 0x40, 0x40, 0x40), cioè 152, 168, 176, 176, 176, 184, 184, 184 in coordinate dall'alto; dalla decima la tabella riparte da 152 (mai più 128). Attenzione a non saltare il primo valore 0x60: con 168 alla seconda ondata il gioco diventa quasi impossibile.
- Marcia sonora di 4 note basse, una a ogni passaggio completo della formazione, con almeno 5 frame fra due note (scelta nostra), frequenze scelte a orecchio.
- Cannone: 1 px per frame, x fra 16 e 224 - 16 - 13, y 216; linea verde del terreno a y 239. Un solo colpo alla volta, 4 px per frame verso l'alto, sparisce a y 32.
- BOMBE: tre tipi, al massimo una per tipo in volo; un tipo gestito per frame a turno (ogni bomba si muove ogni 3 frame); 4 px per passo, 5 quando restano 8 alieni o meno. Rolling: dalla colonna sopra il cannone. Plunger e squiggly: da tabelle di colonne (la squiggly inizia con 11, 1, 6, 3; se non trovi la tabella completa, ricostruiscila e dichiaralo); la plunger smette con un solo alieno. Parte sempre dall'alieno più basso della colonna. Una nuova bomba parte solo quando tutte quelle in volo hanno fatto almeno N passi: N = 48 sotto 200 punti, 16 sotto 1000, 11 sotto 2000, 8 sotto 3000, poi 7.
- BUNKER: 4, a y 192, x 32 + i × 45. Si sgretolano cancellando pixel con eraseBitmap: colpo del giocatore (pennello = esplosione del colpo centrata sulla punta), bombe (pennello = esplosione della bomba), alieni che ci passano sopra (pennello = lo sprite dell'alieno).
- UFO: ogni 0x600 = 1536 frame (25,6 s), solo se restano almeno 8 alieni; a y 40, 1 px per frame (scelta nostra); entra da sinistra se i colpi sparati sono pari, da destra se dispari. Punteggio = [100,50,50,100,150,100,100,50,300,100,100,100,50,150,100][colpiSparati % 15]: i 300 punti tornano ogni 15 colpi (8°, 23°, 38°...); spiega perché i giocatori conoscono il trucco come "23° colpo". Quando è colpito mostra i punti in rosso al suo posto.
- Il colpo può distruggere una bomba (si annullano a vicenda).
- 3 vite, UNA vita extra a 1500 punti. Colpito il cannone: esplosione animata e gioco fermo per 90 frame (scelta nostra), poi nuovo cannone a sinistra senza bombe in volo. Fine partita quando non restano cannoni o quando gli alieni raggiungono l'altezza del cannone. Ondata finita: nuova formazione più bassa e bunker nuovi.
- Collisioni pixel-perfect (bitmapsOverlap), usando il frame di animazione corrente.

Struttura del codice (moduli puri piccoli, ognuno con i suoi test): aliens.ts (formazione), fleet.ts (marcia), bombs.ts, shields.ts, ufo.ts, effects.ts (esplosioni e punti a tempo), cannon.ts, shot.ts, collisions.ts (ogni regola è una funzione (stato) => nuovoStato; updatePlaying applica: movimento cannone e colpo, movimento del mondo, poi le regole in ordine con reduce), playing.ts, game.ts (schermate), controls.ts, attract.ts, score.ts (punteggi a 4 cifre), colors.config.ts (tutti i colori, facili da modificare), palette.ts, playfield.ts (costanti dello schermo), sprites.ts; render-attract.ts, render-hud.ts (SCORE<1> e HI-SCORE in alto, anche nella schermata di attesa per mostrare il record salvato; in basso numero di vite e un'icona per ogni cannone di riserva), render-playing.ts, render.ts; sounds.ts; main.ts che carica il record salvato (createHiScoreStore('insert-coin/space-invaders/hi-score'), initialState con hiScore: load()) e lo salva appena cambia, collega tastiera e pulsanti touch (readControls(mergeKeyStates(keyboard.poll(), touch.poll()))), loop, audio e canvas. Fixture condivise dei test in test-fixtures.ts.

Colori: due modalità, commutate in ogni momento con il tasto V (azione colorMode nei Controls) e conservate fra una partita e l'altra (GameState = Screen & { hiScore, colorMode }, partenza a colori). MONO: tutto bianco su nero, come il monitor originale. COLORE, come le pellicole incollate sul cabinato: cannone, basi, terreno e vite verdi #30ff30; UFO, i suoi punti e GAME OVER rossi #ff3030; alieni per riga: riga 1 azzurro #40c8ff, righe 2-3 verde #30ff30, righe 4-5 viola #c050ff; testo, colpi, bombe ed esplosioni bianchi. Tutti i valori stanno in colors.config.ts; palette.ts li trasforma in una Palette per la modalità scelta (paletteFor, toggleColorMode, alienColor) e le funzioni di disegno la ricevono come parametro. Ogni alieno ha un campo row (1-5) per il colore. La schermata di attesa colora la tabella dei punteggi e mostra "<V> MONO-COLOR".

Suoni (sintetizzati, niente file; dati in sound-bank.ts, logica in sounds.ts), con valori MISURATI sulle registrazioni originali (se l'utente le fornisce, analizzale con FFT a finestre, autocorrelazione e inviluppo, e verifica il risultato rendendo i suoni con un OfflineAudioContext a 11025 Hz): shot = tre discese lineari di frequenza in fila (triangolo 800→375 Hz in 0,058 s; 1800→450 Hz in 0,2 s; 1790→1330 Hz, 0,085 s, più debole) più un soffio di rumore iniziale; alienHit = triangolo 2660→2420 Hz lineare, 0,33 s, costante per 0,16 s poi calo lineare; ufo = due rampe 780→2600 Hz e 2000→820 Hz da ~0,08 s ciascuna, ripetute ogni 10 frame mentre vola; cannonHit = rumore filtrato a 700 Hz, 0,8 s, costante per 0,55 s; march0-3 = dente di sega filtrata a 500 Hz a 60, 56, 52, 69 Hz, 0,1 s; extraLife = tono a 480 Hz (dall'analisi dei circuiti di walkofmind.com); newRecord (non esiste nell'originale) = stessa onda quadra in arpeggio 480, 600, 720, 960 Hz, l'ultima tenuta, suonata UNA volta quando il punteggio supera recordToBeat (il record all'inizio della partita, salvato nella schermata 'playing'), solo se recordToBeat > 0; ufoHit e coin scelti a orecchio (l'originale non ha un suono per la moneta). La logica di gioco NON conosce l'audio: la funzione pura soundsFor(statoPrima, statoDopo) deduce i suoni confrontando due stati (colpi sparati aumentati, effetto appena nato, cannone appena esploso, nuovo passo della marcia...). main.ts li suona.

=====================================================================
5 bis. BREAKOUT (games/breakout)
=====================================================================
Secondo gioco, scelto perché riusa quasi tutto: l'originale si guida con una manopola a potenziometro (posizione assoluta), quindi nel remake la racchetta SEGUE IL MOUSE O IL DITO, e le frecce sono un'alternativa. Nessun processore nell'originale: le fonti sono il manuale Atari (archive.org, testo OCR), la netlist MAME nl_breakout.cpp, il layout MAME breakout.lay per i colori, Wikipedia. Scrivi games/breakout/docs/meccaniche-originali.md marcando ogni fatto con [M] manuale, [C] circuito, [N] scelta nostra. Dipendenze: collision, engine-core, input, math, render, audio, storage.

Schermo: il circuito ha 228 righe × 208 passi, e un passo è circa 1,48 volte una riga (pixel non quadrati). Il gioco lavora in queste unità: <canvas id="screen" width="228" height="208">, e il CSS lo allunga con aspect-ratio: 228 / 308, height min(100vh, 100vw * 308 / 228), image-rendering: pixelated, cursor: none; body con touch-action: none; con @media (pointer: coarse) lo schermo sta in alto (place-items: start center, padding-top env(safe-area-inset-top)) e il dito guida da sotto senza coprire la pallina. Nessun pannello di pulsanti.

UN SOLO FILE per i valori incerti, tuning.config.ts, ognuno commentato con [M]/[C]/[N]: debug false; framesPerSecond 60 (il circuito fa 63,4 immagini al secondo, ma a 60 ogni immagine di uno schermo a 60 Hz mostra un passo, senza scatti); ballsPerGame 3; ballSpeeds [{fromHits 0, vertical 0.6, outer 1.2, middle 0.6}, {4, 0.8, 1.2, 0.6}, {8, 0.6, 1.6, 1.6}, {12, 0.8, 1.6, 1.6}]; fastSpeed {vertical 1, sideways 1.6}; serve {cycleFrames 256, appearY 120}; paddleKeySpeed 3; paddleStrip {top 180, height 20}; brickRowGap 1; scoreBlinkHz 4; sounds {paddle {2000 Hz, 0.009 s}, wall {1000, 0.021}, brick {500, 0.009}, tickFrames 5, topWall true, volume 0.15}; digits {width 10, height 12, strokeX 2, strokeY 2, pitch 16, leftGroupX 36, rightGroupX 144, upperRowY 10, lowerRowY 26}. I valori del circuito (1-2-3 passi per immagine, tabella nella guida delle meccaniche) sono troppo veloci da giocare nel browser: il remake tiene lo schema con valori più bassi e posizioni frazionarie, disegnate arrotondate. Colori in colors.config.ts: background #000, mono #fff, strisce dei mattoni #f00032, #ffa000, #4bc300, #fff500, racchetta #0078c8.

Campo (playfield.ts): muri laterali larghi 4 (destro a x 224), muro in alto alto 8; 8 file × 14 colonne di mattoni da BRICKS_TOP 40, passo 16, larghi 14, alti 4 (disegnati 1 passo più bassi per la riga scura fra le file); pallina 4×2; racchetta a y 188, alta 4, larga 16, 8 quando è dimezzata. Punti per coppia di file dall'alto: 7, 5, 3, 1; un muro vale 448.

Colori come PELLICOLE sul vetro: si disegna tutto in bianco, poi si stende ogni striscia con globalCompositeOperation 'multiply' (quattro strisce da 8 sui mattoni, una sulla racchetta); anche i muri si colorano dove la striscia li attraversa. V toglie le pellicole (mono).

Regole del circuito:
- La pallina memorizza direzioni (dirX, dirY), contatore dei colpi, fast, outer e canHitBrick; la velocità si ricava a ogni immagine con speedFor dalla tabella. Accelerazioni al 4° e al 12° colpo, angolo più piatto dall'8°; conta come colpo ogni ritorno verso l'alto, anche da un mattone.
- Racchetta in 4 segmenti: la metà colpita decide il lato, i segmenti esterni danno outer.
- Un mattone per viaggio: dopo un mattone la pallina attraversa gli altri finché non tocca racchetta o muro in alto (così può rimbalzare fra muro e file rosse). I mattoni arancioni e rossi portano a fastSpeed fino alla palla successiva.
- Racchetta dimezzata al primo tocco del muro in alto, intera alla palla successiva.
- Secondo muro al primo colpo di racchetta con punteggio ≥ 448, una volta sola per partita.
- Battuta deterministica: SERVE; attesa (256 - clock % 256) % 256 immagini; posizione, lato e outer ricavati dal clock al momento della pressione, senza Math.random.
- Punteggio a 3 cifre a sette segmenti, quello del giocatore lampeggia a 4 Hz durante la partita. In alto: "1" e il punteggio a sinistra, il numero della palla e il RECORD a destra (dove l'originale mostrava il punteggio del secondo giocatore) [N].
- Schermata di ATTESA all'apertura e dopo l'ultima palla: la pallina si serve da sola e rimbalza su una racchetta larga quanto lo spazio fra i muri (FULL_ROW_WIDTH, la stessa della modalità debug), i mattoni non si rompono, il punteggio resta quello dell'ultima partita, nessun suono. SERVE avvia la partita (fa da moneta e START), il SERVE successivo serve la pallina.
- debug true: racchetta larga FULL_ROW_WIDTH anche in partita, la pallina non si perde mai.

Controlli: mouse o dito muovono la racchetta (centrata sul puntatore); frecce o A/D la spostano di paddleKeySpeed; clic, tocco, Spazio o Invio = SERVE; M muto; V mono/colori.

Suoni (onde quadre, nessuno per la palla persa): paddle, wall (muri laterali; anche il muro in alto come dice il manuale, anche se il circuito sembra non farlo: interruttore topWall), brick = un tic per ogni punto, in coda uno ogni tickFrames immagini (ticks.ts: { owed, played, wait }, updateTicks(ticks, punti)), newRecord = arpeggio 500, 630, 750, 1000 Hz una volta quando si supera recordToBeat > 0. soundsFor(prima, dopo) li deduce confrontando gli stati. Record con createHiScoreStore('insert-coin/breakout/hi-score').

Moduli: playfield.ts, bricks.ts, colors.config.ts, palette.ts, tuning.config.ts, controls.ts, paddle.ts, speed.ts, ball.ts, brick-hit.ts, serve.ts, play.ts (Round e updateRound: ready, serving, inPlay, gameOver), attract.ts, ticks.ts, game.ts (attract, colorMode, paddle, clock, hiScore, recordToBeat, ticks), sound-bank.ts, sounds.ts, render-film.ts, render-hud.ts, render.ts, main.ts.

=====================================================================
6. DOCUMENTAZIONE (in italiano, con esempi di codice brevi e presi dal progetto)
=====================================================================
- README.md: sotto il titolo un'icona SVG per ogni gioco (per Space Invaders il crab verde su sfondo nero, generato dallo stesso sprite ASCII del gioco, con link alla pagina giocabile) e i badge degli strumenti (stato del deploy, licenza MIT, TypeScript, HTML5 Canvas, Node, pnpm, Vite, Vitest, ESLint, Prettier, Claude) da shields.io; poi cos'è, link "Gioca online" alla pagina pubblicata, tabella dei giochi con stato e link, screenshot, avvio rapido (Node, pnpm, comandi), struttura del monorepo, scelte tecniche (perché Canvas e non Phaser, pnpm workspaces, TS strict, Vite/Vitest), regole di sviluppo (rimando a CLAUDE.md), tabella delle guide, licenza e diritti, link a questo prompt unico.
- docs/00-introduzione.md (obiettivi, metodo di lavoro con l'AI: le decisioni restano umane, ogni passo è verificabile, gli errori dell'AI sono documentati), 01-setup-monorepo.md, 02-game-loop.md, 03-input-tastiera.md, 04-rendering-sprite.md, 05-collisioni.md, 06-audio.md, 07-build-deploy.md, 08-comandi-touch.md, 09-record-salvato.md, 10-secondo-gioco.md (cosa Breakout riusa, cosa aggiunge ai pacchetti, pixel non quadrati, pellicole, file dei valori incerti, pallina come nel circuito, attesa). Ogni guida: obiettivo, spiegazione passo per passo, codice essenziale, test, come verificarlo, link alla successiva.
- games/space-invaders/README.md (come si gioca, tasti, stato) e games/space-invaders/docs/meccaniche-originali.md (marcia, bombe, bunker, UFO, vite, ordine delle regole, mono e colori; con le fonti e le incertezze dichiarate).
- games/breakout/README.md (tasti, schermata di attesa, record, modalità debug) e games/breakout/docs/meccaniche-originali.md; nel README generale l'icona SVG di Breakout (quattro file di mattoni colorati, pallina e racchetta) accanto a quella di Space Invaders.
- docs/ai-workflow.md: diario datato di ogni fase: cosa è stato chiesto, cosa ha proposto l'AI, cosa è stato deciso, errori dell'AI e come sono stati trovati (di solito dai test), verifiche fatte.
- docs/prompt-unico.md: questo prompt, con le istruzioni per usarlo.
- Screenshot in docs/images/ presi da un browser headless (per esempio Playwright) durante una partita.

=====================================================================
7. PUBBLICAZIONE
=====================================================================
- site/: pagina iniziale statica (index.html in italiano + style.css in stile arcade, nero con bordi verdi e titolo rosso) con una griglia di schede, una per gioco (grid con repeat(auto-fit, minmax(16rem, 19rem)) centrata: più colonne su schermo largo, una sola sul telefono). Ogni scheda contiene l'anteprima PNG cliccabile nelle proporzioni del gioco (224×256 per Space Invaders, 228×308 per Breakout), titolo e anno, e sotto i comandi di quel gioco come lista <dl> a due colonne (tasti a sinistra in <kbd>, azione a destra) con una nota per il touch; in fondo alla pagina il link al repository.
- scripts/assemble-site.js (JavaScript con // @ts-check, eseguito da Node): cancella _site/, copia site/ e poi games/<nome>/dist in _site/<nome> per ogni gioco che ha una build. Script "build:site": "pnpm build && node scripts/assemble-site.js". _site/ ignorata da git, ESLint e Prettier.
- .github/workflows/deploy.yml: su push a main e workflow_dispatch; permessi contents: read, pages: write, id-token: write; concurrency "pages" senza cancellazione. Job build: actions/checkout, pnpm/action-setup (versione da packageManager), actions/setup-node con node-version-file .nvmrc e cache pnpm, pnpm install --frozen-lockfile, typecheck, lint, test, build:site, actions/upload-pages-artifact con path _site. Job deploy (needs: build, environment github-pages): actions/deploy-pages.
- Dimmi di attivare GitHub Pages (Settings → Pages → Source: GitHub Actions, senza cliccare "Create your own") e di rilanciare il job fallito se il primo run è partito prima dell'attivazione.

=====================================================================
8. FASI
=====================================================================
0. Setup del monorepo: strumenti, configurazioni, CLAUDE.md, README, struttura vuota di packages/ e games/space-invaders con pagina nera, guida 00 e 01, diario. Chiedimi il nome dell'autore per LICENSE e l'URL del repository GitHub (se non esiste, lavora in locale).
1. Game loop (engine-core, math) + guida 02.
2. Input da tastiera (input) + schermata di attesa con moneta + guida 03.
3. Rendering e sprite (render, font, tutti gli sprite degli alieni, cannone, UFO) + tabella dei punteggi animata + cannone che si muove + guida 04.
4. Collisioni (collision) + colpo, formazione ferma, esplosioni e punteggio + guida 05.
5. Audio (audio) + suoni di moneta, sparo, alieno colpito, muto + guida 06.
6. Gioco completo: marcia, bombe, bunker, UFO, vite, game over, hi-score, modalità mono e colori con il tasto V, tutti i suoni; guida delle meccaniche originali con le fonti.
7. Build e deploy su GitHub Pages + guida 07 + link "Gioca online" nel README + questo prompt in docs/prompt-unico.md, linkato da README, guida 00 e diario.
8. Comandi touch per smartphone (tasti virtuali in input, pannello cabinato nella pagina) + guida 08.
9. Record salvato (pacchetto storage) + fanfara del nuovo record + schermata di attesa con SCORE<1>/HI-SCORE in alto + guida 09; poi versione 1.0.0 nel package.json della root e del gioco.
10. Breakout, in sette passi, fermandoti dopo ognuno perché io lo provi nel browser (anche le regressioni su Space Invaders): 1) ricerca delle meccaniche originali e campo vuoto; 2) mattoni, punteggi a sette segmenti e pellicole; 3) racchetta con mouse, dito e frecce (pointer-position in input); 4) pallina, battuta, rimbalzi e mattoni; 5) mattoni veloci, racchetta dimezzata, secondo muro, punteggio lampeggiante, modalità debug; 6) suoni, record e schermata di attesa; 7) guida 10, README, scheda del sito, versione 1.0.0 del gioco e 1.1.0 della root.

Per ogni fase: scrivi prima i test delle funzioni pure, poi il codice; prova il gioco in un browser headless (movimento, colpi, nessun errore in console) e guarda uno screenshot prima di dichiarare la fase finita. Se non puoi verificare qualcosa, dillo invece di presumere che funzioni.
```

## Come è stato scritto

Il prompt non è stato scritto all'inizio: è stato **ricavato a posteriori** dal progetto finito e dal diario AI. Contiene tre tipi di informazioni:

- **le decisioni dell'autore**: Canvas invece di Phaser, un HTML + un CSS + un JS, le regole "AI for humans", il nome del progetto, la pubblicazione su GitHub Pages;
- **i fatti dell'originale** trovati durante la ricerca: marcia un alieno per frame, tabelle delle bombe, punteggi dell'UFO;
- **gli errori già incontrati**, per non ripeterli: TypeScript 7 non supportato da typescript-eslint, l'opzione deprecata di Vite, Node troppo vecchio, `pnpm install` dimenticato dopo un nuovo pacchetto, `isSolidAt` che sconfinava nella riga successiva, le velocità del circuito di Breakout troppo alte da giocare nel browser.

Quello che il prompt **non** contiene è il dialogo: le alternative scartate, le domande, le correzioni. Per quello resta il [diario AI](ai-workflow.md).

## Tenerlo aggiornato

Il prompt descrive il progetto _com'è adesso_. Ogni modifica significativa (una nuova regola, un nuovo pacchetto, un nuovo gioco) va riportata anche qui, altrimenti chi lo usa otterrà una versione vecchia del progetto. La regola è scritta in [CLAUDE.md](../CLAUDE.md).
