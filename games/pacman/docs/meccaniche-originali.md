# Le meccaniche dell'originale

Questa guida spiega come funziona _Pac-Man_ (Namco, 1980; Midway negli Stati Uniti) "dentro": lo schermo e il labirinto, il movimento di Pac-Man e le sue curve, i quattro fantasmi con i loro bersagli, la casa dei fantasmi, le pillole energetiche, la frutta, i livelli, i suoni e la schermata di presentazione. Per ogni regola indica la fonte e, quando serve, il file che la implementa.

Dentro il cabinato c'è **un solo processore Z80** a 3,072 MHz. Non c'è un processore del suono: l'interruzione del quadro, 60,6 volte al secondo, manda avanti i contatori, la partita e il programma del suono, che scrive direttamente nei registri del chip a forme d'onda Namco (lo stesso WSG di _Galaga_).

Le regole di questa guida vengono dalle ROM originali, lette con un disassemblatore Z80, e dal **disassemblato commentato** di Ms. Pac-Man, che contiene il programma di Pac-Man quasi intatto: dove i due differiscono, vale la ROM di Pac-Man. Le velocità, i tempi, le soglie e le tabelle dei livelli del remake sono **le tabelle di quelle ROM**, copiate valore per valore.

Tutti i valori incerti o da regolare stanno in un solo file, [`tuning.config.ts`](../src/tuning.config.ts), ognuno con la sua marcatura. Ogni valore di questa guida è marcato così:

- **[P]** letto nel programma della ROM, con il suo indirizzo (per esempio `2966`, la routine che sceglie la strada più corta);
- **[R]** letto nelle ROM grafiche o nelle PROM dei colori e delle forme d'onda;
- **[H]** ricavato dall'hardware, attraverso l'emulatore MAME;
- **[W]** da una fonte scritta (il _Pac-Man Dossier_, il manuale, articoli);
- **[N]** scelta nostra, dove le fonti non dicono nulla o dove il browser chiede qualcosa di diverso.

## Fonti

