# Space Invaders

Remake di _Space Invaders_ (Taito, 1978) su HTML5 Canvas, costruito sui pacchetti condivisi `@arcade/*`.

![Space Invaders in gioco](../../docs/images/space-invaders-gameplay.png)

## Come si gioca

| Tasto                | Azione                        |
| -------------------- | ----------------------------- |
| **C** o **5**        | Inserisce una moneta e inizia |
| Frecce o **A**/**D** | Muove il cannone              |
| **Spazio**           | Spara                         |
| **M**                | Toglie e rimette l'audio      |

Il gioco è completo: la formazione di 55 alieni marcia e accelera come nell'originale, lancia tre tipi di bombe, i quattro bunker si sgretolano colpo dopo colpo, l'UFO passa ogni 25 secondi con il suo punteggio "misterioso". Tre vite, una vita extra a 1500 punti, record della sessione e ondate che partono sempre più in basso.

```bash
pnpm dev     # dalla root del monorepo
pnpm build   # output in games/space-invaders/dist: index.html + game.css + game.js
```

## Guide del gioco

- [Le meccaniche dell'originale](docs/meccaniche-originali.md): marcia degli alieni, bombe, bunker, UFO e il trucco del 23° colpo, con le fonti.
