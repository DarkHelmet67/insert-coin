import { describe, expect, it } from 'vitest';
import {
  challengeBonus,
  isChallengeStage,
  RANK,
  stageLooks,
  stageParameters,
  starSpeedTarget,
} from './stage-setup';

describe('stage setup', () => {
  it('makes every fourth stage a challenging stage, from stage 3', () => {
    expect([1, 2, 3, 4, 7, 11].map(isChallengeStage)).toEqual([
      false,
      false,
      true,
      false,
      true,
      true,
    ]);
  });

  it('gives bees, Bosses and butterflies their codes and palettes', () => {
    const looks = stageLooks(1);
    expect(looks.get(0x08)).toMatchObject({ code: 0x18, color: 3 });
    expect(looks.get(0x30)).toMatchObject({ code: 0x08, color: 0 });
    expect(looks.get(0x5e)).toMatchObject({ code: 0x10, color: 2 });
    expect(looks.size).toBe(44);
  });

  it('uses the special aliens on challenging stages', () => {
    expect(stageLooks(3).get(0x08)).toMatchObject({ code: 0x18, color: 3 });
    expect(stageLooks(7).get(0x08)).toMatchObject({ code: 0x10, color: 2 });
    expect(stageLooks(11).get(0x08)?.code).toBe(0x68);
  });

  it('reads the first stage of rank A from the ROM table', () => {
    // 0x00,0x00,0x22,0xC6,0x00 at the start of bmbr_stg_cfg_dat
    expect(stageParameters(1, RANK.A)).toMatchObject({
      bossTimer: 0,
      redTimer: 0,
      yellowTimer: 0,
      maxBombers: 2,
      maxBombersLater: 2,
      beamSpeed: 0x0c,
      continuousBombing: 6,
      harderEntries: false,
      cloneAttack: 0,
    });
    expect(stageParameters(4, RANK.A).cloneAttack).toBe(0x0a);
  });

  it('repeats the last four stages after stage 26', () => {
    expect(stageParameters(29, RANK.B)).toEqual(stageParameters(25, RANK.B));
  });

  it('raises the group bonus every 8 stages and the star speed with the stage', () => {
    expect(challengeBonus(3)).toEqual({ tens: 10, scoreCode: 0xb8 });
    expect(challengeBonus(35).tens).toBe(30);
    expect(starSpeedTarget(1)).toBe(0x40);
    expect(starSpeedTarget(30)).toBe(0x80);
    expect(starSpeedTarget(4)).toBe(0x50);
  });
});
