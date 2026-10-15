import { describe, expect, it } from 'vitest';
import { spin } from './capture-fighter';
import { NO_CAPTURE } from './capture-state';
import { noControls } from './controls';
import { beamCells, beamColumn, beamPalette } from './draw-beam';
import { NO_OBJECT, objectAt, FIGHTER, DISPOSITION } from './objects';
import { emptyPlayingState, type PlayingState } from './playing';
import { startIntro } from './program';
import { updatePlaying } from './update-playing';

describe('spin', () => {
  it('turns a full circle in 24 steps and stops upright', () => {
    const upright = { ...NO_OBJECT, code: 6 };
    const steps = Array.from({ length: 24 }).reduce<typeof upright>(
      (o) => spin(o, true).object,
      upright,
    );
    expect(steps).toMatchObject({ code: 6, flipX: false, flipY: false });
    expect(spin(upright, false).upright).toBe(true);
    expect(spin(upright, true).object).toMatchObject({ code: 5, flipX: true, flipY: false });
  });
});

describe('beam', () => {
  it('is centered on the aimed column', () => {
    // A fighter at sprite x $79 is drawn at screen x 105-120: the beam covers columns 11-16.
    expect(beamColumn(0x79)).toBe(11);
    const cells = beamCells({
      ...NO_CAPTURE,
      beamX: 0x79,
      beamRows: NO_CAPTURE.beamRows.map((_, i) => i === 0),
    });
    expect(cells.map((c) => c.code)).toEqual([0x24, 0x4e, 0x4f, 0x50, 0x51, 0x24]);
    expect(cells[0]).toMatchObject({ column: 11, row: 23 });
  });

  it('cycles three palettes', () => {
    expect([0, 4, 8, 12].map(beamPalette)).toEqual([0x18, 0x18, 0x19, 0x1a]);
  });
});

/**
 * A game where the fighter cannot be hit and stays in the middle; it starts firing at frame
 * 4000, after the capture.
 */
const simulate = (frames: number): readonly PlayingState[] =>
  Array.from({ length: frames }).reduce<readonly PlayingState[]>(
    (states, _, f) => {
      const state = states.at(-1) ?? emptyPlayingState({ step: 'intro' });
      const safe = { ...state, tasks: { ...state.tasks, fighterHits: false } };
      return [...states, updatePlaying(safe, { ...noControls, fire: f % 40 === 0 && f > 4000 })];
    },
    [startIntro(emptyPlayingState({ step: 'intro' }))],
  );

describe('a capture and a rescue', () => {
  const states = simulate(7100);
  /** The first state of the game that passes `test`. */
  const first = (test: (s: PlayingState) => boolean): PlayingState | undefined => states.find(test);

  it('a Boss catches the fighter with its beam and takes it home', () => {
    const caught = first((s) => s.capture.tasks.pull);
    expect(caught?.sounds).toContain('beamCapture');
    const carried = first((s) => s.capture.tasks.carry && !s.capture.showText);
    expect(carried?.messages.map((m) => m.text)).toContain('FIGHTER CAPTURED');
    const held = first((s) => s.restart && s.capture.busy);
    expect(objectAt(held?.objects ?? [], 2)).toMatchObject({
      disposition: DISPOSITION.home,
      color: 7,
    });
  });

  it('shooting the Boss as it dives frees the fighter: a double fighter', () => {
    expect(first((s) => s.capture.tasks.rescue)?.sounds).toContain('rescue');
    const joined = first((s) => s.dual);
    expect(joined).toBeDefined();
    expect(objectAt(joined?.objects ?? [], FIGHTER).x).toBe(0x71);
  });
});
