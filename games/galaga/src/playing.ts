import { newAttacks, type Attacks } from './attacks';
import { NO_CAPTURE, type Capture } from './capture-state';
import type { AlienLook, Rank, StageParameters } from './stage-setup';
import { NO_TIMERS, type GameTimers } from './clock';
import { SLOT_COUNT, type BombDrift } from './flight';
import type { FlightSlot } from './flight-slot';
import { initialFormation, type Formation } from './formation';
import type { Message } from './messages';
import { setUpBombs } from './bombs';
import { FIRST_BONUS } from './extra-lives';
import { emptyObjects, type Objects } from './objects';
import { NO_PATHS, type RocketPath } from './rockets';
import type { SoundName } from './sound-names';
import { STARS_STOPPED, type StarControl } from './star-control';
import { STARS_STILL, type StarSpeed } from './stars';
import { startLauncher, type Launcher } from './wave-launcher';
import type { Phase } from './program';
import { stageParameters, RANK } from './stage-setup';

/** The scrolling starfield: the shift register's phase and the speed chosen by the program. */
export interface StarField {
  readonly phase: number;
  readonly speed: StarSpeed;
}

/**
 * The tasks of the main processor that the program turns on and off (`ds_cpu0_task_actv`),
 * by what they do.
 */
export interface Tasks {
  /** `f_2A90`: the grid sways while the waves enter. */
  readonly sway: boolean;
  /** `f_1DE6`: the grid breathes once all aliens are home. */
  readonly breathing: boolean;
  /** `f_1B65` and `f_1A80`: aliens leave the formation to attack. */
  readonly attacks: boolean;
  /** `f_1F85` and `f_1F04`: the joystick and the fire button are read. */
  readonly stick: boolean;
  readonly fire: boolean;
  /** `f_1A80`: the clone attack of the bonus bee. */
  readonly clones: boolean;
  /** `f_05EE` on the second processor: aliens and bombs can hit the fighter. */
  readonly fighterHits: boolean;
}

/** All tasks off. */
const NO_TASKS: Tasks = {
  sway: false,
  breathing: false,
  attacks: false,
  stick: false,
  fire: false,
  fighterHits: false,
  clones: false,
};

/** Everything about a game in progress. */
export interface PlayingState {
  /** Frames since the game started (`ds3_92A0_frame_cts[0]`). */
  readonly frame: number;
  readonly timers: GameTimers;
  /** Where the main program is. */
  readonly phase: Phase;
  readonly tasks: Tasks;
  readonly objects: Objects;
  readonly slots: readonly (FlightSlot | undefined)[];
  readonly bombDrift: readonly BombDrift[];
  readonly rocketPaths: readonly RocketPath[];
  /** Alternating 1 and 2 pixel steps of the fighter. */
  readonly stepToggle: boolean;
  /** Two fighters side by side, after a rescue. */
  readonly dual: boolean;
  readonly formation: Formation;
  readonly stars: StarField;
  readonly starControl: StarControl;
  /** The stage being played (1, 2, ...), the difficulty, and what the stage setup decided. */
  readonly stage: number;
  readonly rank: Rank;
  readonly params: StageParameters;
  readonly looks: ReadonlyMap<number, AlienLook>;
  readonly launcher: Launcher;
  readonly entryBombBits: number;
  /** Frames between two bomb chances of a diving alien (`b_92E2[0]`). */
  readonly bombInterval: number;
  readonly attacks: Attacks;
  /** Aliens attacking at once: grows once after the first 30 seconds (`b_92C0[$09]`). */
  readonly maxBombers: number;
  /** Flying aliens hit in this stage, and those left of the current group of 8. */
  readonly flyingHits: number;
  readonly groupLeft: number;
  /** The capturing Boss, its beam, the captured or rescued fighter. */
  readonly capture: Capture;
  /** Aliens left of a triple attack and the bonus for shooting them all. */
  readonly tripleLeft: number;
  readonly tripleBonus: { readonly hundreds: number; readonly code: number };
  /** Resting aliens follow the grid (`ds_9200_glbls[$0B]`). */
  readonly enemiesEnabled: boolean;
  /** New waves may start (`_b_atk_wv_enbl`). */
  readonly wavesEnabled: boolean;
  /** All waves are home: the sway stops in the middle (`_b_nestlr_inh`). */
  readonly swayStops: boolean;
  /** Aliens in play, as counted by the object manager, and the count in progress. */
  readonly alive: number;
  readonly counting: number;
  /** The fighter was lost: the stage restarts (`ds_9200_glbls[$13]`). */
  readonly restart: boolean;
  /** Fighters in reserve (`_b_nships`), shown at the bottom left. */
  readonly reserve: number;
  /** Stage badges shown so far: they appear one by one. */
  readonly badges: number;
  readonly messages: readonly Message[];
  readonly score: number;
  /** The next extra fighter, in tens of thousands of points (`_b_mcfg_bonus`). */
  readonly nextBonus: number;
  /** Rockets fired and aliens hit, for the results at the end of the game. */
  readonly shots: number;
  readonly hits: number;
  /** Sounds started in this frame. */
  readonly sounds: readonly SoundName[];
}

/** A game before its first frame: the main program starts with the "PLAYER 1" screen. */
export const emptyPlayingState = (phase: Phase): PlayingState => ({
  frame: 0,
  timers: NO_TIMERS,
  phase,
  tasks: NO_TASKS,
  objects: setUpBombs(emptyObjects()),
  slots: Array.from({ length: SLOT_COUNT }, () => undefined),
  bombDrift: Array.from({ length: 8 }, () => ({ rate: 0, accumulator: 0 })),
  rocketPaths: NO_PATHS,
  stepToggle: false,
  dual: false,
  formation: initialFormation(),
  stars: { phase: 0, speed: STARS_STILL },
  starControl: STARS_STOPPED,
  stage: 0,
  rank: RANK.A,
  params: stageParameters(1, RANK.A),
  looks: new Map(),
  launcher: { ...startLauncher([]), running: false },
  entryBombBits: 0,
  bombInterval: 0x14,
  attacks: newAttacks(),
  maxBombers: 0,
  flyingHits: 0,
  groupLeft: 0,
  capture: NO_CAPTURE,
  tripleLeft: 0,
  tripleBonus: { hundreds: 0, code: 0 },
  enemiesEnabled: false,
  wavesEnabled: false,
  swayStops: false,
  alive: 0,
  counting: 0,
  restart: false,
  reserve: 2,
  badges: 0,
  messages: [],
  score: 0,
  nextBonus: FIRST_BONUS,
  shots: 0,
  hits: 0,
  sounds: [],
});

/** The state with `sound` started in this frame. */
export const play = (state: PlayingState, sound: SoundName): PlayingState => ({
  ...state,
  sounds: [...state.sounds, sound],
});

/** Aliens in flight (`b_bugs_flying_nbr`): the flight slots in use. */
export const flyingCount = (state: PlayingState): number =>
  state.slots.filter((slot) => slot !== undefined).length;
