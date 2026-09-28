import { describe, expect, it } from 'vitest';
import { emptyKeyState, isDown, wasPressed, wasReleased } from './key-state';
import {
  applyPointerChange,
  heldKeys,
  keyChanges,
  movePointer,
  noPointers,
  releasePointer,
} from './pointer-keys';

describe('pointer keys', () => {
  it('holds a key for each finger on a button', () => {
    const pointers = movePointer(movePointer(noPointers, 1, 'ArrowLeft'), 2, 'Space');
    expect(heldKeys(pointers)).toEqual(new Set(['ArrowLeft', 'Space']));
  });

  it('keeps a key held while another finger is still on it', () => {
    const both = movePointer(movePointer(noPointers, 1, 'Space'), 2, 'Space');
    expect(heldKeys(releasePointer(both, 1))).toEqual(new Set(['Space']));
  });

  it('forgets a finger that slides off every button', () => {
    const pointers = movePointer(movePointer(noPointers, 1, 'ArrowLeft'), 1, undefined);
    expect(heldKeys(pointers)).toEqual(new Set());
  });

  it('lists the keys released and pressed between two sets', () => {
    expect(keyChanges(new Set(['ArrowLeft']), new Set(['ArrowRight']))).toEqual([
      { type: 'up', code: 'ArrowLeft' },
      { type: 'down', code: 'ArrowRight' },
    ]);
  });

  it('turns a thumb sliding from left to right into a release and a press', () => {
    const onLeft = movePointer(noPointers, 1, 'ArrowLeft');
    const onRight = movePointer(onLeft, 1, 'ArrowRight');
    const state = applyPointerChange(
      applyPointerChange(emptyKeyState, noPointers, onLeft),
      onLeft,
      onRight,
    );

    expect(isDown(state, 'ArrowLeft')).toBe(false);
    expect(wasReleased(state, 'ArrowLeft')).toBe(true);
    expect(isDown(state, 'ArrowRight')).toBe(true);
    expect(wasPressed(state, 'ArrowRight')).toBe(true);
  });
});
