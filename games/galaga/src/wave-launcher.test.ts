import { describe, expect, it } from 'vitest';
import { emptyObjects } from './objects';
import {
  runLauncher,
  startLauncher,
  type LauncherInputs,
  type LauncherWorld,
} from './wave-launcher';

/** A launcher waiting at a start mark, nothing flying, game timer 0 still running. */
const world: LauncherWorld = {
  launcher: startLauncher(['start', 'end']),
  slots: [],
  objects: emptyObjects(),
};

const inputs: LauncherInputs = {
  frame: 0,
  enabled: true,
  flying: 0,
  challenge: false,
  timer: 2,
  looks: new Map(),
  entryBombBits: 0,
};

describe('wave launcher', () => {
  it('starts the next wave of a normal stage as soon as nothing flies (f_2916)', () => {
    expect(runLauncher(world, inputs).launcher.waveCount).toBe(1);
  });

  it('waits for game timer 0 in a challenging stage', () => {
    const challenge = { ...inputs, challenge: true };
    expect(runLauncher(world, challenge).launcher.waveCount).toBe(0);
    expect(runLauncher(world, { ...challenge, timer: 0 }).launcher.waveCount).toBe(1);
  });

  it('holds the next wave while aliens fly, resetting the pause', () => {
    const held = runLauncher(world, { ...inputs, flying: 1 });
    expect(held.launcher.waveCount).toBe(0);
    expect(held.timer).toBe(2);
  });
});
