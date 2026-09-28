// @ts-check
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Builds the folder published on GitHub Pages:
//   _site/index.html          the landing page, copied from site/
//   _site/<game>/index.html   the production build of each game, copied from games/<game>/dist
// Run it after `pnpm build`; the folder is ignored by git.

const ROOT = join(import.meta.dirname, '..');
const SITE = join(ROOT, '_site');
const LANDING = join(ROOT, 'site');
const GAMES = join(ROOT, 'games');

/**
 * Names of the games that have a production build.
 * @returns {string[]}
 */
const builtGames = () =>
  readdirSync(GAMES).filter((name) => existsSync(join(GAMES, name, 'dist', 'index.html')));

rmSync(SITE, { recursive: true, force: true });
cpSync(LANDING, SITE, { recursive: true });
builtGames().forEach((name) => {
  cpSync(join(GAMES, name, 'dist'), join(SITE, name), { recursive: true });
});
