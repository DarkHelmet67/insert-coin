/**
 * The values of the remake that the sources do not fix for certain, in one place so they are
 * easy to change and to test. Each value says where it comes from:
 * - [P] read in the 6502 program, with its address;
 * - [R] read in the vector ROM;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, articles);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details. Values that are certain (the ROM drawings,
 * their sizes) live in shapes.ts and ship-shapes.ts instead.
 */
export const tuning = {
  /**
   * Frames per second of the game loop, and so the unit of every speed ("per frame").
   * The program ran at 61.5 [P $7B73, H]; the remake uses 60 [N], one step per image on the
   * common 60 Hz screens.
   */
  framesPerSecond: 60,

  /**
   * Ships at the start of a game. The cabinet had a DIP switch for 3 or 4 [P $6ED8]; the
   * remake uses 3 [N], the usual arcade setting.
   */
  startingLives: 3,

  /**
   * How the beam looks on the monitor [N]: the real tube cannot be measured from the sources.
   * Width, glow and dot size are in DVG units (the screen is 1024 wide), so the picture looks
   * the same at any size. The glow is slightly blue, like the white phosphor of the tube. `gamma` below 1 lifts the dim lines: the ROM draws the rocks at
   * brightness 7 of 15 and the ship at 12, and on the real screen both are clearly visible.
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