- Le **ROM del set MAME `pacman`** (Midway): quattro ROM di programma (`pacman.6e`, `6f`, `6h`, `6j`), le ROM grafiche dei caratteri (`5e`) e degli sprite (`5f`), le PROM dei colori (`82s123.7f`, `82s126.4a`) e delle forme d'onda del suono (`82s126.1m`). Non sono nel repository: gli script in `scripts/pacman/` le leggono da una cartella indicata da chi li lancia.
- [Il disassemblato commentato di Ms. Pac-Man](https://github.com/BleuLlama/GameDocs/blob/master/disassemble/mspac.asm) di Scott Lawrence, con i contributi di Don Hodges, Frederic Vecoven (il suono), Mark Spaeth, Dave Widel e del progetto Vigasoco: la mappa della RAM e il significato di quasi ogni routine.
- [The Pac-Man Dossier](https://www.gamedeveloper.com/design/the-pac-man-dossier) di Jamey Pittman: il comportamento visto dal giocatore, con le velocità in percentuale, i bersagli dei fantasmi, le curve e lo schermo diviso del livello 256. Lo usiamo per controllare che la lettura della ROM sia giusta.
- [MAME · driver di Pac-Man](https://github.com/mamedev/mame/blob/master/src/mame/pacman/pacman.cpp) e il suo [video](https://github.com/mamedev/mame/blob/master/src/mame/pacman/pacman_v.cpp): tempi, memoria video, coordinate degli sprite, decodifica della grafica.
- [floooh/chips](https://github.com/floooh/chips): un emulatore dell'hardware Namco con la stessa mappa della memoria video, utile per verificare i calcoli delle coordinate.

## 1. Lo schermo e il tempo

- **Il tempo** [H]: il quadro si rinfresca a **60,6 Hz** e l'interruzione esegue tutta la partita una volta per fotogramma. Il remake gira a 60 passi al secondo [N], come gli altri giochi: ogni velocità resta "per fotogramma", come nell'originale.
- **Lo schermo** [H]: un monitor girato in verticale, **224 × 288 pixel**, cioè 28 × 36 caratteri da 8 pixel. Le due righe in alto ospitano i punteggi, le due in basso le vite e la frutta dei livelli; in mezzo c'è il labirinto, 28 × 31 caselle.
- **La memoria video** [H]: lo schermo è una griglia di codici di carattere (1 KB) e una di colori (1 KB). Il programma non disegna il labirinto "a parte": **lo legge dalla memoria video**. Un muro è un carattere con codice da `C0` in su, un puntino è `10`, una pillola `14`, e alcune caselle hanno colori speciali che il programma usa come segnali: `1A` dove i fantasmi non possono svoltare, `1B` nei tunnel dove rallentano, `18` per la porta della casa [P `24D7`]. Il remake tiene le stesse due griglie.
- **Le coordinate** [P `2018`]: ogni personaggio ha una posizione in pixel (due byte, chiamati Y e X nel disassemblato) e una casella. La casella si ottiene dividendo per 8 e aggiungendo `20` e `1E`; la riga sullo schermo è la Y della casella meno `1E`, la colonna è `3B` meno la X. Così una casella fuori dallo schermo (nei tunnel) ha ancora un numero.
- **Gli sprite** [H]: 8 sprite da 16 × 16 pixel; il programma ne usa 6 (quattro fantasmi, Pac-Man, la frutta).

Codice: [`geometry.ts`](../src/geometry.ts), [`video.ts`](../src/video.ts), [`maze.ts`](../src/maze.ts).

## 2. Velocità a bit

- **Due passi per fotogramma** [P `08EB`]: la routine che muove i personaggi gira **due volte** per fotogramma.
- **I modelli di velocità** [P `1806`, `1B36`, `0814`]: ogni personaggio ha un numero di 32 bit che ruota di un bit a ogni passo. Se il bit uscito vale 1, il personaggio avanza di un pixel. In 16 fotogrammi i bit sono 32: un modello con 20 bit accesi fa **1,25 pixel per fotogramma** (75,75 pixel al secondo), il "100%" del Dossier.
- **La tabella dei livelli** [P `330F`]: sette righe da 42 byte, una per gruppo di livelli. Ogni riga ha i modelli di Pac-Man (normale e con la pillola), di Blinky "Cruise Elroy" 1 e 2, dei fantasmi (normale, blu, nel tunnel) e i tempi delle fasi. Al livello 1: Pac-Man 80%, con la pillola 90%, fantasmi 75%, blu 50%, nel tunnel 40% [P, W]: esattamente i valori del Dossier.
- **Mangiare rallenta** [P `19FD`]: un puntino ferma Pac-Man per 1 passo, una pillola per 6 passi (3 fotogrammi).

Codice: [`speed.ts`](../src/speed.ts).

## 3. Pac-Man

- **Partenza** [P `2576`]: posizione `80C4`, rivolto a sinistra.
- **Il joystick** [P `18C8`]: se la nuova direzione è libera Pac-Man la prende subito; se è bloccata continua dritto e si ferma solo contro un muro, al centro della casella.
- **Le curve** [P `1950`–`1985`]: quando cambia direzione fuori dal centro della casella, a ogni passo Pac-Man avanza nella direzione nuova **e** si riallinea di un pixel verso il centro dell'altro asse. Così "taglia" la curva: chi gira in anticipo guadagna strada sui fantasmi.
- **I tunnel** [P `1864`]: oltre i bordi Pac-Man ricompare dall'altra parte e il joystick vale solo per destra e sinistra.

Codice: [`pacman.ts`](../src/pacman.ts).

## 4. I fantasmi

- **Decidono una casella prima** [P `1BD8`]: arrivato al centro di una casella, il fantasma prende la direzione già scelta e **subito sceglie quella per la casella successiva**. Non torna mai indietro da solo.
- **La strada più corta** [P `2966`]: prova le quattro direzioni (tranne quella da cui viene e quelle con un muro), calcola il quadrato della distanza in linea d'aria dalla casella bersaglio e tiene la più corta. A parità vince l'ordine su, sinistra, giù, destra.
- **I bersagli** [P `2730`–`283A`]:
  - **Blinky** (rosso): la casella di Pac-Man.
  - **Pinky** (rosa): 4 caselle davanti a Pac-Man. Quando Pac-Man guarda in su, il conto a 16 bit sposta il bersaglio anche di 4 caselle a sinistra: è il famoso "errore" di Pinky.
  - **Inky** (azzurro): il punto 2 caselle davanti a Pac-Man (con lo stesso errore verso l'alto), e da lì il doppio del vettore che parte da Blinky.
  - **Clyde** (arancione): Pac-Man finché è lontano più di 8 caselle; più vicino, il suo angolo.
- **Sparpagliarsi e inseguire** [P `0E36`, `330F`]: i fantasmi alternano fasi in cui puntano ai loro angoli (scatter) e fasi di inseguimento (chase). Al livello 1: 7 s scatter, 20 chase, 7 scatter, 20 chase, 5 scatter, 20 chase, 5 scatter, poi solo chase. A ogni cambio di fase invertono la direzione. Il contatore si ferma mentre sono blu.
- **Gli angoli** [P `274B`, `2781`, `27BE`, `2806`]: caselle fuori dal labirinto, in alto a destra (Blinky), in alto a sinistra (Pinky), in basso a destra (Inky), in basso a sinistra (Clyde).
- **Cruise Elroy** [P `20D7`, `084F`]: quando restano pochi puntini (20 e 10 al livello 1), Blinky accelera due volte e, dalla prima soglia, insegue anche durante le fasi scatter.
- **Le zone senza svolta** [P `24F7`, `1C0B`]: nelle caselle colorate `1A` (sopra la casa e sopra la partenza di Pac-Man) i fantasmi non decidono: tirano dritto, quindi non possono girare in su.
- **I tunnel** [P `205A`]: nelle caselle colorate `1B` i fantasmi usano il modello di velocità del tunnel.

Codice: [`ghost-ai.ts`](../src/ghost-ai.ts), [`ghosts.ts`](../src/ghosts.ts), [`ghost-move.ts`](../src/ghost-move.ts), [`ghost-modes.ts`](../src/ghost-modes.ts).

## 5. La casa dei fantasmi

- **Dentro la casa** [P `0C42`]: Pinky, Inky e Clyde ondeggiano su e giù finché non tocca a loro, poi escono dalla porta. Blinky parte già fuori.
- **I contatori dei puntini** [P `1B08`, `2069`–`20D1`, `0843`]: ogni puntino mangiato fa avanzare il contatore del primo fantasma ancora in casa. Pinky esce subito, Inky dopo 30 puntini e Clyde dopo 60 al livello 1; al livello 2 solo Clyde aspetta (50); dal livello 3 escono tutti subito.
- **Dopo una vita persa** [P `1B0F`, `2075`]: vale un contatore unico: Pinky esce a 7 puntini, Inky a 17, e a 32 il contatore unico si spegne.
- **Il timer** [P `13DD`, `0873`]: se Pac-Man non mangia per 4 secondi (3 dal livello 5) il primo fantasma in casa esce comunque.
- **Gli occhi** [P `10C0`–`1232`]: un fantasma mangiato torna verso la casella sopra la porta, entra, si rigenera e riparte.

Codice: [`house.ts`](../src/house.ts), [`eyes.ts`](../src/eyes.ts).

## 6. Le pillole energetiche

- **Fantasmi blu** [P `1A6A`, `0861`]: dopo una pillola i fantasmi invertono la direzione e diventano blu per un tempo che dipende dal livello (6 secondi al livello 1, poi sempre meno, fino a zero: dal livello 19 si girano soltanto).
- **Il lampeggio** [P `0AC3`]: verso la fine i fantasmi lampeggiano tra blu e bianco.
- **Svolte a caso** [P `291E`, `2A23`]: un fantasma blu sceglie la direzione con un generatore pseudo-casuale che legge byte della ROM; se la direzione è bloccata prova la successiva in senso orario. Il generatore riparte da zero a ogni vita e a ogni livello.
- **Punti** [P `1776`, `2A5A`]: 200, 400, 800, 1600 per i fantasmi di una stessa pillola.
- **Le collisioni** [P `171D`, `1789`]: Pac-Man e un fantasma si toccano quando sono **nella stessa casella**. Se si scambiano di casella nello stesso passo, si attraversano: è il "passaggio attraverso" che i giocatori esperti conoscono.

Codice: [`energizer.ts`](../src/energizer.ts), [`collisions.ts`](../src/collisions.ts).

## 7. Frutta, punteggi, vite, livelli

- **La frutta** [P `0EAD`, `0EFD`]: compare sotto la casa quando i puntini mangiati sono **esattamente** 70 e 170, se nessun'altra frutta è in giro. Resta 10 secondi [P `0EF8`], contati sull'orologio della macchina: per questo dura tra 9 e 10 secondi. Ciliegia 100, fragola 300, pesca 500, mela 700, uva 1000, Galaxian 2000, campana 3000, chiave 5000.
- **Mangiarla** [P `199B`]: Pac-Man deve trovarsi esattamente sul suo pixel. I punti restano scritti 2 secondi; la frutta sparisce ma per il programma "c'è" ancora fino allo scadere dei suoi 10 secondi, quindi se Pac-Man arriva a 170 puntini prima, la seconda frutta salta.
- **I timer** [P `0221`]: le attese del gioco sono "compiti a tempo" con un'unità (fotogrammi, decimi, secondi) e un conteggio. Le unità seguono un unico orologio, e un timer di 2 secondi dura fra 1,9 e 2 secondi. Codice: [`timers.ts`](../src/timers.ts).
- **Puntini** [P `2A5A`]: 10 punti, la pillola 50. In tutto 240 puntini e 4 pillole.
- **La vita extra** [P `2A7E`, `2B33`]: una sola, quando le migliaia del punteggio raggiungono l'impostazione dei DIP switch (10 000 punti di fabbrica). In basso a sinistra si vedono al massimo 5 vite di riserva: con 6 o più la routine non ne disegna nessuna [P `2B4A`].
- **La morte** [P `1291`]: per un secondo tutto si ferma, poi i fantasmi spariscono e Pac-Man si consuma negli sprite da `34` a `3F`. Poi il labirinto viene ridisegnato con i puntini rimasti [P `2487`, `0988`] e la casa usa il contatore unico.
- **L'inizio** [P `0674`, `0899`]: "PLAYER ONE" e "READY!" senza personaggi per 2,3 secondi, poi i personaggi al loro posto per altri 2 secondi; una delle vite in basso entra in campo.
- **La fine del livello** [P `08DE`, `09D8`–`0A0E`]: a 244 puntini tutto si ferma per 2 secondi, poi i fantasmi spariscono e il labirinto lampeggia 8 volte, bianco e blu, 0,2 secondi ciascuna; lo schermo resta vuoto 0,3 secondi (anche i punteggi, perché la RAM dei colori viene azzerata) e si riparte. Dopo i livelli 2, 5, 9, 13 e 17 c'è un intermezzo.
- **La fila della frutta** [P `2BEA`]: in basso a destra la frutta dei livelli giocati, al massimo le ultime 7.
- **Il livello 256** [P `2BEA`, W]: il contatore dei livelli è di un byte. Al livello 256 la routine della fila chiede 0 frutti, e il suo ciclo conta 0 come 256: disegna 256 frutti leggendo i byte della ROM che seguono la tabella, e copre la metà destra del labirinto. Non ci sono più abbastanza puntini per finire il livello. Il remake esegue la stessa routine e ottiene lo stesso schermo.

Codice: [`fruit.ts`](../src/fruit.ts), [`lives.ts`](../src/lives.ts), [`death.ts`](../src/death.ts), [`level-flow.ts`](../src/level-flow.ts), [`screen.ts`](../src/screen.ts), [`restart.ts`](../src/restart.ts), [`score.ts`](../src/score.ts), [`levels.ts`](../src/levels.ts).

## 8. Suoni

- **Il chip** [H]: Namco WSG, tre voci, otto forme d'onda da 32 campioni nella PROM `82s126.1m`. È il chip di _Galaga_, già emulato dal pacchetto `@arcade/wsg`. La voce 1 ha una frequenza di 20 bit; le voci 2 e 3 ne ricevono solo i 16 alti, quindi lo stesso valore suona 16 volte più alto.
- **Il programma del suono** [P `2D0C`, `2CC1`]: gira una volta per fotogramma, nell'interruzione, dentro il processore principale. Ogni voce ha un canale per gli **effetti** e uno per le **canzoni**; ciascun canale è un byte di 8 bit di richieste, e suona quella col bit più alto. Il gioco accende e spegne i bit (`SET`, `RES`), il programma li spegne da solo quando un effetto finisce.
- **Gli effetti** [P `2DEE`, tabelle `3B30`, `3B40`, `3B80`]: 8 byte ciascuno: forma d'onda e ottava, frequenza, scivolamento per fotogramma, durata del passo (con un bit che inverte lo scivolamento), salto di frequenza e di volume a ogni passo, numero di passi (0 per un effetto senza fine), volume e inviluppo.
  - Voce 1: la vita extra e la moneta.
  - Voce 2: la sirena, in 5 versioni che salgono con i puntini mangiati (116, 180, 212, 228) [P `0E6C`]; sopra di lei, sui bit più alti, i fantasmi blu e gli occhi che tornano a casa.
  - Voce 3: il "wakka", due mezzi effetti che si alternano a ogni puntino [P `1A06`]; la frutta, il fantasma mangiato, la morte di Pac-Man e le sue due ultime note.
- **Le canzoni** [P `2D44`, tabelle `3BC8`-`3BD0`]: una sequenza di byte di nota (3 bit di durata, da 1 a 128 fotogrammi; 5 bit di nota e ottava) e di comandi da `F0` in su (salto, forma d'onda, ottava, volume, inviluppo, fine). La canzone 1 è la musica d'inizio, la 2 quella degli intermezzi.
- **Un difetto conservato** [P `2FAD`]: alla fine di una canzone il programma continua a leggere i byte che seguono, fino alla nota successiva. Il volume di quella nota non arriva al chip, ma la sua frequenza sì.
- **Il ritardo** [P `009D`]: il programma copia i registri nel chip all'inizio dell'interruzione, prima di calcolare i nuovi; un suono chiesto dal gioco si sente quindi un fotogramma dopo.
- **L'altoparlante** [N]: nel cabinato l'amplificatore arriva all'altoparlante attraverso un condensatore, che non lascia passare una tensione costante. Il remake applica un filtro passa-alto a 15 Hz, così le pause della musica, dove una voce resta ferma su un campione, sono silenzio e non scatti.
- **Quello che resta fuori** [P `0AEB`]: il programma accende un suono per il lampeggio dei fantasmi blu e lo spegne subito dopo, nella stessa routine: non si sente mai, e il remake non lo chiede.

Codice: [`sound-channel.ts`](../src/sound-channel.ts), [`sound-effects.ts`](../src/sound-effects.ts), [`sound-songs.ts`](../src/sound-songs.ts), [`sound-board.ts`](../src/sound-board.ts), [`sounds.ts`](../src/sounds.ts), [`speaker.ts`](../src/speaker.ts).

## 9. Presentazione, demo, gettoni e intermezzi

- **Lo stato della macchina** [P `03C8`]: un byte dice se il gioco è in **presentazione** (attract mode), in attesa del pulsante di avvio o in partita. All'accensione lo schermo si svuota, compaiono "HIGH SCORE", "1UP", "2UP" e il punteggio a zero, poi parte la presentazione. Alla fine di ogni partita il programma torna lì [P `0972`].
- **La presentazione dei fantasmi** [P tabella `0417`]: 15 passi, ciascuno scrive qualcosa e aspetta un secondo, o mezzo per i soprannomi [P `0585`, `0593`]. "CHARACTER / NICKNAME", poi per ogni fantasma il ritratto (2 × 3 caratteri nel suo colore [P `05BF`]), il soprannome ("-SHADOW") e il nome ("BLINKY"); poi "10 PTS" e "50 PTS", infine il copyright. Sono i messaggi della ROM, con le loro posizioni e i loro colori.
- **L'inseguimento** [P `04E5`-`057C`]: il programma disegna una pillola in fondo a una riga vuota e, sopra e sotto la riga, due file di **muri invisibili** (il carattere `FC`, un muro senza disegno [P `0506`]). Pac-Man parte dal bordo destro; Blinky esce quando Pac-Man arriva alla colonna `21`, gli altri quando Blinky arriva alle colonne `20`, `22` e `24`. Gira il **nucleo vero del gioco**, con le velocità del livello 21, ma senza il tempo blu che scade e senza la casa [P `1053`]: per questo i fantasmi restano blu finché non sono mangiati tutti. Quando Pac-Man mangia la pillola, lui e i fantasmi si girano; nell'ultimo stato i fantasmi si girano subito, non al centro della casella [P `1F17`]. L'inseguimento finisce quando il quarto fantasma è mangiato e i suoi punti sono spariti.
- **Pac-Man guidato dal programma** [P `1A19`, `28E3`]: nella presentazione e negli intermezzi Pac-Man si muove **come un fantasma**: a metà di ogni casella entra nella casella davanti, già scelta, e chiede la strada per la successiva con la stessa routine dei fantasmi [P `2966`]. Il bersaglio della demo è la casella dalla parte opposta a Pinky (il doppio della casella di Pac-Man meno quella di Pinky), e diventa la casella di Pinky quando Blinky è blu.
- **La demo** [P `06BE`, `0899`, `0988`]: dopo l'inseguimento il programma gioca una partita da solo, al livello 1, con la sola vita lasciata dall'inseguimento. Non conta i punti [P `2A5A`], non disegna vite né frutta [P `2B6A`, `2BEA`], e al posto di "READY!" scrive "GAME OVER", che resta sullo schermo [P `09B0`]. Le voci 2 e 3 del suono sono spente a ogni fotogramma [P `01AD`]: la demo è muta. Pac-Man muore, "GAME OVER" resta due secondi e la presentazione ricomincia. La demo è sempre uguale, perché tutto è deterministico.
- **I gettoni** [P `02DF`, `03FE`]: il tasto C (o 5, come in MAME) inserisce un gettone, con il suo suono, in qualsiasi momento; i crediti sono un byte BCD, al massimo 99. In presentazione "CREDIT" e il numero stanno sulla riga in basso [P `2BA1`]; con un credito la presentazione lascia il posto a "PUSH START BUTTON", "1 PLAYER ONLY", "BONUS PAC-MAN FOR 10000 PTS" e il copyright [P `05F3`]. Il tasto Invio (o 1) spende il credito e avvia la partita con la sua musica [P `0649`].
  - Con più crediti l'originale scrive "1 OR 2 PLAYERS" [P `061B`]: il remake ha un solo giocatore e scrive sempre "1 PLAYER ONLY" [N].
- **"1UP" e "2UP"** [P `032D`]: fermi prima della partita; durante la partita "1UP" lampeggia con il bit 4 di un contatore di fotogrammi che riparte a ogni vita, e "2UP" sparisce.
- **Gli intermezzi** [P `0A2C`, tabella `0A44`]: dopo i livelli 2, 5, 9, 13 e 17, mentre suona la canzone 2. Il programma prepara gli attori come per l'inseguimento, con le velocità del livello 20, e chiama direttamente le routine di movimento di Pac-Man e di Blinky: niente collisioni, niente casa. Blinky esce come "Cruise Elroy 2", il più veloce possibile. Ogni intermezzo è una tabella di passi: ogni passo aspetta una posizione (una colonna di Pac-Man o di Blinky, o un pixel di Blinky) e intanto muove gli attori di un fotogramma.
  - **Primo** [P `2108`]: Blinky insegue Pac-Man fuori dallo schermo a sinistra; poi Blinky torna blu, inseguito da un **Pac-Man gigante**, fatto di quattro sprite presi in prestito dagli altri tre fantasmi e dalla frutta, scelti dalla posizione per aprire e chiudere la bocca [P `039D`, `15E6`].
  - **Secondo** [P `219E`]: un chiodo (4 caratteri) al centro della riga; il lenzuolo di Blinky ci si impiglia, Blinky rallenta quasi a fermarsi (la sua velocità diventa `2084 2084` [P `2201`]), il lenzuolo si strappa in quattro disegni e Blinky si gira a guardare lo strappo con due sprite dedicati [P `162D`].
  - **Terzo** [P `2297`]: Blinky, rammendato, insegue Pac-Man fuori dallo schermo; torna indietro **senza lenzuolo**, trascinandolo dietro di sé [P `1652`].
  - Quando Pac-Man raggiunge l'ultima colonna a sinistra, nel secondo e nel terzo intermezzo il programma gli dà il colore nero, e nulla gliene ridà un altro fino alla fine [P `163A`]: senza questo si vedrebbe Pac-Man rientrare dal bordo destro.
  - Gli attori fanno tutto il giro dei 256 pixel: escono da un lato, attraversano la zona invisibile oltre lo schermo e rientrano dall'altro.

Codice: [`attract.ts`](../src/attract.ts), [`attract-flow.ts`](../src/attract-flow.ts), [`chase.ts`](../src/chase.ts), [`corridor.ts`](../src/corridor.ts), [`autopilot.ts`](../src/autopilot.ts), [`credits.ts`](../src/credits.ts), [`intermission.ts`](../src/intermission.ts), [`intermission-scenes.ts`](../src/intermission-scenes.ts), [`intermission-moves.ts`](../src/intermission-moves.ts), [`intermission-sprites.ts`](../src/intermission-sprites.ts), [`game.ts`](../src/game.ts).

## Lasciati fuori [N]

Come in _Galaga_: la partita a due giocatori, il cabinato cocktail, il menu dei DIP switch e il test di servizio.
