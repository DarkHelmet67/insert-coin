/*
 * The three ways the sound program plays an effect (`c_03F4`/`c_044A`, `c_0375`, `c_04A2` in
 * `gg1-7.s`). They differ in what the trigger register means:
 * - a *restarting* effect (hits, shot, dive) starts again from the top at every trigger, which
 *   the program clears at once;
 * - a *held* effect (tractor beam, rescue) plays, in a loop, as long as its register is set;
 * - a *tune* plays to its end once triggered, then clears its register.
 */
import { effectTracks, type EffectTracks } from './sound-data';
import { EFFECT, setPlaying, setTrigger, trigger, withSound, type Work } from './sound-state';
import { playTrack, setAt } from './sound-tracks';

/** Track of the challenge results tune (`b_9A30[$1C]`): its three tracks start in turn. */
const ROUND_TRACK = 0x1c;

/**
 * `l_0393`: the tracks of `effect`. The challenge results tune is a round: its second track
 * joins when the first has played a note, the third when the second has.
 */
const tracksOf = (work: Work, effect: number): EffectTracks => {
  const tracks = effectTracks(effect);
  if (effect !== EFFECT.challengeEnd) return tracks;
  const notes = work.sound.tracks.notes;
  const first = notes[ROUND_TRACK] ?? 0;
  if (first === 0) return { ...tracks, count: 1 };
  if (first === 1 || (notes[ROUND_TRACK + 1] ?? 0) === 0) return { ...tracks, count: 2 };
  return tracks;
};

/** `l_03B7`: the effect starts: its tracks go back to their first note. */
const start = (work: Work, effect: number): Work => {
  const { first, count } = tracksOf(work, effect);
  /** Zero for the tracks of the effect. */
  const reset = (list: readonly number[]): readonly number[] =>
    list.map((v, i) => (i >= first && i < first + count ? 0 : v));
  const { tracks } = work.sound;
  return setPlaying(
    withSound(work, { tracks: { ticks: reset(tracks.ticks), notes: reset(tracks.notes) } }),
    effect,
    true,
  );
};

/** The result of playing an effect for one tick. */
interface Played {
  readonly work: Work;
  /** One of its tracks has run out of notes: the effect is over. */
  readonly ended: boolean;
}

/** `l_03D2`: one tick of every track of the effect, each on its voice. */
const playTracks = (work: Work, effect: number): Played => {
  const { first, count, voice } = tracksOf(work, effect);
  return Array.from({ length: count }, (_, i) => i).reduce<Played>(
    (played, i) => {
      const tick = playTrack(
        played.work.sound.tracks,
        played.work.mix,
        effect,
        first + i,
        voice + i,
      );
      return {
        work: { sound: { ...played.work.sound, tracks: tick.tracks }, mix: tick.mix },
        ended: played.ended || tick.ended,
      };
    },
    { work, ended: false },
  );
};

/** The effect is no longer playing when it has ended. */
const stopIfEnded = ({ work, ended }: Played, effect: number): Work =>
  ended ? setPlaying(work, effect, false) : work;

/** `c_03F4`, `c_044A`: a restarting effect. */
export const restarting = (work: Work, effect: number): Work => {
  if (trigger(work, effect) !== 0) {
    return stopIfEnded(playTracks(start(setTrigger(work, effect, 0), effect), effect), effect);
  }
  return work.sound.playing[effect] === true ? stopIfEnded(playTracks(work, effect), effect) : work;
};

/** The effect started if it is not playing yet. */
const startOnce = (work: Work, effect: number): Work =>
  work.sound.playing[effect] === true ? work : start(work, effect);

/** `c_0375`: a held effect; when its register is cleared it stops, to start again from the top. */
export const held = (work: Work, effect: number): Work =>
  trigger(work, effect) === 0
    ? setPlaying(work, effect, false)
    : stopIfEnded(playTracks(startOnce(work, effect), effect), effect);

/** Effects kept by the "shot your ship!" tune when it clears the others: coins, extra fighter. */
const KEPT = new Set<number>([EFFECT.coin, EFFECT.extraLife]);

/** `l_0525`: what the end of a tune does to the trigger registers. */
const tuneEnded = (work: Work, effect: number): Work => {
  const value = trigger(work, effect);
  switch (effect) {
    case EFFECT.coin:
      // One tune for every coin counted.
      return setTrigger(work, effect, value - 1);
    case EFFECT.nameEntry: {
      const left = (value - 1) & 0xff;
      const counted = setTrigger(work, effect, left);
      return left === 0 || (left & 1) !== 0 ? setTrigger(counted, EFFECT.nameEntryEnd, 1) : counted;
    }
    case EFFECT.perfect:
      // At its end the "perfect" tune starts effect $13, the dive sound.
      return setTrigger(setTrigger(work, effect, 0), EFFECT.dive, 1);
    case EFFECT.capturedFighterHit:
      return withSound(work, {
        triggers: work.sound.triggers.map((v, i) => (KEPT.has(i) ? v : 0)),
        playing: work.sound.playing.map((v, i) => KEPT.has(i) && v),
      });
    default:
      return setTrigger(work, effect, 0);
  }
};

/** `c_04A2`: a tune, played to its end once its register is set. */
export const tune = (work: Work, effect: number): Work => {
  if (trigger(work, effect) === 0) return work;
  const played = playTracks(startOnce(work, effect), effect);
  return played.ended ? tuneEnded(setPlaying(played.work, effect, false), effect) : played.work;
};

/** The voice `voice` set to `volume` after the effects, as a few of them do. */
export const setVolume = (work: Work, voice: number, volume: number): Work => ({
  ...work,
  mix: { ...work.mix, volumes: setAt(work.mix.volumes, voice, volume) },
});
