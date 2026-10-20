import type { DrawingContext } from '@arcade/render';

/** One rectangle filled by a drawing function, with the color it was filled with. */
export interface FilledRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
}

/** A fake screen that remembers what was drawn on it instead of showing it. */
export interface DrawingRecorder {
  /** Pass it to any drawing function written for `@arcade/render`: it records every `fillRect`. */
  readonly ctx: DrawingContext;
  /** Returns the rectangles drawn since the last call, and starts a new recording. */
  readonly take: () => readonly FilledRect[];
}

/**
 * Creates a drawing context that records rectangles instead of painting pixels.
 *
 * The games draw everything through `fillStyle` and `fillRect` (see `DrawingContext`), so the
 * original drawing code can run unchanged on this recorder: what it "draws" becomes data that
 * a 3D renderer can extrude into voxels. This is the bridge between a 2D game and its 2.5D
 * remaster: the 2D code decides what is on screen, the 3D code only decides how it looks.
 * @param width - width of the original screen in pixels.
 * @param height - height of the original screen in pixels.
 */
export const createDrawingRecorder = (width: number, height: number): DrawingRecorder => {
  // A recording is rebuilt every frame with thousands of rectangles: it grows in place, private
  // to this closure, like the canvas it stands for (see the exception in CLAUDE.md).
  let rects: FilledRect[] = [];
  const ctx = {
    fillStyle: '#000' as DrawingContext['fillStyle'],
    canvas: { width, height },
    fillRect: (x: number, y: number, w: number, h: number): void => {
      rects.push({ x, y, width: w, height: h, color: String(ctx.fillStyle) });
    },
  };
  return {
    ctx,
    take: () => {
      const recorded = rects;
      rects = [];
      return recorded;
    },
  };
};
