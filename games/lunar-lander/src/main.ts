import './style.css';
import { createGameLoop } from '@arcade/engine-core';
import { boundKeys, createKeyboard } from '@arcade/input';
import { clearScreen, getCanvasContext } from '@arcade/render';
import { drawBeamLines, syncScreen, type BeamLine } from '@arcade/vector';
import { bindings, moveLever, readControls } from './controls';
import { moduleLines } from './flame';
import { flyFrame, type Flight } from './flight';
import { fuelUnits, tankWith } from './fuel';
import { hudLines } from './hud';
import { landerOrientation, landerPosition, startingLander } from './lander';
import { MISSIONS } from './missions';
import { VIEWPORT } from './playfield';
import { leverThrust } from './thrust';
import { tuning } from './tuning.config';

const ctx = getCanvasContext('#screen');
const keyboard = createKeyboard(window, { captureKeys: boundKeys(bindings) });

/** Step 4 of the remake: the module flies over a flat ground, with its instruments. */
interface Demo {
  readonly flight: Flight;
  readonly lever: number;
  readonly thrust: number;
  readonly frame: number;
}

/** A new flight with a coin's worth of fuel. */
const newDemo = (): Demo => ({
  flight: { lander: startingLander(), tank: tankWith(tuning.fuelPerCoin) },
  lever: 0,
  thrust: 0,
  frame: 0,
});

/** One frame: the module starts again when it reaches the ground. */
const update = (demo: Demo): Demo => {
  const controls = readControls(keyboard.poll());
  const lever = moveLever(demo.lever, controls, tuning.leverStep);
  const { flight, thrust } = flyFrame(
    demo.flight,
    { turn: controls.turn, thrust: leverThrust(lever) },
    MISSIONS.cadet,
    'major',
    demo.frame,
  );
  if (flight.lander.y < 0) return newDemo();
  return { flight, lever, thrust, frame: demo.frame + 1 };
};

/** The whole-surface view: a quarter of the world, ground at y = 8 [P TRANS]. */
const sceneLines = (demo: Demo): readonly BeamLine[] => {
  const { x, y } = landerPosition(demo.flight.lander);
  return [
    { x1: 0, y1: 8, x2: 1023, y2: 8, brightness: 6 },
    ...moduleLines({
      x: (((x / 4) % 1024) + 1024) % 1024,
      y: y / 4 + 8,
      size: 'small',
      orientation: landerOrientation(demo.flight.lander),
      thrust: demo.thrust,
      frame: demo.frame,
    }),
    ...hudLines({
      score: 0,
      seconds: Math.floor((demo.frame * 24) / 1000),
      fuel: fuelUnits(demo.flight.tank),
      altitude: Math.floor(y),
      vx: demo.flight.lander.vx,
      vy: demo.flight.lander.vy,
    }),
  ];
};

createGameLoop({
  initialState: newDemo(),
  update,
  render: (demo) => {
    const mapping = syncScreen(ctx, VIEWPORT, window.devicePixelRatio);
    clearScreen(ctx, '#000');
    drawBeamLines(ctx, sceneLines(demo), mapping, tuning.beam);
  },
  step: 1 / tuning.framesPerSecond,
}).start();
