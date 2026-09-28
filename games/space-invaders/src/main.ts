import './style.css';
import { createGameLoop } from '@arcade/engine-core';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
const ctx = canvas?.getContext('2d');
if (!canvas || !ctx) throw new Error('Canvas 2D not available');

// Attract screen placeholder: a blinking "INSERT COIN" driven by the shared game loop.
const BLINK_PERIOD = 1; // seconds for a full on/off cycle
let time = 0;

const loop = createGameLoop({
  update(dt) {
    time += dt;
  },
  render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (time % BLINK_PERIOD < BLINK_PERIOD / 2) {
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INSERT COIN', canvas.width / 2, canvas.height / 2);
    }
  },
});

loop.start();
