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

## 2026-09-28 · Il gioco completo

**Richiesta dell'autore:** prima di pubblicare mancavano la marcia degli alieni con l'accelerazione originale, i quattro bunker distruttibili sia dai colpi del giocatore sia da quelli degli alieni, e l'UFO con i suoi punteggi. Gli algoritmi andavano verificati online.

**Ricerca dell'AI:** le regole vengono dal codice originale disassemblato e commentato su [Computer Archeology](https://www.computerarcheology.com/Arcade/SpaceInvaders/) e dalla [Shmups Wiki](https://www.shmups.wiki/library/Space_Invaders). La scoperta più interessante: l'accelerazione degli alieni non è programmata, nasce dal fatto che l'originale muoveva un solo alieno per frame. Il nostro codice fa lo stesso, e l'accelerazione arriva gratis.

**Onestà sulle fonti:** l'accesso diretto a una delle fonti era limitato dal proxy dell'ambiente, e alcune pagine sono arrivate troncate. Per questo la guida [meccaniche originali](../games/space-invaders/docs/meccaniche-originali.md) separa i valori confermati dalle scelte nostre (velocità dell'UFO, note della marcia, durata delle esplosioni) e dichiara che la tabella delle colonne da cui partono le bombe è ricostruita a memoria, salvo i primi valori confermati.

**Un dettaglio corretto durante la scrittura:** la tabella dei punteggi dell'UFO dà 300 punti anche all'8° colpo, non solo al 23°. L'AI se n'è accorta scrivendo il test e ha verificato il motivo: la prima UFO arriva dopo 25 secondi, quando l'8° colpo è già stato sparato. Il commento nel codice ora lo spiega.

**Un bug trovato dai test:** nel test "colpisci l'ultimo alieno", la bomba _rolling_ (che mira al cannone) partiva proprio dall'alieno bersaglio e fermava il colpo prima che arrivasse. Non era un bug del gioco, era il gioco che funzionava come l'originale. Il test ora parte con una bomba già in volo lontano, così gli alieni non possono sparare.

**Architettura:** un modulo puro per ogni meccanica (`fleet`, `bombs`, `shields`, `ufo`, `effects`) e le collisioni come lista di regole `(stato) => nuovoStato` applicate in ordine. Nel pacchetto `@arcade/collision` è arrivata `eraseBitmap`, riusabile per ogni terreno distruttibile; scrivendola l'AI ha trovato e corretto un difetto di `isSolidAt`, che per coordinate fuori dal bordo destro leggeva i pixel della riga successiva.

**Verifica:** 149 test in totale; partita di prova di 30 secondi in Chromium: marcia, bombe, bunker sgretolati, UFO in arrivo, nessun errore.

## 2026-09-28 · Build e deploy

**Decisione dell'autore:** il gioco completo è l'MVP; le modifiche arriveranno in modo incrementale, dopo la pubblicazione.

**Proposta dell'AI:** pubblicare su GitHub Pages con GitHub Actions invece che da un branch `gh-pages`: niente file generati nel repository, e il deploy dipende dai controlli. Il job di build esegue typecheck, lint e test prima di costruire, quindi un push rotto non arriva al sito. Il sito è pensato per più giochi: una pagina iniziale statica e una cartella per gioco, montate da uno script Node che non va aggiornato quando arriva un nuovo gioco.

**Passaggio manuale:** l'attivazione di Pages (Settings → Pages → Source: GitHub Actions) spetta al proprietario del repository; l'AI non ha i permessi per farlo e non li ha chiesti.

**Verifica:** `pnpm build:site` in locale produce `_site/` con la pagina iniziale e il gioco; l'anteprima nella pagina iniziale è uno screenshot a risoluzione originale (224×256) preso in Chromium durante una partita.

## 2026-09-28 · Il prompt unico

**Richiesta dell'autore:** il progetto è nato in modo interattivo, con molte domande e risposte; chi vuole sperimentare in prima persona ha bisogno di un unico prompt capace di generare l'intero progetto così com'è.

**Proposta dell'AI:** un prompt ricavato a posteriori dal codice e da questo diario, diviso in otto fasi che ricalcano le guide, con un riepilogo e una pausa alla fine di ognuna. Contiene le decisioni dell'autore, i numeri dell'originale con le fonti, e gli errori già incontrati (TypeScript 7, l'opzione deprecata di Vite, Node vecchio, `pnpm install` dimenticato), così chi lo usa non li ripete. Dichiara apertamente che il risultato non sarà identico carattere per carattere.

**Regola nuova:** il prompt descrive il progetto com'è adesso, quindi ogni modifica significativa va riportata anche lì. La regola è in `CLAUDE.md`.

**Limite:** il prompt non è stato ancora eseguito da capo a fine in una cartella vuota; è stato controllato confrontando ogni valore con il codice.

Documento: [prompt unico](prompt-unico.md).

## 2026-09-28 · Icone dei giochi e badge

**Richiesta dell'autore:** sotto il titolo del README, un'immagine per ogni gioco (per Space Invaders il classico alieno, da un PNG trovato online) e i badge degli strumenti del monorepo.

