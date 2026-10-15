# Le meccaniche dell'originale

Questa guida spiega come funziona _Galaga_ (Namco, 1981) "dentro": lo schermo verticale, il caccia e i suoi missili, la formazione dei 40 alieni, le traiettorie di ingresso e di attacco, le bombe, il raggio traente, il caccia doppio, i punteggi, gli stage, i suoni e il campo di stelle. Per ogni regola indica la fonte e, quando serve, il file che la implementa.

_Galaga_ è il seguito di _Galaxian_ (1979). Dentro il cabinato lavorano **tre processori Z80** che condividono la stessa RAM: il primo (_main_) dirige la partita, il secondo (_sub_) muove gli alieni e controlla le collisioni, il terzo (_sub2_) suona. Accanto a loro ci sono alcuni chip custom Namco: il generatore di stelle, il chip delle esplosioni e la scheda del suono a forme d'onda (WSG).

Come per Lunar Lander, abbiamo una fonte migliore di un disassemblato qualsiasi: **il sorgente Z80 commentato e ricompilabile** pubblicato da Glenn A. Neidermeier, che ricostruisce le tre ROM byte per byte e dà un nome a quasi ogni routine e tabella. Le traiettorie degli alieni, le ondate, i parametri di difficoltà, i punteggi e le melodie del remake sono **le tabelle di quelle ROM**, copiate valore per valore.

Tutti i valori incerti o da regolare stanno in un solo file, [`tuning.config.ts`](../src/tuning.config.ts), ognuno con la sua marcatura. Ogni valore di questa guida è marcato così:

- **[P]** letto nel programma del processore _main_ o _sub_, con l'etichetta del sorgente commentato (per esempio `f_08D3`, la routine che muove gli alieni);
- **[S]** letto nel programma del processore del suono (_sub2_);
- **[R]** letto nelle ROM grafiche o nelle PROM dei colori e delle forme d'onda;
- **[H]** ricavato dall'hardware, attraverso l'emulatore MAME;
- **[W]** da una fonte scritta (manuale, guide, articoli);
- **[N]** scelta nostra, dove le fonti non dicono nulla o dove il browser chiede qualcosa di diverso.

## Fonti

