/*
 * What changes from one stage to the next: the look of the aliens (`c_2896`) and the ten
 * difficulty parameters of the stage (`c_2C00`). Both come from tables of the main ROM.
 */
import { BOMBER_BITS, CHALLENGE_BONUS, CHALLENGE_LOOKS, STAGE_PARAMETERS } from './rom/main-rom';

/** Whether `stage` (1, 2, ...) is a challenging stage: 3, 7, 11 ... */
export const isChallengeStage = (stage: number): boolean => ((stage + 1) & 3) === 0;

/**
 * The difficulty set with the DIP switches, as the index the tables use: they are stored in the
 * order B, C, D, A. A is the factory setting.
 */
export const RANK = { B: 0, C: 1, D: 2, A: 3 } as const;
/** One of the four difficulty levels. */
export type Rank = (typeof RANK)[keyof typeof RANK];

/** How an alien looks when it enters: sprite code (multiple of 8), palette, may drop bombs. */
export interface AlienLook {
  readonly code: number;
  readonly color: number;
  readonly bombs: boolean;
}

/** Code and palette packed as the program does: code in bits 3-6, palette in bits 0-2. */
const unpack = (packed: number, bombs: boolean): AlienLook => ({
  code: packed & 0x78,
  color: packed & 0x07,
  bombs,
});

/** Bee (code $18, palette 3), Boss ($08, 0) and butterfly ($10, 2): the normal stages. */
const BEE = 0x1b;
const BOSS = 0x08;
const BUTTERFLY = 0x12;

/** The three classes of aliens: first object, how many, and their packed look. */
const classes = (stage: number): readonly (readonly [number, number, number])[] => {
  const challenge = (CHALLENGE_LOOKS[(stage >> 2) & 7] ?? 0) >> 1;
  return [
    [0x08, 20, isChallengeStage(stage) ? challenge : BEE],
    [0x30, 8, BOSS],
    [0x40, 16, isChallengeStage(stage) ? challenge : BUTTERFLY],
  ];
};

/** Bit `index` of the "may drop bombs" table `d_2908`, most significant bit first. */
const bomberBit = (index: number): boolean =>
  (((BOMBER_BITS[index >> 3] ?? 0) << (index & 7)) & 0x80) !== 0;

/**
 * `c_2896`: the look of objects $08-$5E at the start of `stage`. On challenging stages the bees
 * and butterflies are replaced by the special aliens of that stage, every four stages a new kind.
 */
export const stageLooks = (stage: number): ReadonlyMap<number, AlienLook> => {
  const entries = classes(stage).flatMap(([first, count, packed], c) => {
    const before = classes(stage)
      .slice(0, c)
      .reduce((sum, [, n]) => sum + n, 0);
    return Array.from({ length: count }, (_, i): readonly [number, AlienLook] => [
      first + i * 2,
      unpack(packed, bomberBit(before + i)),
    ]);
  });
  return new Map(entries);
};

/** The bonus of a challenging stage for each group of 8 aliens shot down. */
export interface ChallengeBonus {
  /** Points in hundreds (`ds_bug_collsn_hit_mult[$0F]`): 10 is 1000 points. */
  readonly tens: number;
  /** The score sprite shown on the last alien of the group, with the hit flag. */
  readonly scoreCode: number;
}

/** `l_28B5`: the group bonus grows every 8 stages, up to the fourth level from stage 32. */
export const challengeBonus = (stage: number): ChallengeBonus => {
  const index = stage >= 32 ? 3 : (stage >> 3) & 3;
  return {
    tens: CHALLENGE_BONUS[index * 2] ?? 0,
    scoreCode: CHALLENGE_BONUS[index * 2 + 1] ?? 0,
  };
};

/** The ten parameters of a stage (`ds_new_stage_parms`), named after their use. */
export interface StageParameters {
  /** Index into the "bomb enable" table (0). */
  readonly bombEnable: number;
  /** Indexes into the launch timer tables of Boss, red and yellow bombers (1-3). */
  readonly bossTimer: number;
  readonly redTimer: number;
  readonly yellowTimer: number;
  /** Aliens attacking at once, and after the first 30 seconds (4, 5). */
  readonly maxBombers: number;
  readonly maxBombersLater: number;
  /** Frames between steps of the tractor beam (6). */
  readonly beamSpeed: number;
  /** With fewer aliens than this left, they attack nonstop (7). */
  readonly continuousBombing: number;
  /** Harder entry and attack paths (8, 9). */
  readonly harderEntries: boolean;
  readonly harderAttacks: boolean;
  /** Aliens left when the triple "clone" attack may start (10); 0 on the first stages. */
  readonly cloneAttack: number;
}

/** The stages of the table: past stage 26 the last four repeat. */
const tableStage = (stage: number): number => {
  const repeat = Math.max(0, Math.ceil((stage - 0x1a) / 4));
  return stage - repeat * 4;
};

/** Where each rank's 130 bytes start (`bmbr_stg_cfg_lut`): rank A is the first block. */
const RANK_BLOCK = [1, 2, 3, 0] as const;

/** `c_2C00`: the parameters of `stage` at difficulty `rank`, one per nibble of 5 bytes. */
export const stageParameters = (stage: number, rank: Rank): StageParameters => {
  const start = (RANK_BLOCK[rank] ?? 0) * 0x82 + (tableStage(stage) - 1) * 5;
  const n = Array.from({ length: 10 }, (_, i) => {
    const byte = STAGE_PARAMETERS[start + (i >> 1)] ?? 0;
    return (i & 1) === 0 ? byte >> 4 : byte & 0x0f;
  });
  const [p0 = 0, p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0, p7 = 0, p8 = 0, p9 = 0] = n;
  return {
    bombEnable: p0,
    bossTimer: p1,
    redTimer: p2,
    yellowTimer: p3,
    maxBombers: p4,
    maxBombersLater: p5,
    beamSpeed: p6,
    continuousBombing: p7,
    harderEntries: p8 !== 0,
    harderAttacks: p9 !== 0,
    cloneAttack: stage < 3 || isChallengeStage(stage) ? 0 : 0x0a,
  };
};

/** `c_2C00`: star speed target of the stage, in 1/64 pixel per frame. */
export const starSpeedTarget = (stage: number): number =>
  ((Math.min(stage, 0x10) << 2) & 0x70) + 0x40;
