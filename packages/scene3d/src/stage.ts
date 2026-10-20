import {
  ACESFilmicToneMapping,
  Group,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Texture,
} from 'three';
import type { Vector3 } from './camera-rig';

/** How the stage is set up: values that belong to the game's tuning file. */
export interface StageSettings {
  /** Vertical field of view of the camera, in degrees. */
  readonly fov: number;
  /** Highest pixel density to render at: 2 keeps phones fast on their 3x screens. */
  readonly maxPixelRatio: number;
  /** Overall brightness of the picture (tone mapping exposure); 1 is neutral. */
  readonly exposure: number;
}

/** The 3D stage: a scene seen by one camera, drawn on a canvas that may change size. */
export interface Stage {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  /** The group holding the playfield: tilting it gives the game its depth. */
  readonly playfield: Group;
  /** Width divided by height of the canvas, as it is on screen now. */
  readonly aspect: () => number;
  /** Puts the camera at `position`, looking at `target`. */
  readonly placeCamera: (position: Vector3, target: Vector3) => void;
  /** Makes every material of the scene reflect `texture` (see `createGradientEnvironment`). */
  readonly setEnvironment: (texture: Texture) => void;
  /**
   * Turns the playfield, angles in radians: `tilt` leans it back around the horizontal axis
   * (X), `roll` turns it clockwise or counterclockwise around the axis toward the player (Z),
   * `turn` swings it left or right around the vertical axis (Y). They are applied in this
   * order, so each one keeps its meaning whatever the others are.
   */
  readonly orientPlayfield: (angles: {
    readonly tilt: number;
    readonly roll: number;
    readonly turn: number;
  }) => void;
  /** Draws a frame, first adapting to the size of the canvas on the page. */
  readonly render: () => void;
}

/**
 * Creates the renderer, the scene and the camera on `canvas`.
 * The canvas is transparent: whatever the page shows behind it (a CSS gradient) is the sky.
 * The canvas size follows its CSS size, so the layout of the page stays in the style sheet.
 */
export const createStage = (canvas: HTMLCanvasElement, settings: StageSettings): Stage => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = settings.exposure;
  const scene = new Scene();
  const playfield = new Group();
  scene.add(playfield);
  const camera = new PerspectiveCamera(settings.fov, 1, 1, 5000);
  let width = 0;
  let height = 0;

  /** Matches the drawing buffer and the camera to the size the canvas has on the page. */
  const fitToCanvas = (): void => {
    if (canvas.clientWidth === width && canvas.clientHeight === height) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.maxPixelRatio));
    renderer.setSize(width, height, false);
    camera.aspect = height === 0 ? 1 : width / height;
    camera.updateProjectionMatrix();
  };

  return {
    renderer,
    scene,
    playfield,
    aspect: () => (canvas.clientHeight === 0 ? 1 : canvas.clientWidth / canvas.clientHeight),
    placeCamera: (position, target) => {
      camera.position.set(position.x, position.y, position.z);
      camera.lookAt(target.x, target.y, target.z);
    },
    setEnvironment: (texture) => {
      scene.environment = texture;
    },
    orientPlayfield: ({ tilt, roll, turn }) => {
      // 'YZX': X is applied first, then Z, then Y, all around the axes of the world.
      playfield.rotation.set(-tilt, turn, roll, 'YZX');
    },
    render: () => {
      fitToCanvas();
      renderer.render(scene, camera);
    },
  };
};