**Proposta dell'AI:** invece di scaricare il PNG, un'icona SVG generata dallo stesso sprite ASCII del crab usato nel gioco. Il README dichiara che nessun asset originale o di terzi è incluso, e l'immagine proposta non aveva una licenza chiara; lo sprite nostro è identico nella forma, pesa meno di 1 KB e resta nitido a ogni dimensione. Sfondo nero con bordi arrotondati, così si legge sia nel tema chiaro sia in quello scuro di GitHub.

**Badge:** stato reale del workflow di deploy (si aggiorna da solo), licenza, e badge statici shields.io per TypeScript, HTML5 Canvas, Node, pnpm, Vite, Vitest, ESLint, Prettier e Claude. Le versioni nei badge statici vanno aggiornate a mano quando cambiano gli strumenti.

## 2026-09-28 · Monocromatico o a colori

**Richiesta dell'autore:** l'originale è monocromatico e i colori venivano dalle pellicole sul cabinato; serve un tasto per passare da MONO a COLORE, con basi e cannone verdi, UFO rosso, alieni azzurri nella prima riga, verdi nella seconda e terza, viola nella quarta e quinta. I colori vanno in un file di configurazione facile da modificare.

**Proposta dell'AI:** tasto **V** (C è già la moneta, M l'audio). Un file `colors.config.ts` con soli dati commentati; `palette.ts` lo trasforma nella palette della modalità scelta e il disegno la riceve come parametro, così nessuna funzione di disegno sceglie colori da sola. La modalità sta nello stato del gioco (quindi è testabile come il resto) ma sopravvive fra una partita e l'altra, come il record. Ogni alieno ora ricorda la propria riga, perché due righe con lo stesso tipo di alieno potrebbero avere colori diversi nella configurazione.

**Cosa cambia:** le "strisce" per altezza introdotte con il gioco completo (bombe che diventano verdi vicino alle basi) sono state sostituite dai colori per oggetto chiesti dall'autore.

**Un dettaglio trovato con lo screenshot:** la scritta `<V> MONO/COLOR` usciva senza barra, perché il font 5×7 non ha il carattere `/`; ora è `<V> MONO-COLOR`.

**Verifica:** 153 test; screenshot in Chromium della schermata di attesa e della stessa partita in COLORE e, dopo V, in MONO.

## 2026-09-28 · Suoni misurati sugli originali

**Richiesta dell'autore:** rendere i suoni più simili all'originale, a partire dallo sparo del cannone, usando le registrazioni originali o fonti più rapide.

