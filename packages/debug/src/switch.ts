/**
 * The debug switch of a game. Every game has a `debug` section in its `tuning.config.ts` with
 * at least these three fields, plus the helpers of that game (infinite fuel, no capture...).
 */
export interface DebugConfig {
  /** The main switch: when `false` the rest of the section is ignored. */
  readonly enabled: boolean;
  /** The level the game starts from: round, wave, stage, wall or mission; 1 is the normal start. */
  readonly startLevel: number;
  /** The player cannot die. */
  readonly godMode: boolean;
}

/**
 * The value of the build variable that turns debug on for a whole build: the pull request
 * previews are built with `VITE_ARCADE_DEBUG=on`, so they can be tested on a phone without
 * changing any file. The published site is built without it.
 */
export const PREVIEW_DEBUG_FLAG = 'on';

/** Whether this build was made with debug forced on (see `PREVIEW_DEBUG_FLAG`). */
export const isDebugBuild = (): boolean => import.meta.env.VITE_ARCADE_DEBUG === PREVIEW_DEBUG_FLAG;

/**
 * The debug options the game must follow: the ones of `tuning.config.ts` when debug is on,
 * either by its switch or by the build, otherwise `off`, the options of the normal game.
 * The game code then reads plain flags (`debug.godMode`) and never checks the switch itself.
 * @param config - the `debug` section of `tuning.config.ts`.
 * @param off - the same options with every helper turned off.
 * @param forced - whether the build forces debug on; read from the build by default.
 */
export const activeDebug = <T extends DebugConfig>(
  config: T,
  off: T,
  forced: boolean = isDebugBuild(),
): T => (config.enabled || forced ? { ...config, enabled: true } : off);
