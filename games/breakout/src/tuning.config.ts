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
   * Debug mode [N]: the paddle spans the whole screen, so the ball can never be lost. Useful
   * to watch the speed-ups and the second wall without playing well. The original cabinet did
   * the same in its attract mode. Keep it `false` in the published game.
   */
  debug: false,

  /**
   * Frames per second of the game loop, and so the unit of every speed below ("per frame").
   * The circuit ran at 63.4 [C]; the remake uses 60 [N] so that on the common 60 Hz screens
   * every displayed image shows exactly one step, without the small jumps of 63.4 steps a
   * second on 60 images.
   */
  framesPerSecond: 60,

  /** Balls per game [M]: 3, or 5 with a switch inside the cabinet. */
  ballsPerGame: 3,

  /**
   * Ball speed in each state, per frame: `vertical` in steps, sideways in scan lines, depending
   * on whether the ball last touched an outer or a middle segment of the paddle. The row that
   * applies is the last one whose `fromHits` the hit counter has reached.
   *
   * The pattern follows the circuit [C]: speed-ups at the 4th and 12th hit (confirmed by the
   * manual [M]), a flatter angle from the 8th. The values are ours [N], slower and with gentler
   * steps: the circuit's (1, 2, 1, 2 steps down per frame, 3 when fast) proved too fast to
   * play in the browser. The circuit table is in docs/meccaniche-originali.md.
   */
  ballSpeeds: [
    { fromHits: 0, vertical: 0.6, outer: 1.2, middle: 0.6 },
    { fromHits: 4, vertical: 0.8, outer: 1.2, middle: 0.6 },
    { fromHits: 8, vertical: 0.6, outer: 1.6, middle: 1.6 },
    { fromHits: 12, vertical: 0.8, outer: 1.6, middle: 1.6 },
  ],

  /** The fastest speed, after an orange or red brick [M; values N, circuit: 3 and 3]. */
  fastSpeed: { vertical: 1, sideways: 1.6 },

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
   * The sounds [C]: short square-wave beeps from the counters of the circuit. Frequencies and
   * lengths come from the netlist; the volume is ours [N].
   */
  sounds: {
    /** The paddle hit: about 2 kHz for 9 ms. */
    paddle: { frequency: 2000, duration: 0.009 },
    /** A wall bounce: about 1 kHz for 21 ms. */
    wall: { frequency: 1000, duration: 0.021 },
    /** One point of a broken brick: about 500 Hz for 9 ms. */
    brick: { frequency: 500, duration: 0.009 },
    /**
     * Frames between two brick ticks: the circuit counts the points one at a time, about every
     * 75 ms, and ticks at each one, so a red brick sounds 7 ticks.
     */
    tickFrames: 5,
    /**
     * Whether the top wall sounds too. The manual [M] says every wall does; the netlist [C]
     * wires the sound to the side walls only. We follow the manual.
     */
    topWall: true,
    volume: 0.15,
  },

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
