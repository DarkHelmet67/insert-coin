/**
 * The sounds the game starts at a moment, as the main processor sets the trigger registers of
 * the sound processor (`b_9AA0`). The sounds that last as long as something happens (the
 * tractor beam, the captured fighter's tune, the rescue) are read from the state instead, in
 * `sound-commands.ts`.
 */
export type SoundName =
  | 'shot'
  | 'beeHit'
  | 'butterflyHit'
  | 'bossHit'
  | 'bossDamaged'
  /** A captured fighter, red, was shot ("shot your ship!"). */
  | 'capturedFighterHit'
  /** The player's fighter explodes: the noise of the 54XX chip, not a melody. */
  | 'fighterExplosion'
  | 'dive'
  | 'startTheme'
  | 'challengeStart'
  | 'badge'
  /** The formation starts breathing, with its pulsing sound. */
  | 'pulse'
  | 'extraLife'
  | 'challengeEnd'
  | 'perfect'
  | 'bonusBee';
