import { describe, expect, it } from 'vitest';
import { NO_CAPTURE } from './capture-state';
import { emptyPlayingState, type PlayingState } from './playing';
import { formationSign, soundCommands } from './sound-commands';
import { EFFECT } from './sound-state';
import { newSoundBoard, SAMPLE_RATE, soundFrame } from './sound-system';

const playing: PlayingState = { ...emptyPlayingState({ step: 'running' }), alive: 40 };

describe('formationSign', () => {
  it('follows the breathing counter, one step late where it turns', () => {
    expect(formationSign(0x05)).toBe(1);
    expect(formationSign(0xa0)).toBe(1);
    expect(formationSign(0x9f)).toBe(0xff);
    expect(formationSign(0x00)).toBe(0xff);
  });
});

describe('soundCommands', () => {
  it('turns the sounds of the frame into trigger writes, and the explosion into a noise', () => {
    const commands = soundCommands({ ...playing, sounds: ['shot', 'fighterExplosion'] });
    expect(commands.writes).toContainEqual([EFFECT.shot, 1]);
    expect(commands.explosion).toBe(true);
  });

  it('keeps the tractor beam on while the beam is open', () => {
    const beaming = {
      ...playing,
      capture: { ...NO_CAPTURE, step: 0x05, tasks: { ...NO_CAPTURE.tasks, beam: true } },
    };
    expect(soundCommands(beaming).writes).toContainEqual([EFFECT.tractorBeam, 1]);
    expect(soundCommands(playing).writes).toContainEqual([EFFECT.tractorBeam, 0]);
  });

  it('stops the pulsing sound when the stage is cleared', () => {
    expect(soundCommands({ ...playing, alive: 0 }).writes).toContainEqual([EFFECT.pulse, 0]);
  });
});

describe('soundFrame', () => {
  it('makes one frame of samples: 1/60 of a second', () => {
    const { samples } = soundFrame(newSoundBoard(), soundCommands(playing));
    expect(samples).toHaveLength(SAMPLE_RATE / 60);
  });

  it('plays the sounds the commands start', () => {
    const { samples } = soundFrame(
      newSoundBoard(),
      soundCommands({ ...playing, sounds: ['shot'] }),
    );
    expect(samples.some((s) => s !== 0)).toBe(true);
  });
});
