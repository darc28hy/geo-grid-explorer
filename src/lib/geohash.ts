/**
 * GeoHash implementation
 * Reference: https://en.wikipedia.org/wiki/Geohash
 *
 * GeoHash encodes geographic coordinates into short strings using base-32.
 * Each character narrows the bounding box by alternating between longitude
 * and latitude bisections (5 bits per character).
 */

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const BASE32_INDEX: Record<string, number> = {};
for (let i = 0; i < BASE32.length; i++) {
  BASE32_INDEX[BASE32[i]] = i;
}

export const GEOHASH_RENDER_LIMIT = 50_000;

// --- Types ---

export interface GeoHashCell {
  lat: number;
  lon: number;
  code: string;
  level: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoHashBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface HashesInBoundsResult {
  hashes: Array<{ code: string; center: LatLng; coords: LatLng[] }>;
  exceeded: boolean;
}

// --- Core functions ---

/**
 * Encode latitude/longitude into a GeoHash string.
 */
export function encode(
  lat: number,
  lon: number,
  precision: number,
): GeoHashCell {
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let hash = "";
  let bit = 0;
  let ch = 0;
  let isLon = true;

  while (hash.length < precision) {
    if (isLon) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) {
        ch |= 1 << (4 - bit);
        lonMin = mid;
      } else {
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }
    isLon = !isLon;
    bit++;
    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lon: (lonMin + lonMax) / 2,
    code: hash,
    level: precision,
  };
}

/**
 * Decode a GeoHash string into its bounding box.
 */
export function decodeBounds(code: string): GeoHashBounds {
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let isLon = true;

  for (const c of code) {
    const idx = BASE32_INDEX[c];
    if (idx === undefined) {
      throw new Error(`Invalid GeoHash character: ${c}`);
    }
    for (let bit = 4; bit >= 0; bit--) {
      if (isLon) {
        const mid = (lonMin + lonMax) / 2;
        if (idx & (1 << bit)) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (idx & (1 << bit)) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isLon = !isLon;
    }
  }

  return { latMin, latMax, lonMin, lonMax };
}

/**
 * Decode a GeoHash string into its center coordinates.
 */
export function decode(code: string): GeoHashCell {
  const bounds = decodeBounds(code);
  return {
    lat: (bounds.latMin + bounds.latMax) / 2,
    lon: (bounds.lonMin + bounds.lonMax) / 2,
    code,
    level: code.length,
  };
}

/**
 * Get the rectangle coordinates (4 vertices) for a GeoHash cell.
 * Returns vertices in order: SW, NW, NE, SE (closed polygon for deck.gl).
 */
export function getRectCoords(code: string): LatLng[] {
  const b = decodeBounds(code);
  return [
    { lat: b.latMin, lng: b.lonMin },
    { lat: b.latMax, lng: b.lonMin },
    { lat: b.latMax, lng: b.lonMax },
    { lat: b.latMin, lng: b.lonMax },
  ];
}

/**
 * Validate a GeoHash code string.
 * Valid characters: 0-9, b-h, j, k, m, n, p-z (excludes a, i, l, o).
 */
export function isValidCode(code: string): boolean {
  if (code.length < 1 || code.length > 12) {
    return false;
  }
  for (const c of code) {
    if (BASE32_INDEX[c] === undefined) {
      return false;
    }
  }
  return true;
}

/**
 * Get precision (level) from a GeoHash code.
 */
export function getLevelFromCode(code: string): number {
  return code.length;
}

/**
 * Encode a coordinate at all precision levels (1-12).
 */
export function encodeAllLevels(lat: number, lon: number): GeoHashCell[] {
  const results: GeoHashCell[] = [];
  for (let p = 1; p <= 12; p++) {
    results.push(encode(lat, lon, p));
  }
  return results;
}

/**
 * Calculate the cell size in degrees for a given precision.
 * All GeoHash cells at the same precision have identical dimensions.
 */
function getCellSize(precision: number): {
  latSize: number;
  lonSize: number;
} {
  const totalBits = 5 * precision;
  const lonBits = Math.ceil(totalBits / 2);
  const latBits = Math.floor(totalBits / 2);
  return {
    latSize: 180 / 2 ** latBits,
    lonSize: 360 / 2 ** lonBits,
  };
}

/**
 * Get all GeoHash cells within the given map bounds.
 * Uses grid-based traversal since all cells at a given precision
 * have the same size in degrees.
 */
export function getHashesInBounds(
  north: number,
  south: number,
  east: number,
  west: number,
  precision: number,
): HashesInBoundsResult {
  const { latSize, lonSize } = getCellSize(precision);

  // Estimate cell count to early-exit before expensive computation
  const latSpan = north - south;
  const lonSpan = east >= west ? east - west : east - west + 360;
  const estimatedRows = Math.ceil(latSpan / latSize) + 1;
  const estimatedCols = Math.ceil(lonSpan / lonSize) + 1;
  if (estimatedRows * estimatedCols > GEOHASH_RENDER_LIMIT) {
    return { hashes: [], exceeded: true };
  }

  // Find the starting cell (SW corner)
  const startCell = encode(south, west, precision);
  const startBounds = decodeBounds(startCell.code);

  const visited = new Set<string>();
  const hashes: Array<{ code: string; center: LatLng; coords: LatLng[] }> = [];

  // Step through the grid from south to north, west to east
  let lat = startBounds.latMin + latSize / 2;
  while (lat - latSize / 2 <= north) {
    let lon = startBounds.lonMin + lonSize / 2;

    // Handle date line wrapping
    const handleWrapping = east < west;
    let colCount = 0;
    const maxCols = estimatedCols + 2; // safety margin

    while (colCount < maxCols) {
      // Normalize longitude to [-180, 180)
      let normLon = lon;
      if (normLon > 180) {
        normLon -= 360;
      }
      if (normLon < -180) {
        normLon += 360;
      }

      const cell = encode(
        Math.max(-89.999999, Math.min(89.999999, lat)),
        normLon,
        precision,
      );

      if (!visited.has(cell.code)) {
        visited.add(cell.code);
        hashes.push({
          code: cell.code,
          center: { lat: cell.lat, lng: cell.lon },
          coords: getRectCoords(cell.code),
        });

        if (hashes.length >= GEOHASH_RENDER_LIMIT) {
          return { hashes: [], exceeded: true };
        }
      }

      lon += lonSize;
      colCount++;

      // Check if we've passed the east boundary
      if (!handleWrapping) {
        if (normLon + lonSize / 2 > east) {
          break;
        }
      } else {
        // Wrapping: continue until we pass east (which is east of the date line)
        if (normLon > 0 && normLon + lonSize / 2 > east + 360) {
          break;
        }
      }
    }

    lat += latSize;
  }

  return { hashes, exceeded: false };
}
