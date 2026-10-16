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

Codice: [`playfield.ts`](../src/playfield.ts), [`video.ts`](../src/video.ts).

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

Codice: [`ghost-ai.ts`](../src/ghost-ai.ts), [`ghosts.ts`](../src/ghosts.ts), [`path.ts`](../src/path.ts).

## 5. La casa dei fantasmi

- **Dentro la casa** [P `0C42`]: Pinky, Inky e Clyde ondeggiano su e giù finché non tocca a loro, poi escono dalla porta. Blinky parte già fuori.
- **I contatori dei puntini** [P `1B08`, `2069`–`20D1`, `0843`]: ogni puntino mangiato fa avanzare il contatore del primo fantasma ancora in casa. Pinky esce subito, Inky dopo 30 puntini e Clyde dopo 60 al livello 1; al livello 2 solo Clyde aspetta (50); dal livello 3 escono tutti subito.
- **Dopo una vita persa** [P `1B0F`, `2075`]: vale un contatore unico: Pinky esce a 7 puntini, Inky a 17, e a 32 il contatore unico si spegne.
- **Il timer** [P `13DD`, `0873`]: se Pac-Man non mangia per 4 secondi (3 dal livello 5) il primo fantasma in casa esce comunque.
- **Gli occhi** [P `10C0`–`1232`]: un fantasma mangiato torna verso la casella sopra la porta, entra, si rigenera e riparte.

Codice: [`ghost-house.ts`](../src/ghost-house.ts).

## 6. Le pillole energetiche

- **Fantasmi blu** [P `1A6A`, `0861`]: dopo una pillola i fantasmi invertono la direzione e diventano blu per un tempo che dipende dal livello (6 secondi al livello 1, poi sempre meno, fino a zero: dal livello 19 si girano soltanto).
- **Il lampeggio** [P `0AC3`]: verso la fine i fantasmi lampeggiano tra blu e bianco.
- **Svolte a caso** [P `291E`, `2A23`]: un fantasma blu sceglie la direzione con un generatore pseudo-casuale che legge byte della ROM; se la direzione è bloccata prova la successiva in senso orario. Il generatore riparte da zero a ogni vita e a ogni livello.
- **Punti** [P `1776`, `2A5A`]: 200, 400, 800, 1600 per i fantasmi di una stessa pillola.
- **Le collisioni** [P `171D`, `1789`]: Pac-Man e un fantasma si toccano quando sono **nella stessa casella**. Se si scambiano di casella nello stesso passo, si attraversano: è il "passaggio attraverso" che i giocatori esperti conoscono.

Codice: [`energizer.ts`](../src/energizer.ts), [`collisions.ts`](../src/collisions.ts).

## 7. Frutta, punteggi, livelli

- **La frutta** [P `0EAD`, `0EFD`]: compare sotto la casa dopo 70 e 170 puntini. Ciliegia 100, fragola 300, pesca 500, mela 700, uva 1000, Galaxian 2000, campana 3000, chiave 5000.
- **Puntini** [P `2A5A`]: 10 punti, la pillola 50. In tutto 240 puntini e 4 pillole.
- **La vita extra** [P `2728`]: a 10 000 punti (impostazione di fabbrica).
- **La fine del livello** [P `09D8`–`0A0E`]: il labirinto lampeggia bianco e blu, poi riparte con il livello successivo. Dopo i livelli 2, 5, 9, 13 e 17 c'è un intermezzo.
- **Il livello 256** [W]: il contatore dei livelli è di un byte; la routine che disegna la frutta in basso ne disegna troppa e copre metà del labirinto con caratteri a caso.

Codice: [`fruit.ts`](../src/fruit.ts), [`score.ts`](../src/score.ts), [`levels.ts`](../src/levels.ts).

## 8. Suoni

- **Il chip** [H]: Namco WSG, tre voci, otto forme d'onda da 32 campioni nella PROM `82s126.1m`. È il chip di _Galaga_, già emulato dal pacchetto `@arcade/wsg`.
- **Il programma del suono** [P `2CC1`, `2D0C`]: due motori, uno per gli **effetti** (la sirena, il "wakka" dei puntini, i fantasmi blu, gli occhi, la frutta, la morte) e uno per le **melodie** (la musica d'inizio, gli intermezzi). Le tabelle sono nella ROM da `3B30` in poi.

Codice: [`sound-*.ts`](../src/).

## Lasciati fuori [N]

Come in _Galaga_: la partita a due giocatori, il cabinato cocktail, il menu dei DIP switch e il test di servizio.
