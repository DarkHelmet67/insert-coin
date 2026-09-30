# Le meccaniche dell'originale

Questa guida spiega come funziona _Asteroids_ (Atari, 1979) "dentro": lo schermo vettoriale, la nave, i colpi, gli asteroidi, i dischi volanti, l'iperspazio e i suoni. Per ogni regola indica la fonte e, quando serve, il file che la implementa.

A differenza di Breakout, Asteroids **ha un processore**: un 6502 a 1,5 MHz, lo stesso dell'Apple II e del Commodore 64, con 6 KB di programma. Non disegna pixel: scrive una lista di linee che un secondo circuito, il **generatore di vettori** (DVG, _Digital Vector Generator_), traccia muovendo il fascio di elettroni del monitor. Il programma è stato disassemblato e commentato, quindi quasi ogni regola si può leggere istruzione per istruzione.

Tutti i valori incerti o da regolare staranno in un solo file, `src/tuning.config.ts`, ognuno con la sua marcatura. Ogni valore di questa guida è marcato così:

- **[P]** letto nel programma 6502, con l'indirizzo dell'istruzione (per esempio `$6CFF`);
- **[R]** letto nella ROM vettoriale, cioè nei disegni (per esempio `$11E6`);
- **[H]** ricavato dall'hardware, attraverso l'emulatore MAME;
- **[W]** da una fonte scritta (manuale, articoli);
- **[N]** scelta nostra, dove le fonti non dicono nulla o dove il browser chiede qualcosa di diverso.

## Fonti

