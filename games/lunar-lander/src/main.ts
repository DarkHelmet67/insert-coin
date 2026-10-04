import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { drawBeamLines, syncScreen } from '@arcade/vector';
import { bindings, readControls } from './controls';
import { startFlight, updateFlight, type FlightState } from './play';
import { VIEWPORT } from './playfield';
import { flightLines } from './render-flight';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

/** Step 5 of the remake: a CADET mission over the real surface; any contact starts it again. */
interface Demo {
  readonly flight: FlightState;
  readonly frame: number;
}

/** A new mission with a coin's worth of fuel and random sites. */
const newDemo = (frame: number): Demo => ({
  flight: startFlight('cadet', tuning.fuelPerCoin, Math.floor(Math.random() * 256)),
  frame,
});

createGameLoop({
  initialState: newDemo(0),
  update: (demo: Demo): Demo => {
    const { state, event } = updateFlight(demo.flight, readControls(keyboard.poll()), demo.frame);
    return event === 'flying' ? { flight: state, frame: demo.frame + 1 } : newDemo(demo.frame + 1);
  },
  render: (demo) => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, flightLines(demo.flight, demo.frame), mapping, tuning.beam);
  },
  step: 1 / tuning.framesPerSecond,
}).start();
