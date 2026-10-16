# Pac-Man

Remake di _Pac-Man_ (Namco, 1980) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

Stato: **in costruzione** sul branch `feature/pacman`. Le regole vengono dal programma della ROM originale, letto con un disassemblatore Z80 e con il disassemblato commentato di Ms. Pac-Man: vedi [le meccaniche dell'originale](docs/meccaniche-originali.md).

```bash
pnpm dev:pacman   # dalla root del monorepo
pnpm build        # output in games/pacman/dist: index.html + game.css + game.js
```