- [Computer Archeology · Asteroids](https://computerarcheology.com/Arcade/Asteroids/): il programma disassemblato e commentato (Lonnie Howell), la mappa della RAM, la ROM vettoriale con tutti i disegni e la descrizione del DVG.
- [6502disassembly.com · Asteroids](https://6502disassembly.com/va-asteroids/): un secondo disassemblato, usato per confronto.
- [MAME · driver di Asteroids](https://github.com/mamedev/mame/blob/master/src/mame/atari/asteroid.cpp), [i suoni](https://github.com/mamedev/mame/blob/master/src/mame/atari/asteroid_a.cpp) e [il generatore di vettori](https://github.com/mamedev/mame/blob/master/src/devices/video/avgdvg.cpp).
- [Wikipedia · Asteroids](<https://en.wikipedia.org/wiki/Asteroids_(video_game)>): storia e regole viste dal giocatore.

Il remake segue la **revisione 2** del programma (ROM 035145.02, 035144.02, 035143.02 e 035127.02 per i vettori), quella studiata dai due disassemblati.

## 1. Lo schermo vettoriale

Un monitor normale (raster) disegna l'immagine riga per riga, come Space Invaders e Breakout. Il monitor di Asteroids invece è **vettoriale**: il fascio va direttamente da un punto all'altro e traccia una linea, come una penna su un foglio. Per questo le linee sono nitidissime, senza scalini, e luminose: il fosforo brilla più a lungo dove il fascio passa lentamente, e i punti (i colpi) sembrano piccole stelle.

- **Coordinate** [R, H]: il DVG ragiona su una griglia di 1024 × 1024 unità, con (0, 0) in **basso** a sinistra: la y cresce verso l'alto, al contrario del canvas. Il monitor, montato in orizzontale, ne mostra una finestra 4:3: **x da 0 a 1023, y da 128 a 895**, cioè 1024 × 768 unità. Lo conferma il disegno di prova della ROM (`$1000`), un rettangolo di 1023 × 767 che parte da (0, 128).
- **Intensità** [R]: ogni linea ha una luminosità da 0 a 15; 0 serve a spostare il fascio senza disegnare.
- **Scala** [R, H]: ogni disegno della ROM si può tracciare più grande o più piccolo per potenze di due. Così un solo disegno fa l'asteroide grande, medio e piccolo (vedi la sezione 4).
- **Bianco e nero** [W]: il monitor è monocromatico, senza pellicole colorate. Niente modalità a colori in questo gioco.

Nel remake il canvas disegnerà le linee alla risoluzione vera dello schermo (anche Retina), non ingrandendo pixel: è il compito del nuovo pacchetto `@arcade/vector` dello step 2. Una formula sola, `toCanvasY` in [`playfield.ts`](../src/playfield.ts), converte la y del DVG in quella del canvas.

### Posizioni degli oggetti

Il programma tiene le posizioni con più precisione dello schermo [P `$72FE`]: **x da 0 a 8191, y da 0 a 6143**, cioè 8 unità di posizione per ogni unità del DVG. La conversione è semplice: x sullo schermo = x / 8, y sullo schermo = y / 8 + 128. Il remake lavorerà nelle stesse unità del programma, così ogni velocità e ogni distanza di questa guida si copia senza conversioni.

**Lo schermo si richiude sui bordi** [P `$6FD8`]: chi esce a destra rientra a sinistra, chi esce in alto rientra in basso. Vale per nave, asteroidi e colpi, ma **non per il disco volante**, che quando esce di lato sparisce.

### Il tempo

Il programma avanza di un passo ogni 4 interruzioni del circuito, che arrivano 246 volte al secondo: **61,5 passi al secondo** [P `$7B73`, H]. Il remake avanzerà a **60** [N], come Breakout: sugli schermi a 60 Hz ogni immagine mostra esattamente un passo. Il gioco risulta più lento del 2,5%, una differenza che non si percepisce.

Due contatori scandiscono il tempo [P `$6828`]: uno veloce, che avanza a ogni passo, e uno lento, che avanza ogni 256 passi (circa 4 secondi). Molte regole usano i bit del contatore veloce: "ogni 2 passi", "ogni 4 passi", "4 passi sì e 4 no".

## 2. La nave

- **Direzione** [P `$7086`]: un numero da 0 a 255 (un giro intero); **0 punta a destra**, 64 in alto, 128 a sinistra, 192 in basso. Ogni passo con il tasto premuto la nave ruota di **3 unità**: un giro completo in 85 passi, circa 1,4 secondi.
- **La direzione non si azzera mai** [P]: il programma la scrive solo quando la nave ruota. Dopo una morte o un iperspazio la nave riparte orientata come prima.
- **Seno e coseno** [R `$17B9`]: niente calcoli trigonometrici, ma una tabella di 65 valori (un quarto di giro, da 0 a 127) da cui il programma ricava tutti gli altri per simmetria.
- **Spinta** [P `$70A0`]: con il tasto premuto la velocità cresce di 2 × coseno in orizzontale e 2 × seno in verticale, in 256esimi di unità. Il calcolo avviene **un passo sì e uno no** [P `$709B`].
- **Velocità massima** [P `$7125`]: circa **64 unità di posizione per passo** su ciascun asse, limitata separatamente in orizzontale e in verticale. In diagonale quindi la nave va circa 1,4 volte più veloce. Da ferma alla massima servono circa 2 secondi di spinta.
- **Attrito** [P `$70E1`]: senza spinta la velocità cala di circa 1/128 ogni due passi. Da piena velocità la nave dimezza in circa 3 secondi e si ferma del tutto dopo molti secondi: è l'inerzia che rende Asteroids così particolare.
- **Fiamma** [P `$753B`]: con la spinta dietro la nave compare la fiamma, accesa 4 passi e spenta 4, e per questo tremola.
- **Il disegno** [R `$126E`–`$14D8`]: la ROM contiene 17 disegni della nave, uno ogni 4 unità di direzione per un quarto di giro, ognuno seguito dalla sua fiamma; gli altri tre quarti si ottengono cambiando il segno delle coordinate. La nave è lunga circa 24 unità del DVG. La rotazione a scatti dell'originale nasce da qui: 64 disegni per 256 direzioni.
- **Partenza** [P `$71E8`]: la nave nasce ferma, in (4192, 3168), un po' a destra e in alto rispetto al centro esatto (4096, 3072).
- **Ripartenza sicura** [P `$7139`]: dopo la morte la nave riappare solo quando un quadrato di circa 256 × 256 unità del DVG attorno al centro è libero da asteroidi, e **mai mentre c'è un disco volante** sullo schermo.

## 3. I colpi della nave

- **Al massimo 4 colpi** sullo schermo [P `$6CEC`].
- **Bisogna rilasciare il tasto** [P `$6CDB`]: ogni pressione spara un solo colpo. Niente fuoco automatico.
- **Durata** [P `$6CFF`, `$738D`]: 18 tic da 4 passi, cioè **circa 72 passi** (1,2 secondi).
- **Velocità** [P `$6D04`]: la velocità della nave più metà del coseno (e del seno) della direzione, limitata a **111 unità per passo** per asse. Sparare mentre si vola in avanti rende i colpi più veloci.
- **Partenza** [P `$6D4A`]: il colpo nasce poco davanti alla nave, a 3/4 del coseno (circa 12 unità del DVG).
- **Anche i colpi si richiudono sui bordi**, e possono colpire **la propria nave** [P `$69FD`]: un colpo sparato in avanti a tutta velocità può fare il giro dello schermo e tornare indietro.
- **Il disegno** [P `$7384`]: un punto alla luminosità massima.

## 4. Gli asteroidi

- **Quattro forme** [R `$11E6`, `$11FE`, `$121A`, `$1234`], scelte a caso, e **tre grandezze** dallo stesso disegno [P `$7018`]: grande a scala piena (circa 64 unità del DVG di diametro), medio alla metà, piccolo a un quarto.
- **Ondate** [P `$7187`]: la prima ha **4** asteroidi grandi, poi 6, 8, 10 e da lì sempre **11**. Il programma ha 27 posti per gli asteroidi: se sono tutti occupati, un asteroide colpito sparisce senza dividersi.
- **Dove nascono** [P `$71AA`]: su un bordo, sinistro o inferiore, in un punto a caso; visto che lo schermo si richiude, sembrano arrivare da tutti i lati. Velocità a caso, da 6 a 15 unità per passo su ciascun asse, in qualsiasi verso.
- **Divisione** [P `$75EC`]: colpito, un grande diventa **due medi**, un medio **due piccoli**, un piccolo sparisce. Ogni figlio parte dalla velocità del genitore più un valore a caso fra −16 e +15 su ciascun asse, sempre fra 6 e 31: i pezzi piccoli tendono a essere più veloci.
- **Punti** [P `$7659`]: grande **20**, medio **50**, piccolo **100**. Solo la nave e i suoi colpi fanno punti: se un asteroide lo distrugge il disco volante, nessuno guadagna niente.
- **Pausa fra le ondate** [P `$6F87`]: quando esplode l'ultimo asteroide passano **127 passi** (circa 2 secondi) prima della nuova ondata, e la nuova ondata aspetta anche che il disco volante se ne vada.

### Le collisioni

Il programma non usa cerchi né rettangoli, ma una via di mezzo facile da calcolare con un processore a 8 bit: un **ottagono** [P `$6A13`]. Due oggetti si toccano se le distanze in orizzontale e in verticale sono entrambe entro un raggio R, e la loro somma entro 1,5 × R. Il raggio è la somma di due valori, uno per l'oggetto colpito e uno per chi colpisce [P `$6A55`]:

| Oggetto colpito                        | Valore | Chi colpisce     | Valore |
| -------------------------------------- | ------ | ---------------- | ------ |
| asteroide piccolo, nave, disco piccolo | 42     | un colpo         | 0      |
| asteroide medio, disco grande          | 72     | la nave          | 28     |
| asteroide grande                       | 132    | il disco piccolo | 19     |
|                                        |        | il disco grande  | 37     |

I valori sono in unità di posizione, sulla metà della distanza: per esempio un colpo tocca un asteroide grande entro 264 unità di posizione, cioè 33 unità del DVG.

Chi può colpire chi [P `$69F0`]: i colpi della nave colpiscono asteroidi, disco volante e **la nave stessa**; i colpi del disco colpiscono nave e asteroidi; il disco si scontra con nave e asteroidi; la nave con gli asteroidi. I colpi non si colpiscono fra loro.

Una curiosità: il controllo **non tiene conto del bordo che si richiude** [P]. Due oggetti che si toccano a cavallo del bordo, uno a destra e uno a sinistra, non si scontrano. Il remake farà lo stesso.

## 5. I dischi volanti

- **Due tipi** [P `$6C12`]: il **grande**, lento a mirare, vale **200** punti; il **piccolo** vale **1000** [P `$6B85`: il programma somma 990 più un riporto, e i commenti del disassemblato riportano per errore 990].
- **Quando arrivano** [P `$68F8`, `$6BD0`]: un conto alla rovescia di circa 9,5 secondi, che si accorcia di 0,4 secondi a ogni disco fino a un minimo di circa 2 secondi. Il conto avanza solo mentre la nave è in gioco.
- **La regola contro chi "si nasconde"** [P `$6BBC`]: se il giocatore ha colpito un asteroide negli ultimi 5 secondi, il disco arriva solo quando restano pochi asteroidi (meno di 6 nella prima ondata, fino a meno di 10 più avanti). Se invece il giocatore non colpisce niente, magari aspettando in un angolo, il disco arriva comunque, e sempre più spesso.
- **Grande o piccolo** [P `$6C12`]: i primi tre dischi sono sempre grandi; da **30.000 punti** sempre piccoli; in mezzo la probabilità del piccolo cresce con il tempo.
- **Movimento** [P `$6BDD`, `$6C34`]: entra da sinistra o da destra a un'altezza a caso, a 16 unità per passo (8 secondi per attraversare lo schermo). Ogni 128 passi può cambiare rotta: diagonale in su, in giù o dritto. Quando raggiunge il bordo opposto sparisce.
- **Sparo** [P `$6C45`]: al massimo 2 colpi, il primo dopo circa 72 passi, poi uno ogni **40 passi**; stessa durata e velocità dei colpi della nave. Non spara mentre la nave è esplosa o in iperspazio.
  - Il **grande** spara in una direzione a caso.
  - Il **piccolo** mira alla nave, con un errore a caso di ±16 unità di direzione (±22 gradi), che si dimezza a ±8 da **35.000 punti**.
- **Il disegno** [R `$1252`]: lo stesso disegno a due scale, 40 unità del DVG il grande e 20 il piccolo.

## 6. L'iperspazio

- **Il salto** [P `$6E74`]: la nave sparisce per **48 passi** (0,8 secondi), si ferma e riappare in un punto a caso, lontano dai bordi. **Nessun controllo di sicurezza**: può riapparire sopra un asteroide.
- **Il rischio** [P `$6EB3`]: su 32 casi, 24 vanno sempre bene. Negli altri 8 il programma calcola un numero fra 4 e 18 e **fa esplodere la nave se è maggiore o uguale al numero di asteroidi** sullo schermo. Quindi il rischio è più alto **con pochi asteroidi**: 25% quando ne restano 4 o meno, zero da 19 in su. Un articolo di 6502disassembly.com dice il contrario; il remake segue il programma.

## 7. Vite, punteggio, fine partita

- **Vite** [P `$6ED8`]: 3 o 4 navi, secondo un interruttore interno. Il remake ne usa 3 [N].
- **Vita extra** [P `$7397`]: ogni **10.000 punti**, senza limite, con un suono dedicato.
- **Punteggio** [P]: quattro cifre in memoria più uno zero finale fisso, quindi il massimo è **99.990**; poi riparte da zero. I giocatori più bravi dell'epoca facevano il giro del contatore.
- **Inizio partita** [P `$68F0`]: per circa 2 secondi compare "PLAYER 1" e la nave non si muove, mentre gli asteroidi sì.
- **Fine partita** [P `$6970`]: quando le navi finiscono (e i colpi ancora in volo si sono spenti) compare "GAME OVER".
- **Record**: l'originale ha una tabella dei 10 migliori con le iniziali, tenuta in RAM e persa allo spegnimento. Il remake salverà nel browser il record, come negli altri due giochi [N].
- **Due giocatori** [P]: a turno a ogni vita persa. Il remake parte con un giocatore [N], come Breakout.

## 8. Le esplosioni

- **Asteroidi e dischi** [R `$10F8`, P `$6F62`]: una nuvola di 10 punti che si allarga per circa 37 passi (0,6 secondi). La ROM ha quattro versioni dello stesso disegno, sempre più larghe, per riempire i salti di scala per potenze di due: un trucco elegante per ottenere un'espansione fluida.
- **La nave** [R `$10E0`, P `$7465`]: si rompe in **6 segmenti** che volano via ognuno con la sua velocità [R `$10EC`] e spariscono uno alla volta; l'esplosione dura 192 passi (circa 3 secondi).

## 9. I suoni

Asteroids non ha un chip sonoro programmabile: ogni suono è un piccolo circuito analogico dedicato che il programma accende e spegne [H].

- **Il battito** [P `$7588`]: due note gravi alternate, "tum... tum...", accese per 4 passi. La pausa parte da 48 passi e si accorcia di un passo ogni 64, fino a 8: il ritmo accelera durante l'ondata e crea tensione. Viene spesso citato come uno dei primi esempi di musica che segue il ritmo del gioco.
- **Sparo** [P `$75CD`, H]: un fischio che scende da 820 a 110 Hz in circa 0,3 secondi; quello del disco è più corto e acuto.
- **Spinta** [H]: rumore bianco filtrato, grave.
- **Esplosioni** [P `$6B4A`, H]: rumore che si spegne in circa un secondo, più grave per gli asteroidi grandi e più acuto per i piccoli.
- **Disco volante** [H]: una sirena che oscilla attorno a 500 Hz (grande, lenta) o 750 Hz (piccolo, veloce).
- **Vita extra** [H]: un bip acuto intermittente, per circa 1,5 secondi.

Le frequenze vengono dai modelli dei circuiti di MAME; il remake le sintetizzerà con `@arcade/audio` e le regolerà a orecchio [N].

## 10. Schermate e scritte

- **Font vettoriale** [R `$14F0`–`$16C6`]: lettere e cifre sono piccoli disegni di linee nella ROM, larghi 8 unità e alti 12 (a scala piena). Lo zero è la lettera O.
- **In alto** [P `$724F`]: il punteggio a sinistra, il record al centro in piccolo, sotto il punteggio le navi rimaste come piccole icone.
- **In basso** [R `$10A4`]: "© 1979 ATARI INC", sempre visibile.
- **Scritte** [P `$77F6`]: "PUSH START" lampeggiante, "PLAYER 1", "GAME OVER", "HIGH SCORES". Il programma conteneva anche le traduzioni in tedesco, francese e spagnolo.
- **Schermata di attesa** [P]: asteroidi e dischi volanti si muovono da soli, senza suoni; ogni 16 secondi circa compare la tabella dei record.

## 11. Curiosità

1. **La direzione della nave non si azzera mai**, nemmeno fra una partita e l'altra.
2. **I propri colpi possono uccidere la nave** dopo il giro dello schermo.
3. **Le collisioni ignorano il bordo che si richiude.**
4. **L'iperspazio è più rischioso con pochi asteroidi**, il contrario di quello che si legge spesso.
5. **Il disco piccolo vale 1000 punti, non 990**: il riporto di un'istruzione precedente aggiunge l'ultima decina.
6. **Un piccolo errore nel programma** [P `$6EF1`]: azzerando il punteggio a inizio partita, il ciclo cancella anche l'ultima iniziale del decimo record.
