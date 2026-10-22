import { Euler, Object3D, PerspectiveCamera, Vector3 as ThreeVector } from 'three';
import { describe, expect, it } from 'vitest';
import { degreesToRadians, orbitPosition, type Vector3 } from './camera-rig';
import { fitPointsDistance, orientPoint, standBack } from './framing';

/** Where `point` lands on a camera's picture, from -1 to 1 on each axis inside the frame. */
const project = (
  point: Vector3,
  position: Vector3,
  target: Vector3,
  fov: number,
  aspect: number,
): ThreeVector => {
  const camera = new PerspectiveCamera(fov, aspect, 0.1, 10_000);
  camera.position.set(position.x, position.y, position.z);
  camera.lookAt(target.x, target.y, target.z);
  camera.updateMatrixWorld();
  return new ThreeVector(point.x, point.y, point.z).project(camera);
};

/** The corners of a 224 × 256 playfield, 4 deep, leaned back 32° and turned by `turn` degrees. */
const turnedPlayfield = (turn: number): readonly Vector3[] =>
  [-112, 112].flatMap((x) =>
    [-128, 128].flatMap((y) =>
      [-2, 2].map((z) =>
        orientPoint(
          { x, y, z },
          { tilt: degreesToRadians(32), turn: degreesToRadians(turn), roll: 0 },
        ),
      ),
    ),
  );

describe('orientPoint', () => {
  it('turns a point like Three.js does with the Euler order of the stage', () => {
    const angles = { tilt: 0.5, turn: 0.3, roll: 0.2 };
    const object = new Object3D();
    object.setRotationFromEuler(new Euler(-angles.tilt, angles.turn, angles.roll, 'XYZ'));
    object.updateMatrixWorld();
    const expected = new ThreeVector(10, 20, 3).applyMatrix4(object.matrixWorld);
    const actual = orientPoint({ x: 10, y: 20, z: 3 }, angles);
    expect(actual.x).toBeCloseTo(expected.x);
    expect(actual.y).toBeCloseTo(expected.y);
    expect(actual.z).toBeCloseTo(expected.z);
  });
});

describe('fitPointsDistance', () => {
  const origin = { x: 0, y: 0, z: 0 };
  const front = { x: 0, y: 0, z: 1 };

  it('backs off until a flat rectangle fits', () => {
    // With a 90° field of view the camera sees as high as twice its distance.
    expect(fitPointsDistance([{ x: 0, y: 50, z: 0 }], origin, front, 90, 4, 1)).toBeCloseTo(50);
    expect(fitPointsDistance([{ x: 50, y: 0, z: 0 }], origin, front, 90, 0.5, 1)).toBeCloseTo(100);
  });

  it('backs off further for a point that comes toward the camera', () => {
    const flat = fitPointsDistance([{ x: 0, y: 50, z: 0 }], origin, front, 90, 1, 1);
    const near = fitPointsDistance([{ x: 0, y: 50, z: 10 }], origin, front, 90, 1, 1);
    expect(near).toBeCloseTo(flat + 10);
  });

  it.each([0.6, 1, 1.78])(
    'keeps a turned playfield inside a %s picture at both ends of the turn',
    (aspect) => {
      const target = { x: 0, y: -16, z: 0 };
      const direction = orbitPosition(0, degreesToRadians(14), 1);
      const points = [...turnedPlayfield(-10), ...turnedPlayfield(10)];
      const margin = 1.12;
      const distance = fitPointsDistance(points, target, direction, 50, aspect, margin);
      const position = standBack(target, direction, distance);
      const reach = points
        .map((point) => project(point, position, target, 50, aspect))
        .reduce((most, p) => Math.max(most, Math.abs(p.x), Math.abs(p.y)), 0);
      // Inside the frame, and touching the margin on at least one side: no room wasted.
      expect(reach).toBeCloseTo(1 / margin);
    },
  );
});
