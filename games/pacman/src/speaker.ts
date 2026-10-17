/**
 * The cabinet's amplifier reaches the speaker through a capacitor, which lets no steady
 * voltage through: a voice holding a still sample, as at a rest of the music, gives silence,
 * not an offset that clicks at each change. A one-pole high-pass filter does the same.
 */

/** The filter's memory: the last sample in and out. */
export interface Speaker {
  readonly lastIn: number;
  readonly lastOut: number;
}

/** A speaker at rest. */
export const QUIET_SPEAKER: Speaker = { lastIn: 0, lastOut: 0 };

/** How much of the last output each sample keeps: a cut-off near 15 Hz at 48 kHz [N]. */
const POLE = 0.998;

/**
 * The samples as the speaker plays them, and its memory after them. The loop keeps the
 * filter's two values in local variables: a frame has some 800 samples.
 */
export const throughSpeaker = (
  speaker: Speaker,
  samples: Float32Array<ArrayBuffer>,
): { readonly speaker: Speaker; readonly samples: Float32Array<ArrayBuffer> } => {
  let { lastIn, lastOut } = speaker;
  const out = Float32Array.from(samples, (sample) => {
    lastOut = sample - lastIn + POLE * lastOut;
    lastIn = sample;
    return lastOut;
  });
  return { speaker: { lastIn, lastOut }, samples: out };
};
