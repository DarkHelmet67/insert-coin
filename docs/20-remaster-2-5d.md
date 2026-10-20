# 20 · Remaster 2.5D

Obiettivo: una **remaster 2.5D** di Space Invaders, con oggetti metallici in rilievo, una telecamera che segue il cannone ed esplosioni di particelle, **senza toccare una riga** della cartella `games/space-invaders`. Le regole restano quelle del 1978, verificate dagli stessi test; cambia solo l'aspetto.

Il gioco è in [`games/space-invaders-25d`](../games/space-invaders-25d) e si prova online su `/space-invaders-25d/`.

## 1. Le decisioni

| Domanda                     | Scelta                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Libreria 3D                 | **Three.js**: materiali metallici, riflessi e migliaia di cubi in una chiamata, senza scriverli da zero   |
| Dove vive                   | Una cartella nuova, `games/space-invaders-25d`, con il suo `package.json`                                 |
| Il gioco originale          | **Intatto**: la remaster ne importa i moduli                                                              |
| Sfondo                      | Un gradiente CSS dal terreno al cielo, con gli stessi colori che il metallo riflette; per ora nessun menu |
| Record                      | Separato da quello dello Space Invaders classico, per non confondere i due giochi                         |
| Il peso dei giochi classici | **Invariato**: Three.js sta solo in pacchetti nuovi, e un controllo in CI lo verifica                     |

L'analisi che ha portato a queste scelte è nel diario AI, alla data del 20 ottobre 2026.

## 2. Stesso cervello, corpo nuovo

Space Invaders separa già lo **stato puro** (`updateGame`) dal **disegno** (`renderGame`). Il `package.json` del gioco originale non ha un campo `exports`, quindi un altro pacchetto del workspace ne può importare i file direttamente, con un _import profondo_:

```ts
// games/space-invaders-25d/package.json → "@arcade/space-invaders": "workspace:*"
import { initialGameState, updateGame } from '@arcade/space-invaders/src/game';
import { sounds, soundsFor } from '@arcade/space-invaders/src/sounds';
import { renderGame } from '@arcade/space-invaders/src/render';
```

Il `main.ts` della remaster è quasi uguale a quello originale: stessa tastiera, stesso pannello touch, stessi suoni, stessa modalità debug. Cambia solo cosa succede quando si disegna.

Il rischio di questa scelta è l'accoppiamento: se un giorno si rinomina una funzione di Space Invaders, la remaster smette di compilare. Ma il typecheck in CI lo segnala al primo push, non in produzione.

## 3. Il trucco: un contesto che registra

Tutti i giochi a pixel disegnano attraverso `DrawingContext` di `@arcade/render`, che usa solo `fillStyle` e `fillRect`. Il pacchetto **`@arcade/voxel`** offre un finto contesto che invece di dipingere **ricorda** i rettangoli:

```ts
const recorder = createDrawingRecorder(SCREEN_WIDTH, SCREEN_HEIGHT);
renderGame(recorder.ctx, state); // il disegno originale, identico
const rects = recorder.take(); // ogni fillRect, con il suo colore
```

Così la remaster non ridisegna nulla: alieni, scudi rosicchiati, colpi, bombe, UFO, scritte, la schermata di attesa e il GAME OVER arrivano già dal codice del 1978. Ogni pixel acceso diventa un **voxel**, un cubetto (`rectsToVoxels`). Il pavimento verde resta in 3D, mentre il punteggio in alto e le vite in basso vanno su un canvas piatto sopra la scena, così si leggono sempre (`splitScreen` in `screen.ts`).

Una sola cosa la remaster toglie dal disegno: lo sprite dell'esplosione degli alieni, perché al suo posto l'alieno si sbriciola in particelle (`drawableState`).

## 4. La scena: `@arcade/scene3d`

È l'unico pacchetto che dipende da Three.js:

