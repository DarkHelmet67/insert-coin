# Linee guida per lo sviluppo (umani e AI)

Queste regole valgono per chiunque scriva codice in questo repository, persone o assistenti AI. Molte sono verificate automaticamente da ESLint (`pnpm lint`); le altre si controllano in revisione.

## AI for humans

Il codice di questo progetto sarà letto da persone: **code for humans, not for AI**.

- Usare pattern noti e best practice, non soluzioni "furbe".
- Niente codice monolitico: file e funzioni piccoli, con una sola responsabilità. Un file che supera un paio di centinaia di righe va diviso.
- Limitare la verbosità con molte piccole funzioni helper, facili da testare unitariamente.
- Commentare le parti più complesse spiegando il _perché_, non il _cosa_.

## Regole di sviluppo

| Regola                                                 | Come si applica                                                                                                                                                | Controllo                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Programmazione funzionale, niente classi               | Dati come oggetti `readonly`, logica come funzioni pure `(stato, input) => nuovoStato`                                                                         | `functional/no-classes`, `functional/no-this-expressions`                    |
| Dati immutabili                                        | Si crea un nuovo oggetto invece di modificarne uno esistente. `let` è ammesso solo dentro una funzione, per lo stato privato di una closure (es. il game loop) | `functional/immutable-data`, `functional/no-let`, `functional/readonly-type` |
| Sintassi ES6 con arrow function                        | `const nome = (...) => ...`; la parola chiave `function` non si usa                                                                                            | `no-restricted-syntax`, `prefer-arrow-callback`, `arrow-body-style`          |
| Ogni funzione, interfaccia e tipo ha un commento TSDoc | Una riga che dice cosa fa; `@param`/`@returns`/`@throws` quando non sono ovvi                                                                                  | `jsdoc/require-jsdoc`, `jsdoc/check-param-names`                             |
| TypeScript strict                                      | Nessun `any`, nessun `!` non giustificato                                                                                                                      | `tsc`, `typescript-eslint` strict                                            |

### Eccezioni consentite

- **Il canvas è lo schermo.** Disegnare significa modificare il contesto 2D (`ctx.fillStyle = ...`): è l'unica mutazione ammessa, e il contesto si chiama sempre `ctx`.
- **Il "guscio" imperativo.** Il game loop e gli adattatori verso il browser (`requestAnimationFrame`, eventi da tastiera) tengono lo stato in variabili `let` private a una closure. La logica di gioco resta pura.
- **Test.** Nei file `*.test.ts` mock e fixture mutabili sono ammessi.

Se una regola diventa un ostacolo reale, si discute e si aggiorna questo file, invece di aggirarla con `eslint-disable`.

## Struttura e convenzioni

- Codice e commenti in inglese, documentazione (`README.md`, `docs/`) in italiano.
- Il codice condiviso sta in `packages/` (`@arcade/*`) e non importa mai da `games/`.
- Ogni gioco separa **stato puro** (tipi e funzioni `update`), **disegno** (`render`) e **collegamento** (`main.ts`).
- Ogni nuovo pacchetto o funzionalità arriva con test Vitest e con la sua guida in `docs/`.
- Ogni decisione significativa presa con l'AI va nel [diario AI](docs/ai-workflow.md).

## Prima di ogni commit

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
