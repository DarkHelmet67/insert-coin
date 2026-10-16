import { updateCore } from './core';
import { tickEating } from './eat-ghost';
import { BLINK_PERIOD, blinkEnergizers, flashGhosts, paintEyes } from './energizer';
import { runDecisions } from './ghost-decisions';
import { isScatter, tickModes } from './ghost-modes';
import { GHOST } from './ghosts';
import { moveInHouse, releaseByTimer, tickHouseClock } from './house';
import type { Joystick } from './pacman';
import type { Playing } from './playing';
import { writeVideo } from './video';

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

/** Whether the game stands still: a ghost being eaten, or Pac-Man caught ($4DA4). */
const standsStill = (playing: Playing): boolean =>
  playing.eating !== undefined || playing.killer !== undefined;

/** The ghosts inside the house move one frame out of two ($0C42). */
const tickHouse = (playing: Playing): Playing => {
  if (standsStill(playing)) return playing;
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
  const tick = tickModes(playing.modes, playing.settings.modeChanges, playing.fright.active);
  return {
    ...playing,
    modes: tick.clock,
    ghosts: tick.reverse
      ? playing.ghosts.map((ghost) => ({ ...ghost, reverse: true }))
      : playing.ghosts,
  };
};

/** The ghosts' colors: blue, flashing, their own, or eyes ($0AC3, $0BD6). */
const paintGhosts = (playing: Playing): Playing => {
  const flashed = standsStill(playing)
    ? { ghosts: playing.ghosts, fright: playing.fright }
    : flashGhosts(playing.ghosts, playing.fright);
  return { ...playing, fright: flashed.fright, ghosts: paintEyes(flashed.ghosts) };
};

/** The energizers blink every 10 frames ($0C0D). */
const tickBlink = (playing: Playing): Playing => {
  const frames = playing.blinkFrames + 1;
  if (frames !== BLINK_PERIOD) return { ...playing, blinkFrames: frames };
  return {
    ...playing,
    blinkFrames: 0,
    video: writeVideo(playing.video, { colors: blinkEnergizers(playing.video.colors) }),
  };
};

/** The timer of an eaten ghost's points. */
const tickPoints = (playing: Playing): Playing =>
  playing.eating === undefined ? playing : { ...playing, eating: tickEating(playing.eating) };

/**
 * One frame of play (routine $08EB): the core runs twice, so the fastest actors move two
 * pixels; then the house, the clocks, and the decisions the ghosts asked for.
 */
export const updatePlaying = (playing: Playing, joystick: Joystick): Playing => {
  const work = updateCore(updateCore({ playing, pending: [] }, joystick), joystick);
  const housed = tickHouse(tickHouseTimer(work.playing));
  const clocked = tickPoints(tickBlink(paintGhosts(tickClock(tickWave(housed)))));
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