**Ostacolo:** il sito con le registrazioni non era raggiungibile dall'ambiente dell'AI. L'AI ha trovato l'analisi dei circuiti audio del cabinato su walkofmind.com (utile per la forma d'onda e per la vita extra a 480 Hz, ma senza i valori della maggior parte dei suoni); l'autore ha poi caricato direttamente i file WAV.

**Metodo dell'AI:** misura di ogni registrazione con FFT a finestre, autocorrelazione e inviluppo del volume. Scoperte principali: lo sparo non è un rumore ma una frequenza che scende in linea retta e riparte; l'alieno colpito è un tono acuto a 2,6 kHz, non una discesa; la marcia è a 60, 56, 52 e 69 Hz, più grave di quanto scelto a orecchio.

**Modifiche al pacchetto `@arcade/audio`:** per descrivere questi suoni sono serviti alcuni campi opzionali (`hold`, `fade`, `sweep`, `cutoff`, `delay`) e gli effetti a più strati (`SoundEffect`). Tutti opzionali: i suoni esistenti non cambiano significato.

**Verifica con il sintetizzatore vero:** i suoni del gioco sono stati resi in Chromium con un `OfflineAudioContext` e confrontati con le registrazioni usando le stesse misure. Il primo confronto ha mostrato che la dissolvenza esponenziale spegneva i suoni troppo presto rispetto agli originali, che calano in modo lineare: da qui il campo `fade: 'linear'`. Anche il picco dell'UFO è stato corretto dopo il confronto.

**Divisione del file:** con i nuovi valori `sounds.ts` superava le 190 righe; i dati sono passati in `sound-bank.ts`, la logica `soundsFor` è rimasta in `sounds.ts`.

**Non misurati:** UFO colpito e vita extra (registrazioni non disponibili); la moneta non esiste nell'originale.

## 2026-09-28 · Correzione: altezza delle ondate

**Segnalazione dell'autore:** finito il primo livello, nel secondo gli alieni ripartono troppo in basso e il gioco diventa quasi impossibile. Il principio è giusto (ogni ondata parte più vicina alla base), la quantità no.

**Causa, trovata dall'AI:** errore di trascrizione. La tabella originale delle altezze di partenza (0x1DA3: `60 50 48 48 48 40 40 40`, usata dalla seconda ondata in poi, mentre la prima parte da 0x78) era stata copiata senza il primo valore. Così la seconda ondata partiva dall'altezza della terza, 16 pixel più in basso del dovuto. Anche il ciclo era sbagliato: dopo l'ottava ondata il remake tornava all'altezza della prima, mentre l'originale riparte dalla seconda.

**Correzione:** tabella completa, verificata sull'analisi del codice originale di Ron Jeffries; nuovi test che controllano le prime tre altezze, il limite di 184 pixel e il ciclo dalla decima ondata.

**Lezione:** i valori trascritti da una fonte vanno confrontati uno a uno con la fonte, non solo con il ricordo di averla letta. Un test che fissa i valori attesi ("128, 152, 168") rende l'errore visibile a chiunque legga il codice.

## 2026-09-28 · Giocare da smartphone

**Richiesta dell'autore:** far giocare anche da smartphone, visto che la maggior parte del traffico arriva da lì. La sua prima idea: toccare a sinistra o a destra dello schermo per muovere, al centro per sparare; ma lui stesso la trovava scomoda e ha chiesto alternative.

**Proposte dell'AI:** tre opzioni su una scheda di scelta: pannello come il cabinato sotto lo schermo (consigliata), trascina e spara, zone sullo schermo. Le zone hanno il difetto che le dita coprono l'area di gioco e non c'è un confine che si sente sotto il dito. L'autore ha scelto il pannello.

**Domanda dell'autore:** mostrare il pannello solo sui browser mobili? Sì, ma senza leggere lo _user-agent_ (un iPad si presenta come un Mac): la media query CSS `pointer: coarse` chiede se il puntatore principale è un dito.

**Decisione tecnica:** i pulsanti sono "tasti virtuali" del pacchetto `@arcade/input`, con un attributo `data-key` che produce lo stesso `KeyState` del tasto fisico. La logica di gioco non è cambiata di una riga. Il tracciamento è per dito, non per pulsante, così funzionano il multitouch e il pollice che scivola da ◀ a ▶.

**Un dettaglio trovato dall'AI:** sui telefoni l'audio si sblocca quando il dito si _stacca_ (`pointerup`, `touchend`), non quando tocca. Con il solo `pointerdown` il gioco sarebbe rimasto muto; ora `createAudio` ascolta anche quei due eventi.

**Verifica:** test delle funzioni pure e dell'adattatore con eventi finti; in Chromium con l'emulazione di un telefono (390×844 e 360×740, verticale e orizzontale) tocchi veri via DevTools: moneta, sinistra tenuta con un dito e fuoco con l'altro, pollice fatto scivolare su destra. Screenshot controllati; su desktop il pannello non compare. Non provato su un telefono fisico: lo fa l'autore.

## 2026-09-28 · Correzione: gioco non centrato su desktop

**Segnalazione dell'autore:** dopo il pannello touch, su desktop il gioco è spostato a destra; nel CSS non trovava la causa.

**Causa, trovata dall'AI misurando la pagina in Chromium** (440 pixel di margine a sinistra, 147 a destra): la regola `grid-area: screen` del canvas era fuori dalla media query `pointer: coarse`. Su desktop la griglia non ha un'area chiamata `screen`, e per un nome sconosciuto il browser crea righe e colonne implicite: il canvas finisce in una colonna in più. La media query nascondeva il problema proprio sui dispositivi usati per provare il pannello.

**Correzione:** `grid-area` spostata dentro la media query, con un commento che spiega il perché; margini ora uguali (294 e 294 pixel). Il test in Chromium controlla anche questo.

**Lezione:** una modifica "solo per mobile" va verificata anche sul desktop. Lo screenshot del pannello era perfetto; mancava quello della vecchia pagina.

## 2026-09-28 · Record salvato e versione 1.0.0

**Richiesta dell'autore:** ultima funzionalità prima della v1.0.0: salvare il punteggio più alto nel `localStorage`, con un suono celebrativo quando lo si supera, simile a quello della vita extra.

**Decisioni dell'AI:**

- nuovo pacchetto `@arcade/storage`, perché il record serve a ogni gioco. Ogni accesso a `localStorage` è protetto: in navigazione privata o con l'archiviazione disattivata il browser lancia errori, e un record non salvato non deve fermare il gioco;
- il record si salva appena cambia, non a fine partita, così sopravvive anche se si chiude la pagina a metà;
- la fanfara usa la stessa onda quadra della vita extra, in arpeggio 480, 600, 720, 960 Hz. Suona una sola volta per partita, e non alla prima partita in assoluto (record 0). Per saperlo lo stato della partita ricorda `recordToBeat`, il record all'inizio;
- come sul cabinato, `SCORE<1> HI-SCORE` compare anche nella schermata di attesa: senza, dopo aver ricaricato la pagina il record salvato non si vedeva.

**Verifica:** 182 test; in Chromium: record di partenza 20 scritto nel `localStorage`, partita, record aggiornato, fanfara suonata una volta (rilevata intercettando le frequenze dell'`AudioContext`), pagina ricaricata con il nuovo record in alto.

**Versione:** `1.0.0` nel `package.json` della root e del gioco. Il tag `v1.0.0` e la release si creano da GitHub (Releases → Draft a new release), perché l'ambiente dell'AI può spingere solo sul ramo main.

## 2026-09-29 · Breakout, step 1: meccaniche originali e pagina vuota

**Scelta del secondo gioco.** L'autore proponeva Breakout (o T.T. Block di Taito) e Asteroids, con due dubbi: per Breakout la tastiera al posto della manopola, per Asteroids la grafica vettoriale e i molti tasti. L'AI ha consigliato Breakout: la manopola dell'originale è un **potenziometro**, cioè una posizione assoluta, esattamente come la posizione del mouse o del dito. Riusa quasi tutto (loop, sprite, font, collisioni, audio, record, modalità mono/colori, perché anche Breakout era in bianco e nero con pellicole colorate). Asteroids richiederebbe un renderer nuovo; Galaxian riuserebbe i comandi ma con molto codice nuovo per le traiettorie in picchiata.

**Metodo concordato:** una checklist di sette step; dopo ogni step l'autore prova nel browser, anche Space Invaders per le regressioni; diario aggiornato a ogni step; documentazione e prompt unico a gioco finito.

**Ricerca.** Breakout non ha un processore: niente codice da disassemblare. Un sotto-agente AI ha letto il manuale Atari (su archive.org) e soprattutto la netlist del circuito trascritta da MAME, ricavando porta per porta le misure dello schermo, la tabella delle velocità, i 4 segmenti della racchetta e i toni dei suoni. Scoperte non ovvie: il secondo muro si attiva con il punteggio, non contando i mattoni; dopo un mattone la pallina attraversa gli altri finché non tocca racchetta o muro; i pixel dell'originale non sono quadrati. Ogni valore nella guida delle meccaniche è marcato come "dal manuale", "dal circuito" o "scelta nostra".

**Decisione tecnica:** il gioco lavora nelle unità del circuito (228 righe × 208 passi) e il CSS allunga l'immagine alla forma vera, 228:308, con `aspect-ratio`. Nessun calcolo di conversione nel codice.

**Step 1:** pagina `games/breakout` con i muri e la scritta "COMING SOON", seconda scheda nel sito, comando `pnpm dev:breakout`. Verifica: build del sito con due giochi; in Chromium Breakout e Space Invaders centrati su desktop, Breakout su telefono, pagina iniziale con le due schede.

## 2026-09-29 · Breakout, step 2: campo di gioco

**Richiesta dell'autore, durante lo step:** tutti i valori incerti (per esempio la velocità della pallina) in un unico file di costanti, per cambiarli e provarli facilmente. Nasce `tuning.config.ts`: ogni valore ha un commento con la fonte, marcata [M] manuale, [C] circuito o [N] scelta nostra. I valori certi (misure dei mattoni, punti per fila) restano nel codice che li usa; i colori in `colors.config.ts`, come in Space Invaders.

**Decisioni dell'AI:**

- **La pellicola come nel cabinato:** invece di dare un colore a ogni oggetto, il gioco disegna tutto in bianco e poi stende le cinque strisce colorate con la modalità `multiply` del canvas. Il risultato è quello dell'originale anche nei dettagli: i muri laterali si colorano dove passano sotto una striscia, e la pallina cambierà colore attraversandole. In modalità MONO le strisce semplicemente non ci sono.
- **Cifre a sette segmenti** nel pacchetto `@arcade/render` (`drawSegmentDigit`), perché l'originale usava decoder per display, non un font. Serviranno anche ad altri giochi degli anni '70.
- **Riga scura fra le file di mattoni:** nel circuito è più sottile di un passo; il remake usa un passo intero, valore nel file di configurazione.

**Un aggiustamento dopo lo screenshot:** le cifre in alto toccavano il muro e sembravano attaccate; abbassate di due passi e rimpicciolite (valori [N] nel file di configurazione).

**Verifica:** test di mattoni, punti (448 per muro), segmenti, pellicola e cambio di modalità; screenshot in Chromium a colori e in MONO, Space Invaders ancora giocabile.

## 2026-09-29 · Breakout, step 3: la racchetta

**Richiesta:** muovere la racchetta con mouse, dito e frecce.

**Decisioni dell'AI:**

- **Posizione assoluta, come la manopola:** nuovo adattatore `createPointerPosition` in `@arcade/input`. Converte la x del puntatore nelle unità del gioco (0 a sinistra del canvas, 228 a destra), qualunque sia la dimensione del canvas sullo schermo. Come la tastiera, si legge una volta per frame: restituisce la posizione solo se il puntatore si è mosso, così le frecce funzionano quando il mouse è fermo.
- **Ascolto su tutta la pagina,** non solo sul canvas: il mouse può uscire dal canvas senza perdere la racchetta, e sul telefono il dito scorre sotto lo schermo di gioco senza coprire la pallina. Per lo stesso motivo sui touch screen il canvas va in alto, lasciando libero lo spazio sotto.
- **Cursore nascosto sul canvas:** la racchetta è il cursore.
- **Valori incerti** nel file di configurazione: velocità con le frecce (3 righe per immagine) [N]; corsa fra i muri laterali [N].

**Verifica:** test della conversione delle coordinate, dell'adattatore e del movimento (centro sul puntatore, frecce, fermo ai muri, righe intere). In Chromium: mouse al 25% del canvas, mouse fuori dal canvas a sinistra, freccia destra tenuta, e su telefono emulato un dito che scorre sotto lo schermo: in tutti i casi la racchetta è dove deve essere.

## 2026-09-29 · Breakout, step 4: la pallina

**Richiesta:** battuta, rimbalzi su muri e racchetta con gli angoli, palle perse.

**Decisioni dell'AI:**

- **Velocità ricavata, non memorizzata:** come nel circuito, la pallina tiene solo la direzione, il contatore dei colpi e due indicatori; `speedFor` calcola la velocità a ogni immagine dalla tabella in `tuning.config.ts`. Così cambiare una velocità è cambiare un numero nel file di configurazione, come chiesto dall'autore.
- **Racchetta in 4 segmenti:** la metà colpita decide il lato, i segmenti esterni danno l'angolo più piatto. Sulla racchetta dimezzata (prossimo step) i segmenti si dimezzano da soli, perché sono quarti della larghezza.
- **La battuta dell'originale:** SERVE (spazio, Invio, clic o tocco), poi la pallina compare entro circa 4 secondi, come nel circuito dove gira invisibile finché non attraversa il centro dello schermo. Posizione e direzione dipendono dall'istante della pressione: niente `Math.random`, quindi tutto resta testabile.
- **I mattoni già in questo step:** senza, la pallina li avrebbe attraversati tutti e il gioco non si poteva provare. Il colpo rompe il mattone e somma i suoi punti; con la regola "un mattone per viaggio" del circuito. Accelerazioni per colore, racchetta dimezzata e secondo muro restano per lo step 5.
- **Un'osservazione sulla tabella delle velocità:** la riga "colpi 8–11" sembrava un rallentamento; calcolando con i pixel non quadrati (1,48:1) la velocità complessiva resta quasi uguale, cambia solo l'angolo. Aggiunta alla guida delle meccaniche.

**Adattatore del puntatore:** ora riporta anche i clic e i tocchi (`pressed`), usati come pulsante SERVE.

**Verifica:** test di velocità, rimbalzi, segmenti, mattoni, battuta e fine partita. In Chromium un piccolo "robot" legge i pixel del canvas per trovare la pallina e ci porta sotto il mouse: in 25 secondi la pallina è stata servita, ha rimbalzato su muri e racchetta e ha rotto mattoni (7 punti), senza errori in console.

## 2026-09-29 · Breakout, step 5: le regole del muro

**Richiesta:** accelerazione sui mattoni alti, racchetta dimezzata, secondo muro.

**Implementato, seguendo il circuito:**

- **Mattoni arancioni e rossi:** portano la pallina alla velocità massima fino alla battuta successiva. Non serve una regola a parte: il colpo accende l'indicatore `fast` e `speedFor` fa il resto.
- **Racchetta dimezzata:** al primo tocco del muro in alto la larghezza passa da 16 a 8 righe; torna intera alla palla successiva. I 4 segmenti si dimezzano da soli.
- **Secondo muro:** compare al primo colpo di racchetta dopo 448 punti, una volta sola, come nel circuito, che non contava i mattoni rimasti ma guardava il punteggio.
- **Punteggio lampeggiante:** circa 4 volte al secondo durante la partita, fermo a partita finita; frequenza nel file di configurazione.

**Verifica:** test per ogni regola (colori veloci, larghezza, 448 punti ma non 447, nessun terzo muro, lampeggio di circa 4 Hz). In Chromium il robot che insegue la pallina ha giocato 60 secondi senza errori; in quel tempo non ha raggiunto il muro in alto, quindi racchetta dimezzata e secondo muro sono verificati solo dai test. La prova vera la fa l'autore giocando.

## 2026-09-29 · Breakout, step 5 bis: velocità e modalità debug

**Prova dell'autore su più dispositivi:**

1. la pallina sembra un po' più veloce su Mac che su smartphone;
2. velocità iniziale e accelerazioni troppo alte: dopo 30 secondi è difficile respingere la pallina;
3. serve una modalità debug: un booleano nel file di configurazione e una pallina che non si perde mai, per esempio con una racchetta larga quanto lo schermo.

**Analisi dell'AI sul punto 1:** il loop a passo fisso rende la velocità indipendente dalla potenza di calcolo. Per verificarlo, in Chromium la velocità della pallina è stata misurata leggendo i pixel del canvas, con il processore normale e rallentato 6 volte in emulazione telefono: 35,9 e 36,4 unità al secondo, cioè la stessa (atteso: 0,6 × 60 = 36). Due cause possibili della differenza percepita:

- lo schermo del Mac è più grande, quindi la pallina percorre più centimetri al secondo;
- il gioco avanzava a 63,4 passi al secondo come il circuito, e su uno schermo a 60 Hz ogni tanto un'immagine mostrava due passi, con un piccolo scatto.

Il remake ora avanza a 60 passi al secondo: niente scatti sugli schermi a 60 Hz.

**Punto 2:** la tabella delle velocità mantiene lo schema del circuito ma con valori più bassi e scatti più dolci, marcati [N]; i valori del circuito restano documentati nella guida delle meccaniche. La pallina ora si muove di frazioni di pixel e viene disegnata sul pixel più vicino.

**Punto 3:** `debug` in `tuning.config.ts`. Con `true` la racchetta è larga quanto lo spazio fra i muri: è lo stesso trucco della schermata di attesa del cabinato, dove la racchetta era una riga intera. Provato in Chromium: 90 secondi senza toccare nulla, la pallina è ancora la prima.

## 2026-09-29 · Breakout, step 6: suoni, record e schermata di attesa

**Richiesta:** suoni e record, dopo la conferma che velocità e modalità debug vanno bene.

**Implementato:**

- **Suoni del circuito:** tre onde quadre, "blip" sulla racchetta (circa 2 kHz), "bounce" sui muri (circa 1 kHz), un "tic" (circa 500 Hz) per ogni punto. Come in Space Invaders i suoni si ricavano confrontando due stati consecutivi, quindi la logica di gioco resta pura. I tic hanno bisogno di un piccolo stato in più, `ticks.ts`: il circuito paga i punti uno alla volta, e un mattone rosso suona 7 tic distanziati.
- **Muro in alto:** manuale e circuito non concordano; l'AI ha scelto il manuale e ha messo l'interruttore `sounds.topWall` nel file di configurazione, insieme a toni, durate e volume.
- **Record:** salvato con `@arcade/storage`, mostrato al posto del punteggio del secondo giocatore, con una fanfara quando lo si batte, come in Space Invaders.
- **Schermata di attesa:** l'originale non si ferma mai; aspetta un giocatore con la pallina che rimbalza da sola su una racchetta larga quanto lo schermo, senza rompere mattoni e senza suoni. Il remake fa lo stesso, riusando la larghezza della modalità debug. SERVE fa le veci di moneta e START.

**Verifica:** test per i tic, i suoni (racchetta, muri, silenzio in attesa, fanfara una volta sola), l'attesa (non rompe mattoni e non perde la palla in 5000 immagini) e il passaggio attesa → partita → attesa. In Chromium un robot ha contato gli oscillatori creati: 0 suoni in attesa, poi 2000, 1000 e 500 Hz durante la partita; il record è sopravvissuto al ricaricamento della pagina. Space Invaders si apre senza errori.

## 2026-09-29 · Breakout, step 7: documentazione finale

**Prova dell'autore dello step 6:** tutto a posto, "identico all'originale, anche nei suoni".

**Aggiornato, come previsto dal metodo a gioco finito:**

- **Guida 10, "Un secondo gioco":** cosa Breakout riusa dai pacchetti (tutto, senza modificarli), cosa aggiunge (posizione del puntatore in `@arcade/input`, cifre a sette segmenti in `@arcade/render`), pixel non quadrati, pellicole, il file unico dei valori incerti, la pallina come nel circuito, l'attesa.
- **README:** icona SVG di Breakout accanto a quella di Space Invaders, screenshot di gioco, stato "Completo", guide 10 e meccaniche di Breakout nella tabella.
- **Sito:** tolta la scritta "in costruzione", nuova anteprima presa da una partita vera, i tasti di Breakout sotto quelli di Space Invaders.
- **Prompt unico:** nuova sezione Breakout con tutti i valori di `tuning.config.ts`, le regole del circuito e i sette passi come fase 10; aggiunte le due funzioni nuove dei pacchetti.
- **Versioni:** Breakout 1.0.0; la root passa a 1.1.0, perché il progetto ha un gioco in più.

**Verifica:** screenshot presi in Chromium da un robot che insegue la pallina con il mouse, con un record finto di 214 per mostrarlo in alto a destra.

## 2026-09-29 · Pagina iniziale: i comandi dentro le schede

**Richiesta:** con più giochi, i paragrafi dei comandi sotto la griglia diventano difficili da seguire. Due proposte dell'autore: griglia con miniatura e comandi nella stessa scheda, oppure tabella verticale con le colonne MINIATURA e COMANDI.

**Scelta dell'AI:** la griglia, perché si adatta da sola alla larghezza dello schermo: più colonne su desktop, una sola colonna sul telefono, dove diventa di fatto la tabella verticale. Ogni scheda ha la miniatura cliccabile, titolo e anno, poi i comandi come lista a due colonne (tasti a sinistra, azione a destra) e una nota per il touch.

**Verifica:** screenshot in Chromium a 1100 e 390 pixel di larghezza, nessuno scorrimento orizzontale sul telefono.

## 2026-09-29 · Pagina iniziale: il titolo a pixel

**Richiesta:** il titolo INSERT COIN in stile pixel, con i punti separati, come in un'immagine di esempio.

**Implementato:** `site/title.svg`, generato dal font 5×7 di `@arcade/render`: ogni pixel acceso è un quadrato rosso separato dagli altri da uno spazio sottile, come un display a matrice di punti. Il titolo usa così lo stesso alfabeto dei giochi. Sotto c'è una riga di punti bianchi, come nell'esempio. L'SVG si ridimensiona senza sfocare, anche sul telefono.

## 2026-09-30 · Asteroids, step 1: meccaniche originali e pagina vuota

**Scelta del terzo gioco.** L'AI proponeva Asteroids, con Galaxian, Pac-Man e Frogger come alternative. L'autore ha scelto Asteroids, uno dei suoi giochi preferiti, con un'osservazione: un motore per la **grafica vettoriale** apre la strada a molti altri giochi (Battlezone, Tempest, Star Wars, Lunar Lander...). Per questo il disegno vettoriale nascerà come pacchetto condiviso, `@arcade/vector`, non dentro il gioco.

**Metodo:** lo stesso di Breakout. Una checklist di otto step (meccaniche, motore vettoriale, nave, asteroidi e colpi, vite e iperspazio, dischi volanti, suoni e record, documentazione); dopo ogni step l'autore prova nel browser, anche gli altri due giochi.

**Ricerca.** Asteroids, a differenza di Breakout, ha un processore (un 6502) e il suo programma è stato disassemblato e commentato. Un sotto-agente AI ha letto tutto il listato, la ROM vettoriale con i disegni e i modelli dei circuiti sonori di MAME, annotando ogni valore con l'indirizzo dell'istruzione da cui viene. Scoperte non ovvie: la direzione della nave non si azzera mai; i propri colpi possono distruggere la nave; le collisioni ignorano il bordo che si richiude; l'iperspazio è più rischioso **con pochi** asteroidi (un articolo online dice il contrario: vince il codice); il disco piccolo vale 1000 punti anche se i commenti del disassemblato dicono 990; una regola "anti-attesa" fa arrivare i dischi volanti più spesso a chi non spara agli asteroidi.

**Decisioni tecniche:**

- **Le unità del programma originale:** posizioni da 0 a 8191 × 6143, velocità in unità per passo. Ogni numero del disassemblato si copia senza conversioni; solo il disegno divide per 8 per arrivare alle 1024 × 768 unità dello schermo vettoriale.
- **La y del DVG cresce verso l'alto**, quella del canvas verso il basso: una sola funzione, `toCanvasY`, fa la conversione.
- **60 passi al secondo** invece dei 61,5 dell'originale, come in Breakout: un passo per ogni immagine degli schermi a 60 Hz.

**Step 1:** pagina `games/asteroids` con "COMING SOON" e, come anteprima, il primo asteroide della ROM (`$11E6`) disegnato con le sue coordinate originali; terza scheda nel sito, comando `pnpm dev:asteroids`, guida [delle meccaniche](../games/asteroids/docs/meccaniche-originali.md). Verifica: build del sito con tre giochi; in Chromium Asteroids su desktop e telefono, Space Invaders e Breakout invariati, pagina iniziale con le tre schede.

## 2026-09-30 · Asteroids, step 2: il motore vettoriale

**Richiesta:** il disegno vettoriale come pacchetto riutilizzabile, non dentro il gioco, perché apre la strada ad altri giochi.

**Decisioni dell'AI:**

- **I disegni come passi del fascio**, esattamente come nella ROM: `[dx, dy, luminosità]`, con luminosità 0 per spostarsi senza disegnare. Uno script ha estratto i numeri dal listato della ROM vettoriale: 4 asteroidi, 17 disegni della nave con le fiamme, il disco volante, l'icona delle vite, le schegge delle esplosioni, i pezzi della nave e tutto il font. Ogni disegno riporta nel codice l'indirizzo da cui viene.
- **Il font Atari nel pacchetto**, non nel gioco: gli altri giochi vettoriali Atari usano lettere uguali o molto simili.
- **La nave con i disegni originali**, specchiati come fa il programma (`$750B`), invece di ruotare un disegno solo. La rotazione a scatti di 5,6 gradi è quella del cabinato. Il pacchetto sa comunque ruotare liberamente, per i giochi futuri.
- **Canvas grande quanto lo schermo** (dimensione CSS × `devicePixelRatio`), aggiornato solo quando cambia: linee nitide anche su Retina. Spessore e alone sono in unità del gioco, così l'immagine è la stessa su telefono e monitor.
- **La luce:** alone azzurrino con `shadowBlur`, luce che si somma dove le linee si incrociano (`lighter`), curva di luminosità che schiarisce i valori bassi. Una prima versione con un secondo tratto largo e trasparente sembrava un contorno grigio, non un bagliore: sostituita dopo lo screenshot.
- **Schermo un po' più grande del campo:** il punteggio arriva a y = 900, oltre le 768 righe del campo. Lo schermo mostrato è 1044 × 788 unità, come in MAME.
- **Una piccola eccezione alle regole:** ridimensionare il canvas (`ctx.canvas.width = ...`) è ammesso come disegnare, aggiunto a CLAUDE.md e alla configurazione di ESLint.

**Una scoperta nei dati:** alcuni disegni ruotati della nave non si chiudono esattamente, mancano l'angolo di partenza di un'unità. Atari li calcolò e arrotondò a mano; il remake li tiene così.

**Step 2:** schermata ferma con tutti i disegni: asteroidi nelle tre grandezze, i due dischi, 16 navi in cerchio, una nave con fiamma e colpi, le schegge e i pezzi della nave, punteggio, record, vite, "PUSH START" e "© 1979 ATARI INC". Nuova [guida 11](11-grafica-vettoriale.md). Verifica: test del pacchetto e del gioco; screenshot in Chromium a densità 1, 2 e 3 e su telefono emulato.

## 2026-09-30 · Asteroids, step 3: la nave

**Richiesta:** la nave che ruota, spinge con inerzia e attraversa i bordi.

**Decisioni dell'AI:**

- **La stessa aritmetica del 6502,** non una fisica "moderna" con numeri decimali. La velocità sta in 256esimi di unità, come nei due byte per asse del programma; la spinta aggiunge due volte il seno o il coseno della tabella originale; l'attrito toglie il doppio del byte alto (circa 1/128); la velocità massima è limitata asse per asse. La nave si sposta solo della parte intera, e lo schermo mostra la posizione divisa per 8. Così l'inerzia è quella del cabinato, anche nei dettagli: in diagonale la nave va più veloce, e una nave lenta scivola a lungo prima di fermarsi.
- **Spinta e attrito un passo sì e uno no,** come nel programma; la rotazione a ogni passo.
- **Il contatore dei passi da 0 a 255** nello stato del gioco, come il "fast timer" del 6502: la fiamma lo usa già (4 passi accesa, 4 spenta) e lo useranno molte regole dei prossimi step.
- **Un dettaglio di JavaScript:** il seno di 128 veniva `-0`, un numero che il 6502 non conosce e che fa fallire i confronti nei test. Corretto con `0 - valore`.
- **Comandi:** frecce ← → o A/D per ruotare, ↑ o W per la spinta. La schermata di prova dello step 2 è stata tolta: resta nella storia di git.

**Verifica:** test di tabella, seno e coseno, rotazione, spinta (velocità massima in circa 2 secondi), attrito (dimezza in circa 3 secondi), bordi. In Chromium un robot tiene premute le frecce: la nave ruota, la fiamma tremola, la nave esce in alto e rientra dal basso.

## 2026-09-30 · Asteroids, step 4: asteroidi e colpi

**Richiesta:** i colpi della nave e gli asteroidi, con divisione, punteggio e ondate.

**Decisioni dell'AI:**

- **Il generatore casuale del 6502** (`$77B5`), copiato bit per bit e tenuto nello stato del gioco invece di `Math.random()`. La logica resta pura, e un test può rigiocare la stessa partita dallo stesso seme. Anche l'ordine delle estrazioni è quello originale: per dividere un asteroide il programma estrae sei numeri per figlio e ne usa solo alcuni, e il remake fa lo stesso.
- **I 27 posti degli asteroidi e i 4 dei colpi** come array di lunghezza fissa con `null` per il posto libero, riempiti nello stesso ordine del programma. Così si comportano come l'originale anche i casi limite, per esempio un asteroide colpito quando tutti i posti sono occupati, che sparisce senza dividersi.
- **L'esplosione occupa il posto dell'asteroide** per circa 37 passi, come nel 6502: la nuova ondata parte solo quando anche l'ultima nuvola si è spenta, più 127 passi di pausa.
- **Le collisioni a ottagono** con la stessa aritmetica a 8 bit, compresa una piccola asimmetria: per le distanze negative il programma inverte i bit invece di cambiare segno, e l'ottagono risulta un'unità più largo da un lato.
- **Il disegno dell'esplosione:** la scala cresce per potenze di due (da 1/32 alla grandezza piena) e la ROM ha quattro versioni della nuvola per riempire i salti. Il remake usa gli stessi due numeri che usava il programma, presi dal contatore dell'esplosione.

**Due test sbagliati, non il codice:** un test si aspettava che due colpi nello stesso punto ne fermassero solo uno. Invece il secondo colpisce uno dei due figli appena nati nello stesso punto, come nel cabinato: è corretto il codice, ed è stato corretto il test. Un altro controllava la distanza massima dal lato "sbagliato" dell'ottagono asimmetrico.

**Verifica:** test di generatore, colpi, ondate, divisione, collisioni, punti e disegno. In Chromium un robot spara ruotando: gli asteroidi si dividono, le nuvole si allargano, il punteggio sale.

## 2026-09-30 · Asteroids, step 5: vite, iperspazio e record

**Richiesta:** vite, esplosione della nave, ricomparsa sicura, iperspazio e fine partita. Luca ha chiesto anche il record salvato, previsto allo step 7: anticipato qui, insieme alla fine partita.

**Decisioni dell'AI:**

- **La vita della nave come tipo con tre casi:** in volo, nascosta, in esplosione. Il 6502 usa un byte di stato e un timer, con valori speciali difficili da leggere; il remake dà un nome a ogni caso, e la nave nascosta ricorda il motivo (attende di ricomparire, salto riuscito, salto fatale). TypeScript obbliga a gestirli tutti.
- **Il rischio dell'iperspazio come nel programma,** non come negli articoli: la nave esplode più spesso quando restano **pochi** asteroidi. Un sito di riferimento dice il contrario, ma le istruzioni a `$6EBF` non lasciano dubbi; un test prova tutti i 65.536 stati del generatore casuale e trova esattamente il 25% con 4 asteroidi e zero con 19.
- **Chi colpisce chi, nell'ordine del programma:** ogni colpo cerca prima la nave e poi gli asteroidi, e alla fine la nave cerca gli asteroidi. Così un colpo che fa il giro dello schermo può distruggere la propria nave, e la nave che si schianta contro un asteroide lo divide e ne guadagna i punti, come sul cabinato.
- **Ricomparsa sicura** con lo stesso controllo "grossolano" del 6502: blocchi di 256 unità attorno al centro, compresi gli asteroidi che stanno esplodendo.
- **Il record cambia solo a fine partita:** sul cabinato il numero al centro è il primo della tabella dei record, che si aggiorna quando la partita finisce. In Breakout il record cresceva durante la partita; qui si segue l'originale.
- **"PLAYER 1" all'inizio, "GAME OVER", "PUSH START":** le scritte del programma, nelle sue posizioni. La direzione della nave non si azzera fra una partita e l'altra, una curiosità dell'originale che il remake conserva.
- **Il pulsante START è Invio (o 1),** non lo Spazio: chi sta ancora sparando quando perde l'ultima nave non riparte per sbaglio.

**Verifica:** test di vite, esplosione (192 passi), iperspazio (margini, rischio, 48 passi), ricomparsa, collisioni con la nave, vita extra (anche al giro del contatore), fine partita e record. In Chromium un robot gioca fino al "GAME OVER": il record viene salvato nel browser e resta dopo "Invio".
