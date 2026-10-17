/** The text shown in the corner of the page while debug is on. */
export const DEBUG_MARK_TEXT = 'DEBUG';

/**
 * Fixed in the top left corner, above the game and the touch panel, and ignored by the
 * pointer so it never steals a touch. Inline, so no game needs to change its style sheet.
 */
const MARK_STYLE = [
  'position: fixed',
  'top: 4px',
  'left: 4px',
  'z-index: 1000',
  'padding: 2px 6px',
  'font: bold 12px monospace',
  'color: #000',
  'background: #ff0',
  'pointer-events: none',
].join('; ');

/** The part of the page the mark needs: a fake object can replace it in tests. */
export interface MarkPage {
  /** Creates the element of the mark. */
  readonly createElement: (tag: 'div') => HTMLElement;
  /** Where the mark is added. */
  readonly body: Pick<HTMLElement, 'append'>;
}

/**
 * Adds the DEBUG mark to the page when `on`, so a game with debug on is never mistaken for
 * the real one (a hi-score made by an immortal player means nothing).
 * @returns the mark, or `null` when debug is off.
 */
export const showDebugMark = (on: boolean, page: MarkPage = document): HTMLElement | null => {
  if (!on) return null;
  const mark = page.createElement('div');
  mark.setAttribute('class', 'debug-mark');
  mark.setAttribute('style', MARK_STYLE);
  mark.append(DEBUG_MARK_TEXT);
  page.body.append(mark);
  return mark;
};
