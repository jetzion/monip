/**
 * Projection for public/world-map.svg (equirectangular, 1000x394,
 * longitude -180..180, latitude 84..-58). Regenerate the SVG with the
 * same constants if they change.
 */
export const MAP = { width: 1000, height: 394, north: 84 } as const;

/** Latitudes shown on the page: the Arctic is cropped to keep the map short; the south is shown in full. */
export const VIEW = { north: 72, south: -58 } as const;

const pxPerDegree = MAP.width / 360;

/** Visible map height in SVG units. */
export const viewHeight = (VIEW.north - VIEW.south) * pxPerDegree;

/** How to place the full SVG inside the cropped view, as percentages of the view height. */
export const mapImageBox = {
  top: -(((MAP.north - VIEW.north) * pxPerDegree) / viewHeight) * 100,
  height: (MAP.height / viewHeight) * 100,
};

type Point = { latitude: number; longitude: number };

/** Position in the cropped view as percentages of its width and height. */
export function mapPosition({ latitude, longitude }: Point) {
  return {
    left: ((longitude + 180) / 360) * 100,
    top: ((VIEW.north - latitude) / (VIEW.north - VIEW.south)) * 100,
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
