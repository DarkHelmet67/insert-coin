import type { Playing } from './playing';
import { SOUND_CHANNEL, type SoundWrite } from './sound-board';

/** `SET bit` on a trigger byte. */
const setBit = (channel: number, bit: number): SoundWrite => ({
  channel,
  keep: 0xff,
  set: 1 << bit,
});

/** `RES bit` on a trigger byte. */
const clearBit = (channel: number, bit: number): SoundWrite => ({
  channel,
  keep: 0xff & ~(1 << bit),
  set: 0,
});

/** A plain store into a trigger byte. */
const store = (channel: number, value: number): SoundWrite => ({ channel, keep: 0, set: value });

const { effect1, effect2, effect3, song1, song2 } = SOUND_CHANNEL;

/** The sounds of the game, as the writes of the program to the trigger bytes. */
export const SOUND = {
  /** The extra life: effect 1 of voice 1 ($2B3C). */
  extraLife: [setBit(effect1, 0)],
  /** A coin ($02F7). */
  credit: [setBit(effect1, 1)],
  /** The music at the start of a game: song 1 on voices 1 and 2 ($0668). */
  startMusic: [store(song1, 1), store(song2, 1)],
  /** The blue ghosts, over the siren ($1AC1). */
  fright: [{ channel: effect2, keep: 0x7f, set: 0x20 }],
  /** The end of the blue time ($13D5). */
  frightOver: [clearBit(effect2, 5), clearBit(effect2, 7)],
  /** Eyes on their way home ($128B), and none left ($1112). */
  eyes: [setBit(effect2, 6)],
  noEyes: [clearBit(effect2, 6)],
  /** A fruit eaten ($19C8). */
  fruit: [setBit(effect3, 2)],
  /** A ghost eaten ($1783). */
  ghost: [setBit(effect3, 3)],
  /** Pac-Man shrinking ($12F9), then the two last notes of his death ($1346). */
  death: [setBit(effect3, 4)],
  deathEnd: [store(effect3, 0x20)],
  /** Voices 2 and 3 quiet: Pac-Man caught ($0E72) or the level over ($09E1). */
  quietSiren: [store(effect2, 0)],
  quiet: [store(effect2, 0), store(effect3, 0)],
  /** No song: before a new level ($0A7C). */
  noSongs: [store(song1, 0), store(song2, 0)],
} as const;

/**
 * The "wakka" of a dot or an energizer ($1A06): two effects that alternate with the number of
 * dots eaten, so each dot plays the other half of the sound.
 */
export const dotSound = (dotsEaten: number): readonly SoundWrite[] =>
  dotsEaten % 2 === 0
    ? [setBit(effect3, 0), clearBit(effect3, 1)]
    : [clearBit(effect3, 0), setBit(effect3, 1)];

/** The dots eaten at which the siren goes up a step ($0E7C-$0E9D). */
const SIREN_STEPS = [0x74, 0xb4, 0xd4, 0xe4] as const;

/**
 * The siren, one of 5 effects that rise with the dots eaten (routine $0E6C). The blue ghosts
 * and the eyes, on the bits above, keep playing over it.
 */
export const sirenSound = (dotsEaten: number): readonly SoundWrite[] => [
  {
    channel: effect2,
    keep: 0xe0,
    set: 1 << SIREN_STEPS.filter((dots) => dotsEaten >= dots).length,
  },
];

/** The game with more sound writes for this frame. */
export const withSounds = (playing: Playing, writes: readonly SoundWrite[]): Playing => ({
  ...playing,
  sounds: [...playing.sounds, ...writes],
});
