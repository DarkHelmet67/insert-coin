/**
 * Finds a canvas in the page and returns its 2D context.
 * @throws Error when the canvas is missing or 2D drawing is not available: the game cannot run anyway.
 */
export const getCanvasContext = (selector: string): CanvasRenderingContext2D => {
  const ctx = document.querySelector<HTMLCanvasElement>(selector)?.getContext('2d');
  if (!ctx) throw new Error(`Canvas 2D not available for "${selector}"`);
  return ctx;
};
