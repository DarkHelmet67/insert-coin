import { describe, expect, it } from 'vitest';
import { ghostNearby, ghostOnTile } from './collisions';
import { GHOST, GHOST_IDS, newGhost, type Ghost } from './ghosts';
import { levelSettings } from './levels';
import { newPacMan } from './pacman';

const speeds = levelSettings(1).speeds;
const pacman = newPacMan(speeds.pacman, speeds.pacmanFright);
const ghosts = GHOST_IDS.map((id) => newGhost(id, speeds));

/** The ghosts with one of them moved. */
const moved = (id: 0 | 1 | 2 | 3, change: Partial<Ghost>): readonly Ghost[] =>
  ghosts.map((ghost) => (ghost.id === id ? { ...ghost, ...change } : ghost));

describe('ghostOnTile', () => {
  it("finds a ghost on Pac-Man's tile", () => {
    expect(ghostOnTile(pacman, moved(GHOST.inky, { tile: pacman.tile }))).toBe(GHOST.inky);
    expect(ghostOnTile(pacman, ghosts)).toBeUndefined();
  });

  it('ignores eyes, and checks Clyde before Blinky', () => {
    expect(ghostOnTile(pacman, moved(GHOST.inky, { tile: pacman.tile, eyes: 'toDoor' }))).toBe(
      undefined,
    );
    const both = moved(GHOST.blinky, { tile: pacman.tile }).map((ghost) =>
      ghost.id === GHOST.clyde ? { ...ghost, tile: pacman.tile } : ghost,
    );
    expect(ghostOnTile(pacman, both)).toBe(GHOST.clyde);
  });
});

describe('ghostNearby', () => {
  it('catches a ghost up to 3 pixels away, on one side only', () => {
    const near = { x: pacman.position.x + 3, y: pacman.position.y };
    expect(ghostNearby(pacman, moved(GHOST.blinky, { position: near }))).toBe(GHOST.blinky);
    const behind = { x: pacman.position.x - 1, y: pacman.position.y };
    expect(ghostNearby(pacman, moved(GHOST.blinky, { position: behind }))).toBeUndefined();
  });
});
