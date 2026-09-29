# Breakout

Remake di _Breakout_ (Atari, 1976) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Il gioco è completo: schermata di attesa, battuta, rimbalzi, accelerazioni, racchetta dimezzata, secondo muro, tre palle, suoni del circuito e record salvato nel browser. Manca la documentazione finale.

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

## Modalità debug

In [`src/tuning.config.ts`](src/tuning.config.ts) c'è `debug: false`. Con `true` la racchetta occupa tutto lo spazio fra i muri e la pallina non si perde mai: si possono osservare le accelerazioni e il secondo muro senza dover giocare bene. È lo stesso trucco della schermata di attesa. Da rimettere a `false` prima di pubblicare.
