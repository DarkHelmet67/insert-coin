import type { TouchControlsSettings } from '@arcade/input';
import type { BurstSettings } from '@arcade/particles';
import type { GradientSky, LightSettings, MetalSettings, StageSettings } from '@arcade/scene3d';

/**
 * The look of the remaster, in one place so it is easy to change and to test. The rules of the
 * game are not here: they are those of the original, in games/space-invaders, untouched (its
 * debug section included). Every value here is a choice [N]: nothing in 1978 was 3D.
 * Angles are in degrees, sizes in pixels of the original screen (one voxel = one pixel).
 */

/** The colors of the background, bottom up: also the colors the metal reflects. */
const sky: GradientSky = {
  ground: '#3b2414',
  horizon: '#3a1f63',
  sky: '#04040f',
};

/** The camera: where it stands and how it follows the cannon. */
const camera = {
  /** Vertical field of view: a narrow lens keeps the perspective gentle. */
  fov: 30,
  /** Furthest turn to each side, reached when the cannon is at the edge of the screen. */
  maxYaw: 24,
  /** Height of the camera above the middle of the playfield. */
  pitch: 14,
  /** How quickly the camera catches up with the cannon, per second (see smoothTowards). */
  followRate: 2.5,
  /** The camera looks this far below the middle of the playfield, toward the cannon. */
  lookDown: 16,
  /** Room left around the playfield: 1.1 = 10% more than the strict minimum. */
  margin: 1.12,
  /** On the attract screen the camera sways by itself, this far and this slowly (seconds). */
  attractSway: 10,
  attractSwayPeriod: 12,
  /** Share of the camera movement kept when the system asks for reduced motion. */
  reducedMotion: 0.25,
};

/** The playfield leans back like a table: the invaders far, the cannon near. */
const playfield = {
  tilt: 32,
};

/** The cubes every pixel becomes. */
const voxel = {
  /** Side facing the player: below 1 a thin gap shows the pixel grid. */
  size: 0.92,
  /** Thickness toward the player. */
  depth: 4,
  /** Radius of the rounded edges, which catch the highlights. */
  bevel: 0.18,
  /** Steps of the rounded edges: 1 is light enough for phones, 2 is smoother and heavier. */
  bevelSegments: 1,
  /** Most cubes on screen at once: the full formation and four shields take about 3500. */
  capacity: 8000,
};

/** The metallic paint of every object. */
const metal: MetalSettings = {
  metalness: 0.85,
  roughness: 0.24,
  clearcoat: 0.6,
};

/** Light and picture. */
const lights: LightSettings & { readonly softboxes: number } = {
  ambient: 0.35,
  key: 2.2,
  /** Brightness of the two bright panels the metal reflects (0 = only the gradient). */
  softboxes: 6,
};

/** Renderer settings: field of view comes from the camera section. */
const render: Omit<StageSettings, 'fov'> = {
  exposure: 1.1,
  maxPixelRatio: 2,
};

/** The explosions: what is left of an invader, of the mystery ship, of the cannon, of a shield. */
const explosions = {
  /** An invader, the mystery ship or the cannon blown into its voxels. */
  burst: {
    speed: 45,
    spread: 0.6,
    towardViewer: 70,
    minLife: 0.6,
    maxLife: 1.2,
    maxSpin: 2,
  } satisfies BurstSettings,
  /** The pixels a shot or a bomb carves out of a shield. */
  debris: {
    speed: 25,
    spread: 0.8,
    towardViewer: 35,
    minLife: 0.3,
    maxLife: 0.7,
    maxSpin: 3,
  } satisfies BurstSettings,
  /** Downward pull on the pieces, in pixels per second². */
  gravity: 160,
  /** Most pieces flying at once: the oldest go first. */
  maxParticles: 2500,
};

export const tuning = {
  sky,
  camera,
  playfield,
  voxel,
  metal,
  lights,
  render,
  explosions,
  /**
   * The controls on touch screens [N], as in the original: `movement` is `'joystick'` or
   * `'arrows'`; `deadZone` is the part of the joystick's push that does not move anything yet.
   */
  touchControls: { movement: 'joystick', deadZone: 0.3 } satisfies TouchControlsSettings,
} as const;
