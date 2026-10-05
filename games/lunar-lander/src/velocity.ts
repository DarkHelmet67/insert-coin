/**
 * Speeds as the program keeps them: 16 bits of magnitude plus a sign [P SUMSUM]. In the remake a
 * speed is a signed integer; what matters is that the magnitude stops at 0xFFFF instead of
 * wrapping around. A speed of 4096 moves the module by one world unit per frame.
 */

/** The largest magnitude of a speed [P SUMSUM]. */
export const MAX_SPEED = 0xffff;

/** `magnitude` with the sign of `speed`; never -0, so a speed that stops is a plain 0. */
export const withSignOf = (speed: number, magnitude: number): number =>
  speed < 0 && magnitude > 0 ? -magnitude : magnitude;

/** `speed + change`, with the magnitude saturated at {@link MAX_SPEED}. */
export const addSpeed = (speed: number, change: number): number =>
  Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed + change));

/**
 * The speed the instruments show: the top 10 bits of the magnitude [P DISPLY]. The starting
 * horizontal speed 0x3200 shows as 200.
 */
export const shownSpeed = (speed: number): number => Math.abs(speed) >> 6;

/**
 * TRAINING friction, every 16 frames: each speed loses 1/32 of its magnitude, the shift of the
 * program rounding the loss down [P FRICTN].
 */
export const applyFriction = (speed: number): number => {
  const magnitude = Math.abs(speed) - (Math.abs(speed) >> 5);
  return withSignOf(speed, magnitude);
};

/**
 * A speed change of the program times a multiplier of `tuning.config.ts` [N], rounded to whole
 * speed units because the program has no fractions. A multiplier of 1 gives the value back.
 */
export const scaleSpeed = (change: number, scale: number): number => Math.round(change * scale);
