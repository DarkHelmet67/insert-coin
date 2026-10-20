import type { Particle } from '@arcade/particles';
import {
  addLights,
  createGradientEnvironment,
  createMetalMaterial,
  createStage,
  createVoxelLayer,
  degreesToRadians,
  smoothTowards,
} from '@arcade/scene3d';
import type { GameState } from '@arcade/space-invaders/src/game';
import { paletteFor } from '@arcade/space-invaders/src/palette';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@arcade/space-invaders/src/playfield';
import { renderGame } from '@arcade/space-invaders/src/render';
import { createDrawingRecorder, rectsToVoxels } from '@arcade/voxel';
import { findBursts } from './bursts';
import { cameraPosition, cameraTarget, playfieldAngles, viewLean } from './camera';
import { addBursts, stepExplosions } from './explosions';
import { drawHud, type HudContext } from './hud';
import { particleInstance, voxelInstance } from './instances';
import { drawableState, splitScreen } from './screen';
import { tuning } from './tuning.config';

/** The 2.5D picture of the game. */
export interface View {
  /** Looks at one step of the game, to catch what blew up in it. */
  readonly notice: (prev: GameState, next: GameState) => void;
  /** Draws a frame of `state`. */
  readonly render: (state: GameState) => void;
}

/** Longest time step for the camera and the particles: after a pause they do not jump. */
const MAX_FRAME_TIME = 0.1;

/**
 * Builds the 3D scene and returns the functions that keep it in step with the game.
 *
 * Every frame the original drawing code (`renderGame` of games/space-invaders) draws on a
 * recorder instead of a canvas; the score bars go to the flat HUD canvas, everything else
 * becomes metallic voxels. The camera and the flying pieces live here, outside the game state:
 * they change the look, never the game. Like the game loop, this is the imperative shell: its
 * state lives in `let` variables private to this closure.
 * @param canvas - the WebGL canvas.
 * @param hud - the flat canvas for the score bars.
 * @param motion - share of the camera movement to keep: less than 1 for reduced motion.
 */
export const createView = (canvas: HTMLCanvasElement, hud: HudContext, motion: number): View => {
  const stage = createStage(canvas, { ...tuning.render, fov: tuning.camera.fov });
  stage.setEnvironment(
    createGradientEnvironment(stage.renderer, tuning.sky, tuning.lights.softboxes),
  );
  addLights(stage.scene, tuning.sky, tuning.lights);
  const material = createMetalMaterial(tuning.metal);
  const field = createVoxelLayer(stage.playfield, tuning.voxel, material);
  const pieces = createVoxelLayer(
    stage.playfield,
    { ...tuning.voxel, depth: tuning.voxel.size, capacity: tuning.explosions.maxParticles },
    material,
  );
  const recorder = createDrawingRecorder(SCREEN_WIDTH, SCREEN_HEIGHT);
  let particles: readonly Particle[] = [];
  let lean = 0;
  let lastTime: number | undefined;
  let drawn: GameState | undefined;

  /** Redraws the playfield voxels and the score bars: only needed when the game has moved on. */
  const drawScreen = (state: GameState): void => {
    renderGame(recorder.ctx, drawableState(state));
    const screen = splitScreen(recorder.take());
    const background = paletteFor(state.colorMode).background;
    field.write(rectsToVoxels(screen.field, background).map(voxelInstance));
    drawHud(hud, screen.hud);
    drawn = state;
  };

  return {
    notice: (prev, next) => {
      particles = addBursts(particles, findBursts(prev, next));
    },
    render: (state) => {
      const now = performance.now() / 1000;
      const dt = lastTime === undefined ? 0 : Math.min(now - lastTime, MAX_FRAME_TIME);
      lastTime = now;
      particles = stepExplosions(particles, dt);

      // On a 120 Hz screen every game step is shown twice: the voxels are rebuilt only once.
      if (state !== drawn) drawScreen(state);
      pieces.write(particles.map(particleInstance));

      lean = smoothTowards(
        lean,
        viewLean(state, now, tuning.camera, motion),
        tuning.camera.followRate,
        dt,
      );
      const angles = playfieldAngles(lean, tuning.playfield);
      stage.orientPlayfield({
        tilt: degreesToRadians(angles.tilt),
        roll: degreesToRadians(angles.roll),
        turn: degreesToRadians(angles.turn),
      });
      stage.placeCamera(
        cameraPosition(tuning.playfield.tilt, stage.aspect(), tuning.camera),
        cameraTarget(tuning.camera),
      );
      stage.render();
    },
  };
};
