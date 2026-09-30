import { atariVectorFont, textToLines, type BeamLine } from '@arcade/vector';
import { showsGameOver, type GameState } from './game';

/**
 * The messages of the program [P $77F6], at the positions of its table [P $7871] and at twice
 * the font size, like every message.
 */
const MESSAGES = {
  player: { text: 'PLAYER 1', x: 400, y: 728 },
  gameOver: { text: 'GAME OVER', x: 400, y: 628 },
  pushStart: { text: 'PUSH START', x: 400, y: 792 },
} as const;

/** Scale of the messages: the program draws them all at global scale 1, twice the font. */
const MESSAGE_SCALE = 2;

/** Which messages a state shows. */
export type MessageName = keyof typeof MESSAGES;

/**
 * The messages on screen: "PLAYER 1" before the ship first appears [P $6892], "GAME OVER" once
 * the last ship is lost [P $6984], and after the game "PUSH START", blinking 32 frames on and
 * 32 off [P $693B].
 */
export const visibleMessages = (state: GameState): readonly MessageName[] => [
  ...(state.phase === 'playing' && state.delay > 0 ? (['player'] as const) : []),
  ...(showsGameOver(state) ? (['gameOver'] as const) : []),
  ...(state.phase === 'attract' && (state.frame & 0x20) === 0 ? (['pushStart'] as const) : []),
];

/** The lines of the messages on screen. */
export const messageLines = (state: GameState): readonly BeamLine[] =>
  visibleMessages(state).flatMap((name) => {
    const { text, x, y } = MESSAGES[name];
    return textToLines(atariVectorFont, text, { x, y, scale: MESSAGE_SCALE });
  });
