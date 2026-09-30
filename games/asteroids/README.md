# Asteroids

Remake di _Asteroids_ (Atari, 1979) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione**. Per ora la pagina mostra, fermi, tutti i disegni della ROM originale (asteroidi, nave, dischi volanti, esplosioni, scritte) tracciati dal motore vettoriale `@arcade/vector`; il gioco arriva un passo alla volta, e ogni passo è pubblicato online.

I valori incerti (per ora l'aspetto del fascio: spessore, alone, luminosità) sono tutti in [`src/tuning.config.ts`](src/tuning.config.ts).

```bash
pnpm dev:asteroids  # dalla root del monorepo
pnpm build          # output in games/asteroids/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): schermo vettoriale, nave, asteroidi, dischi volanti, iperspazio e suoni, ricavati dal programma originale.
- [11 · Grafica vettoriale](../../docs/11-grafica-vettoriale.md): il motore vettoriale condiviso, dai disegni della ROM alle linee luminose.
