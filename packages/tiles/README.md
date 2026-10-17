# @arcade/tiles

La grafica a tile dei coin-op Namco (Pac-Man, Galaga e la loro famiglia): tile di 2 bit per pixel scritti come "ASCII art" (`.` trasparente, `1`, `2`, `3` i tre colori), specchiature come le fa l'hardware, colori letti dalle PROM (`BBGGGRRR` con i pesi delle resistenze) e disegno su canvas.

- `parseArt`, `flipArt`, `joinArt`: dall'ASCII art ai tre livelli di colore da disegnare.
- `promColor`, `lookupColors`: dal byte della PROM al colore CSS, dalla tavolozza ai tre colori del tile.
- `drawArt`: disegna un tile con i suoi colori.

Nato da Galaga e condiviso con Pac-Man. Guida: [17 · Il sesto gioco: Pac-Man](../../docs/17-sesto-gioco.md).