- [neiderm/arcade · Gyaraga](https://github.com/neiderm/arcade): il **sorgente Z80 commentato** delle tre CPU (Glenn A. Neidermeier, 2012). I file citati più spesso: `gg1-5.s` (CPU _sub_: traiettorie, collisioni, missili, bombe), `gg1-3.s` (formazione, ondate, raggio traente), `gg1-2_fx.s` (caccia, picchiate, bombe, respiro della formazione), `new_stage.s` (difficoltà), `game_ctrl.s` (stage e punteggio), `gg1-7.s` (suono).
- [Computer Archeology · Galaga](https://computerarcheology.com/Arcade/Galaga/): il disassemblato delle tre CPU, la decodifica delle **ROM grafiche** (caratteri e sprite) e delle **PROM dei colori**, con le immagini delle ROM.
- [MAME · driver di Galaga](https://github.com/mamedev/mame/blob/master/src/mame/namco/galaga.cpp), il [video](https://github.com/mamedev/mame/blob/master/src/mame/namco/galaga_v.cpp), il [suono Namco WSG](https://github.com/mamedev/mame/blob/master/src/devices/sound/namco.cpp) e il [generatore di stelle 05xx](https://github.com/mamedev/mame/blob/master/src/mame/namco/starfield_05xx.cpp). La copia del vecchio driver MAME inclusa nel progetto di Neidermeier mostra in modo diretto come lo schermo usa le coordinate degli sprite.
- [StrategyWiki · Galaga](https://strategywiki.org/wiki/Galaga/Gameplay) e il manuale Midway: regole viste dal giocatore, punteggi, stemmi degli stage.

## 1. Lo schermo e il tempo

- **Il tempo** [H]: lo schermo si rinfresca a **60,6 Hz** e i processori _main_ e _sub_ lavorano una volta per fotogramma. Il remake gira a 60 passi al secondo [N]: la differenza dell'1% non si sente e ogni velocità resta "per fotogramma", come nell'originale.
- **Lo schermo** [H]: un monitor girato in verticale, **224 × 288 pixel**, cioè 28 × 36 caratteri da 8 pixel. Le due righe in alto ospitano i punteggi, le due in basso le vite e gli stemmi dello stage.
- **Gli sprite** [H, R]: 64 sprite da 16 × 16 pixel con 4 colori, scelti tra 16 tavolozze. L'hardware può raddoppiarli in larghezza e altezza (lo fa per l'esplosione del caccia).
- **Coordinate** [H]: lo sprite con posizione (x, y) compare con l'angolo in alto a sinistra in (x − 16, y − 40). Il programma che muove gli alieni [P `f_08D3`] usa invece un suo sistema, con la **y verso l'alto** e numeri a virgola fissa (9 bit interi, 7 di frazione): uno sprite in quel sistema sta in y_sprite = 353 − y. Il remake tiene le stesse due coordinate.

Codice: [`playfield.ts`](../src/playfield.ts).

## 2. Il caccia

- **Partenza** [P `c_player_respawn`]: x = 122, y = 297 in coordinate sprite, cioè il centro dello schermo in basso.
- **Movimento** [P `c_1F92`]: al primo fotogramma di una nuova direzione il caccia si sposta di 1 pixel, poi alterna 2 e 1: in media **1,5 pixel per fotogramma** (90 al secondo). Si ferma a x = 18 a sinistra e a x = 225 a destra; con il caccia doppio, a 209.
- **I missili** [P `c_1F0F`, `rckt_man`]: al massimo **due in volo**. Salgono di **6 pixel per fotogramma** e spariscono in cima allo schermo. Con il caccia doppio ogni missile è uno sprite largo il doppio: due proiettili affiancati, quattro in tutto.
- **Il colpo** [P `hitd_det_rckt`]: un missile colpisce un alieno se le posizioni distano al massimo 5 pixel in orizzontale e 6 in verticale. Gli alieni già in esplosione non contano.
- **Lo scontro** [P `hitd_det_fghtr`]: il caccia è distrutto da un alieno o da una bomba entro 6 pixel in orizzontale e 6 in verticale. Una curiosità del programma: **mentre le ondate entrano in scena, solo le bombe e i "transitori" (sezione 9) possono colpire il caccia**; gli alieni che volano verso la formazione lo attraversano.

Codice: [`fighter.ts`](../src/fighter.ts), [`rockets.ts`](../src/rockets.ts), [`hits.ts`](../src/hits.ts) (i controlli dei colpi e il loro smistamento, `hitd_dspchr`).

## 3. La formazione

- **40 alieni** [P `c_2896`, `sprt_fmtn_hpos`]: 4 **Boss Galaga** (verdi, due colpi), 16 **Goei** (le farfalle rosse) e 20 **Zako** (le api gialle). Ogni alieno ha un numero di oggetto (da $08 a $5E) e un posto fisso nella griglia: i Boss nella riga in alto, colonne 3-6; le farfalle in due righe da 8; le api in due righe da 10. Sopra ogni Boss c'è un posto vuoto: è quello del caccia catturato.
- **La griglia** [P `db_fmtn_hpos_orig`]: dieci colonne a 16 pixel l'una dall'altra (x = 49, 65 … 193) e righe a y = 60 (caccia catturati), 76 (Boss), 92, 104 (farfalle), 116, 128 (api).
- **Il dondolio** [P `f_2A90`]: mentre le ondate entrano, la griglia scivola a destra e a sinistra di 1 pixel ogni 4 fotogrammi, fino a 32 pixel dal centro. Quando l'ultimo alieno ha preso posto, la griglia torna al centro e si ferma.
- **Il respiro** [P `f_1DE6`, `d_1E64_bitmap_tables`]: poi la formazione comincia a pulsare, allargandosi e stringendosi. Ogni 4 fotogrammi il contatore avanza di 1, da 0 a 31 e ritorno; una tabella di bit decide quali colonne e righe si spostano di un pixel a quel passo, così le colonne esterne e le righe basse si muovono di più. Il suono "pulsante" della formazione segue lo stesso ritmo [S].
- **Il battito d'ali** [P `f_1DE6`]: gli alieni fermi alternano due disegni (ali aperte e chiuse) con lo stesso ritmo del respiro.

Codice: [`formation.ts`](../src/formation.ts), [`object-states.ts`](../src/object-states.ts) (il gestore degli oggetti `f_23DD`, che ogni 4 fotogrammi mette gli alieni fermi al loro posto, li fa girare dritti quando arrivano e manda avanti le esplosioni).

## 4. Il volo: un piccolo linguaggio di traiettorie

Il cuore di _Galaga_ è la routine che fa volare gli alieni [P `f_08D3`]. Non contiene traiettorie scritte come curve: legge da tabelle di byte un **piccolo programma** per ogni alieno, e lo esegue un fotogramma alla volta. Fino a 12 alieni volano insieme, ognuno con il suo "segnalibro" nel programma [P `ds_bug_motion_que`].

- **La direzione** [P `l_0C46`]: un angolo da 10 bit (1024 passi per giro; 0 è verso destra, 256 verso l'alto).
- **L'istruzione di volo** [P `l_0BDC_flite_pth_load`]: tre byte. Il primo contiene due velocità (i due nibble, usati a fotogrammi alterni), il secondo di quanto ruota l'angolo a ogni fotogramma (con segno), il terzo per quanti fotogrammi vale l'istruzione. Per esempio `23 06 16` vuol dire "velocità 3 e 2 pixel alterni, gira di 6 a ogni fotogramma, per 22 fotogrammi": un arco.
- **Il passo** [P `l_0C46`–`l_0D03`]: a ogni fotogramma l'angolo ruota, poi l'alieno avanza della velocità lungo l'asse più vicino alla direzione e di una frazione proporzionale lungo l'altro. È un'approssimazione **ottagonale** del seno e del coseno, senza tabelle trigonometriche: una moltiplicazione 8 × 8 bit è tutto quello che serve.
- **Il disegno** [P `l_0C6D`]: l'angolo sceglie anche lo sprite, tra **6 disegni ruotati di 15 gradi** per un quarto di giro più quello verticale; gli altri tre quarti si ottengono rovesciando lo sprite in orizzontale e in verticale.
- **I comandi** [P `d_0920_jp_tbl`]: i byte da $EF a $FF sono istruzioni speciali: salta a un'altra tabella, vai verso il tuo posto nella formazione, mira al caccia, comincia la picchiata, sparisci, dividiti in tre (sezione 9), cattura il caccia (sezione 7). Uno di questi (`case_0A01`) sceglie la curva in base alla distanza dal caccia: è per questo che le farfalle sembrano inseguirti.
- **Le traiettorie** [P `db_flv_001d` … `db_flv_0ff0`, `db_flv_atk_yllw`, `db_flv_atk_red`, `db_flv_0411`, `db_0454`]: 24 programmi di ingresso (16 per gli stage normali, 8 per gli stage bonus) e quelli di attacco di api, farfalle, Boss e Boss che catturano.
- **Simmetria** [P `l_0BF7`]: ogni programma vale per il lato sinistro; per il lato destro basta cambiare segno alla rotazione.
- **Il ritorno a casa** [P `case_0AA0`, `l_0C05_flite_pth_cont`]: quando l'alieno deve tornare in formazione, il programma calcola l'angolo verso il posto di destinazione (con una divisione e un arcotangente a 8 bit, `c_0E5B`) e corregge la rotta finché non arriva entro un pixel. Il posto si muove con il dondolio e il respiro: l'alieno lo insegue.

Il remake **esegue gli stessi byte** con un interprete che ricalca la routine originale. Codice: [`flight.ts`](../src/flight.ts), [`flight-commands.ts`](../src/flight-commands.ts), [`flight-bombs.ts`](../src/flight-bombs.ts), [`flight-world.ts`](../src/flight-world.ts), [`flight-slot.ts`](../src/flight-slot.ts), [`flight-memory.ts`](../src/flight-memory.ts), [`z80-math.ts`](../src/z80-math.ts), [`rom/flight-rom.ts`](../src/rom/flight-rom.ts).

## 5. Le ondate di ingresso

- **Cinque ondate da otto** [P `c_25A2`, `db_attk_wav_IDs`]: ogni stage comincia vuoto; gli alieni arrivano in cinque gruppi da otto, in quest'ordine: farfalle e api dall'alto, Boss e farfalle da sinistra, farfalle da destra, api da destra, api da sinistra.
- **Coppie e file** [P `f_2916`]: ogni ondata è fatta di coppie (un alieno per lato, o due della stessa fila). Un alieno parte ogni 8 fotogrammi, salvo quelli segnati per partire insieme al compagno.
- **La partenza** [P `db_2A6C`]: dall'alto, poco fuori dallo schermo, puntando in basso; o dai lati in basso, puntando verso destra o sinistra.
- **Le tabelle per stage** [P `d_combat_stg_dat`, `d_combat_stg_dat_idx`]: 13 configurazioni per gli stage normali, scelte secondo lo stage e la difficoltà. Dopo il 23° stage il programma ripete in ciclo gli ultimi quattro.
- **Le prossime ondate aspettano** [P `f_2916`]: negli stage normali un'ondata parte appena la precedente è tutta al suo posto; negli stage bonus c'è in più una pausa di 2 "tic" dei timer di gioco (un tic ogni 32 fotogrammi, [P `f_1DD2`]).
- **Gli alieni di passaggio** [P `l_2612`, `l_29B3`]: dal quarto stage alcune ondate portano 2 o 4 alieni in più, inseriti in posizioni casuali: entrano con gli altri ed escono dallo schermo senza prendere posto. Il programma originale ricava il caso dal registro di refresh dello Z80, che nessuna emulazione della sola logica può riprodurre: il remake usa un generatore di byte casuali [N].
- **La sequenza dello stage** [P `stg_init_splash`, `c_new_level_tokens`, `c_player_respawn`]: "PLAYER 1" con la musica di inizio, poi "STAGE 1" e le bandierine dello stage in basso a destra, una ogni 8 fotogrammi con il suo "clic"; poi compare il caccia, le stelle partono e accelerano fino alla velocità dello stage [P `f_1D76`].

Codice: [`attack-waves.ts`](../src/attack-waves.ts), [`wave-launcher.ts`](../src/wave-launcher.ts), [`stage-setup.ts`](../src/stage-setup.ts), [`program.ts`](../src/program.ts), [`rom/main-rom.ts`](../src/rom/main-rom.ts) (tabelle copiate dalla ROM dallo script `scripts/galaga/extract-rom-tables.js`).

## 6. Le picchiate e le bombe

- **Tre timer** [P `f_1B65`, `f_0857`]: ogni 16 fotogrammi il programma fa scendere di 1 tre contatori, uno per le api, uno per le farfalle e uno per i Boss. Quando uno arriva a 0, un alieno di quel tipo lascia la formazione, se non ce ne sono già troppi in volo. I valori di partenza vengono da tabelle che li accorciano con il passare del tempo e con il calare degli alieni rimasti [P `d_08CD`, `d_08EB`, `d_0909`].
- **La difficoltà** [P `bmbr_stg_cfg_dat`]: 5 byte per stage (10 parametri da 4 bit) per ognuno dei quattro livelli di difficoltà del cabinato: quali alieni sganciano bombe, i tre timer, quanti alieni possono picchiare insieme (e quanti dopo 30 secondi), la velocità del raggio traente, sotto quanti alieni rimasti scatta l'**attacco continuo**. Il remake usa il livello **A**, quello di fabbrica [W].
- **I Boss con la scorta** [P `case_bmbr_boss`, `c_1D03`]: un Boss parte da solo, oppure con una o due farfalle della riga sotto. Uno ogni due (se nessuno sta già catturando) scende invece per **catturare il caccia** (sezione 7).
- **Le bombe** [P `l_0D8D_got_a_bullet`, `f_1EA4`]: al massimo **8** in volo. Scendono di 2 e 3 pixel a fotogrammi alterni (2,5 in media) e puntano dove si trova il caccia al momento dello sgancio, con uno spostamento orizzontale massimo di 1,5 pixel per fotogramma. Un alieno può sganciare solo nella metà alta dello schermo, quando il suo timer scade e i bit di permesso lo consentono [P `0x0E(ix)`, `0x0F(ix)`].

Codice: [`attacks.ts`](../src/attacks.ts), [`bomber-timers.ts`](../src/bomber-timers.ts), [`bombs.ts`](../src/bombs.ts), [`combat.ts`](../src/combat.ts) (che li collega al resto del fotogramma).

## 7. Il raggio traente e il caccia doppio

- **La discesa** [P `case_0A53`, `f_21CB`]: il Boss scelto punta verso il caccia (allineandosi a un multiplo di 8 pixel), scende e si ferma a metà schermo.
- **Il raggio** [P `f_2222`, `d_23A1`]: il raggio è fatto di **caratteri**, non di sprite: 10 righe di 6 caratteri che si aprono dall'alto verso il basso, una riga ogni 12 fotogrammi nel primo stage. Resta aperto per 64 fotogrammi, poi si richiude. I colori ruotano ogni 4 fotogrammi.
- **La cattura** [P `l_233D`, `f_20F2`, `f_19B2`]: se in quei 64 fotogrammi il caccia si trova a meno di 27 pixel dal centro del raggio, viene preso: diventa rosso, gira su se stesso e sale fino al Boss, che torna in formazione portandolo sopra di sé. Per il giocatore è una vita persa.
- **Colpire il Boss** [P `l_0849`, `f_2000`]: se il Boss con il caccia catturato viene abbattuto **mentre picchia**, il caccia si libera, scende girando e si aggancia a quello del giocatore: è il **caccia doppio**, che spara il doppio dei missili ma offre un bersaglio largo il doppio. Se invece il Boss viene colpito in formazione, il caccia catturato diventa nemico e prende il volo [P `db_fltv_rogefgter`].
- **Colpire il caccia catturato** costa caro: vale 500 punti in formazione e 1000 in volo, ma il caccia è perso per sempre.

Codice: [`capture-state.ts`](../src/capture-state.ts) (i byte di stato condivisi dai cinque task della cattura), [`tractor-beam.ts`](../src/tractor-beam.ts), [`capture-fighter.ts`](../src/capture-fighter.ts) (anche la rotazione del caccia, `c_2188`), [`rescue.ts`](../src/rescue.ts), [`draw-beam.ts`](../src/draw-beam.ts). La scelta del Boss che cattura (uno ogni due lanci di Boss, se nessuna cattura è in corso e nessun caccia è prigioniero) è in [`attacks.ts`](../src/attacks.ts).

## 8. I punteggi

- **La tabella** [P `d_scoreman_inc_lut`, `hitd_dspchr`]: il programma conta i colpi per colore e moltiplica alla fine. Un'ape vale **50** in formazione e il doppio, **100**, in volo; una farfalla **80** e **160**; un Boss **150** in formazione.
- **Il Boss in picchiata** [P `d_1CFD`]: **400** da solo, **800** con una scorta, **1600** con due. Il punteggio compare sullo schermo dove è stato colpito, sempre dritto: alla fine dell'esplosione il programma riscrive il registro di controllo dello sprite senza i bit di specchiatura [P `l_24DA`, `l_2529`].
- **Il caccia catturato** colpito in volo vale **1000** [P `l_0849`].
- **Vite extra** [P `gctl_supv_score`, W, H]: a **20 000** e **70 000** punti, poi ogni 70 000, con 3 vite di partenza: la configurazione di fabbrica. Il programma confronta le due cifre più alte del punteggio con la soglia successiva ogni volta che il punteggio cambia.
- **Statistiche** [P `gctl_plyr_terminate`, `c_0A72_puts_hitmiss_ratio`]: a fine partita, dopo "GAME OVER", lo schermo si svuota e compaiono i colpi sparati, quelli andati a segno e la percentuale con un decimale, arrotondata; restano per circa 7 secondi.

Codice: [`score.ts`](../src/score.ts), [`hits.ts`](../src/hits.ts), [`extra-lives.ts`](../src/extra-lives.ts), [`endings.ts`](../src/endings.ts).

## 9. Gli stage

- **Stemmi** [P `gctl_stg_tokens`]: in basso a destra lo stage si conta con stemmi da 1, 5, 10, 20, 30 e 50 [W]. Prima di ogni stage compare la scritta "STAGE n".
- **Challenging Stage** [P `c_25A2`, `d_challg_stg_dat`]: il terzo stage e poi uno ogni quattro (7, 11, 15…) è uno stage bonus: 40 alieni sfilano su traiettorie acrobatiche senza sparare e senza fermarsi. Gli alieni hanno forme diverse secondo lo stage (api, farfalle, libellule, astronavi…) [P `d_290E`, R]. Abbatterne un'intera fila da otto vale un bonus di 1000, 1500, 2000 o 3000 punti secondo lo stage [P `d_stage_chllg_rnd_attrib`]; alla fine ogni alieno colpito vale 100 punti e colpirli tutti e 40 dà **10 000** punti ("PERFECT!").
- **I transitori** [P `l_29B3_setup_transients`, `f_1A80`]: dal quarto stage alcune ondate portano alieni in più che non entrano in formazione, e quando restano meno di 10 alieni un'ape (l'"ape bonus") lampeggia per 64 fotogrammi, poi picchia e si divide in **tre** nemici speciali (scorpioni, astronavi di Bosconian, ammiraglie di Galaxian). Abbatterli tutti e tre dà 1000, 2000 o 3000 punti.
- **Fine stage** [P `gctl_supv_stage`]: lo stage finisce quando non resta nessun alieno; se il caccia viene distrutto, gli alieni in volo tornano in formazione prima che compaia il caccia successivo.

Codice: [`stage-setup.ts`](../src/stage-setup.ts), [`attack-waves.ts`](../src/attack-waves.ts), [`badges.ts`](../src/badges.ts), [`clone-attack.ts`](../src/clone-attack.ts), [`endings.ts`](../src/endings.ts) (i risultati dello stage bonus: `gctl_chllng_stg_end`), [`program.ts`](../src/program.ts).

## 10. I colori e i disegni

- **Gli sprite** [R `2800l`, `2700k`, nel set MAME `galagamw`]: 128 sprite da 16 × 16 pixel, con 4 valori per pixel. Ogni alieno ne usa 8: sei orientamenti, il disegno verticale e quello con le ali chiuse; gli altri due quadranti si ottengono specchiando. Le esplosioni grandi sono sprite "doppi" di 2 × 2 tessere.
- **I caratteri** [R `2600j`]: 128 caratteri da 8 × 8, per le scritte (cifre da 0, lettere da 0x0A: il programma scrive in ASCII e sottrae 0x30 o 0x37), gli stemmi degli stage e il raggio traente.
- **I colori** [R `prom-5.5n`, `prom-3.1c`, `prom-4.2n`]: una tavolozza di 32 colori (tre bit di rosso e di verde, due di blu, pesati dalle resistenze del circuito) e due tabelle che ne scelgono quattro per ogni tavolozza di sprite o di caratteri. Il colore 15, nero, è "trasparente": i pixel che ci finiscono sopra non si disegnano.
- **Le stelle** [H `starfield_05xx`]: un chip fa girare un registro a scorrimento di 16 bit, un passo per pixel, e accende una stella quando 8 dei suoi bit hanno un valore fisso: 256 stelle possibili, in 4 gruppi da 64. Il registro si ripete ogni 65.535 passi ma un fotogramma ne dura 65.536: per questo le stelle si spostano da sole di un pixel a fotogramma; qualche passo in più o in meno le fa correre, rallentare o fermare. Il programma mostra due gruppi alla volta e li cambia ogni 4 fotogrammi [P `jp_Task_man`]: è lo scintillio. Si fermano quando il caccia è stato distrutto e accelerano stage dopo stage [P `f_1D76`, `ds_99B9_star_ctrl`].

Il remake non copia la ROM nel repository (è di Namco): lo script [`scripts/galaga/extract-rom-art.js`](../../../scripts/galaga/extract-rom-art.js) legge le ROM del set MAME e scrive in [`src/art/`](../src/art/) ogni tessera come _ASCII art_ (`.` trasparente, `1`, `2`, `3` i tre colori) e le PROM dei colori byte per byte. Il disegno usa lo `Sprite` monocromatico condiviso: ogni tessera diventa tre sprite, uno per colore, disegnati uno sull'altro. Le stelle non fanno girare il registro 65.536 volte a fotogramma: le 256 stelle si trovano una volta sola, poi si calcola dove cade ciascuna.

Codice: [`pixel-art.ts`](../src/pixel-art.ts), [`sprite-rom.ts`](../src/sprite-rom.ts), [`palette.ts`](../src/palette.ts), [`text.ts`](../src/text.ts), [`stars.ts`](../src/stars.ts).

## 11. I suoni

- **Il chip** [H `namco.cpp`, R `prom-1.1d`]: il suono di Galaga è fatto da **tre voci a forma d'onda** (WSG): ogni voce legge in ciclo una forma d'onda di 32 campioni da 4 bit, scelta tra 8 memorizzate in una PROM, con una frequenza a 20 bit e un volume a 4 bit. Il chip produce 96 000 campioni al secondo.
- **Il programma** [S `c_nmi_proc`, `d_0703_snd_parms`, `d_0748_p_snd_fx`, H `galaga.cpp`]: il processore del suono lavora 120 volte al secondo (MAME lo interrompe alle righe 64 e 192). Ogni effetto suona da una a tre tracce, una per voce; ogni traccia è una lista di note (un indice nella tabella delle frequenze, `d_06A9_ndat`, e un'ottava) con la loro lunghezza in battiti, e il battito di ogni effetto è in `d_07A6`. Il volume di ogni nota segue uno di tre inviluppi.
- **I comandi** [S `b_9AA0`]: il processore principale scrive 1 nel registro di un effetto. Colpi, alieni colpiti e picchiate ripartono da capo a ogni comando (`c_03F4`); il raggio traente, la musica del caccia catturato e quella del salvataggio suonano in ciclo finché il registro resta acceso (`c_0375`); le melodie suonano fino alla fine e poi azzerano il registro (`c_04A2`).
- **La priorità** [S `c_nmi_proc`]: gli effetti sono controllati sempre nello stesso ordine e ognuno scrive le voci che usa, quindi uno più avanti copre quello prima sulla stessa voce. Il suono del caccia catturato colpito ("shot your ship!") salta tutte le melodie e alla fine le spegne, monete e vita extra escluse.
- **Il suono pulsante** [S `l_00D3`, `d_06C3`]: mentre la formazione respira, la prima voce fa un tono che sale quando la formazione si apre e scende quando si chiude, in 8 tratti da 34 tick. Si spegne a fine stage e quando gli ultimi alieni bombardano senza sosta (`f_0857`); dopo la musica di "shot your ship!" torna solo con lo stage seguente.
- **Il raggio traente** [S `l_0204`, `l_0241`]: il ronzio ha un tremolo sulla terza voce (volume da 12 a 3, un passo ogni 6 tick); quando il caccia viene preso la prima voce cambia forma d'onda ogni 28 tick.
- **I risultati dello stage bonus** [S `l_0393`] sono un canone: la seconda traccia entra quando la prima ha suonato una nota, la terza quando l'ha suonata la seconda.
- **L'esplosione del caccia** [H `galaga.cpp`]: viene da un chip a parte, il Namco 54XX, che fa rumore attraverso un circuito analogico; MAME stesso non la emula del tutto. Il remake la imita con del rumore filtrato, i cui valori sono in `tuning.config.ts` [N].
- **Il remake** riproduce le melodie **dai dati della ROM**, copiati da `scripts/galaga/extract-rom-sound.js`: un emulatore delle tre voci genera i campioni e Web Audio li suona. Codice: [`@arcade/wsg`](../../../packages/wsg/), [`sound-program.ts`](../src/sound-program.ts), [`sound-effects.ts`](../src/sound-effects.ts), [`sound-commands.ts`](../src/sound-commands.ts). Guida: [15 · Il chip sonoro Namco](../../../docs/15-chip-sonoro-namco.md).

## 12. Le scelte del remake

- **Un solo giocatore** [N]: la modalità a due giocatori alternati non c'è.
- **Il livello di difficoltà** [N] è il livello A di fabbrica; gli altri tre sono nelle tabelle e si possono scegliere in `tuning.config.ts`.
- **La schermata attract** [P `f_17B2`, `d_attrmode_sptiles`]: come sul cabinato, "GALAGA", "-- SCORE --" e la tabella dei punti compaiono una riga al secondo, con gli alieni dritti accanto ai loro punti, poi il copyright. Il cabinato prosegue con un allenamento e una partita dimostrativa guidati dal programma (`d_1928`, `d_1887`): il remake non li ha e ripete la schermata delle informazioni [N]. Manca anche il logo "namco" sotto il copyright: le tessere da \$66 a \$6C provate non lo disegnano [N].
- **La moneta avvia la partita** [N]: il remake non conta i crediti, quindi niente "PUSH START BUTTON" e niente suono della moneta.
- **Il caccia doppio, le catture e i transitori** seguono le tabelle della ROM; dove il programma passa i dati da un processore all'altro con tempi che dipendono dall'hardware (per esempio la rotazione del caccia catturato), i tempi sono ricavati dal codice e segnati [N] se approssimati.
