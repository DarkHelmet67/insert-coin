import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshPhysicalMaterial,
  Object3D,
  type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** One cube to draw: where, how big, how turned, which color. Units are those of the world. */
export interface VoxelInstance {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** 1 is the normal size of a voxel. */
  readonly scale: number;
  /** Rotation in radians, for the tumbling pieces of an explosion; 0 for still voxels. */
  readonly spin: number;
  readonly color: string;
}

/** The shape of the cubes of a layer. */
export interface VoxelShape {
  /** Most cubes the layer can show at once: the rest is not drawn. */
  readonly capacity: number;
  /** Side of the cube facing the player; a little less than 1 leaves a thin gap between pixels. */
  readonly size: number;
  /** Thickness of the cube, toward the player. */
  readonly depth: number;
  /** Radius of the rounded edges, which catch the light. */
  readonly bevel: number;
  /**
   * Steps of each rounded edge: 1 already catches the light; every step more multiplies the
   * triangles (108 per cube with 1, 300 with 2), which phones feel with thousands of cubes.
   */
  readonly bevelSegments: number;
}

/** A set of cubes drawn in one go by the graphics card. */
export interface VoxelLayer {
  /** Shows exactly these cubes until the next call. */
  readonly write: (instances: readonly VoxelInstance[]) => void;
}

/** Shiny metal settings for `createMetalMaterial`. */
export interface MetalSettings {
  /** 0 = plastic, 1 = metal. */
  readonly metalness: number;
  /** 0 = mirror, 1 = matte. */
  readonly roughness: number;
  /** A clear varnish on top of the metal, like a car's paint: 0 = none, 1 = full. */
  readonly clearcoat: number;
}

/** A metallic paint: each cube gets its own color, the metal reflects the environment. */
export const createMetalMaterial = (metal: MetalSettings): MeshPhysicalMaterial =>
  new MeshPhysicalMaterial({
    metalness: metal.metalness,
    roughness: metal.roughness,
    clearcoat: metal.clearcoat,
    clearcoatRoughness: 0.15,
  });

/**
 * Creates a layer of up to `shape.capacity` rounded cubes inside `parent`.
 * Every cube is an instance of the same mesh (`InstancedMesh`): thousands of them cost a single
 * draw call, so a whole screen of pixels can be redrawn at every frame.
 */
export const createVoxelLayer = (
  parent: Object3D,
  shape: VoxelShape,
  material: Material,
): VoxelLayer => {
  const geometry = new RoundedBoxGeometry(
    shape.size,
    shape.size,
    shape.depth,
    shape.bevelSegments,
    shape.bevel,
  );
  const mesh = new InstancedMesh(geometry, material, shape.capacity);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  // The cubes move every frame: the bounding sphere Three.js would use to skip them is never right.
  mesh.frustumCulled = false;
  parent.add(mesh);
  const placer = new Object3D();
  const still = new Matrix4();
  const colors = new Map<string, Color>();

  /** The Three.js color for a CSS color, parsed once and then reused. */
  const colorOf = (css: string): Color => {
    const known = colors.get(css);
    if (known) return known;
    const parsed = new Color(css);
    colors.set(css, parsed);
    return parsed;
  };

  /** The matrix of a cube that is not turned: a scale and a move, the common and cheap case. */
  const stillMatrix = (voxel: VoxelInstance): Matrix4 =>
    still.makeScale(voxel.scale, voxel.scale, voxel.scale).setPosition(voxel.x, voxel.y, voxel.z);

  /** The matrix of a tumbling cube, built from its position, rotation and scale. */
  const turnedMatrix = (voxel: VoxelInstance): Matrix4 => {
    placer.position.set(voxel.x, voxel.y, voxel.z);
    placer.rotation.set(voxel.spin, voxel.spin * 0.7, 0);
    placer.scale.setScalar(voxel.scale);
    placer.updateMatrix();
    return placer.matrix;
  };

  return {
    write: (instances) => {
      const shown = instances.slice(0, shape.capacity);
      shown.forEach((voxel, index) => {
        mesh.setMatrixAt(index, voxel.spin === 0 ? stillMatrix(voxel) : turnedMatrix(voxel));
        mesh.setColorAt(index, colorOf(voxel.color));
      });
      mesh.count = shown.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
};
