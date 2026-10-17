import { decidePacMan } from './autopilot';
import { newFrameWork, updateCore, type FrameWork } from './core';
import { tickEating } from './eat-ghost';
import { BLINK_PERIOD, blinkEnergizers, flashGhosts, paintEyes } from './energizer';
import { runDecisions } from './ghost-decisions';
import { isScatter, tickModes } from './ghost-modes';
import { GHOST } from './ghosts';
import { moveInHouse, releaseByTimer, tickHouseClock } from './house';
import type { Joystick } from './pacman';
import { roundOf, type Playing } from './playing';
import { fruitDue, fruitOf } from './fruit';
import { DELAY, timerOf } from './timers';
import { SOUND, sirenSound, withSounds } from './sounds';
import { writeVideo } from './video';
import { ENERGIZER_ADDRESSES } from './maze';

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
export const tickWave = (playing: Playing): Playing => {
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
export const paintGhosts = (playing: Playing): Playing => {
  const flashed = standsStill(playing)
    ? { ghosts: playing.ghosts, fright: playing.fright }
    : flashGhosts(playing.ghosts, playing.fright);
  return { ...playing, fright: flashed.fright, ghosts: paintEyes(flashed.ghosts) };
};

/**
 * The energizers blink every 10 frames ($0C0D): those of the maze, or in the attract mode
 * the ones of its own screens.
 */
export const tickBlink = (
  playing: Playing,
  addresses: readonly number[] = ENERGIZER_ADDRESSES,
): Playing => {
  const frames = playing.blinkFrames + 1;
  if (frames !== BLINK_PERIOD) return { ...playing, blinkFrames: frames };
  return {
    ...playing,
    blinkFrames: 0,
    video: writeVideo(playing.video, { colors: blinkEnergizers(playing.video.colors, addresses) }),
  };
};

/** The timer of an eaten ghost's points. */
export const tickPoints = (playing: Playing): Playing =>
  playing.eating === undefined ? playing : { ...playing, eating: tickEating(playing.eating) };

/** The fruit comes out under the house at 70 and 170 dots (routine $0EAD), not while dying. */
const releaseFruit = (playing: Playing): Playing => {
  if (playing.killer !== undefined) return playing;
  const due = fruitDue(playing.dotsEaten, playing.fruitsReleased, playing.fruit);
  if (due === undefined) return playing;
  return {
    ...playing,
    fruit: { kind: fruitOf(roundOf(playing)), shown: true },
    fruitsReleased: playing.fruitsReleased.map((released, i) => released || i === due),
    fruitTimer: timerOf(DELAY.fruit),
  };
};

/**
 * The sounds that follow the state of the game: the eyes' sound stops when no eyes are left
 * ($1101), and the siren rises with the dots eaten, silent while Pac-Man dies ($0E6C).
 */
const ongoingSounds = (playing: Playing): Playing => {
  const eyes = playing.ghosts.some((ghost) => ghost.eyes !== 'alive');
  const withEyes = eyes ? playing : withSounds(playing, SOUND.noEyes);
  return withSounds(
    withEyes,
    playing.killer === undefined ? sirenSound(playing.dotsEaten) : SOUND.quietSiren,
  );
};

/**
 * The decisions asked during the frame, run after it as the program's tasks: Pac-Man's in the
 * demo (task $17), then the ghosts' ($0C-$0F).
 */
export const runFrameDecisions = (playing: Playing, work: FrameWork): Playing => {
  const blinky = playing.ghosts[GHOST.blinky];
  const pinky = playing.ghosts[GHOST.pinky];
  const pacman = work.pacmanDecides
    ? decidePacMan(
        playing.pacman,
        { pinkyTile: pinky?.nextTile ?? playing.pacman.tile, blinkyBlue: blinky?.blue ?? false },
        playing.video.tiles,
      )
    : playing.pacman;
  const decided = runDecisions(playing.ghosts, playing.seed, work.pending, {
    hunt: {
      pacmanTile: pacman.tile,
      pacmanStep: pacman.step,
      blinkyTile: blinky?.nextTile ?? pacman.tile,
    },
    scatter: isScatter(playing.modes),
    elroy1: playing.elroy.elroy1,
    tiles: playing.video.tiles,
  });
  return { ...playing, pacman, ghosts: decided.ghosts, seed: decided.seed };
};

/** The two passes of the core in a frame ($08EB, $052C). */
export const runCore = (playing: Playing, joystick: Joystick, timers = true): FrameWork =>
  updateCore(updateCore(newFrameWork(playing), joystick, timers), joystick, timers);

/**
 * One frame of play (routine $08EB): the core runs twice, so the fastest actors move two
 * pixels; then the house, the clocks, the sounds, the fruit and the decisions the actors asked for.
 */
export const updatePlaying = (playing: Playing, joystick: Joystick): Playing => {
  const work = runCore(playing, joystick);
  const housed = tickHouse(tickHouseTimer(work.playing));
  const clocked = tickPoints(tickBlink(paintGhosts(tickClock(tickWave(housed)))));
  return releaseFruit(ongoingSounds(runFrameDecisions(clocked, work)));
};
