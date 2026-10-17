import { describe, expect, it } from 'vitest';
import { activeDebug, isDebugBuild, type DebugConfig } from './switch';

const off: DebugConfig = { enabled: false, startLevel: 1, godMode: false };

describe('activeDebug', () => {
  it('returns the normal game when the switch is off', () => {
    const config = { enabled: false, startLevel: 7, godMode: true };
    expect(activeDebug(config, off, false)).toEqual(off);
  });

  it('returns the options of tuning.config.ts when the switch is on', () => {
    const config = { enabled: true, startLevel: 7, godMode: true };
    expect(activeDebug(config, off, false)).toEqual(config);
  });

  it('turns the options on when the build forces debug, as in the PR previews', () => {
    const config = { enabled: false, startLevel: 7, godMode: true };
    expect(activeDebug(config, off, true)).toEqual({ ...config, enabled: true });
  });
});

describe('isDebugBuild', () => {
  it('is off in a build without the variable, like the tests and the published site', () => {
    expect(isDebugBuild()).toBe(false);
  });
});
