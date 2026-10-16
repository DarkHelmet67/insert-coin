import { NO_FLIP } from '@arcade/tiles';
import type { Point } from './geometry';
import { ghostSprite } from './ghost-sprites';
import { GHOST } from './ghosts';
import type { Intermission } from './intermission';
import { pacmanSprite } from './pacman-sprite';
import type { Playing } from './playing';
import type { HardwareSprite } from './sprites';

/**
 * The sprites of the intermissions. The program draws the actors as usual, then each scene
 * changes some sprite slots ($15E6, $162D, $1652): the giant Pac-Man of the first scene is
 * made of four sprites, borrowed from the other ghosts and the fruit.
 */

/** A sprite with no flip. */
const plain = (code: number, palette: number, at: Point): HardwareSprite => ({
  code,
  palette,
  flip: NO_FLIP,
  ...at,
});

/** The first of the four quarters of the giant Pac-Man, by his position in his 16 pixels ($15EC). */
const giantMouth = (x: number): number => {
  const phase = x & 0x0f;
  if (phase >= 12) return 0x18;
  if (phase >= 8) return 0x14;
  if (phase >= 4) return 0x10;
  return 0x14;
};

/** The palette of the giant Pac-Man. */
const GIANT_PALETTE = 0x16;

/**
 * The giant Pac-Man (routines $039D and $15E6): four quarters around Pac-Man's place, in the
 * slots of Pinky, Inky, Clyde and the fruit; Pac-Man's own sprite turns into an empty one.
 */
const giantSlots = (slots: readonly HardwareSprite[], playing: Playing): HardwareSprite[] => {
  const { x, y } = playing.pacman.position;
  const code = giantMouth(x);
  /** One quarter, `dx` and `dy` away from Pac-Man. */
  const quarter = (offset: number, dx: number, dy: number): HardwareSprite =>
    plain(code + offset, GIANT_PALETTE, { x: (x + dx) & 0xff, y: (y + dy) & 0xff });
  const [blinky, , , , pacman] = slots;
  return [
    ...(blinky === undefined ? [] : [blinky]),
    quarter(0, 8, -16),
    quarter(1, -8, -16),
    quarter(2, 8, 0),
    ...(pacman === undefined ? [] : [{ ...pacman, code: 0x3f }]),
    quarter(3, -8, 0),
  ];
};

/** Blinky's torn sheet in the second scene, then his look at it ($1642, $164D). */
const tornSlots = (slots: readonly HardwareSprite[], step: number): HardwareSprite[] =>
  slots.map((sprite, slot) =>
    slot === GHOST.blinky && step >= 10
      ? { ...sprite, code: step >= 12 ? 0x33 : 0x32, palette: 0x1d }
      : sprite,
  );

/** The third scene: the mended sheet, then Blinky naked dragging it ($1667-$1687). */
const nakedSlots = (
  slots: readonly HardwareSprite[],
  playing: Playing,
  intermission: Intermission,
): HardwareSprite[] => {
  const blinkyX = playing.ghosts[GHOST.blinky]?.position.x ?? 0;
  const sheetCode = ((blinkyX & 8) >> 3) + 0x0a;
  const dragging = intermission.step >= 3;
  const blinkyCode = dragging ? sheetCode + 2 : playing.wave + 8;
  const sheet = dragging ? [plain(sheetCode, 0x1e, intermission.sheet)] : [];
  return [
    ...slots.map((sprite, slot) =>
      slot === GHOST.blinky && intermission.step >= 1 ? { ...sprite, code: blinkyCode } : sprite,
    ),
    ...sheet,
  ];
};

/** Pac-Man black once he has left on the left in scenes 2 and 3 ($163A, $165F). */
const hidePacMan = (slots: readonly HardwareSprite[], hidden: boolean): HardwareSprite[] =>
  slots.map((sprite, slot) => (hidden && slot === 4 ? { ...sprite, palette: 0 } : sprite));

/** The sprites of an intermission, in slot order: the four ghosts, Pac-Man, and the fruit's slot. */
export const intermissionSprites = (
  playing: Playing,
  intermission: Intermission,
): readonly HardwareSprite[] => {
  const slots = [
    ...playing.ghosts.map((ghost) => ghostSprite(ghost, playing.wave)),
    pacmanSprite(playing.pacman),
  ];
  switch (intermission.scene) {
    case 1:
      return intermission.step >= 5 ? giantSlots(slots, playing) : slots;
    case 2:
      return hidePacMan(tornSlots(slots, intermission.step), intermission.pacmanHidden);
    case 3:
      return hidePacMan(nakedSlots(slots, playing, intermission), intermission.pacmanHidden);
  }
};
