import { describe, expect, it } from 'vitest';
import { serveDelay, servedBall } from './serve';

describe('serve', () => {
  it('waits for the hidden ball to come round: never more than about 4 seconds', () => {
    expect(serveDelay(0)).toBe(0);
    expect(serveDelay(1)).toBe(255);
    expect(serveDelay(511)).toBe(1);
  });

  it('sends the ball down from the middle of the screen, slowly, inside the walls', () => {
    [0, 1, 2, 3, 99, 215, 216, 1000].forEach((clock) => {
      const ball = servedBall(clock);
      expect(ball).toMatchObject({ y: 120, dirY: 1, hits: 0, fast: false, canHitBrick: true });
      expect(ball.x).toBeGreaterThanOrEqual(4);
      expect(ball.x + 4).toBeLessThanOrEqual(224);
    });
  });

  it('varies the side and the angle with the moment of the press', () => {
    expect(servedBall(0).dirX).not.toBe(servedBall(1).dirX);
    expect(servedBall(0).outer).not.toBe(servedBall(2).outer);
  });
});
