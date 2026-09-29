import { describe, expect, it } from 'vitest';
import { fullWall } from './bricks';
import { initialGameState } from './game';
import { renderBricks, renderGame } from './render';
import type { FilmContext } from './render-film';

/** A fake context that records rectangles with their color and blend mode. */
const recordingContext = () => {
  const rects: { x: number; y: number; color: string; blend: string }[] = [];
  const ctx = {
    canvas: { width: 228, height: 208 },
    fillStyle: '' as FilmContext['fillStyle'],
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    fillRect: (x: number, y: number) => {
      rects.push({ x, y, color: String(ctx.fillStyle), blend: ctx.globalCompositeOperation });
    },
  };
  return { ctx, rects };
};

describe('render', () => {
  it('draws one rectangle per standing brick', () => {
    const { ctx, rects } = recordingContext();
    const wall = fullWall().map((brick, index) => brick && index !== 0);
    renderBricks(ctx, wall, '#fff');
    expect(rects).toHaveLength(111);
  });

  it('lays the film on top in color mode, blending with multiply', () => {
    const { ctx, rects } = recordingContext();
    renderGame(ctx, initialGameState);
    const film = rects.filter((rect) => rect.blend === 'multiply');
    expect(film.map((rect) => rect.color)).toEqual([
      '#f00032',
      '#ffa000',
      '#4bc300',
      '#fff500',
      '#0078c8',
    ]);
    expect(ctx.globalCompositeOperation).toBe('source-over');
  });

  it('lays no film in mono mode', () => {
    const { ctx, rects } = recordingContext();
    renderGame(ctx, { ...initialGameState, colorMode: 'mono' });
    expect(rects.some((rect) => rect.blend === 'multiply')).toBe(false);
  });
});
