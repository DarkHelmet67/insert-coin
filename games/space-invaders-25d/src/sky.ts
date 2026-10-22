import type { GradientSky } from '@arcade/scene3d';

/** The page element whose style receives the sky colors. */
export type StyleTarget = Pick<HTMLElement, 'style'>;

/** The CSS custom properties style.css uses to paint the background gradient. */
export const skyProperties = (sky: GradientSky): readonly (readonly [string, string])[] => [
  ['--ground', sky.ground],
  ['--horizon', sky.horizon],
  ['--sky', sky.sky],
];

/**
 * Hands the sky colors of `tuning.config.ts` to the style sheet, so the CSS gradient behind the
 * 3D scene and the reflections on the metal come from the same three colors.
 */
export const paintSky = (target: StyleTarget, sky: GradientSky): void => {
  skyProperties(sky).forEach(([name, value]) => {
    target.style.setProperty(name, value);
  });
};
