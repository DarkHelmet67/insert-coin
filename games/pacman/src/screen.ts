import { fruitRowWrites } from './fruit';
import { livesWrites } from './lives';
import { dotWrites, ENERGIZER_ADDRESSES, mazeColorWrites, mazeWrites, TILE } from './maze';
import { HIGH_SCORE_ADDRESS, SCORE_ADDRESS, scoreWrites } from './score';
import { TEXT, textWrites } from './texts';
import { fillCells, filledVideo, writeVideo, type CellWrite, type Video } from './video';

/** "1UP" over the score: tiles '1', 'U', 'P' from right to left at $3DA-$3D8 (routine $0369). */
const ONE_UP: readonly CellWrite[] = [
  { address: 0x3da, value: 0x31 },
  { address: 0x3d9, value: 0x55 },
  { address: 0x3d8, value: 0x50 },
];

/** The playfield: from the first cell under the scores to the last above the lives. */
const PLAYFIELD_START = 0x40;
const PLAYFIELD_SIZE = 0x380;

/** The video with a list of updates applied in order. */
const applyAll = (video: Video, updates: readonly Parameters<typeof writeVideo>[1][]): Video =>
  updates.reduce(writeVideo, video);

/**
 * The dots still on the screen (routine $2487, run when Pac-Man dies): a dot cell keeps its
 * dot only if it still holds one, and the energizer cells are copied as they are.
 */
export const savedDots = (video: Video): readonly CellWrite[] => [
  ...dotWrites().filter(
    (cell) => cell.value === TILE.dot && video.tiles[cell.address] === TILE.dot,
  ),
  ...ENERGIZER_ADDRESSES.map((address) => ({ address, value: video.tiles[address] ?? TILE.space })),
];

/** All the dots of a new level (tasks $12 and $03). */
export const allDots = (): readonly CellWrite[] => dotWrites();

/**
 * The maze drawn again for a new life or a new level (routine $0988): the playfield is
 * cleared, colored, the walls and `dots` drawn, then the fruit row (task $10 draws it with the
 * level settings), the lives and "READY!". On level 256 the fruit row spills over the dots.
 */
export const mazeVideo = (
  video: Video,
  dots: readonly CellWrite[],
  round: number,
  livesShown: number,
): Video =>
  applyAll(video, [
    { tiles: fillCells(PLAYFIELD_START, PLAYFIELD_SIZE, TILE.space) },
    { colors: mazeColorWrites(false, true) },
    { tiles: [...mazeWrites(), ...dots] },
    fruitRowWrites(round),
    livesWrites(livesShown),
    textWrites(TEXT.ready),
  ]);

/**
 * The screen when a game starts (routine $0674): the maze with all its dots, "PLAYER ONE",
 * "READY!", the scores, the first fruit and all the lives.
 */
export const gameStartVideo = (hiScore: number, lives: number): Video =>
  applyAll(mazeVideo(filledVideo(TILE.space, 0), allDots(), 0, lives), [
    textWrites(TEXT.highScore),
    textWrites(TEXT.playerOne),
    {
      tiles: [
        ...ONE_UP,
        ...scoreWrites(0, SCORE_ADDRESS),
        ...(hiScore > 0 ? scoreWrites(hiScore, HIGH_SCORE_ADDRESS) : []),
      ],
    },
  ]);

/** The maze painted white, or back to blue, for the flashes at the end of a level ($09E8). */
export const flashVideo = (video: Video, white: boolean): Video =>
  writeVideo(video, { colors: mazeColorWrites(white, false) });

/** The screen after the flashes (routine $0A0E): the playfield empty and every color black. */
export const blankVideo = (video: Video): Video =>
  applyAll(video, [
    { tiles: fillCells(PLAYFIELD_START, PLAYFIELD_SIZE, TILE.space) },
    { colors: fillCells(0, video.colors.length, 0) },
  ]);
