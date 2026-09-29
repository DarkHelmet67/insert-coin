import type { DrawingContext } from './draw';

/**
 * The seven segments of a digit display, named as in every datasheet:
 * a top, b top right, c bottom right, d bottom, e bottom left, f top left, g middle.
 */
export type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

/** Which segments light up for each digit, as a 7448 decoder chip does. */
export const DIGIT_SEGMENTS: Readonly<Record<string, readonly Segment[]>> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

/** Size of one digit: outer width and height, and thickness of the segments. */
export interface SegmentStyle {
  readonly width: number;
  readonly height: number;
  /** Thickness of the vertical segments (b, c, e, f). */
  readonly strokeX: number;
  /** Thickness of the horizontal segments (a, d, g). */
  readonly strokeY: number;
}

/** A rectangle relative to the top-left corner of the digit. */
interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where each segment sits inside the digit. The vertical segments overlap the horizontal
 * ones at the corners, so the outline is closed like on a real display.
 */
export const segmentBox = (segment: Segment, style: SegmentStyle): Box => {
  const { width, height, strokeX, strokeY } = style;
  const middle = Math.floor((height - strokeY) / 2);
  const upperHeight = middle + strokeY;
  const lowerHeight = height - middle;
  const boxes: Record<Segment, Box> = {
    a: { x: 0, y: 0, width, height: strokeY },
    b: { x: width - strokeX, y: 0, width: strokeX, height: upperHeight },
    c: { x: width - strokeX, y: middle, width: strokeX, height: lowerHeight },
    d: { x: 0, y: height - strokeY, width, height: strokeY },
    e: { x: 0, y: middle, width: strokeX, height: lowerHeight },
    f: { x: 0, y: 0, width: strokeX, height: upperHeight },
    g: { x: 0, y: middle, width, height: strokeY },
  };
  return boxes[segment];
};

/** Draws one digit (0-9) with its top-left corner at `x`, `y`; other characters draw nothing. */
export const drawSegmentDigit = (
  ctx: DrawingContext,
  digit: string,
  x: number,
  y: number,
  style: SegmentStyle,
  color: string,
): void => {
  ctx.fillStyle = color;
  (DIGIT_SEGMENTS[digit] ?? []).forEach((segment) => {
    const box = segmentBox(segment, style);
    ctx.fillRect(x + box.x, y + box.y, box.width, box.height);
  });
};

/** Draws a number digit by digit, one every `pitch` pixels starting at `x`. */
export const drawSegmentNumber = (
  ctx: DrawingContext,
  digits: string,
  x: number,
  y: number,
  pitch: number,
  style: SegmentStyle,
  color: string,
): void => {
  [...digits].forEach((digit, index) => {
    drawSegmentDigit(ctx, digit, x + index * pitch, y, style, color);
  });
};
