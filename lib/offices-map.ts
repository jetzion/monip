/**
 * Projection for public/world-map.svg (equirectangular, 1000x394,
 * longitude -180..180, latitude 84..-58). Regenerate the SVG with the
 * same constants if they change.
 */
export const MAP = { width: 1000, height: 394, north: 84 } as const;

type Point = { latitude: number; longitude: number };

/** Position on the map as percentages of its width and height. */
export function mapPosition({ latitude, longitude }: Point) {
  return {
    left: ((longitude + 180) / 360) * 100,
    top: ((((MAP.north - latitude) / 360) * MAP.width) / MAP.height) * 100,
  };
}

/** Label on the left when another office sits just to the east, so labels do not overlap. */
export function labelOnLeft(office: Point, all: Point[]) {
  return all.some(
    (other) =>
      other !== office &&
      other.longitude > office.longitude &&
      other.longitude - office.longitude < 30 &&
      Math.abs(other.latitude - office.latitude) < 12,
  );
}
