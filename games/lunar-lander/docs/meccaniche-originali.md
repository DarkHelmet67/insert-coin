# Le meccaniche dell'originale

Questa guida spiega come funziona _Lunar Lander_ (Atari, 1979) "dentro": lo schermo vettoriale, il terreno e lo zoom, il modulo lunare, la leva della spinta, il carburante, l'atterraggio, il punteggio e i suoni. Per ogni regola indica la fonte e, quando serve, il file che la implementa.

Lunar Lander è il primo gioco vettoriale di Atari, uscito nell'agosto 1979, pochi mesi prima di Asteroids. Usa la **stessa scheda**: un 6502 e il generatore di vettori (DVG). Per questo il remake riusa il pacchetto `@arcade/vector` scritto per Asteroids ([guida 11](../../../docs/11-grafica-vettoriale.md)).

Questa volta però c'è una fonte migliore di un disassemblato: **il codice sorgente originale di Atari**, con i nomi delle variabili e i commenti dei programmatori, pubblicato nel 2021 insieme a quello di altri giochi dell'epoca. Ogni regola qui sotto si legge direttamente nelle righe scritte da Rich Moore nel 1978.

Tutti i valori incerti o da regolare stanno in un solo file, [`tuning.config.ts`](../src/tuning.config.ts), ognuno con la sua marcatura. Ogni valore di questa guida è marcato così:

- **[P]** letto nel programma 6502, con l'etichetta del sorgente originale (per esempio `ACCEL`);
- **[R]** letto nella ROM vettoriale, cioè nei disegni (per esempio `SHIP08`);
- **[H]** ricavato dall'hardware, attraverso l'emulatore MAME;
- **[W]** da una fonte scritta (manuale, articoli);
- **[N]** scelta nostra, dove le fonti non dicono nulla o dove il browser chiede qualcosa di diverso.

Rispetto ad Asteroids le marcature [P] e [R] citano **etichette** invece di indirizzi: avendo il sorgente, il nome che il programmatore ha dato a una routine o a una tabella è il riferimento più chiaro.

## Fonti

