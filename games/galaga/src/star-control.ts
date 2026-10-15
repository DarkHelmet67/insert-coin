import { STARS_STILL, type StarSpeed } from './stars';

/**
 * `ds_99B9_star_ctrl`: what decides the speed of the stars. They stand still until the fighter
 * is on screen, then speed up to the speed of the stage; they run backwards fast while the
 * fighter is being captured.
 */
export interface StarControl {
  /** The fighter is on screen (99B9). */
  readonly shipOnScreen: boolean;
  /** The stars run backwards (99BA). */
  readonly backwards: boolean;
  /** Target and current speed in 1/64 pixel per frame (99BB, 99BC), and the remainder (99BD). */
  readonly target: number;
  readonly current: number;
  readonly remainder: number;
}

/** Stars standing still. */
export const STARS_STOPPED: StarControl = {
  shipOnScreen: false,
  backwards: false,
  target: 0x40,
  current: 0,
  remainder: 0,
};

/** The speed register value that runs the stars backwards: 2 extra steps (`l_1D9B`). */
const BACKWARDS_SPEED = 2;

/**
 * `f_1D76`: one frame of star control. The speed ramps up by 1/64 pixel per frame to the target;
 * the pixels to move this frame are the whole part of the accumulated speed, and the hardware
 * speed register is 7 minus that (7 still, 6 one pixel, 5 two...).
 */
export const controlStars = (
  control: StarControl,
): { readonly control: StarControl; readonly speed: StarSpeed } => {
  if (!control.shipOnScreen) {
    return { control: { ...control, current: 0, remainder: 0 }, speed: STARS_STILL };
  }
  if (control.backwards) return { control, speed: BACKWARDS_SPEED };
  const current = control.current === control.target ? control.current : control.current + 1;
  const sum = current + control.remainder;
  const pixels = (sum >> 6) & 3;
  return {
    control: { ...control, current, remainder: sum & 0x3f },
    speed: ((-pixels - 1) & 7) as StarSpeed,
  };
};
