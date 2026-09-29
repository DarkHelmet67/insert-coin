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

  /** Balls per game [M]: 3, or 5 with a switch inside the cabinet. */
  ballsPerGame: 3,

  /**
   * Ball speed in each state, per frame: `vertical` in steps, sideways in scan lines, depending
   * on whether the ball last touched an outer or a middle segment of the paddle [C]. The row
   * that applies is the last one whose `fromHits` the hit counter has reached. The manual
   * confirms speed-ups at the 4th and the 12th hit [M]; the row from hit 8 comes only from
   * the circuit [C, uncertain]: slower vertically but flatter, so about as fast overall.
   */
  ballSpeeds: [
    { fromHits: 0, vertical: 1, outer: 2, middle: 1 },
    { fromHits: 4, vertical: 2, outer: 2, middle: 1 },
    { fromHits: 8, vertical: 1, outer: 3, middle: 3 },
    { fromHits: 12, vertical: 2, outer: 3, middle: 3 },
  ],

  /** The fastest speed, after an orange or red brick [M, values C]. */
  fastSpeed: { vertical: 3, sideways: 3 },

  /**
   * The serve [C]: the ball circles invisibly and shows up when it crosses the middle of the
   * screen, which takes up to `cycleFrames` frames (about 4 seconds) after SERVE is pressed.
   */
  serve: { cycleFrames: 256, appearY: 120 },

  /**
   * How far the arrow keys move the paddle in one frame, in scan lines [N]. The original had
   * only the knob, which could move the paddle as fast as the hand turned it.
   */
  paddleKeySpeed: 3,

  /** The film strip over the paddle area [N]: the circuit does not say how wide it was. */
  paddleStrip: { top: 180, height: 20 },

  /**
   * Dark gap between two rows of bricks, in steps [N]. The circuit makes it with a small delay,
   * a fraction of a step that a pixel grid cannot show: one step is the closest match.
   */
  brickRowGap: 1,

  /** The player's score blinks during play [M], about 4 times a second [C]. */
  scoreBlinkHz: 4,

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
