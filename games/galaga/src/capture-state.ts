/*
 * The state of a capture: the Boss that dives to catch the fighter, its tractor beam, the
 * captured fighter and its rescue. The original keeps it in a handful of bytes
 * (`ds5_928A_captr_status`, `_b_captr_flag`, `_b_bmbr_boss_cobj` ...) shared by five tasks of
 * the main processor; the remake keeps the same values, named after their use.
 */

/** The five tasks of a capture (`ds_cpu0_task_actv`), by what they do. */
export interface CaptureTasks {
  /** `f_21CB`: the capturing Boss dives and turns upright. */
  readonly approach: boolean;
  /** `f_2222`: the beam opens, holds, closes. */
  readonly beam: boolean;
  /** `f_20F2`: the fighter spins up to the Boss. */
  readonly pull: boolean;
  /** `f_19B2`: the Boss carries the captured fighter back to the formation. */
  readonly carry: boolean;
  /** `f_2000`: a rescued fighter spins down and joins the player's. */
  readonly rescue: boolean;
}

/** Everything about a capture. */
export interface Capture {
  /**
   * A capture is going on, or a fighter is held: no other Boss is chosen to capture
   * (`_b_bmbr_boss_cflag`). It stays set while a double fighter flies.
   */
  readonly busy: boolean;
  /** The capturing Boss, then the rescued fighter; 1 when none (`_b_bmbr_boss_cobj`). */
  readonly object: number;
  /** The flight slot of the capturing Boss (`_b_cboss_slot`). */
  readonly slot: number;
  /** Sprite x the beam is centered on, aligned to the fighter (`captr_status[0]`). */
  readonly beamX: number;
  /**
   * The beam's progress (`captr_status[1]`): the low nibble counts its rows, bit 6 marks the
   * closing, bit 7 a Boss shot while beaming; during a rescue it counts the landing phases.
   */
  readonly step: number;
  /** Frames to the next step of the beam (`captr_status[2]`). */
  readonly countdown: number;
  /** The fighter is still being pulled up (`captr_status[3]`). */
  readonly pulling: boolean;
  /** "FIGHTER CAPTURED" must be shown (`captr_status[4]`). */
  readonly showText: boolean;
  /** Frames between beam steps (`_b_captr_flag`): the stage parameter, 10 while pulling. */
  readonly beamSpeed: number;
  /** The fighter has reached the Boss (`b_9200[$0D]`). */
  readonly connected: boolean;
  /** Which of the 10 rows of the beam are drawn. */
  readonly beamRows: readonly boolean[];
  readonly tasks: CaptureTasks;
}

/** Number of character rows of the beam. */
export const BEAM_ROWS = 10;

/** No capture going on. */
export const NO_CAPTURE: Capture = {
  busy: false,
  object: 1,
  slot: 0,
  beamX: 0,
  step: 0,
  countdown: 0,
  pulling: false,
  showText: false,
  beamSpeed: 0,
  connected: false,
  beamRows: Array.from({ length: BEAM_ROWS }, () => false),
  tasks: { approach: false, beam: false, pull: false, carry: false, rescue: false },
};

/** The beam with row `row` (1-10) drawn or erased. */
export const setBeamRow = (capture: Capture, row: number, drawn: boolean): Capture => ({
  ...capture,
  beamRows: capture.beamRows.map((shown, i) => (i === row - 1 ? drawn : shown)),
});

/** The capture with some of its tasks turned on or off. */
export const withTasks = (capture: Capture, tasks: Partial<CaptureTasks>): Capture => ({
  ...capture,
  tasks: { ...capture.tasks, ...tasks },
});
