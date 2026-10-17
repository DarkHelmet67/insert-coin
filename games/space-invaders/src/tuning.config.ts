import type { TouchControlsSettings } from '@arcade/input';

/**
 * The values of the remake that are a choice rather than a fact of the original, in one place
 * so they are easy to change and to test. The colours have their own file, colors.config.ts.
 * - [N] our choice, where the sources say nothing or the browser asks for something else.
 */
export const tuning = {
  /**
   * The controls on touch screens [N]: `movement` is `'joystick'` (a virtual joystick where the
   * arrow buttons were, moving the cannon) or `'arrows'` (the arrow buttons). `deadZone` is
   * the part of the joystick's push, from 0 to 1, that does not move anything yet.
   */
  touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
} as const;
