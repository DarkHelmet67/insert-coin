import './style.css';
import { clamp } from '@arcade/math';

const canvas = document.querySelector<HTMLCanvasElement>('#screen');
const ctx = canvas?.getContext('2d');
if (!canvas || !ctx) throw new Error('Canvas 2D not available');

// "Hello canvas": proves the toolchain works before any game code exists.
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#fff';
ctx.font = '8px monospace';
ctx.textAlign = 'center';
ctx.fillText('INSERT COIN', canvas.width / 2, clamp(canvas.height / 2, 0, canvas.height));
