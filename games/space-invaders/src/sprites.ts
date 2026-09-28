import { parseSprite, type Sprite } from '@arcade/render';

// All sprites are redrawn by hand in the style of the 1978 original, one string per pixel row.

/** The three kinds of invaders, from the top row (worth most) to the bottom rows. */
export type AlienKind = 'squid' | 'crab' | 'octopus';

/** Two animation frames: invaders alternate between them at every step of their march. */
export type AnimationFrames = readonly [Sprite, Sprite];

/** Sprites of each invader kind. */
export const alienSprites: Readonly<Record<AlienKind, AnimationFrames>> = {
  squid: [
    parseSprite([
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '..X..X..',
      '.X.XX.X.',
      'X.X..X.X',
    ]),
    parseSprite([
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'XX.XX.XX',
      'XXXXXXXX',
      '.X.XX.X.',
      'X......X',
      '.X....X.',
    ]),
  ],
  crab: [
    parseSprite([
      '..X.....X..',
      '...X...X...',
      '..XXXXXXX..',
      '.XX.XXX.XX.',
      'XXXXXXXXXXX',
      'X.XXXXXXX.X',
      'X.X.....X.X',
      '...XX.XX...',
    ]),
    parseSprite([
      '..X.....X..',
      'X..X...X..X',
      'X.XXXXXXX.X',
      'XXX.XXX.XXX',
      'XXXXXXXXXXX',
      '.XXXXXXXXX.',
      '..X.....X..',
      '.X.......X.',
    ]),
  ],
  octopus: [
    parseSprite([
      '....XXXX....',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      'XXX..XX..XXX',
      'XXXXXXXXXXXX',
      '...XX..XX...',
      '..XX.XX.XX..',
      'XX........XX',
    ]),
    parseSprite([
      '....XXXX....',
      '.XXXXXXXXXX.',
      'XXXXXXXXXXXX',
      'XXX..XX..XXX',
      'XXXXXXXXXXXX',
      '..XXX..XXX..',
      '.XX..XX..XX.',
      '..XX....XX..',
    ]),
  ],
};

/** The player's laser cannon. */
export const cannonSprite = parseSprite([
  '......X......',
  '.....XXX.....',
  '.....XXX.....',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
]);

/** The mystery ship (UFO) that crosses the top of the screen. */
export const ufoSprite = parseSprite([
  '.....XXXXXX.....',
  '...XXXXXXXXXX...',
  '..XXXXXXXXXXXX..',
  '.XX.XX.XX.XX.XX.',
  'XXXXXXXXXXXXXXXX',
  '..XXX..XX..XXX..',
  '...X........X...',
]);

/** The cannon's laser shot: a thin vertical line. */
export const shotSprite = parseSprite(['X', 'X', 'X', 'X']);

/** The burst shown for a moment where an invader was hit. */
export const explosionSprite = parseSprite([
  '....X...X....',
  '.X...X.X...X.',
  '..X.......X..',
  '...X.....X...',
  'XX.........XX',
  '...X.....X...',
  '..X..X.X..X..',
  '.X..X...X..X.',
]);

/** The three kinds of invader bombs, each with its own look and firing rule. */
export type BombKind = 'rolling' | 'plunger' | 'squiggly';

/** Four animation frames per bomb, cycled as the bomb falls. */
export const bombSprites: Readonly<Record<BombKind, readonly [Sprite, Sprite, Sprite, Sprite]>> = {
  rolling: [
    parseSprite(['.X.', '.X.', 'XX.', '.X.', '.X.', '.XX', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', '.XX', '.X.', '.X.', 'XX.', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.']),
  ],
  plunger: [
    parseSprite(['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', 'XXX', '.X.', '.X.', '.X.', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', '.X.', '.X.', 'XXX', '.X.', '.X.', '.X.']),
    parseSprite(['.X.', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX', '.X.']),
  ],
  squiggly: [
    parseSprite(['X..', '.X.', '..X', '.X.', 'X..', '.X.', '..X', '.X.']),
    parseSprite(['.X.', '..X', '.X.', 'X..', '.X.', '..X', '.X.', 'X..']),
    parseSprite(['..X', '.X.', 'X..', '.X.', '..X', '.X.', 'X..', '.X.']),
    parseSprite(['.X.', 'X..', '.X.', '..X', '.X.', 'X..', '.X.', '..X']),
  ],
};

/** The splash left where the cannon's shot hits a shield or the top of the screen. */
export const shotExplosionSprite = parseSprite([
  'X...X..X',
  '..X...X.',
  '.XXXXXX.',
  'XXXXXXXX',
  'XXXXXXXX',
  '.XXXXXX.',
  '..X..X..',
  'X..X...X',
]);

/** The splash left where an invader bomb hits a shield or the ground. */
export const bombExplosionSprite = parseSprite([
  '.X..X.',
  'X.XX..',
  '.XXXX.',
  'XXXXXX',
  '.XXXX.',
  'X.XX.X',
  '..X..X',
  'X...X.',
]);

/** The cannon blowing up: two frames that alternate. */
export const cannonExplosionSprites: readonly [Sprite, Sprite] = [
  parseSprite([
    '......X.......',
    '..........X...',
    '...X..X..X....',
    '.....XX.......',
    '..X.XXXX...X..',
    'X..XXXXXX.....',
    '.XXXXXXXXX..X.',
    'XXXXXXXXXXX.XX',
  ]),
  parseSprite([
    '....X....X....',
    'X......X....X.',
    '..X..XX...X...',
    '.X..XXXX......',
    '...XXXXX.X..X.',
    'X.XXXXXXX..X..',
    '..XXXXXXXXX..X',
    '.XXXXXXXXXXXX.',
  ]),
];

/** One of the four green shields, before any damage. */
export const shieldSprite = parseSprite([
  '....XXXXXXXXXXXXXX....',
  '...XXXXXXXXXXXXXXXX...',
  '..XXXXXXXXXXXXXXXXXX..',
  '.XXXXXXXXXXXXXXXXXXXX.',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXX',
  'XXXXXXX........XXXXXXX',
  'XXXXXX..........XXXXXX',
  'XXXXX............XXXXX',
  'XXXXX............XXXXX',
]);
