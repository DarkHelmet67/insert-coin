import { rectsOverlap } from '@arcade/collision';
import { ballRect, type Ball } from './ball';
import { brickPoints, brickPositions, brickRect, hasBrick, removeBrick, type Wall } from './bricks';

/** The ball, the wall and the points after one frame of brick collisions. */
export interface BrickHit {
  readonly ball: Ball;
  readonly wall: Wall;
  readonly points: number;
}

/**
 * Breaks the brick the ball touches, if any: the brick disappears and the ball reverses its
 * vertical direction, keeping its sideways one.
 * After a hit the ball goes through every other brick until it touches the paddle or the top
 * wall (`canHitBrick`): one brick per trip, as in the circuit. That is what lets a ball that
 * broke through bounce between the top wall and the back row, scoring again and again.
 */
export const hitBrick = (ball: Ball, wall: Wall): BrickHit => {
  const hit = ball.canHitBrick
    ? brickPositions().find(
        (position) => hasBrick(wall, position) && rectsOverlap(ballRect(ball), brickRect(position)),
      )
    : undefined;
  if (!hit) return { ball, wall, points: 0 };
  const dirY = ball.dirY === 1 ? -1 : 1;
  return {
    // A ball sent back up by a brick counts as a hit too: the circuit counts every turn upwards.
    ball: { ...ball, dirY, canHitBrick: false, hits: dirY === -1 ? ball.hits + 1 : ball.hits },
    wall: removeBrick(wall, hit),
    points: brickPoints(hit.row),
  };
};
