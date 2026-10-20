import {
  BackSide,
  BufferAttribute,
  Color,
  DoubleSide,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';

/** The three colors of a simple sky, from the bottom up: any CSS color works. */
export interface GradientSky {
  readonly ground: string;
  readonly horizon: string;
  readonly sky: string;
}

/**
 * The color of the sky at `height`, from -1 (straight down, the ground) through 0 (the horizon)
 * to 1 (straight up).
 */
export const skyColorAt = (sky: GradientSky, height: number): Color => {
  const horizon = new Color(sky.horizon);
  return height < 0
    ? horizon.lerp(new Color(sky.ground), Math.min(1, -height))
    : horizon.lerp(new Color(sky.sky), Math.min(1, height));
};

/** A sphere seen from inside, painted with the gradient sky. */
const skySphere = (sky: GradientSky): Mesh => {
  const geometry = new SphereGeometry(100, 32, 16);
  const positions = geometry.getAttribute('position');
  const colors = Array.from({ length: positions.count }, (_, index) =>
    skyColorAt(sky, positions.getY(index) / 100).toArray(),
  ).flat();
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: BackSide }));
};

/**
 * A bright rectangle in the sky, like a photographer's softbox: metal needs something bright
 * to reflect, or it looks like black plastic.
 */
const softbox = (x: number, y: number, z: number, brightness: number): Mesh => {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  material.color.setScalar(brightness);
  const panel = new Mesh(new PlaneGeometry(60, 20), material);
  panel.position.set(x, y, z);
  panel.lookAt(0, 0, 0);
  return panel;
};

/**
 * Builds the reflections of the scene from the same colors as the page background, with no
 * image file: the gradient plus two softboxes, prefiltered by Three.js for shiny and rough
 * surfaces alike (PMREM).
 * @param renderer - the renderer that will use the reflections.
 * @param sky - the colors of the gradient.
 * @param brightness - how bright the softboxes are; 0 leaves only the gradient.
 */
export const createGradientEnvironment = (
  renderer: WebGLRenderer,
  sky: GradientSky,
  brightness: number,
): Texture => {
  const scene = new Scene();
  scene.add(skySphere(sky));
  if (brightness > 0) {
    scene.add(softbox(-50, 60, 50, brightness));
    scene.add(softbox(60, 30, 40, brightness * 0.6));
  }
  const generator = new PMREMGenerator(renderer);
  const texture = generator.fromScene(scene, 0.03).texture;
  generator.dispose();
  return texture;
};

/** Light settings: intensities as Three.js understands them. */
export interface LightSettings {
  /** Soft light from all around, sky color from above and ground color from below. */
  readonly ambient: number;
  /** The main light, from the upper left in front of the playfield. */
  readonly key: number;
}

/** Adds a hemisphere light in the colors of the sky and one directional key light. */
export const addLights = (scene: Scene, sky: GradientSky, lights: LightSettings): void => {
  scene.add(new HemisphereLight(sky.sky, sky.ground, lights.ambient));
  const key = new DirectionalLight(0xffffff, lights.key);
  key.position.set(-100, 150, 200);
  scene.add(key);
};
