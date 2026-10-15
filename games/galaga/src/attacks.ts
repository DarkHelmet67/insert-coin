/*
 * `f_1B65`: the attack manager. Every 16 frames three countdowns (Boss, red butterfly, yellow
 * bee) step down; when one runs out an alien of that kind leaves the formation and dives along
 * its attack program, unless too many are already flying. A Boss takes up to two butterflies
 * of the row below as escorts; their launches wait in a small queue and leave one per frame.
 */
import type { BomberSettings } from './bomber-timers';
import type { Capture } from './capture-state';
import { newSlot, type FlightSlot } from './flight-slot';
import { DISPOSITION, objectAt, updateObject, type Objects } from './objects';
import { BOSS_SCORES, ESCORTS } from './rom/main-rom';

/** Flight programs of the second processor's ROM used by the attacks. */
export const ATTACK_PROGRAM = {
  /** `db_flv_atk_yllw` and `db_flv_atk_red`: bee and butterfly dives. */
  bee: 0x034f,
  butterfly: 0x03a9,
  /** `db_flv_0411`: Boss dive; `db_flv_00f1` when the aliens are not "enabled" (training). */
  boss: 0x0411,
  bossTraining: 0x00f1,
  /** `db_fltv_rogefgter`: a captured fighter diving alone. */
  rogueFighter: 0x0444,
  /** `db_0454`: a Boss diving to capture the fighter with its beam. */
  capture: 0x0454,
  /** `db_flv_cboss`: the Boss going home with the captured fighter. */
  captureHome: 0x046b,
} as const;

/** A launch waiting in the queue (`bmbr_boss_pool`). */
export interface QueuedLaunch {
  readonly object: number;
  readonly mirrored: boolean;
  readonly program: number;
}

/** The score a Boss is worth when shot while diving, set when it leaves. */
export interface BossScore {
  /** Points added in hundreds (`ds_bug_collsn_hit_mult[$0F]`), on top of 2 × 150. */
  readonly hundreds: number;
  /** The score sprite shown, with the hit flag. */
  readonly code: number;
}

/** The attack manager's state. */
export interface Attacks {
  /** Countdowns of Boss, red and yellow bombers (`b_92C0[0-2]`). */
  readonly countdown: readonly [number, number, number];
  readonly queue: readonly QueuedLaunch[];
  /** Counts Boss launches while no capture is going on: one in two captures (`_b_bmbr_boss_wingm`). */
  readonly bossToggle: number;
  /** Score of each Boss when shot diving, by its place ($30, $32, $34, $36). */
  readonly bossScores: readonly BossScore[];
  /** The alien chosen as bonus bee, which the manager does not launch (`_b_bbee_obj`). */
  readonly bonusBee: number;
  /** Frames before the bonus bee leaves, counting up to 0 from $C0 (`_b_bbee_tmr`). */
  readonly bonusBeeTimer: number;
  /** Its own look, packed code and palette, taken back when it returns (`_b_bbee_clr_a`). */
  readonly bonusBeeLook: number;
  /** The palette it flashes to, 4, 5 or 6 by stage (`_b_bbee_clr_b`). */
  readonly bonusBeeColor: number;
}

/** The default Boss score: 400 points (`01 B5` four times, `stg_init_env`). */
const BOSS_400: BossScore = { hundreds: 1, code: 0xb5 };

/** The manager at the start of a stage. */
export const newAttacks = (): Attacks => ({
  countdown: [0x16, 2, 2],
  queue: [],
  bossToggle: 0,
  bossScores: [BOSS_400, BOSS_400, BOSS_400, BOSS_400],
  bonusBee: 1,
  bonusBeeTimer: 0,
  bonusBeeLook: 0x1b,
  bonusBeeColor: 4,
});

/** What the manager changes. */
export interface AttackWorld {
  readonly attacks: Attacks;
  readonly objects: Objects;
  readonly slots: readonly (FlightSlot | undefined)[];
  /** Only the choice of a capturing Boss reads and changes it. */
  readonly capture: Capture;
  /** An alien left the formation: the dive sound. */
  readonly dived: boolean;
}

/** What the manager reads. */
export interface AttackInputs {
  readonly frame: number;
  readonly settings: BomberSettings;
  readonly flying: number;
  readonly enemiesEnabled: boolean;
  readonly fireEnabled: boolean;
  readonly rescueRunning: boolean;
}

