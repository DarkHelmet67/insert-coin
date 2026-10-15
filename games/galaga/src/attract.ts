/*
 * The attract screen (`f_17B2`): while the cabinet waits for a coin, the info screen writes
 * "GALAGA", the score table and the aliens one line a second, then the copyright appears. The
 * original goes on with a training round and a demo game played by the program, which the
 * remake leaves out: the info screen and the copyright repeat instead.
 */
import { setTimer, tickTimers, NO_TIMERS, type GameTimers } from './clock';
import { show, type Message } from './messages';
import { DISPOSITION, emptyObjects, updateObject, type Objects } from './objects';
import type { StarField } from './playing';
import { advanceStars, STARS_SLOW } from './stars';

/** The texts of the info screen, one a second (strings $0E-$12 of `d_cstring_tbl`). */
const INFO_TEXTS: readonly Message[] = [
  { text: 'GALAGA', column: 11, row: 4, palette: 0 },
  { text: '-- SCORE --', column: 8, row: 7, palette: 0 },
  { text: '50    100', column: 12, row: 10, palette: 0 },
  { text: '80    160', column: 12, row: 12, palette: 0 },
  { text: '', column: 12, row: 13, palette: 0 },
];

/** `s_1525`: the copyright line (the styled "NAMCO" under it is left out). */
const COPYRIGHT: Message = { text: '© 1981 NAMCO LTD.', column: 6, row: 29, palette: 3 };

/**
 * `d_attrmode_sptiles`: the aliens of the score table, from the 3rd text on: object, color and
 * code, x and y / 2. The upright sprite of each alien is its code + 6.
 */
const INFO_SPRITES = [
  { object: 0x08, look: 0x1b, x: 0x44, y: 0x3a },
  { object: 0x0a, look: 0x12, x: 0x44, y: 0x42 },
  { object: 0x0c, look: 0x08, x: 0x7c, y: 0x50 },
] as const;

/** Where the attract screen is. */
export type AttractStep = 'info' | 'copyright';

/** The attract screen. */
export interface Attract {
  readonly frame: number;
  readonly stars: StarField;
  readonly timers: GameTimers;
  readonly step: AttractStep;
  /** Texts of the info screen written so far. */
  readonly shown: number;
  readonly messages: readonly Message[];
  readonly objects: Objects;
}

/** `case_1940`, `case_1948`: a clear screen, the first text due in one second. */
const startInfo = (attract: Omit<Attract, 'step' | 'shown' | 'messages' | 'objects'>): Attract => ({
  ...attract,
  timers: setTimer(attract.timers, 2, 2),
  step: 'info',
  shown: 0,
  messages: [],
  objects: emptyObjects(),
});

/** The attract screen as the cabinet is switched on. */
export const newAttract = (): Attract =>
  startInfo({ frame: 0, stars: { phase: 0, speed: STARS_SLOW }, timers: NO_TIMERS });

/** `c_sprite_tiles_displ`: an alien of the score table appears, upright. */
const showSprite = (objects: Objects, index: number): Objects => {
  const sprite = INFO_SPRITES[index];
  if (sprite === undefined) return objects;
  return updateObject(objects, sprite.object, (o) => ({
    ...o,
    disposition: DISPOSITION.home,
    code: (sprite.look & 0x78) + 6,
    color: (sprite.look & 0x07) | ((sprite.look & 0x80) !== 0 ? 8 : 0),
    x: sprite.x,
    y: sprite.y * 2,
  }));
};

/** `case_1984`: every second the next text, and from the third one an alien. */
const info = (attract: Attract): Attract => {
  if (attract.timers[2] !== 0) return attract;
  const timers = setTimer(attract.timers, 2, 2);
  if (attract.shown === INFO_TEXTS.length) {
    // The copyright stays about four seconds (`case_18AC`).
    return {
      ...attract,
      timers: setTimer(timers, 2, 9),
      step: 'copyright',
      messages: show(attract.messages, COPYRIGHT),
    };
  }
  const text = INFO_TEXTS[attract.shown];
  const shown = attract.shown + 1;
  return {
    ...attract,
    timers,
    shown,
    messages:
      text === undefined || text.text === '' ? attract.messages : show(attract.messages, text),
    objects: shown >= 3 ? showSprite(attract.objects, shown - 3) : attract.objects,
  };
};

/** One frame of the attract screen: the stars move, the screens follow one another. */
export const updateAttract = (attract: Attract): Attract => {
  const frame = attract.frame + 1;
  const moved: Attract = {
    ...attract,
    frame,
    stars: { ...attract.stars, phase: advanceStars(attract.stars.phase, attract.stars.speed) },
    timers: tickTimers(attract.timers, frame),
  };
  switch (moved.step) {
    case 'info':
      return info(moved);
    case 'copyright':
      return moved.timers[2] <= 1 ? startInfo(moved) : moved;
  }
};
