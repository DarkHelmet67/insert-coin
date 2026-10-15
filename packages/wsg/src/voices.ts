/** What one voice of the chip plays. */
export interface WsgVoice {
  /** 20-bit step added to the voice's counter at every chip sample (`CHIP_RATE`). */
  readonly frequency: number;
  /** 0 (silent) to 15. */
  readonly volume: number;
  /** Which waveform of the PROM, 0 to 7. */
  readonly waveform: number;
}

/** A voice that makes no sound. */
export const SILENT_VOICE: WsgVoice = { frequency: 0, volume: 0, waveform: 0 };

/** The chip has three voices. */
export const VOICE_COUNT = 3;

/** Three silent voices. */
export const SILENT_VOICES: readonly WsgVoice[] = Array.from(
  { length: VOICE_COUNT },
  () => SILENT_VOICE,
);
