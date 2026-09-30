import { atariVectorFont, shapeToLines, textToLines, type BeamLine } from '@arcade/vector';
import { hudLines } from './hud';
import { ROCK_SHAPES, SAUCER_SHAPE, SHIP_DEBRIS_SHAPES, SHRAPNEL_SHAPES } from './shapes';
import { SHIP_PICTURES, shipPlacement, shipView } from './ship-shapes';

/**
 * The showcase screen of step 2: every drawing of the ROM, in its real sizes, drawn by the
 * vector engine. Positions are DVG units, y upwards; nothing moves yet.
 */

/** Rock sizes: the program draws the same outline at scale 1, 1/2 and 1/4 [P $7018]. */
const ROCK_SCALES = [1, 1 / 2, 1 / 4] as const;

/** The four outlines in the three sizes, one column per outline. */
const rockGallery = (): readonly BeamLine[] =>
  ROCK_SHAPES.flatMap((shape, column) =>
    ROCK_SCALES.flatMap((scale, row) =>
      shapeToLines(shape, { x: 120 + column * 110, y: 690 - row * 70 - (row > 0 ? 10 : 0), scale }),
    ),
  );

/** The large saucer (scale 1/2) and the small one (1/4) [P $7018]. */
const saucers = (): readonly BeamLine[] => [
  ...shapeToLines(SAUCER_SHAPE, { x: 640, y: 690, scale: 1 / 2 }),
  ...shapeToLines(SAUCER_SHAPE, { x: 640, y: 620, scale: 1 / 4 }),
];

/** Sixteen ships around a circle, each pointing outwards: the ROM drawings and their mirrors. */
const shipRing = (): readonly BeamLine[] =>
  Array.from({ length: 16 }, (_, index) => index * 16).flatMap((direction) => {
    const angle = (direction / 256) * 2 * Math.PI;
    const view = shipView(direction);
    const placement = shipPlacement(260 + 110 * Math.cos(angle), 330 + 110 * Math.sin(angle), view);
    return shapeToLines(SHIP_PICTURES[view.picture]?.ship ?? [], placement);
  });

/** A ship pointing up with its flame, and three shots flying ahead of it. */
const thrustingShip = (): readonly BeamLine[] => {
  const view = shipView(64);
  const picture = SHIP_PICTURES[view.picture];
  if (!picture) return [];
  // The flame is drawn right after the ship, from where the outline ends.
  const shipAndFlame = [...picture.ship, ...picture.flame];
  const shots = [0, 1, 2].map((index): BeamLine => {
    const y = 380 + index * 40;
    return { x1: 260, y1: y, x2: 260, y2: y, brightness: 15 };
  });
  return [...shapeToLines(shipAndFlame, shipPlacement(260, 330, view)), ...shots];
};

/** The four shrapnel patterns, growing as they do in an explosion. */
const explosions = (): readonly BeamLine[] =>
  SHRAPNEL_SHAPES.flatMap((shape, index) =>
    shapeToLines(shape, { x: 560 + index * 100, y: 420, scale: [1 / 4, 1 / 2, 1, 1][index] ?? 1 }),
  );

/** The six pieces of an exploding ship, scattered around a point. */
const shipDebris = (): readonly BeamLine[] =>
  SHIP_DEBRIS_SHAPES.flatMap((shape, index) => {
    const angle = (index / SHIP_DEBRIS_SHAPES.length) * 2 * Math.PI;
    return shapeToLines(shape, {
      x: 760 + 40 * Math.cos(angle),
      y: 280 + 40 * Math.sin(angle),
      scale: 2,
    });
  });

/** The whole showcase: HUD, rocks, saucers, ships, shots and explosions. */
export const demoLines = (): readonly BeamLine[] => [
  ...hudLines(12340, 99990, 4),
  ...textToLines(atariVectorFont, 'PUSH START', { x: 400, y: 792, scale: 2 }),
  ...rockGallery(),
  ...saucers(),
  ...shipRing(),
  ...thrustingShip(),
  ...explosions(),
  ...shipDebris(),
];
