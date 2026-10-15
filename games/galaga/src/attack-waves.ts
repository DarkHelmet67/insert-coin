/*
 * The five attack waves that bring the aliens into the formation at the start of each stage
 * (`c_25A2`). Each wave is a list of aliens with a control byte that picks the flight program,
 * the start point and the timing; from stage 4 on, "transients" join the waves: aliens that fly
 * in and leave without taking a place in the formation.
 */
import {
  CHALLENGE_STAGE_INDEX,
  CHALLENGE_STAGES,
  COMBAT_STAGE_INDEX,
  COMBAT_STAGES,
  WAVE_OBJECTS,
} from './rom/main-rom';
import { isChallengeStage, type Rank } from './stage-setup';

/** One alien of a wave: its control byte and its object. */
export interface WaveEntry {
  readonly control: number;
  readonly object: number;
}

/** The table read by the wave launcher: a start mark before each wave, an end mark. */
export type WaveToken = 'start' | 'end' | WaveEntry;

/**
 * The `n`-th random byte of a stage setup. The original mixes the Z80 refresh register with the
 * frame counter, something no emulation of the game logic can reproduce: any source of random
 * bytes gives the same kind of waves.
 */
export type RandomByte = (n: number) => number;

/** What `c_25A2` produces: the token list and the two header bytes of the stage. */
export interface StageWaves {
  readonly tokens: readonly WaveToken[];
  /** Header byte 0 (`b_92E2[0]`): frames between two bomb chances of a diving alien. */
  readonly bombInterval: number;
  /** Header byte 1 (`b_92E2[1]`): bomb bits of the aliens that may drop bombs while entering. */
  readonly entryBombBits: number;
}

/** The stage that gives the waves: past stage 22 the last four repeat. */
const waveStage = (stage: number): number => {
  const repeat = Math.max(0, Math.ceil((stage - 0x16) / 4));
  return stage - repeat * 4;
};

/** Offset of the stage's 18 bytes in the combat or the challenge table. */
const stageRow = (
  stage: number,
  rank: Rank,
): { readonly table: readonly number[]; readonly offset: number } => {
  const level = waveStage(stage);
  if (isChallengeStage(level)) {
    return { table: CHALLENGE_STAGES, offset: CHALLENGE_STAGE_INDEX[(stage >> 2) & 7] ?? 0 };
  }
  const index = level - (level >> 2) - 1;
  return { table: COMBAT_STAGES, offset: COMBAT_STAGE_INDEX[rank * 17 + index] ?? 0 };
};

/** An empty place in the 16-byte buffer of one wave. */
const FREE = 0xff;

/** The buffer while transients are placed, and how many random bytes were used. */
interface Placing {
  readonly buffer: readonly number[];
  readonly draws: number;
}

/**
 * `l_2612`: places the transients of a wave in random free places of the buffer. The low nibble
 * of `spec` is how many, the high bits (one per transient) whether it is a butterfly or a bee.
 */
const placeTransients = (spec: number, random: RandomByte, first: number): readonly number[] => {
  const count = spec & 0x0f;
  const range = (count >> 1) + 4;
  /** One transient: retries until it finds a free place, like the original. */
  const place = (buffer: readonly number[], b: number, draw: number): Placing => {
    const position = (random(draw) % range) | ((b & 1) === 1 ? 8 : 0);
    if (buffer[position] !== FREE) return place(buffer, b, draw + 1);
    const butterfly = ((spec << (count - b)) & 0x80) !== 0;
    const id = ((b << 1) & 0xff) | (butterfly ? 0x40 : 0) | 0x38;
    return { buffer: buffer.map((value, i) => (i === position ? id : value)), draws: draw + 1 };
  };
  return Array.from({ length: count }, (_, i) => count - i).reduce<Placing>(
    (placing, b) => place(placing.buffer, b, placing.draws),
    { buffer: Array.from({ length: 16 }, () => FREE), draws: first },
  ).buffer;
};

/** `l_2636`: the 8 aliens of the wave fill the free places, 4 in each half of the buffer. */
const placeAliens = (buffer: readonly number[], aliens: readonly number[]): readonly number[] =>
  aliens.reduce((current, id, n) => {
    const from = n < 4 ? 0 : 8;
    const position = current.findIndex((value, i) => i >= from && value === FREE);
    return current.map((value, i) => (i === position ? id : value));
  }, buffer);

/** `l_2662`: aliens fly in pairs, one from each half, with their own control bytes. */
const pairUp = (buffer: readonly number[], left: number, right: number): readonly WaveEntry[] => {
  const length = buffer.slice(0, 8).findIndex((value) => value === FREE);
  return Array.from({ length: length < 0 ? 8 : length }, (_, i) => [
    { control: left, object: buffer[i] ?? FREE },
    { control: right, object: buffer[i + 8] ?? FREE },
  ]).flat();
};

/**
 * `c_25A2`: the attack waves of `stage`. When a Boss holds a captured fighter, that fighter
 * flies in with the last wave (`rogueFighter`).
 */
export const buildAttackWaves = (
  stage: number,
  rank: Rank,
  random: RandomByte,
  rogueFighter: boolean,
): StageWaves => {
  const { table, offset } = stageRow(stage, rank);
  const waves = Array.from({ length: 5 }, (_, w) => {
    const spec = table[offset + 2 + w * 3] ?? 0;
    const aliens = WAVE_OBJECTS.slice(w * 8, w * 8 + 8);
    const buffer = placeAliens(placeTransients(spec, random, w * 64), aliens);
    const left = table[offset + 3 + w * 3] ?? 0;
    const right = table[offset + 4 + w * 3] ?? 0;
    return pairUp(buffer, left, right);
  });
  const last = waves[4]?.at(-2);
  const rogue: readonly WaveToken[] =
    rogueFighter && !isChallengeStage(stage) && last !== undefined
      ? [{ control: last.control, object: 0x04 }]
      : [];
  return {
    tokens: [...waves.flatMap((wave): readonly WaveToken[] => ['start', ...wave]), ...rogue, 'end'],
    bombInterval: table[offset] ?? 0x14,
    entryBombBits: table[offset + 1] ?? 0,
  };
};
