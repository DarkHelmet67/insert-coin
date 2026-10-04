import { describe, expect, it } from 'vitest';
import {
  closeUpOn,
  CLOSE_UP_ALTITUDE,
  followLander,
  startingCamera,
  toScreen,
  WIDE_VIEW_ALTITUDE,
  wideViewOn,
  type CameraInput,
} from './camera';

/** A module at (`x`, `y`) falling right, high above the surface. */
const at = (x: number, y: number, overrides: Partial<CameraInput> = {}): CameraInput => ({
  x,
  y,
  vx: 1,
  vy: -1,
  altitude: 2000,
  ...overrides,
});

describe('the camera', () => {
  it('shows the start of a mission where the program puts it', () => {
    expect(toScreen(startingCamera, 256, 2696)).toEqual({ x: 64, y: 682 });
  });

  it('lets the module move freely between x = 128 and 896', () => {
    expect(followLander(startingCamera, at(2000, 2000)).camera).toEqual(startingCamera);
  });

  it('follows the module past x = 896 going right, and past 128 going left', () => {
    const right = followLander(startingCamera, at(900 * 4, 2000)).camera;
    expect(toScreen(right, 900 * 4, 2000).x).toBe(896);
    const left = followLander(startingCamera, at(100 * 4, 2000, { vx: -1 })).camera;
    expect(toScreen(left, 100 * 4, 2000).x).toBe(128);
  });

  it('scrolls the sky going up past y = 660, and loses the module after 512', () => {
    const y = (700 - 8) * 4;
    const up = followLander(startingCamera, at(2000, y, { vy: 1 }));
    expect(up.camera.scroll).toBe(40);
    expect(up.flewOff).toBe(false);
    const gone = followLander(startingCamera, at(2000, (660 + 512 - 8) * 4, { vy: 1 }));
    expect(gone.flewOff).toBe(true);
  });

  it('scrolls the sky back before the module moves down the screen', () => {
    const scrolled = { ...startingCamera, scroll: 40 };
    const down = followLander(scrolled, at(2000, (660 + 40 - 8 - 10) * 4)).camera;
    expect(down.scroll).toBe(30);
  });

  it('switches to the close-up below 384 units of altitude, module at (512, 632)', () => {
    const near = followLander(startingCamera, at(2000, 900, { altitude: CLOSE_UP_ALTITUDE - 1 }));
    expect(near.camera.view).toBe('minor');
    expect(toScreen(near.camera, 2000, 900)).toEqual({ x: 512, y: 632 });
  });

  it('follows the module down and up in the close-up', () => {
    const camera = closeUpOn(2000, 900);
    const down = followLander(camera, at(2000, 900 - 400)).camera;
    expect(toScreen(down, 2000, 500).y).toBe(256);
    const up = followLander(camera, at(2000, 900 + 50, { vy: 1, altitude: 100 })).camera;
    expect(toScreen(up, 2000, 950).y).toBe(660);
  });

  it('goes back to the whole view climbing high in the close-up', () => {
    const camera = closeUpOn(2000, 900);
    const climb = at(2000, 950, { vy: 1, altitude: WIDE_VIEW_ALTITUDE });
    expect(followLander(camera, climb).camera).toEqual(wideViewOn(2000));
    expect(toScreen(wideViewOn(2000), 2000, 900).x).toBe(512);
  });
});
