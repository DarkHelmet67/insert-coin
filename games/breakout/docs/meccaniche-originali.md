# Le meccaniche dell'originale

Questa guida spiega come funziona _Breakout_ (Atari, 1976) "dentro": lo schermo, i mattoni, la racchetta, la pallina e i suoni. Per ogni regola indica la fonte e, quando serve, il file che la implementa.

A differenza di Space Invaders, **Breakout non ha un processore né un programma**: è fatto di circa cento chip di logica TTL collegati fra loro (il progetto è attribuito a Steve Wozniak e Steve Jobs, poi rifatto da Atari). Non c'è un codice da disassemblare: le regole si ricavano dal manuale e dallo schema elettrico, che il progetto MAME ha trascritto in una _netlist_ simulabile.

Tutti i valori incerti stanno in un solo file, [`tuning.config.ts`](../src/tuning.config.ts), ognuno con la sua marcatura: per provare un'altra velocità o un'altra posizione basta cambiare un numero lì. I colori stanno in [`colors.config.ts`](../src/colors.config.ts).

Ogni valore è marcato così:

- **[M]** detto dal manuale o da un'altra fonte scritta;
- **[C]** ricavato leggendo il circuito (netlist MAME), non verificato in simulazione;
- **[N]** scelta nostra, dove le fonti non dicono nulla.

## Fonti

