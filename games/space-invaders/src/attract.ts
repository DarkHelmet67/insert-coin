/** State of the attract screen, the demo shown while waiting for a coin. */
export interface AttractState {
  /** Seconds of simulation time since the screen appeared. */
  readonly time: number;
}

/** Seconds for a full on/off cycle of the blinking text. */
export const BLINK_PERIOD = 1;

/** The attract screen as it appears when the game loads. */
export const initialAttractState: AttractState = { time: 0 };

/** Returns the attract screen state `dt` seconds later. */
export const updateAttract = (state: AttractState, dt: number): AttractState => ({
  time: state.time + dt,
});

/** Whether the blinking "INSERT COIN" text is visible: on for the first half of each period. */
export const isInsertCoinVisible = ({ time }: AttractState): boolean =>
  time % BLINK_PERIOD < BLINK_PERIOD / 2;
