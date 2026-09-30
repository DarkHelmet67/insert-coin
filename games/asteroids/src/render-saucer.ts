import { shapeToLines, type BeamLine } from '@arcade/vector';
import { toScreen } from './position';
import { rockSlotLines } from './render-rocks';
import type { SaucerSize, SaucerSlot } from './saucer';
import { SAUCER_SHAPE } from './shapes';

/** Drawing scale of the saucers [P $7018]: the ROM outline at 1/2 (large) or 1/4 (small). */
export const SAUCER_SCALE: Readonly<Record<SaucerSize, number>> = { large: 1 / 2, small: 1 / 4 };

/** The lines of the saucer slot: the saucer, its explosion (the rocks' cloud) or nothing. */
export const saucerLines = (slot: SaucerSlot): readonly BeamLine[] => {
  if (slot?.kind !== 'saucer') return rockSlotLines(slot);
  const at = toScreen(slot.position);
  return shapeToLines(SAUCER_SHAPE, { ...at, scale: SAUCER_SCALE[slot.size] });
};