- [historicalsource/lunar-lander](https://github.com/historicalsource/lunar-lander): il **sorgente originale**. `A34573.1A` è il programma principale (fisica, rotazione, carburante, atterraggio, punteggio, esplosione); `A34573.1D` l'interruzione da 4 ms (lettura della leva, orologio, cifre, messaggi); `A34599.1C` e `A34598.1B` la ROM vettoriale (moduli, terreno, stelle, scritte); `VECMAC.XX` le macro del generatore di vettori.
- [MAME · driver di Lunar Lander](https://github.com/mamedev/mame/blob/master/src/mame/atari/asteroid.cpp) (lo stesso file di Asteroids: schermo, ingressi, lampade, circuiti del suono) e [il generatore di vettori](https://github.com/mamedev/mame/blob/master/src/devices/video/avgdvg.cpp).
- [Wikipedia · Lunar Lander (1979)](<https://en.wikipedia.org/wiki/Lunar_Lander_(1979_video_game)>) e la [FAQ di vecfever](https://www.vecfever.com/faq/lunar-lander/): storia e comandi visti dal giocatore.
- Le note di ricerca complete, in inglese e con tutte le tabelle, sono nella cartella del progetto (`lunar-lander/note-sorgente-originale.md`).

Il sorgente pubblicato è la revisione 1 del programma (`034573-01`). MAME conosce anche una revisione 2, che aggiunge solo più tagli di carburante per moneta.

## 1. Lo schermo e il tempo

- **Il tempo** [P `FRMECNT`, H]: il circuito interrompe il 6502 ogni 4 ms; un passo del gioco dura 6 interruzioni, cioè **24 ms: 41,67 passi al secondo**. MAME rinfresca lo schermo alla stessa frequenza e la FAQ di vecfever conferma "41 Hz". È molto meno dei 61,5 passi di Asteroids, e il remake lo rispetta [N]: ogni velocità del programma è "per passo", e cambiare frequenza vorrebbe dire ricalcolarle tutte. Il gioco lo sopporta bene: è una simulazione lenta, da giocare con calma.
- **Coordinate** [R]: il DVG ragiona su una griglia di 1024 unità con la y verso l'alto, come in Asteroids. Qui le macro dei disegni (`VCTR dx, dy, luminosità`) usano direttamente le unità dello schermo.
- **Finestra visibile** [H]: MAME mostra 1044 × 800 unità; con la stessa corrispondenza di Asteroids vuol dire **x da -10 a 1034 e y da -6 a 794**. La riga più alta delle scritte sta a y = 748, il terreno può scendere fino a y = 24. Tutto ciò che esce da 0-1023 il DVG non lo disegna [H].
- **Un secondo** [P `SECCNT`] vale 250 interruzioni: l'orologio della missione avanza solo durante il gioco.

## 2. Il terreno e lo zoom

Lunar Lander è stato il primo videogioco con **più punti di vista**: da lontano si vede tutta la superficie, vicino al suolo l'inquadratura si stringe.

- **Il terreno** [R `SECT01`–`SECT16`, `SEG001`–`SEG025`]: una sola linea spezzata larga **4096 unità**, divisa in 16 sezioni da 256. Ogni sezione è una lista di "segmenti", piccoli pezzi di montagna riusati più volte (il segmento 2 compare in quattro sezioni). La linea parte da (0, 896) e finisce a (4096, 896): **il mondo si richiude su se stesso**, chi esce a destra rientra a sinistra.
- **Vista lontana** (_major_) [P `TRANS`]: all'accensione il programma costruisce una seconda copia del terreno con ogni vettore diviso per 4, scrivendola nella RAM del DVG. Tutto il mondo (4096 / 4 = 1024) entra nello schermo, e il modulo usa i disegni piccoli.
- **Vista vicina** (_minor_): zoom 4×, con i disegni grandi del modulo.
- **Il passaggio** [P `SCAPMJR`, `YMJMIN`]: quando nella vista lontana il modulo scende sotto **96 unità di altitudine** (384 a zoom pieno), il programma passa alla vista vicina e ricentra il modulo in (512, 632). Torna alla vista lontana [P `SCRLUP`, `YMISCR`] quando il modulo sale oltre y = 660 con più di 520 unità di altitudine.
- **Lo scorrimento** [P `SCAPCHG`, `XMIN`, `XMAX`]: in tutte e due le viste il modulo si muove liberamente tra x = 128 e x = 896; oltre, è il paesaggio a scorrere sotto di lui. In verticale la vista vicina scorre quando il modulo scende sotto y = 256 o sale sopra y = 660.
- **Il cielo** [P `SCAPMJR`]: nella vista lontana, salendo sopra y = 660, il cielo scorre verso l'alto e compare un secondo campo di stelle. Dopo 512 unità di salita la missione è persa: **il modulo è uscito nello spazio**, ricomincia da capo e paga una penale di carburante (sezione 5).
- **Le stelle** [R `STAR0A`–`STAR3B`, `STRM0`–`STRM15`]: due campi di stelle disegnati a mano, uno per vista, che scorrono con il terreno.

Nel remake il terreno è una funzione "altezza in x" ricavata dai vettori della ROM, e la posizione del modulo è nelle coordinate del mondo; la telecamera applica le stesse regole del programma. Codice: [`surface.ts`](../src/surface.ts), [`surface-data.ts`](../src/surface-data.ts), [`camera.ts`](../src/camera.ts).

## 3. Il modulo lunare

- **32 orientamenti** [P `SHIP`]: un passo vale 11,25 gradi. 8 è il modulo dritto, 0 e 16 sdraiato su un fianco (spinta verso destra o verso sinistra), 24 capovolto. Il tasto destro toglie 1, il sinistro aggiunge 1; premuti insieme si annullano [P `ROTCHK`].
- **Nove disegni** [R `SHIP00`–`SHIP08`, `MOD00`–`MOD08`; P `MODULE`]: la ROM disegna solo un quarto di giro, gli altri orientamenti si ottengono rovesciando i segni delle coordinate, come in Asteroids. Il modulo grande è una cabina ottagonale (`OCT00`–`OCT07`, ruotata a parte) con corpo, gambe e ugello, luminosità 12. Dritto misura circa 28 × 26 unità: la cabina va da -7 a 8, i piedi poggiano a y = -18.
- **Rotazione** [P `ROT.NI`]: con il tasto premuto un contatore avanza di 1 a ogni passo e l'orientamento ne è un quarto: **uno scatto ogni 4 passi** (96 ms), un giro intero in poco più di 3 secondi. Ogni passo con il tasto premuto consuma **0,06 unità di carburante** [P `ROT.GAS`], cioè 2,5 unità al secondo di rotazione. Un dettaglio: girando a destra il primo scatto arriva subito, a sinistra dopo 4 passi, perché il contatore parte da un multiplo di 4.
- **La spinta** [P `THRLVL`, `TRSTAB`]: la leva del cabinato è un potenziometro letto 250 volte al secondo [P `NMI`]. Il programma ne calcola da solo il minimo e il massimo, poi divide la corsa in 16 livelli: sotto un quarto della corsa la spinta è 0, nell'ultimo ottavo è 15, in mezzo è proporzionale. Una tabella trasforma il livello in accelerazione: 0, 2, 5, 8, 11, 13, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28.
- **La direzione** [P `FRCMLT`, `SINES`]: l'accelerazione si divide tra x e y con una tabella di 9 valori per un quarto di giro. Curiosità: **non sono seni veri**. Il secondo valore è 0,1961 (sin 11,25° = 0,195), il quarto è 0,6 (sin 33,75° = 0,556). Il remake usa la tabella così com'è.
- **La gravità** [P `ACCEL`, `GRAVT`]: 17 unità di velocità tolte alla velocità verticale a ogni passo, il doppio nella missione PRIME. La spinta massima (28) vince la gravità di poco: il modulo è pesante.
- **Unità** [P `ACCEL`, `ROTATE`]: la velocità è un numero a 16 bit; il modulo si sposta di velocità / 4096 unità del mondo a ogni passo, in entrambe le viste. Sullo schermo la velocità compare divisa per 64 [P `DISPLY`], con una freccia per il verso.
- **Partenza** [P `PLYINIT`]: ogni missione comincia in alto a sinistra (64, 682 nella vista lontana), già lanciata verso destra (velocità orizzontale **200**) e con il modulo sdraiato: tirando la leva si frena.
- **La fiamma** [P `FLAME`]: un triangolo sotto l'ugello, lungo in proporzione alla spinta, che si allunga di un'unità a passi alterni: per questo tremola. È più luminosa con più spinta.

Codice: [`lander.ts`](../src/lander.ts), [`thrust.ts`](../src/thrust.ts), [`rotation.ts`](../src/rotation.ts); i disegni in [`module-shapes.ts`](../src/module-shapes.ts).

## 4. Le quattro missioni

Il cabinato ha quattro pulsanti illuminati per scegliere la missione; il pulsante SELECT li fa girare in qualunque momento, anche durante il volo [P `TYPE`; H, lampade di MAME].

| Missione | Gravità | Spinta | Consumo | Rotazione                  | Attrito |
| -------- | ------- | ------ | ------- | -------------------------- | ------- |
| TRAINING | 17      | × 1    | normale | solo metà inferiore (0-16) | sì      |
| CADET    | 17      | × 1    | normale | libera                     | no      |
| PRIME    | 34      | × 1,5  | ridotto | libera                     | no      |
| COMMAND  | 17      | × 1    | normale | **con inerzia**            | no      |

- **TRAINING** [P `FRICTN`, `ROT.NI`]: ogni 16 passi la velocità perde 1/32 su entrambi gli assi, come se la Luna avesse un po' d'aria; il modulo non si può capovolgere.
- **PRIME** [P `ACCEL`, `BURN`]: gravità doppia, spinta × 1,5, consumo per unità di spinta ridotto da 218 a 144.
- **COMMAND** [P `ROTSHP`]: la rotazione ha **inerzia**. I tasti non girano il modulo, accelerano la rotazione, e il modulo continua a girare finché non si dà un colpo dall'altra parte. Un tocco breve avvia comunque una rotazione minima; quando la rotazione è quasi ferma e nessun tasto è premuto, il programma la ferma del tutto. Ogni passo con il tasto premuto costa 0,06 unità di carburante.

Codice: [`missions.ts`](../src/missions.ts).

## 5. Il carburante

Il carburante **è il credito**: non ci sono vite, la partita dura finché c'è carburante.

- **Moneta** [P `CRDTBL`, H]: ogni moneta dà 450, 600, 750 o 900 unità a scelta del gestore (MAME parte da 750, che il remake usa [N]). Si possono aggiungere monete in qualunque momento, anche in volo. Il massimo è 9999.
- **Consumo** [P `BURN`, `FUELFAC`]: a ogni passo la spinta consuma livello × 218 / 256 centesimi di unità: alla massima spinta circa **9,6 unità al secondo**.
- **Poco carburante** [P `STATUS`]: sotto le 100 unità lampeggia LOW ON FUEL con un fischio a 3 kHz.
- **Senza carburante** [P `GAS`, `PLYCHK`]: OUT OF FUEL, la leva e la rotazione non rispondono più. Dopo 5 secondi la partita finisce, a meno che il modulo tocchi il suolo prima.
- **Il consumo minimo** [P `DEDUCT`, `FLFACT`]: il programma calcola quanto carburante "avrebbe dovuto" usare una missione, 8 unità per ogni secondo di volo. Se il modulo si schianta (o esce nello spazio) dopo averne usato meno, **la differenza viene tolta**: AUXILIARY FUEL TANKS DESTROYED, nnn FUEL UNITS LOST. È la regola che impedisce di farsi cadere giù a spinta zero per risparmiare.
- **Premio** [P `BNFUEL`]: un atterraggio perfetto regala **50 unità**.

Codice: [`fuel.ts`](../src/fuel.ts).

## 6. L'atterraggio

- **Punti di contatto** [P `DECODE`, `SHPUPL`, `SHPLWL`, `SHPLWR`, `SHPUPR`]: per ognuno dei 32 orientamenti del modulo grande una tabella dà quattro punti: i due "piedi" e i due punti più esterni. Il programma misura la distanza dal terreno sotto i piedi (è l'**altitudine** mostrata) e la distanza orizzontale dei punti esterni dalle pareti; se uno dei punti finisce dentro il terreno, il modulo si è schiantato. Nella vista lontana basta il punto centrale del modulo piccolo [P `CNVRT`].
- **Toccare terra** [P `SCAPLND`]: solo nella vista vicina, quando entrambi i piedi sono a meno di 2 unità dal suolo. Allora:
  - il modulo deve essere dritto o quasi (orientamento 7, 8 o 9) e la velocità orizzontale sotto **16**, altrimenti è uno schianto;
  - velocità verticale sotto **16**: atterraggio **perfetto**;
  - da 16 a 31: atterraggio **duro**, il modulo rimbalza una volta [P `M.HRDY`, `M.HRDG`];
  - 32 o più: **schianto**.
- **Dopo** [P `MOTCHK`]: messaggio, punti e, per lo schianto, l'esplosione; la sequenza dura circa 6 secondi, poi parte la missione successiva con il carburante rimasto.
- **L'esplosione** [P `BOOM`, R `PIECE1`–`PIEC12`]: sei pezzi di rottami e la cabina che vola via girando su se stessa, ognuno in una direzione presa da quattro schemi diversi, scelti a caso.

Codice: [`landing.ts`](../src/landing.ts), [`collision.ts`](../src/collision.ts), [`explosion.ts`](../src/explosion.ts).

## 7. Le piazzole e il punteggio

- **15 piazzole** [R `TBMNA`; P `TBSTFT`, `TSTLNG`]: tratti piani del terreno lunghi 256, 128, 64 o 32 unità. Più la piazzola è corta, più vale: il moltiplicatore va da 2 a 5.
- **Ogni missione ne sceglie 4** [P `PLYINIT`]: due vicine tra le prime quattro (sempre × 2) e due tra le altre undici. Lampeggiano ogni 16 passi con il loro moltiplicatore scritto sotto, per esempio "4X" [P `SITES`].
- **Punti** [P `POINTS`, `LNDADR`]: atterraggio perfetto **50**, duro **15**, schianto **5**, moltiplicati per il valore della piazzola quando il centro del modulo è sopra una delle quattro. Lo schianto su una piazzola vale quindi più di zero. Il punteggio ha 4 cifre.

## 8. ABORT

Il pulsante rosso del cabinato salva il modulo all'ultimo momento [P `ABORT`, `ABTCNT`]: il programma raddrizza il modulo di uno scatto ogni due passi, frena la corsa orizzontale e accende il motore **al massimo assoluto** (un livello 16 che la leva non raggiunge) per circa 100 passi, smettendo prima se la salita è già abbastanza veloce. Costa caro: circa 90 unità di carburante al secondo. Durante l'ABORT il modulo non ruota.

## 9. Schermate e scritte

- **Il cruscotto** [R `MESSVG`, `DATAVG`]: a sinistra SCORE, TIME e FUEL, a destra ALTITUDE, HORIZONTAL SPEED e VERTICAL SPEED, con due frecce per il verso delle velocità.
- **I messaggi** [P `DSPMOT`, `E.MOFF`]: dopo un atterraggio perfetto CONGRATULATIONS e una frase a caso tra THAT WAS A GREAT LANDING, THE EAGLE HAS LANDED, THE COLUMBIA HAS LANDED e YOU HAVE LANDED; dopo uno duro YOU LANDED HARD e LIFE SUPPORT IS GONE, YOUR TRIP IS ONE WAY, YOU ARE HOPELESSLY MAROONED o COMMUNICATION SYSTEM DESTROYED; dopo uno schianto DESTROYED, YOU CREATED A TWO MILE CRATER, YOU JUST DESTROYED A 100 MEGABUCK LANDER o THERE WERE NO SURVIVORS. Accanto al codice c'è anche un commento dei programmatori: "MEG-A-WHO???".
- **Il carattere** [R `VECAN`]: è lo stesso alfabeto vettoriale di Asteroids, disegnato da Ed Logg, qui a luminosità 12.
- **L'attesa** [P `ATRINIT`]: un modulo dritto cade da (64, 682) con una velocità orizzontale a caso e ricomincia appena tocca il suolo; lampeggia INSERT COINS, sotto "750 FUEL UNITS PER COIN".
- **Dopo la moneta** [P `DSPRTP`]: schermo nero con SELECT OPTION, PUSH START e il carburante caricato.
- **Il record** [N]: il cabinato non ha una classifica. Il remake salva comunque il punteggio migliore nel browser, come gli altri giochi, e lo mostra fuori dallo schermo vettoriale, sul pannello del cabinato.

## 10. I suoni

Come in Asteroids non c'è un chip sonoro: sono circuiti analogici accesi e spenti dal programma [P `S.SND`; H].

- **Il motore** [P, H]: rumore bianco filtrato fino a diventare un **brontolio profondo** (filtri a 71, 90 e 560 Hz). Il volume è metà della spinta più uno: durante il gioco **si sente sempre**, anche a leva abbassata.
- **L'esplosione** [P `BOOM`, H]: lo stesso rumore meno filtrato, che si spegne in circa 3 secondi.
- **Allarme carburante** [P `STATUS`, H]: un fischio a 3 kHz che lampeggia con la scritta LOW ON FUEL.
- Nient'altro: vecfever lo riassume in "solo rumore, un'esplosione e un bip quando il carburante è basso" [W].

## 11. Curiosità

- Il genere nasce nel 1969 con _Lunar_ di Jim Storer, un gioco a solo testo in FOCAL; Atari ne fece un coin-op con grafica vettoriale, uscito proprio nel decennale dello sbarco di Apollo 11 [W].
- Ne furono venduti 4.830; Asteroids, uscito tre mesi dopo sulla stessa scheda, lo oscurò subito [W].
- I nomi "Eagle" e "Columbia" sono il modulo lunare e il modulo di comando di Apollo 11.
