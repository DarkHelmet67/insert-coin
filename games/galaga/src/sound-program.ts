/*
 * `c_nmi_proc`: one tick of the sound processor, 120 a second. The effects are checked in a
 * fixed order and each one writes the voices it uses: an effect later in the list covers an
 * earlier one on the same voice, so the order is the priority.
 */
import type { WsgVoice } from '@arcade/wsg';
import { PULSE_CLOSING, PULSE_OPENING, pulseSegment } from './sound-data';
import { held, restarting, setVolume, tune } from './sound-effects';
import { EFFECT, trigger, withSound, type SoundState, type Work } from './sound-state';
import { setAt } from './sound-tracks';

/** Ticks of each segment of the pulsing sound (`l_0102`). */
const PULSE_SEGMENT_TICKS = 0x22;

/** Restarting effects, lowest priority first: the dive, the shot and the hits. */
const RESTARTING = [
  EFFECT.dive,
  EFFECT.shot,
  EFFECT.beeHit,
  EFFECT.butterflyHit,
  EFFECT.bossDamaged,
  EFFECT.bossHit,
] as const;

/**
 * `l_00D3`: the pulsing sound of the breathing formation, on the first voice: a pitch that
 * slides up while the formation opens and down while it closes, in segments of 34 ticks.
 * `sign` is the direction of the formation (`formatn_mv_signage`): 1 opening, $FF closing.
 */
const pulse = (work: Work, sign: number): Work => {
  if (trigger(work, EFFECT.pulse) === 0) return work;
  const { pulse: current, tracks } = work.sound;
  const turned = sign !== current.sign;
  const tick = turned ? 0 : ((tracks.ticks[0] ?? 0) + 1) & 0xff;
  const nextSegment = turned || tick === PULSE_SEGMENT_TICKS;
  const table = turned ? (sign === 0xff ? PULSE_CLOSING : PULSE_OPENING) : current.table;
  const segment = turned ? 0 : nextSegment ? current.segment + 1 : current.segment;
  const loaded = nextSegment ? pulseSegment(table, segment) : undefined;
  const step = loaded?.step ?? current.step;
  const pitch = ((loaded?.start ?? current.pitch) + step) & 0xffff;
  return {
    sound: {
      ...work.sound,
      tracks: { ...tracks, ticks: setAt(tracks.ticks, 0, nextSegment ? 0 : tick) },
      pulse: { sign, table, segment, pitch, step },
    },
    mix: {
      frequencies: setAt(work.mix.frequencies, 0, (pitch >> 8) * 16),
      volumes: setAt(work.mix.volumes, 0, 0x0a),
      waveforms: setAt(work.mix.waveforms, 0, 0),
    },
  };
};

/**
 * `l_0204`: the tractor beam, with a tremolo on its third voice: every 6 ticks the volume
 * drops by one, from 12 down to 3 and back to 12.
 */
const tractorBeam = (work: Work): Work => {
  if (trigger(work, EFFECT.tractorBeam) === 0) return held(work, EFFECT.tractorBeam);
  const played = held(work, EFFECT.tractorBeam);
  const ticks = played.sound.beamTicks + 1;
  const { beamVolume } = played.sound;
  const next = ticks < 6 ? beamVolume : beamVolume < 4 ? 0x0c : beamVolume - 1;
  return setVolume(
    withSound(played, { beamTicks: ticks < 6 ? ticks : 0, beamVolume: next }),
    2,
    next,
  );
};

/** `l_0241`: the fighter pulled up the beam: the first voice changes waveform every 28 ticks. */
const beamCapture = (work: Work): Work => {
  if (trigger(work, EFFECT.beamCapture) === 0) return held(work, EFFECT.beamCapture);
  const played = held(work, EFFECT.beamCapture);
  const ticks = played.sound.pullTicks + 1;
  const waveform = ticks === 0x1c ? played.sound.pullWaveform + 1 : played.sound.pullWaveform;
  const counted = withSound(played, {
    pullTicks: ticks === 0x1c ? 0 : ticks,
    pullWaveform: waveform,
  });
  return {
    ...counted,
    mix: { ...counted.mix, waveforms: setAt(counted.mix.waveforms, 0, waveform) },
  };
};

/** `l_0292`-`l_0324`: the tunes, below the "shot your ship!" one, which skips them all. */
const tunes = (work: Work): Work => {
  const rescued = held(work, EFFECT.rescue);
  const intro = tune(rescued, EFFECT.challengeStart);
  const results =
    trigger(intro, EFFECT.challengeEnd) === 0
      ? intro
      : setVolume(setVolume(tune(intro, EFFECT.challengeEnd), 1, 9), 2, 6);
  return [
    EFFECT.perfect,
    EFFECT.badge,
    EFFECT.extraLife,
    EFFECT.startTheme,
    EFFECT.unused,
    EFFECT.nameEntry,
    EFFECT.nameEntryEnd,
  ].reduce((w, effect) => (effect === EFFECT.unused ? held(w, effect) : tune(w, effect)), results);
};

/** The voices at the end of a tick: only the low bits of each register count. */
const voicesOf = (work: Work): readonly WsgVoice[] =>
  work.mix.frequencies.map((frequency, voice) => ({
    frequency,
    volume: (work.mix.volumes[voice] ?? 0) & 0x0f,
    waveform: (work.mix.waveforms[voice] ?? 0) & 7,
  }));

/** One tick of the program. */
export interface SoundTick {
  readonly sound: SoundState;
  readonly voices: readonly WsgVoice[];
}

/** `c_nmi_proc`: one tick of the sound program; `sign` is the formation's direction. */
export const tickSound = (sound: SoundState, sign: number): SoundTick => {
  const first: Work = {
    sound,
    mix: { frequencies: [0, 0, 0], volumes: [0, 0, 0], waveforms: sound.waveforms },
  };
  const hits = RESTARTING.reduce(restarting, pulse(first, sign));
  const beams = beamCapture(tractorBeam(tune(hits, EFFECT.bonusBee)));
  const captured = held(beams, EFFECT.fighterCaptured);
  const music =
    trigger(captured, EFFECT.capturedFighterHit) === 0
      ? tunes(captured)
      : tune(captured, EFFECT.capturedFighterHit);
  const last = tune(music, EFFECT.coin);
  return { sound: { ...last.sound, waveforms: last.mix.waveforms }, voices: voicesOf(last) };
};
