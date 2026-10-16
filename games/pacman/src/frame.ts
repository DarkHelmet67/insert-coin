import { updateCore } from './core';
import { runDecisions } from './ghost-decisions';
import { isScatter, tickModes } from './ghost-modes';
import { GHOST } from './ghosts';
import { moveInHouse, releaseByTimer, tickHouseClock } from './house';
import type { Joystick } from './pacman';
import type { Playing } from './playing';

/** The idle timer of the house: a ghost leaves when Pac-Man stops eating ($13DD). */
const tickHouseTimer = (playing: Playing): Playing => {
  const timer = releaseByTimer(
    playing.ghosts,
    playing.houseTimer,
    playing.settings.houseTimer,
    playing.dotsEaten !== playing.dotsAtLastMove,
  );
  return { ...playing, ghosts: timer.ghosts, houseTimer: timer.frames };
};

/** The ghosts inside the house move one frame out of two ($0C42). */
const tickHouse = (playing: Playing): Playing => {
  const tick = tickHouseClock(playing.houseClock);
  return {
    ...playing,
    houseClock: tick.clock,
    ghosts: tick.move ? playing.ghosts.map(moveInHouse) : playing.ghosts,
  };
};

/** The skirts flip every 8 frames (routine $0E23). */
const tickWave = (playing: Playing): Playing => {
  const frames = playing.waveFrames + 1;
  return frames === 8
    ? { ...playing, waveFrames: 0, wave: playing.wave ^ 1 }
    : { ...playing, waveFrames: frames };
};

/** The scatter/chase clock; at each change all the ghosts must turn around ($0E36). */
const tickClock = (playing: Playing): Playing => {
  const tick = tickModes(playing.modes, playing.settings.modeChanges, false);
  return {
    ...playing,
    modes: tick.clock,
    ghosts: tick.reverse
      ? playing.ghosts.map((ghost) => ({ ...ghost, reverse: true }))
      : playing.ghosts,
  };
};

/**
 * One frame of play (routine $08EB): the core runs twice, so the fastest actors move two
 * pixels; then the house, the clocks, and the decisions the ghosts asked for.
 */
export const updatePlaying = (playing: Playing, joystick: Joystick): Playing => {
  const work = updateCore(updateCore({ playing, pending: [] }, joystick), joystick);
  const clocked = tickClock(tickWave(tickHouse(tickHouseTimer(work.playing))));
  const decided = runDecisions(clocked.ghosts, clocked.seed, work.pending, {
    hunt: {
      pacmanTile: clocked.pacman.tile,
      pacmanStep: clocked.pacman.step,
      blinkyTile: clocked.ghosts[GHOST.blinky]?.nextTile ?? clocked.pacman.tile,
    },
    scatter: isScatter(clocked.modes),
    elroy1: clocked.elroy.elroy1,
    tiles: clocked.video.tiles,
  });
  return { ...clocked, ghosts: decided.ghosts, seed: decided.seed };
};
