import {
  atariVectorFont,
  shapeToLines,
  textToLines,
  type BeamLine,
  type VectorShape,
} from '@arcade/vector';
import { shownSpeed } from './velocity';

/**
 * The instruments at the top of the screen, at the positions of the vector ROM [R MESSVG,
 * DATAVG, STARRW]: labels on the left of each value, all at brightness 12.
 */

/** Brightness of the text and of the arrows [R .BRITE]. */
export const HUD_BRIGHTNESS = 12;

/** The labels, each where the beam writes it [R MESSVG]. */
const LABELS: readonly (readonly [text: string, x: number, y: number])[] = [
  ['SCORE', 100, 748],
  ['TIME', 100, 720],
  ['FUEL', 100, 692],
  ['ALTITUDE', 600, 748],
  ['HORIZONTAL SPEED', 600, 720],
  ['VERTICAL SPEED', 600, 692],
];

/** Left edge of the values of the left column, and of the right column [R DATAVG]. */
const LEFT_VALUES = 200;
const RIGHT_VALUES = 820;

/** The time colon: two dots at brightness 7, 6 units wide [R COLON]. */
const COLON: VectorShape = [
  [2, 4, 0],
  [0, 0, 7],
  [0, 4, 0],
  [0, 0, 7],
  [4, -8, 0],
];

/** Width of two digits, where the colon starts. */
const TWO_DIGITS = 2 * atariVectorFont.advance;
/** Width of the colon. */
const COLON_WIDTH = 6;

/** What the instruments show. */
export interface Instruments {
  readonly score: number;
  /** Seconds since the mission began. */
  readonly seconds: number;
  /** Whole fuel units. */
  readonly fuel: number;
  /** Height above the ground, in world units. */
  readonly altitude: number;
  /** Speeds, as the module keeps them. */
  readonly vx: number;
  readonly vy: number;
}

/** A number in a fixed number of digits, with the leading zeros [P D.LD4: no zero suppression]. */
export const zeroPadded = (value: number, digits: number): string =>
  String(Math.max(0, Math.floor(value)) % 10 ** digits).padStart(digits, '0');

/**
 * A number in six places, leading zeros left blank but the last digit always written
 * [P D.SIX, DIGITS]: the digits keep their place on the right.
 */
export const sixPlaces = (value: number): string =>
  String(Math.max(0, Math.floor(value)) % 1e6).padStart(6, ' ');

/** Text at brightness 12. */
const hudText = (text: string, x: number, y: number): readonly BeamLine[] =>
  textToLines(atariVectorFont, text, { x, y, brightness: HUD_BRIGHTNESS });

/** Minutes and seconds of the mission clock, "MM:SS" [P MESDATA]. */
const timeLines = (seconds: number, y: number): readonly BeamLine[] => {
  const minutes = Math.floor(seconds / 60);
  return [
    ...hudText(zeroPadded(minutes, 2), LEFT_VALUES, y),
    ...shapeToLines(COLON, { x: LEFT_VALUES + TWO_DIGITS, y }),
    ...hudText(zeroPadded(seconds % 60, 2), LEFT_VALUES + TWO_DIGITS + COLON_WIDTH, y),
  ];
};

/** Where the speed arrows are drawn from [R STARRW]. */
const ARROWS_ORIGIN = { x: 888, y: 706 } as const;

/** Arrow pointing right, left, up and down [R RIGHT1, LEFT1, UP1, DOWN1], from their start. */
const ARROWS: Readonly<Record<'right' | 'left' | 'up' | 'down', VectorShape>> = {
  right: [
    [12, 20, 0],
    [24, 0, HUD_BRIGHTNESS],
    [-6, 6, HUD_BRIGHTNESS],
    [0, -10, HUD_BRIGHTNESS],
    [6, 6, HUD_BRIGHTNESS],
  ],
  left: [
    [36, 20, 0],
    [-24, 0, HUD_BRIGHTNESS],
    [6, 6, HUD_BRIGHTNESS],
    [0, -10, HUD_BRIGHTNESS],
    [-6, 6, HUD_BRIGHTNESS],
  ],
  up: [
    [24, -18, 0],
    [0, 24, HUD_BRIGHTNESS],
    [-6, -6, HUD_BRIGHTNESS],
    [12, 0, HUD_BRIGHTNESS],
    [-6, 6, HUD_BRIGHTNESS],
  ],
  down: [
    [24, 6, 0],
    [0, -24, HUD_BRIGHTNESS],
    [-6, 6, HUD_BRIGHTNESS],
    [12, 0, HUD_BRIGHTNESS],
    [-6, -6, HUD_BRIGHTNESS],
  ],
};

/**
 * The arrows that tell which way the module drifts [P DISPLY]: none when the instrument shows 0,
 * so a speed too small to show has no arrow either.
 */
export const arrowLines = (vx: number, vy: number): readonly BeamLine[] => {
  const horizontal = shownSpeed(vx) === 0 ? [] : [vx > 0 ? ARROWS.right : ARROWS.left];
  const vertical = shownSpeed(vy) === 0 ? [] : [vy > 0 ? ARROWS.up : ARROWS.down];
  return [...vertical, ...horizontal].flatMap((arrow) => shapeToLines(arrow, ARROWS_ORIGIN));
};

/** The six labels, which never change [R MESSVG]. */
export const labelLines: readonly BeamLine[] = LABELS.flatMap(([text, x, y]) =>
  hudText(text, x, y),
);

/** All the instruments with their values [P MESDATA, DISPLY]. */
export const hudLines = (values: Instruments): readonly BeamLine[] => [
  ...labelLines,
  ...hudText(zeroPadded(values.score, 4), LEFT_VALUES, 748),
  ...timeLines(values.seconds, 720),
  ...hudText(zeroPadded(values.fuel, 4), LEFT_VALUES, 692),
  ...hudText(sixPlaces(values.altitude), RIGHT_VALUES, 748),
  ...hudText(sixPlaces(shownSpeed(values.vx)), RIGHT_VALUES, 720),
  ...hudText(sixPlaces(shownSpeed(values.vy)), RIGHT_VALUES, 692),
  ...arrowLines(values.vx, values.vy),
];
