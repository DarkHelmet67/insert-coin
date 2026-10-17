import { describe, expect, it } from 'vitest';
import { noControls, type Controls } from './controls';
import { DEATH_OVER } from './death';
import { createGame, updateGame, type GameState } from './game';
import { MAZE_FOOD } from './ghost-modes';
import { GHOST } from './ghosts';
import { fruitOf } from './fruit';
import { DELAY, timerOf } from './timers';
import { TEXT } from './texts';
import { ROM_TEXTS } from './rom/texts';

/** The game after `frames` frames with the given controls. */
const run = (state: GameState, frames: number, controls: Controls = noControls): GameState =>
  Array.from({ length: frames }).reduce<GameState>(
    (current) => updateGame(current, controls),
    state,
  );

/** A coin, then the start button: a game has just started. */
const newGame = (): GameState =>
  run(run(createGame(0), 1, { ...noControls, coin: true }), 1, { ...noControls, start: true });

/** The game once play has started. */
const playing = (): GameState => {
  const started = run(newGame(), 260);
  expect(started.stage.kind).toBe('playing');
  return started;
};

/** Whether message `text` is on the screen. */
const shows = (state: GameState, text: number): boolean => {
  const first = ROM_TEXTS[text];
  return first !== undefined && state.playing.video.tiles[first.offset] === first.tiles[0];
};

/** A game in which a ghost has just finished catching Pac-Man. */
const caught = (lives: number): GameState => {
  const state = playing();
  return {
    ...state,
    playing: { ...state.playing, lives, killer: GHOST.blinky, death: DEATH_OVER - 2 },
  };
};

describe('the game', () => {
  it('starts with "PLAYER ONE" and "READY!", then the actors, then play', () => {
    const start = newGame();
    expect(start.stage.kind).toBe('starting');
    expect(shows(start, TEXT.playerOne)).toBe(true);
    expect(shows(start, TEXT.ready)).toBe(true);
    const ready = run(start, 140);
    expect(ready.stage.kind).toBe('ready');
    expect(shows(ready, TEXT.playerOne)).toBe(false);
    expect(ready.playing.livesShown).toBe(2);
    const play = playing();
    expect(shows(play, TEXT.ready)).toBe(false);
  });

  it('takes a life away and starts the next one after "READY!"', () => {
    const lost = run(caught(3), 1);
    expect(lost.stage.kind).toBe('lost');
    expect(lost.playing.lives).toBe(2);
    const next = run(lost, 1);
    expect(next.stage.kind).toBe('ready');
    expect(next.playing.killer).toBeUndefined();
    expect(next.playing.houseDots.global).toBe(0);
  });

  it('ends with "GAME OVER", then goes back to the attract mode', () => {
    const over = run(caught(1), 2);
    expect(over.stage.kind).toBe('gameOver');
    expect(shows(over, TEXT.gameOver)).toBe(true);
    const attract = run(over, 130);
    expect(attract.stage.kind).toBe('intro');
    expect(attract.playing.demo).toBe(true);
  });

  it('flashes the maze when the dots are gone, then starts the next level', () => {
    const state = playing();
    const done = run({ ...state, playing: { ...state.playing, dotsEaten: MAZE_FOOD } }, 1);
    expect(done.stage.kind).toBe('cleared');
    const flashing = run(done, 125);
    expect(flashing.stage.kind).toBe('flashing');
    const next = run(flashing, 8 * 12 + 30);
    expect(next.stage.kind).toBe('ready');
    expect(next.playing.level).toBe(2);
    expect(next.playing.dotsEaten).toBe(0);
    expect(shows(next, TEXT.ready)).toBe(true);
  });

  it('takes the fruit away after 10 seconds, even across a death', () => {
    const state = caught(3);
    const withFruit = {
      ...state,
      playing: {
        ...state.playing,
        fruit: { kind: fruitOf(0), shown: true },
        fruitTimer: timerOf(DELAY.fruit),
      },
    };
    expect(run(withFruit, 500).playing.fruitTimer).toBeDefined();
    expect(run(withFruit, 610).playing.fruitTimer).toBeUndefined();
  });
});
