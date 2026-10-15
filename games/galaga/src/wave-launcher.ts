/*
 * `f_2916`: sends the attack waves into the screen, one alien at a time, by giving each one a
 * flight slot with the start point and the program of its control byte.
 */
import type { WaveEntry, WaveToken } from './attack-waves';
import { newSlot, type FlightSlot } from './flight-slot';
import { DISPOSITION, updateObject, type Objects } from './objects';
import { ENTRY_PROGRAMS, ENTRY_STARTS } from './rom/main-rom';
import type { AlienLook } from './stage-setup';

/** The launcher's own state. */
export interface Launcher {
  readonly tokens: readonly WaveToken[];
  /** Index of the next token (`_p_atkwav_tbl`). */
  readonly next: number;
  /** Waves started so far (`_b_attkwv_ctr`). */
  readonly waveCount: number;
  /** False once all waves are home: the task disables itself. */
  readonly running: boolean;
}

/** What the launcher reads from the rest of the game. */
export interface LauncherInputs {
  readonly frame: number;
  /** Waves may start (`_b_atk_wv_enbl`): false while the fighter is being replaced. */
  readonly enabled: boolean;
  readonly flying: number;
  readonly challenge: boolean;
  /** Game timer 0, the pause between waves. */
  readonly timer: number;
  readonly looks: ReadonlyMap<number, AlienLook>;
  readonly entryBombBits: number;
}

/** What the launcher changes. */
export interface LauncherWorld {
  readonly launcher: Launcher;
  readonly slots: readonly (FlightSlot | undefined)[];
  readonly objects: Objects;
  /** Game timer 0 to set, when the launcher sets it. */
  readonly timer?: number;
  /** Challenging stage: the count of aliens per group restarts (`w_bug_flying_hit_cnt`). */
  readonly groupCountReset?: boolean;
  /** All waves are home: the attacks can start and the formation stops swaying. */
  readonly completed?: boolean;
}

/** A launcher at the start of the token list. */
export const startLauncher = (tokens: readonly WaveToken[]): Launcher => ({
  tokens,
  next: 0,
  waveCount: 0,
  running: true,
});

/** The look of a special enemy: butterfly, bee, or Boss in the third wave (`l_29B3`). */
const transientLook = (id: number, waveCount: number): AlienLook => {
  if ((id & 0x40) !== 0) return { code: 0x10, color: 2, bombs: false };
  return waveCount === 2
    ? { code: 0x08, color: 0, bombs: false }
    : { code: 0x18, color: 3, bombs: false };
};

/** `l_29D1`: the slot of an alien entering with control byte `control`. */
const entrySlot = (entry: WaveEntry, object: number, bombBits: number): FlightSlot => {
  const program = ENTRY_PROGRAMS[(entry.control & 0x3f) * 2] ?? 0;
  const high = ENTRY_PROGRAMS[(entry.control & 0x3f) * 2 + 1] ?? 0;
  const mirrored = (entry.control & 0x40) !== 0;
  const start = (high >> 5) * 6 + (mirrored ? 3 : 0);
  return newSlot({
    object,
    y: (ENTRY_STARTS[start] ?? 0) << 8,
    x: (ENTRY_STARTS[start + 1] ?? 0) << 8,
    angle: (ENTRY_STARTS[start + 2] ?? 0) << 8,
    pointer: program | ((high & 0x1f) << 8),
    bombTimer: (entry.control & 1) === 1 ? 0x44 : 0x08,
    bombBits,
    mirrored,
  });
};

/** `l_295E`: puts the next alien in the first free slot, or waits if none is free. */
const launch = (world: LauncherWorld, entry: WaveEntry, inputs: LauncherInputs): LauncherWorld => {
  const free = world.slots.findIndex((slot) => slot === undefined);
  if (free < 0) return world;
  const { launcher } = world;
  // Objects $78-$7E stand for the special enemies $38-$3E that are butterflies.
  const object = (entry.object & 0x78) === 0x78 ? entry.object & ~0x40 : entry.object;
  const transient = (object & 0x38) === 0x38;
  const look = transient
    ? transientLook(entry.object, launcher.waveCount)
    : (inputs.looks.get(object) ?? { code: 0x18, color: 3, bombs: false });
  const slot = entrySlot(entry, object, look.bombs ? inputs.entryBombBits : 0);
  return {
    ...world,
    launcher: { ...launcher, next: launcher.next + 1 },
    slots: world.slots.map((s, i) => (i === free ? slot : s)),
    objects: updateObject(world.objects, object, (o) => ({
      ...o,
      disposition: DISPOSITION.entering,
      counter: free,
      code: look.code,
      color: look.color,
      flipX: false,
      flipY: false,
      big: false,
      hit: 0,
    })),
  };
};

/**
 * `l_2944`: a start mark. The next wave waits until nothing flies; in a challenging stage it
 * also waits for the pause of game timer 0 (`f_2916`).
 */
const startWave = (world: LauncherWorld, inputs: LauncherInputs): LauncherWorld => {
  if (!inputs.enabled) return world;
  if (inputs.flying !== 0) return { ...world, timer: 2 };
  if (inputs.challenge && inputs.timer === 1) return { ...world, groupCountReset: true };
  if (inputs.challenge && inputs.timer !== 0) return world;
  const { launcher } = world;
  return {
    ...world,
    launcher: { ...launcher, next: launcher.next + 1, waveCount: launcher.waveCount + 1 },
  };
};

/** One frame of the launcher. */
export const runLauncher = (world: LauncherWorld, inputs: LauncherInputs): LauncherWorld => {
  const { launcher } = world;
  if (!launcher.running) return world;
  const token = launcher.tokens[launcher.next] ?? 'end';
  if (token === 'end') {
    return inputs.flying === 0
      ? { ...world, launcher: { ...launcher, running: false }, completed: true }
      : world;
  }
  if (token === 'start') return startWave(world, inputs);
  // Without bit 7, the alien follows the previous one in line: one every 8 frames.
  if ((token.control & 0x80) === 0 && (inputs.frame & 7) !== 0) return world;
  return launch(world, token, inputs);
};