/** Whether object `id` rests in the formation. */
const atHome = (objects: Objects, id: number): boolean =>
  objectAt(objects, id).disposition === DISPOSITION.home;

/** Aliens on the right half of the formation fly mirrored programs: bit 1 of their number. */
const isRightSide = (id: number): boolean => (id & 2) !== 0;

/**
 * `j_108A`: an alien leaves the formation. It takes a free flight slot, starting where its
 * sprite is, pointing up.
 */
export const launchDiver = (
  world: AttackWorld,
  launch: QueuedLaunch,
  bombBits: number,
): AttackWorld => {
  const free = world.slots.findIndex((slot) => slot === undefined);
  if (free < 0) return world;
  const sprite = objectAt(world.objects, launch.object);
  const slot = newSlot({
    object: launch.object,
    pointer: launch.program,
    angle: 0x100,
    y: ((0x161 - sprite.y) & 0x1ff) << 7,
    x: sprite.x << 7,
    bombTimer: 0x1e,
    bombBits,
    mirrored: launch.mirrored,
  });
  return {
    ...world,
    slots: world.slots.map((s, i) => (i === free ? slot : s)),
    objects: updateObject(world.objects, launch.object, (o) => ({
      ...o,
      disposition: DISPOSITION.flying,
      counter: free,
    })),
    dived: true,
  };
};

/** `case_bmbr_yellow`, `case_bmbr_red`: the first resting bee or butterfly that is not the bonus bee. */
const launchFirst = (
  world: AttackWorld,
  first: number,
  count: number,
  program: number,
  inputs: AttackInputs,
): AttackWorld => {
  const id = Array.from({ length: count }, (_, i) => first + i * 2).find(
    (candidate) => atHome(world.objects, candidate) && candidate !== world.attacks.bonusBee,
  );
  if (id === undefined) return world;
  const launch = { object: id, mirrored: isRightSide(id), program };
  return launchDiver(world, launch, inputs.enemiesEnabled ? inputs.settings.bombBits : 0);
};

/** The Boss of each ordinal 1-4 of the escort search (`c_1C8D`): 4 is the leftmost. */
const BOSS_BY_ORDINAL = [0x32, 0x36, 0x34, 0x30] as const;

/** Index of a Boss in the score table: $30, $32, $34, $36 are 0-3. */
const bossIndex = (boss: number): number => (boss & 7) >> 1;

/**
 * `j_1CAE`: a Boss leaves with `escorts` (0, 1 or 2 butterflies). Its score when shot diving is
 * 400 alone, 800 with one escort, 1600 with two; everyone waits in the queue.
 */
const queueBoss = (
  world: AttackWorld,
  boss: number,
  escorts: readonly number[],
  program: number,
): AttackWorld => {
  const mirrored = isRightSide(boss);
  const scoreRow = 2 - escorts.length;
  const score = {
    hundreds: BOSS_SCORES[scoreRow * 2] ?? 1,
    code: BOSS_SCORES[scoreRow * 2 + 1] ?? 0xb5,
  };
  // The captured fighter of this Boss, if it rests above it, follows it (`l_1CE3`).
  const fighter = boss & 7;
  const captured = atHome(world.objects, fighter) ? [fighter] : [];
  const queue = [boss, ...escorts, ...captured].map((object) => ({ object, mirrored, program }));
  const { attacks } = world;
  return {
    ...world,
    attacks: {
      ...attacks,
      queue,
      bossScores: attacks.bossScores.map((s, i) => (i === bossIndex(boss) ? score : s)),
    },
  };
};

/**
 * `l_1C30`: a Boss with escorts. Six butterflies can escort (`d_1D2C_wingmen`); each Boss looks at
 * the three below it. First a Boss with two free escorts is sought, then one with one, then any
 * Boss alone; with no Boss left, a captured fighter dives by itself.
 */
