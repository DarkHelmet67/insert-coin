import { describe, expect, it } from 'vitest';
import type { Ball } from './ball';
import { initialGameState, type GameState } from './game';
import { BALL_HEIGHT, PADDLE_Y, SIDE_WALL_WIDTH, TOP_WALL_HEIGHT } from './playfield';
import { sounds, soundsFor } from './sounds';

const ball: Ball = {
  x: 100,
  y: 120,
  dirX: 1,
  dirY: 1,
  hits: 0,
  fast: false,
  outer: false,
  canHitBrick: true,
};

/** A game in progress with the ball at `changes`. */
const playing = (changes: Partial<Ball>, state: Partial<GameState> = {}): GameState => ({
  ...initialGameState,
  attract: false,
  ...state,
  play: { phase: 'inPlay', ball: { ...ball, ...changes } },
});

describe('soundsFor', () => {
  it('has a sound for every name', () => {
    expect(Object.keys(sounds)).toEqual(['paddle', 'wall', 'brick', 'newRecord']);
  });

  it('blips on the paddle', () => {
    const next = playing({ y: PADDLE_Y - BALL_HEIGHT, dirY: -1, dirX: -1 });
    expect(soundsFor(playing({}), next)).toEqual(['paddle']);
  });

  it('bounces on the side walls and the top wall', () => {
    const side = playing({ x: SIDE_WALL_WIDTH, dirX: 1 });
    expect(soundsFor(playing({ dirX: -1 }), side)).toEqual(['wall']);
    const top = playing({ y: TOP_WALL_HEIGHT, dirY: 1 });
    expect(soundsFor(playing({ dirY: -1 }), top)).toEqual(['wall']);
  });

  it('is silent when the ball just flies, or turns on a brick', () => {
    expect(soundsFor(playing({}), playing({ y: 121 }))).toEqual([]);
    expect(soundsFor(playing({ y: 60, dirY: -1 }), playing({ y: 60, dirY: 1 }))).toEqual([]);
  });

  it('ticks when a brick point is counted', () => {
    const ticked = playing({}, { ticks: { owed: 0, played: 1, wait: 4 } });
    expect(soundsFor(playing({}), ticked)).toEqual(['brick']);
  });

  it('plays the fanfare once, when the record is beaten', () => {
    const record = { recordToBeat: 100 };
    const beaten = soundsFor(
      playing({}, { ...record, score: 99 }),
      playing({}, { ...record, score: 102 }),
    );
    expect(beaten).toContain('newRecord');
    const again = soundsFor(
      playing({}, { ...record, score: 102 }),
      playing({}, { ...record, score: 105 }),
    );
    expect(again).not.toContain('newRecord');
  });

  it('is silent in the attract mode', () => {
    const next = { ...playing({ x: SIDE_WALL_WIDTH }), attract: true };
    expect(soundsFor({ ...playing({ dirX: -1 }), attract: true }, next)).toEqual([]);
  });
});
