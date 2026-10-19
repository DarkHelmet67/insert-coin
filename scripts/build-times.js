// @ts-check
import { stripVTControlCharacters } from 'node:util';

// Pure helpers for scripts/build.js: they read the prefixed output of `pnpm -r` and turn it
// into a timing summary. Kept apart from the script so they can be tested without spawning.

/**
 * First and last time (ms) a project printed something.
 * @typedef {{ readonly start: number, readonly end: number }} Span
 */

/**
 * Spans of every project seen so far, keyed by project folder (e.g. `games/pacman`).
 * @typedef {Readonly<Record<string, Span>>} Timings
 */

// `pnpm -r` prefixes each line with "<project folder> <script>: ".
const PREFIX = /^(\S+) build: /;

/**
 * Project folder that printed a line of `pnpm -r` output.
 * @param {string} line a raw output line, possibly with color codes
 * @returns {string | undefined} undefined for lines that pnpm prints itself
 */
export const projectOf = (line) => PREFIX.exec(stripVTControlCharacters(line))?.[1];

/**
 * Records that a project printed a line at the given time.
 * @param {Timings} timings
 * @param {string} project
 * @param {number} now time in ms
 * @returns {Timings}
 */
export const recordLine = (timings, project, now) => ({
  ...timings,
  [project]: { start: timings[project]?.start ?? now, end: now },
});

/**
 * Formats milliseconds as seconds with two decimals.
 * @param {number} ms
 * @returns {string}
 */
export const formatSeconds = (ms) => `${(ms / 1000).toFixed(2)} s`;

/**
 * Summary table: time of each project, their sum and the wall-clock total.
 * The sum differs from the total: pnpm builds projects in parallel, and a project's span
 * starts at its first output line, after Node and Vite have started.
 * @param {Timings} timings
 * @param {number} wallMs elapsed time of the whole build
 * @returns {string}
 */
export const formatSummary = (timings, wallMs) => {
  const rows = Object.entries(timings)
    .map(([project, { start, end }]) => /** @type {const} */ ([project, end - start]))
    .sort(([a], [b]) => a.localeCompare(b));
  const sum = rows.reduce((total, [, ms]) => total + ms, 0);
  const lines = [
    ...rows.map(([project, ms]) => [project, formatSeconds(ms)]),
    ['sum of projects', formatSeconds(sum)],
    ['total (wall clock)', formatSeconds(wallMs)],
  ];
  const width = Math.max(...lines.map(([label]) => label.length));
  return ['Build times', ...lines.map(([label, time]) => `  ${label.padEnd(width)}  ${time}`)].join(
    '\n',
  );
};
