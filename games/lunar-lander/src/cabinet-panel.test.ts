import { describe, expect, it } from 'vitest';
import { findPanel, panelView, showPanel, type PanelElements } from './cabinet-panel';
import { createGame } from './game';
import type { Mission } from './missions';

/** A fake element that records its attributes and text. */
const fakeElement = () => {
  const attributes = new Map<string, string>();
  const element = {
    textContent: '',
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
    replaceChildren: (...nodes: (string | Node)[]) => {
      element.textContent = nodes.join('');
    },
  };
  return element;
};

describe('the cabinet panel', () => {
  it('dims all the lamps in attract and lights the chosen mission in a game', () => {
    expect(panelView(createGame(0, 0)).lamps.cadet).toBe('dim');
    const ready = {
      ...createGame(0, 0),
      mode: { kind: 'ready' as const },
      mission: 'prime' as const,
    };
    expect(panelView(ready).lamps).toEqual({
      training: 'off',
      cadet: 'off',
      prime: 'on',
      command: 'off',
    });
  });

  it('flashes START while it waits', () => {
    const ready = { ...createGame(0, 0), mode: { kind: 'ready' as const } };
    expect(panelView({ ...ready, frame: 0 }).start).toBe('on');
    expect(panelView({ ...ready, frame: 16 }).start).toBe('off');
  });

  it('shows the record, or the score when it beats it', () => {
    expect(panelView(createGame(0, 120)).record).toBe(120);
    expect(panelView({ ...createGame(0, 120), score: 300 }).record).toBe(300);
  });

  it('writes the lamps and the record in the page', () => {
    const lamp = fakeElement();
    const record = fakeElement();
    const elements: PanelElements = {
      lamps: new Map<Mission, typeof lamp>([['cadet', lamp]]),
      start: null,
      record,
    };
    showPanel(elements, panelView(createGame(0, 42)));
    expect(lamp.getAttribute('data-lamp')).toBe('dim');
    expect(record.textContent).toBe('0042');
  });

  it('finds nothing in an empty page without breaking', () => {
    const empty = findPanel({ querySelector: () => null, querySelectorAll: () => [] } as never);
    expect(empty.lamps.size).toBe(0);
  });
});
