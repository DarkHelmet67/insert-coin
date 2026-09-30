# Asteroids

Remake di _Asteroids_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Per ora la pagina mostra uno schermo vuoto con il primo asteroide della ROM; il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

```bash
pnpm dev:asteroids  # dalla root del monorepo
pnpm build          # output in games/asteroids/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo vettoriale, nave, asteroidi, dischi volanti, iperspazio e suoni, ricavati dal programma originale.
