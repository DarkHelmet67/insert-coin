// @ts-check

// Pure helpers for scripts/check-bundles.js: they decide whether the bundle of a classic game
// stayed as light as it was. Kept apart from the script so they can be tested without a build.

/**
 * What the check knows about one built game.
 * @typedef {{
 *   readonly name: string,
 *   readonly remaster: boolean,
 *   readonly gzipBytes: number,
 *   readonly containsThree: boolean,
 * }} Bundle
 */

/**
 * Budgets in kB (1024 bytes) of compressed `game.js`, keyed by game folder.
 * @typedef {Readonly<Record<string, number>>} Budgets
 */

/** A string every Three.js bundle carries, even minified: the library registers its version. */
export const THREE_MARKER = '__THREE__';

/**
 * Whether a game is a 2.5D remaster: only remasters may use the 3D stage, and Three.js with it.
 * The folder name decides (`games/<game>-25d`), not the dependencies: a classic game that
 * picked up the 3D stage by mistake must still be checked, not let through.
 * @param {string} name the game's folder
 * @returns {boolean}
 */
export const isRemaster = (name) => name.endsWith('-25d');

/**
 * The problems of one classic game's bundle; remasters have none to report.
 * @param {Bundle} bundle
 * @param {Budgets} budgets
 * @returns {string[]} one sentence per problem
 */
export const bundleProblems = (bundle, budgets) => {
  if (bundle.remaster) return [];
  const budget = budgets[bundle.name];
  return [
    ...(bundle.containsThree
      ? [`${bundle.name}: contains Three.js, which only remasters may use`]
      : []),
    ...(budget === undefined
      ? [`${bundle.name}: no budget in scripts/bundle-budgets.json`]
      : bundle.gzipBytes > budget * 1024
        ? [
            `${bundle.name}: ${formatKb(bundle.gzipBytes)} compressed, over its ${String(budget)} kB budget`,
          ]
        : []),
  ];
};

/**
 * Bytes as kB with one decimal.
 * @param {number} bytes
 * @returns {string}
 */
export const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

/**
 * One line of the report for a bundle.
 * @param {Bundle} bundle
 * @param {Budgets} budgets
 * @returns {string}
 */
export const reportLine = (bundle, budgets) => {
  const limit = bundle.remaster
    ? 'remaster, no budget'
    : `budget ${String(budgets[bundle.name] ?? '?')} kB`;
  return `  ${bundle.name.padEnd(24)} ${formatKb(bundle.gzipBytes).padStart(9)}  (${limit})`;
};
