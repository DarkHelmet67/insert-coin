import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { initialAttractState, updateAttract } from './attract';
import { renderAttract } from './render';

/** Finds the game canvas and its 2D context, failing loudly if the page is broken. */
const getScreen = (): CanvasRenderingContext2D => {
  const ctx = document.querySelector<HTMLCanvasElement>('#screen')?.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  return ctx;
};

const ctx = getScreen();

createGameLoop({
  initialState: initialAttractState,
  update: updateAttract,
  render: (state) => renderAttract(ctx, state),
}).start();
