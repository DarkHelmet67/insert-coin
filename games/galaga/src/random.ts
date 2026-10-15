/**
 * A pure source of random bytes: the `n`-th byte for a given `seed`, from an integer hash
 * (the "lowbias32" mix by Chris Wellons). The same seed always gives the same game, which
 * keeps the logic testable; the game takes the seed from the frame counter when a stage starts.
 */
export const randomBytes =
  (seed: number) =>
  (n: number): number => {
    const x = (Math.imul(seed, 0x9e3779b9) + n) | 0;
    const a = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    const b = Math.imul(a ^ (a >>> 15), 0x846ca68b);
    return (b ^ (b >>> 16)) & 0xff;
  };
