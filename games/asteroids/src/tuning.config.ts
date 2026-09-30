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

  /**
   * The sounds [H, N]. Asteroids has no sound chip: each sound is a small analog circuit that
   * the program switches on and off. The frequencies come from MAME's models of the circuits
   * (asteroid_a.cpp) where they can be read; the rest (the heartbeat's two notes, the volumes,
   * the filters) is set by ear and waits for a comparison with recordings of the cabinet.
   */
  sound: {
    /** The heartbeat's two notes [N]: a low square wave smoothed by the RC filter. */
    thump: { low: 60, high: 72, cutoff: 350, volume: 0.45 },
    /** The ship's shot [H]: 820 falling to 110 Hz in 0.28 s. */
    fire: { from: 820, to: 110, duration: 0.28, volume: 0.1 },
    /** The saucer's shot [H]: shorter fall, from 830 to 630 Hz. */
    saucerFire: { from: 830, to: 630, duration: 0.28, volume: 0.08 },
    /** The rumble of the thrust [H]: noise through a low-pass filter around 160 Hz. */
    thrust: { cutoff: 220, volume: 0.5 },
    /**
     * The saucer's siren [H]: a triangle wave warbling around 500 Hz (large, 5.75 times a
     * second) or 750 Hz (small, 8.25 times a second). The depth is set by ear [N].
     */
    saucer: {
      large: { center: 500, depth: 150, rate: 5.75 },
      small: { center: 750, depth: 200, rate: 8.25 },
      volume: 0.07,
    },
    /**
     * Explosions [P $6B4A, H]: noise dying away in about a second, deeper for large rocks and
     * large saucers. The cut-off frequencies are the circuit's three noise clocks.
     */
    explosion: { low: 1000, mid: 2400, high: 4000, duration: 1.05, volume: 0.45 },
    /** The extra ship [H, P $7BA9]: a 3 kHz beep, 4 frames on and 4 off, 11 times. */
    extraLife: { frequency: 3000, beeps: 11, volume: 0.04 },
  },
} as const;