- **`createStage`**: renderer con sfondo trasparente (dietro c'è il gradiente CSS), scena, telecamera, adattamento alla dimensione del canvas. Il campo di gioco è un gruppo **inclinato all'indietro** come un tavolo: gli invasori lontani, il cannone vicino.
- **`createVoxelLayer`**: migliaia di cubi arrotondati (`RoundedBoxGeometry`) come istanze di un'unica mesh (`InstancedMesh`). Il campo di gioco ne ha circa 4000, che costano una sola chiamata alla scheda grafica.
- **`createMetalMaterial`**: un `MeshPhysicalMaterial` con `metalness`, `roughness` e una vernice trasparente (`clearcoat`). Ogni cubo ha il suo colore, preso dalla tavolozza dell'originale: il tasto V passa ancora al monitor in bianco e nero.

Three.js si configura per assegnamento (`mesh.count = ...`), come il contesto canvas: per `stage.ts`, `voxel-layer.ts` e il registratore la regola sull'immutabilità è spenta, e l'eccezione è scritta in [CLAUDE.md](../CLAUDE.md). Le funzioni di calcolo restano pure e testate.

## 5. Riflessi senza immagini

Un metallo che non ha nulla da riflettere sembra plastica nera. `createGradientEnvironment` costruisce l'ambiente riflesso senza file: una sfera dipinta con lo stesso gradiente dello sfondo, più due pannelli luminosi come i softbox di un fotografo, filtrati da Three.js (PMREM) per le superfici lucide e per quelle opache.

I tre colori stanno in un solo posto, la sezione `sky` di `tuning.config.ts`: `paintSky` li passa al CSS come proprietà personalizzate (`--ground`, `--horizon`, `--sky`), così sfondo e riflessi non possono divergere.

## 6. La visuale che segue il cannone

La telecamera sta ferma davanti al campo, un po' più in alto. A muoversi è il **campo di gioco**, che oltre a essere inclinato all'indietro (asse X) ruota su due assi, ognuno con il suo massimo in `tuning.config.ts`:

- **`maxRoll`**, asse Z: il piano gira in senso orario o antiorario. Dà il senso del movimento, ma se è troppo fa venire il mal di mare.
- **`maxTurn`**, asse Y: il piano si gira verso sinistra o verso destra e mostra i fianchi di invasori e scudi.

La prima versione faceva invece girare la telecamera intorno al campo inclinato. Luca, provandola, ha visto quasi solo una rotazione sull'asse Z, e troppo ampia: con il campo inclinato, un'orbita della telecamera si vede soprattutto come rotazione del piano (circa 12° sul pavimento a fine corsa). Ora le due rotazioni sono separate e regolabili, entrambe a 6°. `orientPlayfield` di `@arcade/scene3d` le applica in ordine (X, poi Z, poi Y) intorno agli assi del mondo, così ognuna mantiene il suo significato.

Le funzioni pure sono in `camera.ts` e in `@arcade/scene3d`:

- **`viewLean`**: quanto la visuale pende verso un lato, da -1 (cannone tutto a sinistra) a 1 (tutto a destra). Nella schermata di attesa oscilla da sola. `playfieldAngles` lo traduce nei due angoli.
- **`smoothTowards`**: lo smorzamento esponenziale. A ogni frame si copre una parte della distanza che dipende dal tempo trascorso, `1 - e^(-rate·dt)`, quindi il movimento è uguale a 30, 60 o 144 fotogrammi al secondo. Un "10% a frame" andrebbe al doppio della velocità su uno schermo a 120 Hz.
- **`fitDistance`**: la distanza a cui l'intero campo sta nell'inquadratura, che sia la finestra larga di un PC o lo schermo stretto di un telefono.

Se il sistema chiede **meno movimento** (`prefers-reduced-motion`), il campo ruota solo per un quarto.

## 7. Esplosioni di particelle

Come i suoni dell'originale (`soundsFor(prev, next)`), le esplosioni si trovano **confrontando due stati**: `findBursts` in `bursts.ts`. La logica di gioco non sa che esistono.

- **Alieno colpito**: l'originale crea un effetto `alien` nel punto dell'esplosione. L'alieno colpito è quello, nello stato precedente, la cui esplosione cadrebbe esattamente lì: lo calcola `explodeAlien`, la stessa funzione che usa il gioco. Cercare "l'alieno sparito" non basta: quando muore l'ultimo, nello stesso passo arriva la formazione nuova e nessuno risulta mancante. Un test se n'è accorto.
- **UFO e cannone**: il loro sprite nella posizione prima del colpo.
- **Scudi**: i pixel accesi prima e spenti dopo diventano detriti. Il confronto parte solo se la bitmap è cambiata, cosa che con lo stato immutabile si vede da `before.bitmap === after.bitmap`.

Il pacchetto **`@arcade/particles`** è puro: `createBurst` lancia ogni frammento lontano dal centro e verso il giocatore, con una rotazione; `stepParticles` li muove, li fa cadere e li elimina a fine vita. Il caso arriva da una funzione passata come parametro, quindi i test sono ripetibili.

## 8. Prestazioni

Misurate sul codice, non stimate:

- **Triangoli**: un cubo arrotondato con 2 passi di smussatura ha 300 triangoli, con 1 passo 108, un cubo semplice 12. Con 4000 cubi la differenza è fra 1,2 milioni e 430 mila triangoli: si usa **1 passo**, ed è un valore di `tuning.config.ts`.
- **Matrici**: per i cubi fermi la matrice è solo scala più spostamento, senza calcolare la rotazione.
- **Voxel**: quasi tutti i rettangoli sono una riga di uno sprite, e quel caso evita gli array intermedi (da 2,5 a 1 ms per schermata).
- **Ricostruzione**: i voxel si rifanno solo quando lo stato del gioco cambia. Su uno schermo a 120 Hz ogni passo di gioco si vede due volte, ma si ricostruisce una sola.

Il browser senza schermo usato per le prove disegna in software, quindi non dice nulla sulla fluidità reale: va provata su un telefono vero, con l'anteprima della pull request.

## 9. I giochi classici non ingrassano

Il bundle della remaster pesa circa 140 kB compressi, quello di Space Invaders 10 kB. Ogni gioco ha la sua build, e un bundle contiene solo ciò che il gioco importa, quindi Three.js non può finire nei giochi classici, **a patto che non entri nei pacchetti che usano anche loro**. Per questo vive solo in `@arcade/scene3d`.

Perché la regola non dipenda dalla memoria di nessuno, `scripts/check-bundles.js` (`pnpm check:bundles`, eseguito dalla CI e da `build:site`) controlla dopo la build che:

- nessun gioco classico contenga Three.js (la stringa `__THREE__`, con cui la libreria registra la sua versione);
- ogni gioco classico stia nel suo **budget** in kB compressi, scritto in [`scripts/bundle-budgets.json`](../scripts/bundle-budgets.json).

Un gioco è una remaster se dipende da `@arcade/scene3d`, e allora non ha budget. Se un gioco classico deve crescere davvero, si alza il suo budget nella stessa modifica: la crescita diventa una decisione, non un incidente.

## 10. Verso le altre remaster

Il registratore funziona con qualunque gioco che disegna con `fillRect`: per gli altri giochi a pixel la strada è la stessa. I giochi vettoriali (Asteroids, Lunar Lander) disegnano linee invece di rettangoli e chiederanno un registratore di segmenti, per esempio tubi luminosi. Prima di ogni nuova remaster va controllato come quel gioco disegna.
