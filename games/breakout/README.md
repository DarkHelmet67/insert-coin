# Breakout

Remake di _Breakout_ (Atari, 1976) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **completo**. Schermata di attesa, battuta, rimbalzi, accelerazioni, racchetta dimezzata, secondo muro, tre palle, suoni del circuito e record salvato nel browser.

| Comando                     | Azione                           |
| --------------------------- | -------------------------------- |
| Mouse o dito                | Muove la racchetta               |
| Frecce o **A**/**D**        | Muove la racchetta               |
| Clic, tocco, spazio o Invio | Avvia la partita, poi serve      |
| **M**                       | Audio sì/no                      |
| **V**                       | Schermo monocromatico o a colori |

All'apertura il gioco è in attesa, come il cabinato: la pallina rimbalza da sola su una racchetta larga quanto lo schermo. Il primo clic (o tocco, spazio, Invio) avvia la partita, il secondo serve la pallina. Il numero in alto a destra, dove l'originale mostrava il punteggio del secondo giocatore, è il record, salvato nel browser.

La racchetta sta dove sta il puntatore, come sul cabinato stava dove girava la manopola. Sul telefono il dito può scorrere ovunque, anche sotto lo schermo di gioco, così non copre la pallina.

I valori incerti (velocità, angoli, posizioni) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts), i colori in [`src/colors.config.ts`](src/colors.config.ts).

```bash
pnpm dev:breakout   # dalla root del monorepo
pnpm build          # output in games/breakout/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo, mattoni, racchetta, pallina e suoni, ricavati dal manuale e dallo schema elettrico.
- [10 · Un secondo gioco: Breakout](../../docs/10-secondo-gioco.md): come il gioco riusa i pacchetti di Space Invaders e che cosa aggiunge.

## Modalità debug

Per provare i livelli avanzati, in [`src/tuning.config.ts`](src/tuning.config.ts) c'è la sezione `debug`. Con `enabled: true` le sue opzioni valgono: con `startLevel: 2` si parte dal secondo muro, con `godMode` la pallina rimbalza sul fondo, con `fullPaddle` la racchetta occupa tutto lo spazio fra i muri (lo stesso trucco della schermata di attesa), con `startHits` ogni battuta parte con dei colpi già contati, per vedere subito le accelerazioni. Con il debug acceso compare la scritta DEBUG e il record non viene salvato; nelle anteprime delle pull request è acceso da solo. Da rimettere a `false` prima di pubblicare: un test lo controlla. Tutti i dettagli nella [guida 18](../../docs/18-modalita-debug.md).
