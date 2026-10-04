/**
 * The values of the remake that the sources do not fix for certain, in one place so they are
 * easy to change and to test. Each value says where it comes from:
 * - [P] read in the original 6502 program, with the label of its source code;
 * - [R] read in the vector ROM;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, articles);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details.
 */
export const tuning = {
  /**
   * Frames per second of the game loop, and so the unit of every speed ("per frame").
   * The program steps once every 24 ms [P FRMECNT, H]: 41.67 frames a second. The remake keeps
   * it, so every speed and timer of the program is copied unchanged.
   */
  framesPerSecond: 1000 / 24,

  /**
   * How far one frame of the up or down key moves the thrust lever, out of 255 [N]: the whole
   * travel in about 0.75 seconds. The cabinet lever is moved by hand, so the program says nothing.
   */
  leverStep: 8,

  /**
   * Fuel units given by one coin [P CRDTBL]: the DIP switches choose 450, 600, 750 or 900;
   * 750 is the factory setting and the one the attract screen announces.
   */
  fuelPerCoin: 750,

  /**
   * How the beam looks on the monitor [N], as in Asteroids: sizes in DVG units, a slightly blue
   * glow, `gamma` below 1 to lift the dim lines.
   */
  beam: {
    color: '#f4f7ff',
    glowColor: 'rgba(150, 185, 255, 0.9)',
    coreWidth: 1.4,
    glowBlur: 6,
    dotSize: 3,
    maxBrightness: 15,
    gamma: 0.6,
  },
} as const;
