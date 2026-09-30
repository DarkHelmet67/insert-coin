import { shapeToLines, type BeamLine } from '@arcade/vector';
import { toScreen } from './position';
import type { RockExplosion, RockSize, RockSlot } from './rocks';
import { ROCK_SHAPES, SHRAPNEL_SHAPES } from './shapes';
import type { ShotSlots } from './shots';

/** Drawing scale of each rock size [P $7018]: the large rock is the ROM outline as it is. */
export const ROCK_SCALE: Readonly<Record<RockSize, number>> = { 4: 1, 2: 1 / 2, 1: 1 / 4 };

/**
 * Drawing scale of an explosion [P $6F62]: the high nibble of the status, plus one, is the
 * power-of-two scale of the vector generator. The burst grows from 1/32 to full size.
 */
export const explosionScale = (status: number): number => 2 ** ((status >> 4) + 1 - 16);

/**
 * Which of the four shrapnel patterns to draw [P $6F62]: bits 2-3 of the status, so the
 * pattern spreads a little more every few frames between two scale steps.
 */
export const shrapnelPattern = (status: number): number => (status >> 2) & 3;

/** The dots of an explosion. */
const explosionLines = (explosion: RockExplosion): readonly BeamLine[] => {
  const shape = SHRAPNEL_SHAPES[shrapnelPattern(explosion.status)] ?? [];
  const at = toScreen(explosion.position);
  return shapeToLines(shape, { ...at, scale: explosionScale(explosion.status) });
};

/** The lines of one rock slot: an outline, a cloud of shrapnel or nothing. */
export const rockSlotLines = (slot: RockSlot): readonly BeamLine[] => {
  if (!slot) return [];
  if (slot.kind === 'explosion') return explosionLines(slot);
  const at = toScreen(slot.position);
  return shapeToLines(ROCK_SHAPES[slot.shape] ?? [], { ...at, scale: ROCK_SCALE[slot.size] });
};

/** The lines of every rock and explosion. */
export const rocksLines = (rocks: readonly RockSlot[]): readonly BeamLine[] =>
  rocks.flatMap(rockSlotLines);

/** Brightness of a shot: the beam stops on one point at full power [P $7384]. */
const SHOT_BRIGHTNESS = 15;

/** The shots: each one a single bright dot. */
export const shotsLines = (shots: ShotSlots): readonly BeamLine[] =>
  shots.flatMap((shot) => {
    if (!shot) return [];
    const { x, y } = toScreen(shot.position);
    return [{ x1: x, y1: y, x2: x, y2: y, brightness: SHOT_BRIGHTNESS }];
  });
