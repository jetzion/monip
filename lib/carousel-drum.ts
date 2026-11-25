/** Degrees between neighbouring cards on the drum. */
export const STEP_DEGREES = 24;
/** Drum radius in card slots: neighbours sit about one slot apart. */
const RADIUS_SLOTS = 2.6;

export type DrumPlace = {
  /** Shift from the card's flat slot to its place on the drum, in px. */
  x: number;
  /** Depth: 0 at the front, negative further back, in px. */
  z: number;
  /** Turn away from the viewer, in degrees (positive on the right). */
  rotate: number;
  /** 1 for the front card, fading to 0 past 2.2 slots so the back of the drum never shows. */
  opacity: number;
  /** Brightness: back cards slightly darker. */
  shade: number;
};

/**
 * Where a card sits on the drum, from its signed distance to the centre in slots
 * (`distance`) and the width of one slot in px.
 */
export function drumPlace(distance: number, slot: number): DrumPlace {
  const angle = (distance * STEP_DEGREES * Math.PI) / 180;
  const radius = RADIUS_SLOTS * slot;
  const away = Math.abs(distance);
  return {
    x: radius * Math.sin(angle) - distance * slot,
    z: radius * (Math.cos(angle) - 1),
    rotate: distance * STEP_DEGREES,
    opacity: Math.min(1, Math.max(0, (2.7 - away) / 0.5)),
    shade: 1 - 0.08 * Math.min(away, 2),
  };
}
