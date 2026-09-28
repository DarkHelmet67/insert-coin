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
