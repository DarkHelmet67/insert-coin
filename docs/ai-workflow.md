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
