import { describe, expect, it } from 'vitest';
import { DEBUG_MARK_TEXT, showDebugMark, type MarkPage } from './debug-mark';

/** A fake page that records what is added to it. */
const fakePage = () => {
  const added: unknown[] = [];
  const texts: string[] = [];
  const page: MarkPage = {
    createElement: () =>
      ({
        setAttribute: () => undefined,
        append: (...nodes: (Node | string)[]) => {
          texts.push(...nodes.map(String));
        },
      }) as unknown as HTMLElement,
    body: {
      append: (...nodes: (Node | string)[]) => {
        added.push(...nodes);
      },
    },
  };
  return { page, added, texts };
};

describe('showDebugMark', () => {
  it('adds nothing when debug is off', () => {
    const { page, added } = fakePage();
    expect(showDebugMark(false, page)).toBeNull();
    expect(added).toHaveLength(0);
  });

  it('adds one mark saying DEBUG when debug is on', () => {
    const { page, added, texts } = fakePage();
    expect(showDebugMark(true, page)).not.toBeNull();
    expect(added).toHaveLength(1);
    expect(texts).toEqual([DEBUG_MARK_TEXT]);
  });
});
