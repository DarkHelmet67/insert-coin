import { shapeToLines, type BeamLine } from '@arcade/vector';
import { toScreen } from './position';
import type { ShipLife } from './player';
import { debrisLines } from './render-debris';
import type { Ship } from './ship';
import { SHIP_PICTURES, shipPlacement, shipView } from './ship-shapes';

/**
 * Whether the flame shows in this frame: while the thrust button is held it is lit 4 frames and
 * dark 4, so it flickers [P $753B].
 */
export const flameVisible = (ship: Ship, frame: number): boolean =>
  ship.thrusting && (frame & 4) !== 0;

/** The lines of the ship, and of its flame when it shows. */
export const shipLines = (ship: Ship, frame: number): readonly BeamLine[] => {
  const view = shipView(ship.direction);
  const picture = SHIP_PICTURES[view.picture];
  if (!picture) return [];
  const screen = toScreen(ship.position);
  // The flame is drawn right after the outline, from the point where the outline ends.
  const shape = flameVisible(ship, frame) ? [...picture.ship, ...picture.flame] : picture.ship;
  return shapeToLines(shape, shipPlacement(screen.x, screen.y, view));
};

/** The ship as its life shows it: whole, in pieces, or nothing while hidden. */
export const playerLines = (ship: Ship, life: ShipLife, frame: number): readonly BeamLine[] => {
  if (life.kind === 'flying') return shipLines(ship, frame);
  if (life.kind === 'exploding') return debrisLines(ship.position, life.status, life.age);
  return [];
};
