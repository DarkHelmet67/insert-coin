/**
 * The values of the remake that the sources do not fix for certain, or that the cabinet lets
 * the owner choose, in one place so they are easy to change and to test. Each value says where
 * it comes from:
 * - [P] read in the program, with the address of the routine;
 * - [R] read in the ROMs;
 * - [H] from the hardware, through MAME;
 * - [W] from written sources (manuals, the Pac-Man Dossier);
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 * See docs/meccaniche-originali.md for the details.
 */
export const tuning = {
  /**
   * Frames per second of the cabinet: the video clock of 6.144 MHz draws 384 × 264 pixels per
   * frame, 60.606 frames a second [H `pacman.cpp`].
   */
  framesPerSecond: 6_144_000 / (384 * 264),

  /**
   * Frames the points of an eaten ghost stay on screen while the game stands still. The
   * program asks its timer for 10 tenths of a second ($126E), counted on a clock that ticks
   * every 6 frames, so the real wait is 55 to 60 frames depending on that clock [P]; we take 60.
   */
  ghostPointsFrames: 60,
} as const;
