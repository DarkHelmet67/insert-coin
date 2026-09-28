import { describe, expect, it } from 'vitest';
import type { Alien } from './aliens';
import { noControls } from './controls';
import { initialPlayingState, updatePlaying, type PlayingState } from './playing';

const fire = { ...noControls, fire: true };

/** A game with the given invaders and the cannon at `cannonX`. */
const gameWith = (aliens: readonly Alien[], cannonX = 100): PlayingState => ({
  ...initialPlayingState(),
  cannon: { x: cannonX },
  aliens,
});

/** Runs `steps` updates at 60 Hz with the same controls. */
const run = (state: PlayingState, steps: number, controls = noControls): PlayingState =>
  Array.from({ length: steps }).reduce<PlayingState>(
    (s) => updatePlaying(s, controls, 1 / 60),
    state,
  );

describe('updatePlaying', () => {
  it('fires a shot when fire is pressed', () => {
    expect(updatePlaying(initialPlayingState(), fire, 1 / 60).shot).toBeDefined();
  });

  it('allows only one shot at a time', () => {
    const firing = updatePlaying(initialPlayingState(), fire, 1 / 60);
    const again = updatePlaying(firing, fire, 1 / 60);
    expect(again.shot?.y).toBeLessThan(firing.shot?.y ?? 0);
  });

  it('destroys an invader in the line of fire and scores its points', () => {
    // The shot leaves x = 106; the octopus spans x 100-111 and y 150-157.
    const alien: Alien = { kind: 'octopus', x: 100, y: 150 };
    const hit = run(
      updatePlaying(gameWith([alien, { kind: 'squid', x: 10, y: 50 }]), fire, 1 / 60),
      30,
    );
    expect(hit.aliens).toHaveLength(1);
    expect(hit.score).toBe(10);
    expect(hit.shot).toBeUndefined();
  });

  it('brings a new formation when the last invader is destroyed', () => {
    const alien: Alien = { kind: 'squid', x: 102, y: 150 };
    const cleared = run(updatePlaying(gameWith([alien]), fire, 1 / 60), 30);
    expect(cleared.score).toBe(30);
    expect(cleared.aliens).toHaveLength(55);
  });
});
