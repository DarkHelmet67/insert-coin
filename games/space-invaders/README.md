# Space Invaders

Remake di _Space Invaders_ (Taito, 1978) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: schermata d'attesa con la tabella dei punteggi; con **C** (o **5**) si inserisce una moneta. In gioco il cannone si muove con le frecce o **A**/**D** e spara con lo **spazio**; i colpi distruggono gli alieni (per ora fermi) e fanno salire il punteggio. Moneta, sparo e alieno colpito hanno i loro effetti sonori; **M** toglie e rimette l'audio.

```bash
pnpm dev     # dalla root del monorepo
pnpm build   # output in games/space-invaders/dist: index.html + game.css + game.js
```

Le guide specifiche del gioco (formazione degli alieni, bunker, UFO, punteggi) andranno in [docs/](docs/).
