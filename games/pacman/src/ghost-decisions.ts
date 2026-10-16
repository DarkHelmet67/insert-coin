import {
  chooseAtRandom,
  chooseToward,
  ghostTarget,
  withChoice,
  type DecisionContext,
} from './ghost-ai';
import type { Decision } from './ghost-move';
import type { Ghost, GhostId } from './ghosts';
import { drawRandom } from './random';

/** A decision asked by a ghost during the frame's updates. */
export interface PendingDecision {
  readonly id: GhostId;
  readonly decision: Decision;
}

/** The ghosts and the random seed after the decisions. */
export interface Decided {
  readonly ghosts: readonly Ghost[];
  readonly seed: number;
}

/**
 * Runs the decisions in the order they were asked. On the cabinet they are tasks that the
 * main program runs after the interrupt that moved the ghosts, so they see the positions at
 * the end of the frame; blue ghosts each take the next random number.
 */
export const runDecisions = (
  ghosts: readonly Ghost[],
  seed: number,
  pending: readonly PendingDecision[],
  context: DecisionContext,
): Decided =>
  pending.reduce<Decided>(
    (state, { id, decision }) => {
      const ghost = state.ghosts[id];
      if (ghost === undefined) return state;
      const draw = decision === 'random' ? drawRandom(state.seed) : undefined;
      const choice =
        draw === undefined
          ? chooseToward(
              ghost.nextTile,
              ghost.nextOrientation,
              ghostTarget(ghost, context),
              context.tiles,
            )
          : chooseAtRandom(ghost.nextTile, ghost.nextOrientation, draw.bits, context.tiles);
      return {
        ghosts: state.ghosts.map((other) => (other.id === id ? withChoice(ghost, choice) : other)),
        seed: draw?.seed ?? state.seed,
      };
    },
    { ghosts, seed },
  );
