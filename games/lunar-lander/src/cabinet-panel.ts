import type { GameState } from './game';
import { MISSION_ORDER, type Mission } from './missions';

/**
 * The lamps of the cabinet and the record, shown in the page around the screen [P TYPE, L.LED;
 * N for the record]. The cabinet has four lit buttons for the missions: the chosen one is lit,
 * in attract all four glow at half power [P NMI: 50% duty cycle].
 */

/** How a lamp is lit. */
export type Lamp = 'on' | 'off' | 'dim';

/** What the panel shows. */
export interface PanelView {
  readonly lamps: Readonly<Record<Mission, Lamp>>;
  /** The START button flashes while it waits to be pressed [P RTPCHK]. */
  readonly start: Lamp;
  readonly record: number;
}

/** The panel for `state`. */
export const panelView = (state: GameState): PanelView => {
  const attract = state.mode.kind === 'attract';
  const lamps = Object.fromEntries(
    MISSION_ORDER.map((mission) => [
      mission,
      attract ? 'dim' : mission === state.mission ? 'on' : 'off',
    ]),
  ) as Record<Mission, Lamp>;
  const waiting = state.mode.kind === 'ready' && (state.frame & 0x10) === 0;
  return { lamps, start: waiting ? 'on' : 'off', record: Math.max(state.hiScore, state.score) };
};

/** A lamp in the page: only its `data-lamp` attribute is used. */
export type LampElement = Pick<HTMLElement, 'getAttribute' | 'setAttribute'>;

/** The page elements of the panel; missing ones are skipped. */
export interface PanelElements {
  readonly lamps: ReadonlyMap<Mission, LampElement>;
  readonly start: LampElement | null;
  readonly record: Pick<HTMLElement, 'textContent' | 'replaceChildren'> | null;
}

/** Finds the panel in the page: lamps by `data-mission`, `#start` and `#record`. */
export const findPanel = (
  doc: Pick<Document, 'querySelector' | 'querySelectorAll'>,
): PanelElements => ({
  lamps: new Map(
    [...doc.querySelectorAll<HTMLElement>('[data-mission]')].map((element) => [
      element.dataset.mission as Mission,
      element,
    ]),
  ),
  start: doc.querySelector<HTMLElement>('#start'),
  record: doc.querySelector<HTMLElement>('#record'),
});

/** Lights a lamp, touching the page only when it changes. */
const light = (element: LampElement | null | undefined, lamp: Lamp): void => {
  if (element && element.getAttribute('data-lamp') !== lamp)
    element.setAttribute('data-lamp', lamp);
};

/**
 * Shows `view` on the page. Lamps are a `data-lamp` attribute styled in style.css; the page
 * changes only when something changed, because this runs every frame.
 */
export const showPanel = (elements: PanelElements, view: PanelView): void => {
  elements.lamps.forEach((element, mission) => {
    light(element, view.lamps[mission]);
  });
  light(elements.start, view.start);
  const record = String(view.record).padStart(4, '0');
  if (elements.record && elements.record.textContent !== record)
    elements.record.replaceChildren(record);
};