- [Manuale Atari di Breakout](https://archive.org/stream/ArcadeGameManualBreakout/breakout_djvu.txt): istruzioni, regole, parti di ricambio (testo OCR su archive.org).
- [MAME · netlist di Breakout](https://github.com/mamedev/mame/blob/master/src/mame/atari/nl_breakout.cpp): lo schema elettrico del cabinato, porta per porta.
- [MAME · driver](https://github.com/mamedev/mame/blob/master/src/mame/atari/pong.cpp) e [layout con i colori delle pellicole](https://github.com/mamedev/mame/blob/master/src/mame/layout/breakout.lay).
- [Wikipedia · Breakout](<https://en.wikipedia.org/wiki/Breakout_(video_game)>): storia e regole viste dal giocatore.

## 1. Lo schermo e i pixel non quadrati

Il monitor è in bianco e nero e montato in verticale [M]. Il circuito non conosce "pixel": conta i passi di un contatore orizzontale (H) e le righe di scansione (V). Con il monitor ruotato, **H scorre dall'alto in basso** e **le righe da un lato all'altro** [C].

Un passo di H è circa **1,48 volte più lungo** dello spessore di una riga [C]. Per restare fedeli il remake lavora nelle unità originali, 228 righe × 208 passi, e lascia al CSS il compito di allungare l'immagine alla forma vera, 228:308:

```css
#screen {
  aspect-ratio: 228 / 308;
  image-rendering: pixelated;
}
```

Il canvas non si deforma nel codice: ogni misura del gioco resta quella del circuito. Codice: [`playfield.ts`](../src/playfield.ts), [`style.css`](../src/style.css).

Il circuito disegna un'immagine completa circa **63,4 volte al secondo** (252 righe da 62,6 µs), non 60 [C].

## 2. Il campo di gioco

Dall'alto in basso, in passi di H dall'inizio dell'immagine visibile [C]:

| Elemento          | Posizione | Note                                                          |
| ----------------- | --------- | ------------------------------------------------------------- |
| Muro in alto      | 0–7       | il "back wall"                                                |
| Numeri e punteggi | 8–39      | giocatore di turno e numero della palla sopra, punteggi sotto |
| Mattoni           | 40–71     | 8 file da 4 passi, separate da una riga sottile               |
| Racchetta         | 188–191   | 4 passi di spessore                                           |
| Palla persa       | oltre 208 | quando esce dal fondo dello schermo                           |

Da un lato all'altro: due muri laterali di 4 righe e, fra i muri, **14 colonne di mattoni** da 14 righe con 2 righe di spazio [M: "8 rows of 14 bricks each"; C: misure]. Il primo mattone a sinistra è in parte nascosto dal muro [C].

Oggetti: pallina 4 righe × 2 passi, racchetta 16 righe × 4 passi [C].

### I colori: pellicole sul vetro

Come in Space Invaders, il colore non viene dal monitor: **quattro strisce di pellicola trasparente**, ognuna sopra due file di mattoni, dall'alto **rossa, arancione, verde, gialla**, più una quinta striscia sopra la zona della racchetta [M]. Tutto il resto è bianco, e la pallina prende il colore della striscia che attraversa.

Colori della striscia della racchetta e valori RGB: dal layout di MAME (rosso, arancione, verde, giallo, **blu** per la racchetta) [M: MAME]. Altezza della striscia della racchetta: dalla riga 180 alla 199 [N].

Il remake riproduce la pellicola alla lettera: disegna tutto in bianco, poi stende sopra ogni striscia con un rettangolo in modalità `multiply`. Il bianco sotto la striscia prende il suo colore, il nero resta nero, e anche i muri laterali si colorano dove la striscia li attraversa, come sul cabinato. Codice: [`render-film.ts`](../src/render-film.ts).

Fra una fila di mattoni e l'altra il circuito lascia una sottile riga scura, più sottile di un passo: il remake usa un passo intero [N].

## 3. Punteggio e secondo muro

- **Punti per mattone** [M]: gialli 1, verdi 3, arancioni 5, rossi 7. Un muro vale 448 punti.
- **Secondo muro** [M]: finiti i mattoni, ne compare un secondo set completo, **una sola volta**: il massimo è 896. Nel circuito il nuovo muro non si attiva contando i mattoni, ma **con il punteggio**: al primo colpo di racchetta dopo 448 punti [C].
- **Ticchettio** [C]: il punteggio sale subito, ma i "tic" sonori sono messi in coda e suonano uno per punto: un mattone rosso fa 7 tic in circa mezzo secondo.
- **Cifre a sette segmenti** [C]: tre cifre per giocatore, disegnate da decoder 7448 come quelle di un orologio digitale. In alto a sinistra il giocatore di turno e sotto il suo punteggio, in alto a destra il numero della palla e sotto il punteggio dell'altro giocatore. Posizione esatta e spessore dei segmenti sono nostri [N]. Codice: `drawSegmentDigit` in [`@arcade/render`](../../../packages/render/src/seven-segment.ts).
- **Punteggio lampeggiante** [M]: durante il gioco il punteggio del giocatore di turno lampeggia, circa 4 volte al secondo [C].
- **Record**: l'originale non ha un record; il remake lo aggiunge come Space Invaders [N].

## 4. Palle, battuta, giocatori

- **3 palle** per partita (5 con un interruttore interno) [M]. Il remake usa 3 [N].
- **La battuta** [M]: il giocatore preme il pulsante **SERVE**; "entro quattro secondi" la pallina compare a metà schermo e scende lentamente verso la racchetta. Il ritardo nasce dal circuito: la pallina si muove già, invisibile, e appare solo quando attraversa una certa fascia [C]. Direzione laterale di fatto casuale [C].
- **1 o 2 giocatori**, a turno a ogni palla persa [M]. Il remake parte con un giocatore [N].

## 5. La racchetta

- **Manopola a potenziometro** [M]: la posizione della manopola è la posizione della racchetta. È il motivo per cui nel remake la racchetta **segue il mouse o il dito**: è lo stesso tipo di controllo.
- Nel remake, la racchetta si centra sulla posizione del mouse o del dito, letta in unità dello schermo di gioco con il nuovo `createPointerPosition` di `@arcade/input`. Con le frecce si sposta di 3 righe per immagine [N]. Si ferma ai muri laterali: la corsa esatta della manopola non è nota [N]. Codice: [`paddle.ts`](../src/paddle.ts).
- **Racchetta dimezzata** [M]: quando la pallina tocca il muro in alto, la racchetta si riduce a metà (16 → 8 righe) [C]. Torna intera alla battuta successiva [C].

## 6. La pallina

Il movimento è per passi interi a ogni immagine: in verticale 1, 2 o 3 passi, di lato 1, 2 o 3 righe [C]. **Mai zero**: la pallina non va mai dritta in verticale né in orizzontale.

La racchetta è divisa in **4 segmenti** [M: "4 directions"; C]: la metà colpita decide se la pallina va a destra o a sinistra, i segmenti esterni danno un angolo più aperto di quelli centrali.

| Situazione                        | In verticale | Di lato (esterni) | Di lato (centrali) |
| --------------------------------- | ------------ | ----------------- | ------------------ |
| Colpi 0–3 (battuta)               | 1            | 2                 | 1                  |
| Colpi 4–7 (prima accelerazione)   | 2            | 2                 | 1                  |
| Colpi 8–11                        | 1            | 3                 | 3                  |
| Colpi 12+ (seconda accelerazione) | 2            | 3                 | 3                  |
| Dopo un mattone arancione o rosso | 3            | 3                 | 3                  |

Il manuale conferma le tre accelerazioni (4° colpo, 12° colpo, primo mattone arancione o rosso) e che "gli angoli diventano più verticali con la velocità" [M]. La riga "colpi 8–11" viene solo dalla lettura del circuito ed è il valore più incerto [C].

### Un mattone per viaggio

Dopo aver colpito un mattone, **la pallina attraversa gli altri mattoni** finché non tocca la racchetta o il muro in alto [C]. È ciò che rende possibile il colpo più famoso del gioco: aperto un varco, la pallina sale oltre i mattoni e **rimbalza fra il muro e le file rosse**, raccogliendo punti a ripetizione [M].

## 7. Suoni

Tre suoni durante il gioco, nessuno in attesa [M], tutti onde quadre ricavate dai contatori del circuito [C]:

| Suono    | Quando                   | Tono         | Durata                      |
| -------- | ------------------------ | ------------ | --------------------------- |
| "Blip"   | pallina sulla racchetta  | circa 2 kHz  | circa 9 ms                  |
| "Bounce" | pallina su un muro       | circa 1 kHz  | circa 21 ms                 |
| "Tic"    | ogni punto di un mattone | circa 500 Hz | circa 9 ms, uno ogni ~75 ms |

Nessun suono per la palla persa [C].

## 8. Attesa e fine partita

- **Schermata di attesa** [M]: la pallina viene servita da sola e la racchetta è una riga intera, così la pallina rimbalza sempre; i mattoni non spariscono, niente suoni.
- **Fine partita** [M]: persa l'ultima palla, si torna all'attesa.

## Valori incerti

- La tabella delle velocità, soprattutto la riga "colpi 8–11", e se contano come "colpi" solo quelli della racchetta.
- Il suono sul muro in alto: il manuale lo cita, il circuito sembra suonare solo sui muri laterali.
- La corsa esatta della racchetta (arriva fino ai muri?) e lo spazio fra le file di mattoni.
- Il colore della striscia della racchetta (blu solo secondo MAME).

Dove il remake deve scegliere, la scelta sarà segnalata qui con [N].
