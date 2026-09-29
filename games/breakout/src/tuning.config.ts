/**
 * The values of the remake that the sources do not fix for certain, in one place so they are
 * easy to change and to test. Each value says where it comes from:
 * - [M] stated by the manual or another written source;
 * - [C] read from the circuit (MAME netlist), not verified in simulation;
 * - [N] our choice, where the sources say nothing.
 * See docs/meccaniche-originali.md for the details. Values that are certain (the size of the
 * bricks, the points per row) live in playfield.ts and bricks.ts instead.
 */
export const tuning = {
  /**
   * Frames per second of the original circuit [C]: 252 lines of 62.6 µs. The game advances in
   * whole frames at this rate, so every speed below is "per frame" as in the circuit.
   */
  framesPerSecond: 63.4,

  /** The film strip over the paddle area [N]: the circuit does not say how wide it was. */
  paddleStrip: { top: 180, height: 20 },

  /**
   * Dark gap between two rows of bricks, in steps [N]. The circuit makes it with a small delay,
   * a fraction of a step that a pixel grid cannot show: one step is the closest match.
   */
  brickRowGap: 1,

  /**
   * The seven-segment score digits. Cell of 16 lines by 16 steps [C]; size of the lit segments
   * and positions on the screen [N].
   */
  digits: {
    width: 10,
    height: 12,
    strokeX: 2,
    strokeY: 2,
    /** Distance between the left edges of two digits. */
    pitch: 16,
    /** Left edge of player 1's group (player up above, score below) and of player 2's group. */
    leftGroupX: 36,
    rightGroupX: 144,
    /** Top of the upper row (player up, ball number) and of the lower row (scores). */
    upperRowY: 10,
    lowerRowY: 26,
  },
} as const;
