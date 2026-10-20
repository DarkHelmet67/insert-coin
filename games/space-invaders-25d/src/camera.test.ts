import { describe, expect, it } from 'vitest';
import { cameraPosition, cameraTarget, targetYaw } from './camera';
import { attractGame, LEFTMOST, playingGame, RIGHTMOST } from './test-fixtures';
import { tuning } from './tuning.config';

const { camera } = tuning;

describe('targetYaw', () => {
  it('turns the view to the side where the cannon is', () => {
    expect(targetYaw(playingGame({ cannon: { x: LEFTMOST } }), 0, camera, 1)).toBe(-camera.maxYaw);
    expect(targetYaw(playingGame({ cannon: { x: RIGHTMOST } }), 0, camera, 1)).toBe(camera.maxYaw);
  });

  it('looks straight ahead with the cannon in the middle', () => {
    const middle = (LEFTMOST + RIGHTMOST) / 2;
    expect(targetYaw(playingGame({ cannon: { x: middle } }), 0, camera, 1)).toBeCloseTo(0);
  });

  it('moves less when reduced motion is asked', () => {
    expect(targetYaw(playingGame({ cannon: { x: RIGHTMOST } }), 0, camera, 0.25)).toBe(
      camera.maxYaw * 0.25,
    );
  });

  it('sways by itself on the attract screen', () => {
    const quarter = camera.attractSwayPeriod / 4;
    expect(targetYaw(attractGame, quarter, camera, 1)).toBeCloseTo(camera.attractSway);
  });
});

describe('cameraPosition', () => {
  it('stands to the right when the view turns right', () => {
    expect(cameraPosition(10, 30, 1.5, camera).x).toBeGreaterThan(0);
  });

  it('backs off on a narrow phone screen to keep the whole playfield in view', () => {
    const wide = cameraPosition(0, 30, 1.6, camera);
    const narrow = cameraPosition(0, 30, 0.5, camera);
    expect(narrow.z).toBeGreaterThan(wide.z);
  });
});

describe('cameraTarget', () => {
  it('looks a little below the middle of the playfield', () => {
    expect(cameraTarget(camera).y).toBe(-camera.lookDown);
  });
});
