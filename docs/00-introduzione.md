# 00 · Introduzione

## Perché questo progetto

`insert-coin` mostra come ricostruire un videogioco arcade degli anni '80 con strumenti web moderni, lavorando insieme a un assistente AI (Claude). Non è un emulatore: il comportamento dei giochi originali viene studiato e riscritto in TypeScript.

## Come è organizzato il lavoro con l'AI

- **Le decisioni restano umane.** L'AI propone alternative con pro e contro; la scelta finale (motore, struttura, nomi) è dell'autore. Esempio: la scelta fra Phaser e Canvas è documentata nel [diario AI](ai-workflow.md).
- **Ogni passo è verificabile.** Ogni modifica passa da typecheck, lint, test e build prima del commit.
- **Gli errori dell'AI sono documentati**, non nascosti: il diario registra cosa è stato corretto e perché.

## Come leggere le guide

Le guide sono numerate e vanno lette in ordine: ognuna parte dal risultato della precedente e aggiunge un pezzo al motore condiviso. Le guide specifiche di un gioco stanno in `games/<gioco>/docs/`.

## Vuoi rifarlo da zero?

Il [prompt unico](prompt-unico.md) contiene in un solo messaggio tutte le decisioni prese durante lo sviluppo: incollato in un assistente AI con accesso al terminale, ricostruisce il progetto fase per fase. Le guide restano il modo per capire _perché_ ogni pezzo è fatto così.
