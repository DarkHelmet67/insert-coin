# @arcade/scene3d

La scena 3D delle remaster 2.5D, su Three.js: renderer trasparente sopra lo sfondo della pagina, campo di gioco inclinato, telecamera in orbita con smorzamento esponenziale, riflessi generati da un gradiente senza immagini, migliaia di cubi metallici in una sola chiamata (`InstancedMesh`).

È l'**unico** pacchetto che dipende da Three.js: i giochi classici non lo usano, e `pnpm check:bundles` verifica che il loro peso non cambi.

Stato: disponibile. Guida: [20 · Remaster 2.5D](../../docs/20-remaster-2-5d.md).
