import { atariVectorFont, textToLines, type BeamLine } from '@arcade/vector';
import type { Outcome } from './landing';

/**
 * The messages in the middle of the screen [P ENGMSG, E.MOFF, DSPMOT, STATUS, DSPATTR, DSPRTP;
 * R MSSGLBS]: texts and positions as the program writes them, at brightness 12.
 */

/** Brightness of the messages. */
const MESSAGE_BRIGHTNESS = 12;

/** Where the beam starts each kind of message [R MSSGLBS]. */
export const MESSAGE_AT = {
  insertCoins: { x: 434, y: 576 },
  fuelStatus: { x: 446, y: 608 },
  fuelLost: { x: 392, y: 608 },
  coinOffer: { x: 374, y: 528 },
  tanksDestroyed: { x: 332, y: 640 },
  landingTitle: { x: 422, y: 544 },
  points: { x: 446, y: 464 },
  pushStart: { x: 452, y: 528 },
  fuelOnBoard: { x: 422, y: 480 },
  crashVerdict: { x: 272, y: 544 },
  goodVerdict: { x: 368, y: 512 },
  hardVerdict: { x: 332, y: 512 },
} as const;

/** The four verdicts of each outcome, picked at random, with their centring nudge [P E.MOFF]. */
const VERDICTS: Readonly<Record<Outcome, readonly (readonly [text: string, nudge: number])[]>> = {
  good: [
    ['THAT WAS A GREAT LANDING', 0],
    ['THE EAGLE HAS LANDED', 24],
    ['THE COLUMBIA HAS LANDED', 6],
    ['YOU HAVE LANDED', 54],
  ],
  hard: [
    ['LIFE SUPPORT IS GONE', 60],
    ['YOUR TRIP IS ONE WAY', 60],
    ['YOU ARE HOPELESSLY MAROONED', 18],
    ['COMMUNICATION SYSTEM DESTROYED', 0],
  ],
  crash: [
    ['DESTROYED', 186],
    ['YOU CREATED A TWO MILE CRATER', 60],
    ['YOU JUST DESTROYED A 100 MEGABUCK LANDER', 0],
    ['THERE WERE NO SURVIVORS', 102],
  ],
};

/** A message at a position. */
const message = (
  text: string,
  at: { readonly x: number; readonly y: number },
): readonly BeamLine[] =>
  textToLines(atariVectorFont, text, { ...at, brightness: MESSAGE_BRIGHTNESS });

/** A number in four places, leading zeros blank [P DIGT2S]. */
const fourPlaces = (value: number): string =>
  String(Math.max(0, Math.floor(value))).padStart(4, ' ');

/** The verdict and title after a landing or a crash [P DSPMOT]. */
export const outcomeLines = (
  outcome: Outcome,
  verdict: number,
  points: number,
): readonly BeamLine[] => {
  const [text, nudge] = VERDICTS[outcome][verdict & 3] ?? ['', 0];
  const verdictAt =
    outcome === 'good'
      ? MESSAGE_AT.goodVerdict
      : outcome === 'hard'
        ? MESSAGE_AT.hardVerdict
        : MESSAGE_AT.crashVerdict;
  const title =
    outcome === 'good' ? 'CONGRATULATIONS' : outcome === 'hard' ? 'YOU LANDED HARD' : undefined;
  return [
    ...(title === undefined ? [] : message(title, MESSAGE_AT.landingTitle)),
    ...message(text, { x: verdictAt.x + nudge, y: verdictAt.y }),
    ...message(`${fourPlaces(points)} POINTS`, MESSAGE_AT.points),
  ];
};

/** "nnnn FUEL UNITS LOST" [P MESSFU]. */
export const fuelLostLines = (units: number): readonly BeamLine[] =>
  message(`${fourPlaces(units)} FUEL UNITS LOST`, MESSAGE_AT.fuelLost);

/** The crash adds the reason for the lost fuel above it [P DSPMOT]. */
export const tanksDestroyedLines: readonly BeamLine[] = message(
  'AUXILIARY FUEL TANKS DESTROYED',
  MESSAGE_AT.tanksDestroyed,
);

/** "LOW ON FUEL", flashing, or "OUT OF FUEL" [P STATUS]. */
export const fuelStatusLines = (status: 'low' | 'out'): readonly BeamLine[] =>
  message(status === 'low' ? 'LOW ON FUEL' : 'OUT OF FUEL', MESSAGE_AT.fuelStatus);

/** The attract screen: the price, and INSERT COINS flashing [P DSPATTR]. */
export const attractLines = (
  fuelPerCoin: number,
  showInsertCoins: boolean,
): readonly BeamLine[] => [
  ...message(`${String(fuelPerCoin)} FUEL UNITS PER COIN`, MESSAGE_AT.coinOffer),
  ...(showInsertCoins ? message('INSERT COINS', MESSAGE_AT.insertCoins) : []),
];

/** The screen between the coin and START [P DSPRTP]. */
export const readyLines = (fuel: number): readonly BeamLine[] => [
  ...message('SELECT OPTION', MESSAGE_AT.insertCoins),
  ...message('PUSH START', MESSAGE_AT.pushStart),
  ...message(`${fourPlaces(fuel)} FUEL UNITS`, MESSAGE_AT.fuelOnBoard),
];
