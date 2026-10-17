import { NO_FLIP } from '@arcade/tiles';
import { deathSprite, ghostsGone } from './death';
import { FRUIT_POSITION, type Fruit } from './fruit';
import type { Stage } from './stage';
import { intermissionSprites } from './intermission-sprites';
import { ghostPointsSprite, ghostSprite } from './ghost-sprites';
import { PACMAN_PALETTE, pacmanSprite } from './pacman-sprite';
import type { Playing } from './playing';
import type { HardwareSprite } from './sprites';

/** The fruit under the house, while it is there to eat. */
const fruitSprites = (fruit: Fruit | undefined): readonly HardwareSprite[] =>
  fruit?.shown === true
    ? [
        {
          code: fruit.kind.sprite,
          palette: fruit.kind.palette,
          flip: NO_FLIP,
          ...FRUIT_POSITION,
        },
      ]
    : [];

/** Pac-Man as usual, or shrinking once a ghost has caught him ($12CB). */
const pacmanSprites = (playing: Playing): readonly HardwareSprite[] => {
  const dying = deathSprite(playing.death);
  if (dying === undefined) return [pacmanSprite(playing.pacman)];
  return [{ code: dying, palette: PACMAN_PALETTE, flip: NO_FLIP, ...playing.pacman.position }];
};

/**
 * The ghosts (an eaten one shows its points in its place, $1250) and Pac-Man, who vanishes
 * while the points show. They are gone during the death animation.
 */
const playSprites = (playing: Playing): readonly HardwareSprite[] => {
  const { ghosts, wave, eating, fright } = playing;
  const shown = eating?.phase === 'meet' ? undefined : eating;
  const ghostSprites = ghostsGone(playing.death)
    ? []
    : ghosts.map((ghost) =>
        ghost.id === shown?.ghost
          ? ghostPointsSprite(ghost, fright.eaten)
          : ghostSprite(ghost, wave),
      );
  return shown === undefined ? [...ghostSprites, ...pacmanSprites(playing)] : ghostSprites;
};

/**
 * The hardware sprites of a stage, in the order of the program's sprite slots: the ghosts,
 * Pac-Man, the fruit. There are none before the game starts and once a life is lost; during
 * the flashes the ghosts are gone ($09F6). The attract mode's chase shows them as in a game;
 * the intermissions change some slots.
 */
export const actorSprites = (stage: Stage, playing: Playing): readonly HardwareSprite[] => {
  switch (stage.kind) {
    case 'ready':
    case 'playing':
    case 'cleared':
    case 'chase':
      return [...playSprites(playing), ...fruitSprites(playing.fruit)];
    case 'intermission':
      return intermissionSprites(playing, stage.intermission);
    case 'flashing':
      return [...pacmanSprites(playing), ...fruitSprites(playing.fruit)];
    default:
      return [];
  }
};
