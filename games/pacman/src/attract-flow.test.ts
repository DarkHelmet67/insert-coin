import { describe, expect, it } from 'vitest';
import { noControls, type Controls } from './controls';
import { createGame, updateGame, type GameState } from './game';
import { MAZE_FOOD } from './ghost-modes';
import { ROM_TEXTS } from './rom/texts';
import { TEXT } from './texts';

/** The machine after `frames` frames with the given controls. */
const run = (state: GameState, frames: number, controls: Controls = noControls): GameState =>
  Array.from({ length: frames }).reduce<GameState>(
    (current) => updateGame(current, controls),
    state,
  );

/** One frame with a coin. */
const coin = (state: GameState): GameState => run(state, 1, { ...noControls, coin: true });
/** One frame with the start button. */
const start = (state: GameState): GameState => run(state, 1, { ...noControls, start: true });

/** Whether message `text` is on the screen. */
const shows = (state: GameState, text: number): boolean => {
  const first = ROM_TEXTS[text];
  return first !== undefined && state.playing.video.tiles[first.offset] === first.tiles[0];
};

describe('coins and the start button', () => {
  it('asks to push start after a coin, and starts a game with the button', () => {
    const coined = coin(createGame(0));
    expect(coined.credits).toBe(1);
    expect(coined.stage.kind).toBe('pushStart');
    expect(shows(coined, TEXT.pushStart)).toBe(true);
    const started = start(coined);
    expect(started.credits).toBe(0);
    expect(started.stage.kind).toBe('starting');
    expect(started.playing.demo).toBe(false);
  });

  it('ignores the start button without credits', () => {
    expect(start(createGame(0)).stage.kind).toBe('intro');
  });

  it('keeps the coins inserted during a game', () => {
    const playing = start(coin(createGame(0)));
    const more = coin(coin(playing));
    expect(more.credits).toBe(2);
    expect(more.stage.kind).toBe('starting');
  });
});

describe('the demo', () => {
  /** The demo game, just after the chase. */
  const demo = (): GameState => {
    const state = run(createGame(0), 1360);
    expect(state.stage.kind).toBe('playing');
    return state;
  };

  it('plays by itself with "GAME OVER" on the screen, scoring nothing', () => {
    const state = demo();
    expect(state.playing.demo).toBe(true);
    expect(shows(state, TEXT.gameOver)).toBe(true);
    const later = run(state, 600);
    expect(later.playing.dotsEaten).toBeGreaterThan(20);
    expect(later.playing.score).toBe(0);
  });

  it('gives way to "PUSH START BUTTON" as soon as a coin comes', () => {
    expect(coin(demo()).stage.kind).toBe('pushStart');
  });
});

describe('the intermissions in a game', () => {
  it('comes after level 2, then level 3 starts', () => {
    const game = run(start(coin(createGame(0))), 260);
    const cleared = run(
      { ...game, playing: { ...game.playing, level: 2, dotsEaten: MAZE_FOOD } },
      230,
    );
    expect(cleared.stage.kind).toBe('intermission');
    const next = run(cleared, 700);
    expect(next.playing.level).toBe(3);
    expect(['ready', 'playing']).toContain(next.stage.kind);
  });
});