const launchBoss = (world: AttackWorld, inputs: AttackInputs): AttackWorld => {
  const program = inputs.enemiesEnabled ? ATTACK_PROGRAM.boss : ATTACK_PROGRAM.bossTraining;
  const available = ESCORTS.map(
    (id) => id !== world.attacks.bonusBee && atHome(world.objects, id),
  ).reverse();
  /** Escorts free under the Boss of ordinal `n` (1-4): three bits of the escort row. */
  const freeEscorts = (n: number): readonly number[] =>
    [0, 1, 2]
      .map((bit) => 4 - n + bit)
      .filter((index) => available[index] === true)
      .map((index) => ESCORTS[5 - index] ?? 0);
  /** The first Boss (ordinals 4 to 1) at home with at least `wanted` free escorts. */
  const pick = (wanted: number): AttackWorld | undefined => {
    const ordinal = [4, 3, 2, 1].find(
      (n) => freeEscorts(n).length >= wanted && atHome(world.objects, BOSS_BY_ORDINAL[n - 1] ?? 0),
    );
    if (ordinal === undefined) return undefined;
    const boss = BOSS_BY_ORDINAL[ordinal - 1] ?? 0;
    return queueBoss(world, boss, freeEscorts(ordinal).slice(0, wanted), program);
  };
  const lone = [0x30, 0x32, 0x34, 0x36].find((id) => atHome(world.objects, id));
  const rogue = [0x00, 0x02, 0x04, 0x06].find((id) => atHome(world.objects, id));
  return (
    pick(2) ??
    pick(1) ??
    (lone !== undefined ? queueBoss(world, lone, [], program) : undefined) ??
    (rogue !== undefined
      ? launchDiver(
          world,
          { object: rogue, mirrored: isRightSide(rogue), program: ATTACK_PROGRAM.rogueFighter },
          inputs.enemiesEnabled ? inputs.settings.bombBits : 0,
        )
      : world)
  );
};

/**
 * `case_bmbr_boss`: when no capture is going on, one Boss launch in two is a capture: the first
 * resting Boss dives alone along the capture program. With no Boss resting, nothing leaves.
 */
const launchBossOrCapture = (world: AttackWorld, inputs: AttackInputs): AttackWorld => {
  if (world.capture.busy) return launchBoss(world, inputs);
  const bossToggle = world.attacks.bossToggle + 1;
  const counted = { ...world, attacks: { ...world.attacks, bossToggle } };
  if ((bossToggle & 1) !== 0) return launchBoss(counted, inputs);
  const boss = [0x30, 0x32, 0x34, 0x36].find((id) => atHome(world.objects, id));
  if (boss === undefined) return counted;
  return queueBoss(
    { ...counted, capture: { ...counted.capture, busy: true, object: boss } },
    boss,
    [],
    ATTACK_PROGRAM.capture,
  );
};

/** `l_1B8B`: the next queued launch, if the alien is still at home. */
const launchQueued = (world: AttackWorld, inputs: AttackInputs): AttackWorld => {
  const [next, ...rest] = world.attacks.queue;
  const popped = { ...world, attacks: { ...world.attacks, queue: rest } };
  if (next === undefined || !atHome(world.objects, next.object)) return popped;
  return launchDiver(popped, next, inputs.enemiesEnabled ? inputs.settings.bombBits : 0);
};

/** `l_1BA8`: the countdowns step; the first to run out launches its kind of alien. */
const countDown = (world: AttackWorld, inputs: AttackInputs): AttackWorld => {
  const { countdown } = world.attacks;
  const expired = countdown.findIndex((value) => value === 1);
  // Countdowns step in order up to the first that runs out, like the original loop.
  const last = expired < 0 ? 2 : expired;
  const stepped = countdown.map((value, i) => (i <= last ? (value - 1) & 0xff : value));
  /** The world with the countdowns set to `values`. */
  const counted = (values: readonly number[]): AttackWorld => ({
    ...world,
    attacks: { ...world.attacks, countdown: [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0] },
  });
  if (expired < 0) return counted(stepped);
  if (inputs.flying >= inputs.settings.maxBombers) {
    return counted(stepped.map((value, i) => (i === expired ? 1 : value)));
  }
  const reloaded = counted(
    stepped.map((value, i) => (i === expired ? (inputs.settings.reload[i] ?? 1) : value)),
  );
  switch (expired) {
    case 0:
      return launchBossOrCapture(reloaded, inputs);
    case 1:
      return launchFirst(reloaded, 0x40, 16, ATTACK_PROGRAM.butterfly, inputs);
    default:
      return launchFirst(reloaded, 0x08, 20, ATTACK_PROGRAM.bee, inputs);
  }
};

/** One frame of the attack manager. */
export const runAttacks = (world: AttackWorld, inputs: AttackInputs): AttackWorld => {
  if (inputs.enemiesEnabled && (!inputs.fireEnabled || inputs.rescueRunning)) return world;
  if (world.attacks.queue.length > 0) return launchQueued(world, inputs);
  return (inputs.frame & 0x0f) === 0 ? countDown(world, inputs) : world;
};
