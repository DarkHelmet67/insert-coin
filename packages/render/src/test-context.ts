import type { DrawingContext } from './draw';

/** One `fillRect` call recorded by the fake context, with the color active at that moment. */
export interface RecordedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
}

/**
 * A fake canvas context for tests: it records rectangles instead of drawing them,
 * so drawing code can be checked in Node without a browser.
 */
export const createRecordingContext = (
  width = 224,
  height = 256,
): DrawingContext & { readonly rects: RecordedRect[] } => {
  const rects: RecordedRect[] = [];
  const ctx = {
    canvas: { width, height },
    fillStyle: '' as DrawingContext['fillStyle'],
    rects,
    fillRect: (x: number, y: number, w: number, h: number) => {
      rects.push({ x, y, width: w, height: h, color: String(ctx.fillStyle) });
    },
  };
  return ctx;
};
