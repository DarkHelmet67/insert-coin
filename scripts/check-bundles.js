// @ts-check
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { gzipSync } from 'node:zlib';
import { bundleProblems, isRemaster, reportLine, THREE_MARKER } from './bundles.js';

// Checks that the 2.5D remasters left the classic games as they were: after `pnpm build`, the
// bundle of every classic game must not contain Three.js and must stay within its compressed
// size budget (scripts/bundle-budgets.json). A classic game that grows on purpose raises its
// budget in the same change, so the growth is a decision, not an accident.

const ROOT = join(import.meta.dirname, '..');
const GAMES = join(ROOT, 'games');
/** @type {import('./bundles.js').Budgets} */
const budgets = JSON.parse(readFileSync(join(import.meta.dirname, 'bundle-budgets.json'), 'utf8'));

/** @type {import('./bundles.js').Bundle[]} */
const bundles = readdirSync(GAMES)
  .filter((name) => existsSync(join(GAMES, name, 'dist', 'game.js')))
  .map((name) => {
    const code = readFileSync(join(GAMES, name, 'dist', 'game.js'));
    const manifest = JSON.parse(readFileSync(join(GAMES, name, 'package.json'), 'utf8'));
    return {
      name,
      remaster: isRemaster(manifest),
      gzipBytes: gzipSync(code, { level: 9 }).length,
      containsThree: code.includes(THREE_MARKER),
    };
  });

const problems = [
  ...(bundles.length === 0 ? ['no built game found: run `pnpm build` first'] : []),
  ...bundles.flatMap((bundle) => bundleProblems(bundle, budgets)),
];
process.stdout.write(
  `Bundle sizes (game.js, gzip)\n${bundles.map((b) => reportLine(b, budgets)).join('\n')}\n`,
);
if (problems.length > 0) {
  process.stderr.write(`\n${problems.join('\n')}\n`);
  process.exit(1);
}
