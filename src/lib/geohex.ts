// GeoHex v3 Implementation
// Based on the GeoHex v3 specification (https://sites.google.com/site/geohexdocs)

const H_BASE = 20037508.34;
const H_K = Math.tan((Math.PI * 30) / 180); // tan(30°) ≈ 0.5773502691896258
const H_DEG = Math.tan((Math.PI * 60) / 180); // tan(60°) = √3 ≈ 1.7320508075688767
const H_KEY = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export interface GeoHexCell {
  lat: number;
  lon: number;
  x: number;
  y: number;
  code: string;
  level: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

// Calculate hex size for a given level
function calcHexSize(level: number): number {
  return H_BASE / Math.pow(3, level + 3);
}

// Convert lat/lon to Mercator coordinates
function loc2xy(lon: number, lat: number): { x: number; y: number } {
  const x = (lon * H_BASE) / 180;
  const y =
    (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) *
    (H_BASE / 180);
  return { x, y };
}

// Convert Mercator coordinates to lat/lon
function xy2loc(x: number, y: number): { lon: number; lat: number } {
  const lon = (x / H_BASE) * 180;
  const lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp(((y / H_BASE) * 180 * Math.PI) / 180)) -
      Math.PI / 2);
  return { lon, lat };
}

// Handle world-wrapping of grid coordinates
function adjustXY(
  x: number,
  y: number,
  level: number,
): { x: number; y: number } {
  const maxSteps = Math.pow(3, level + 2);
  const steps = Math.abs(x - y);

  if (steps === maxSteps && x > y) {
    return { x: y, y: x };
  }
  if (steps > maxSteps) {
    const dif = steps - maxSteps;
    const difX = Math.floor(dif / 2);
    const difY = dif - difX;
    if (x > y) {
      return { x: y + difY + difX, y: x - difX - difY };
    }
    if (y > x) {
      return { x: y - difY - difX, y: x + difX + difY };
    }
  }
  return { x, y };
}

// Convert grid coordinates to GeoHex code
function getCode(
  modX: number,
  modY: number,
  locX: number,
  level: number,
): string {
  const code3x: number[] = [];
  const code3y: number[] = [];
  let code9 = "";

  for (let i = 0; i <= level + 2; i++) {
    const pow = Math.pow(3, level + 2 - i);

    if (modX >= Math.ceil(pow / 2)) {
      code3x[i] = 2;
      modX -= pow;
    } else if (modX <= -Math.ceil(pow / 2)) {
      code3x[i] = 0;
      modX += pow;
    } else {
      code3x[i] = 1;
    }

    if (modY >= Math.ceil(pow / 2)) {
      code3y[i] = 2;
      modY -= pow;
    } else if (modY <= -Math.ceil(pow / 2)) {
      code3y[i] = 0;
      modY += pow;
    } else {
      code3y[i] = 1;
    }

    // World-wrap correction at i=2
    if (i === 2 && (locX === -180 || locX >= 0)) {
      if (
        code3x[0] === 2 &&
        code3y[0] === 1 &&
        code3x[1] === code3y[1] &&
        code3x[2] === code3y[2]
      ) {
        code3x[0] = 1;
        code3y[0] = 2;
      } else if (
        code3x[0] === 1 &&
        code3y[0] === 0 &&
        code3x[1] === code3y[1] &&
        code3x[2] === code3y[2]
      ) {
        code3x[0] = 0;
        code3y[0] = 1;
      }
    }
  }

  for (let i = 0; i < code3x.length; i++) {
    const code3 = "" + code3x[i] + code3y[i];
    code9 += parseInt(code3, 3);
  }

  const num3 = code9.substring(0, 3);
  const rest = code9.substring(3);
  const n = parseInt(num3, 10);
  const c1 = Math.floor(n / 30);
  const c2 = n % 30;

  return H_KEY[c1] + H_KEY[c2] + rest;
}

// Decode GeoHex code to grid coordinates
function getXYByCode(code: string): { x: number; y: number; level: number } {
  const level = code.length - 2;

  let dec9 =
    "" +
    (H_KEY.indexOf(code[0]) * 30 + H_KEY.indexOf(code[1])) +
    code.substring(2);

  if (
    dec9[0].match(/[15]/) &&
    dec9[1].match(/[^125]/) &&
    dec9[2].match(/[^125]/)
  ) {
    if (dec9[0] === "5") {
      dec9 = "7" + dec9.substring(1);
    } else if (dec9[0] === "1") {
      dec9 = "3" + dec9.substring(1);
    }
  }

  // Zero-pad to correct length
  while (dec9.length < level + 3) {
    dec9 = "0" + dec9;
  }

  // Convert each base-9 digit to 2 base-3 digits
  let dec3 = "";
  for (let i = 0; i < dec9.length; i++) {
    const d = parseInt(dec9[i], 10).toString(3);
    if (d.length === 1) {
      dec3 += "0" + d;
    } else if (d.length === 0) {
      dec3 += "00";
    } else {
      dec3 += d;
    }
  }

  // De-interleave x and y base-3 digits
  const decX: number[] = [];
  const decY: number[] = [];
  for (let i = 0; i < dec3.length / 2; i++) {
    decX[i] = parseInt(dec3[i * 2], 10);
    decY[i] = parseInt(dec3[i * 2 + 1], 10);
  }

  // Convert balanced ternary to integer coordinates
  let x = 0;
  let y = 0;
  for (let i = 0; i <= level + 2; i++) {
    const pow = Math.pow(3, level + 2 - i);
    if (decX[i] === 0) {
      x -= pow;
    } else if (decX[i] === 2) {
      x += pow;
    }
    if (decY[i] === 0) {
      y -= pow;
    } else if (decY[i] === 2) {
      y += pow;
    }
  }

  const adjusted = adjustXY(x, y, level);
  return { x: adjusted.x, y: adjusted.y, level };
}

/**
 * Encode lat/lon + level to GeoHex code
 */
export function encode(lat: number, lon: number, level: number): GeoHexCell {
  const size = calcHexSize(level);
  const unitX = 6 * size;
  const unitY = 6 * size * H_K;

  const { x: lonGrid, y: latGrid } = loc2xy(lon, lat);

  const posX = (lonGrid + latGrid / H_K) / unitX;
  const posY = (latGrid - H_K * lonGrid) / unitY;

  const x0 = Math.floor(posX);
  const y0 = Math.floor(posY);
  const xq = posX - x0;
  const yq = posY - y0;

  let x = Math.round(posX);
  let y = Math.round(posY);

  // Hexagonal boundary correction
  if (yq > -xq + 1) {
    if (yq < 2 * xq && yq > 0.5 * xq) {
      x = x0 + 1;
      y = y0 + 1;
    }
  } else if (yq < -xq + 1) {
    if (yq > 2 * xq - 1 && yq < 0.5 * xq + 0.5) {
      x = x0;
      y = y0;
    }
  }

  const adjusted = adjustXY(x, y, level);
  x = adjusted.x;
  y = adjusted.y;

  // Calculate center in Mercator
  const mercY = (H_K * x * unitX + y * unitY) / 2;
  const mercX = (mercY - y * unitY) / H_K;
  const center = xy2loc(mercX, mercY);

  // Handle world-wrap for code generation
  const maxSteps = Math.pow(3, level + 2);
  const steps = Math.abs(x - y);

  let modX = x;
  let modY = y;
  let cLon = center.lon;

  if (steps === maxSteps && x > y) {
    modX = y;
    modY = x;
    cLon = -180;
  }

  const code = getCode(modX, modY, cLon, level);

  return {
    lat: center.lat,
    lon: cLon,
    x,
    y,
    code,
    level,
  };
}

/**
 * Decode GeoHex code to cell info
 */
export function decode(code: string): GeoHexCell {
  const { x, y, level } = getXYByCode(code);
  const size = calcHexSize(level);
  const unitX = 6 * size;
  const unitY = 6 * size * H_K;

  const mercY = (H_K * x * unitX + y * unitY) / 2;
  const mercX = (mercY - y * unitY) / H_K;
  const center = xy2loc(mercX, mercY);

  const maxSteps = Math.pow(3, level + 2);
  const steps = Math.abs(x - y);

  let cLon = center.lon;
  if (steps === maxSteps && x > y) {
    cLon = -180;
  }

  return {
    lat: center.lat,
    lon: cLon,
    x,
    y,
    code,
    level,
  };
}

/**
 * Get the 6 vertices of a hexagon for a GeoHex cell
 * Returns vertices in [lat, lng] order for Google Maps compatibility
 */
export function getHexCoords(
  lat: number,
  lon: number,
  level: number,
): LatLng[] {
  const { x, y } = loc2xy(lon, lat);
  const size = calcHexSize(level);

  const top = xy2loc(x, y + H_DEG * size);
  const bottom = xy2loc(x, y - H_DEG * size);
  const left = xy2loc(x - 2 * size, y);
  const right = xy2loc(x + 2 * size, y);
  const cl = xy2loc(x - size, y);
  const cr = xy2loc(x + size, y);

  // Flat-top hexagon vertices, clockwise from left
  return [
    { lat, lng: left.lon },
    { lat: top.lat, lng: cl.lon },
    { lat: top.lat, lng: cr.lon },
    { lat, lng: right.lon },
    { lat: bottom.lat, lng: cr.lon },
    { lat: bottom.lat, lng: cl.lon },
  ];
}

/**
 * Validate a GeoHex code string
 */
export function isValidCode(code: string): boolean {
  if (code.length < 2) {
    return false;
  }
  if (H_KEY.indexOf(code[0]) === -1) {
    return false;
  }
  if (H_KEY.indexOf(code[1]) === -1) {
    return false;
  }
  for (let i = 2; i < code.length; i++) {
    const c = code[i];
    if (c < "0" || c > "8") {
      return false;
    }
  }
  return true;
}

/**
 * Get level from a GeoHex code
 */
export function getLevelFromCode(code: string): number {
  return code.length - 2;
}

/**
 * Encode all levels (0-15) for a given lat/lon
 */
export function encodeAllLevels(lat: number, lon: number): GeoHexCell[] {
  const results: GeoHexCell[] = [];
  for (let level = 0; level <= 15; level++) {
    results.push(encode(lat, lon, level));
  }
  return results;
}

/**
 * Get hex cells visible in a map bounds at a given level.
 * Returns an array of { code, coords } for rendering.
 */
export const HEX_RENDER_LIMIT = 50000;

export interface HexesInBoundsResult {
  hexes: Array<{ code: string; center: LatLng; coords: LatLng[] }>;
  exceeded: boolean;
}

export function getHexesInBounds(
  north: number,
  south: number,
  east: number,
  west: number,
  level: number,
): HexesInBoundsResult {
  const size = calcHexSize(level);
  const unitX = 6 * size;
  const unitY = 6 * size * H_K;

  // Convert all 4 corners to grid coordinates to get accurate range
  function toGrid(lon: number, lat: number) {
    const m = loc2xy(lon, lat);
    return {
      gx: (m.x + m.y / H_K) / unitX,
      gy: (m.y - H_K * m.x) / unitY,
    };
  }

  const corners = [
    toGrid(west, north),
    toGrid(east, north),
    toGrid(west, south),
    toGrid(east, south),
  ];

  const gxValues = corners.map((c) => c.gx);
  const gyValues = corners.map((c) => c.gy);

  const gridXMin = Math.floor(Math.min(...gxValues)) - 1;
  const gridXMax = Math.ceil(Math.max(...gxValues)) + 1;
  const gridYMin = Math.floor(Math.min(...gyValues)) - 1;
  const gridYMax = Math.ceil(Math.max(...gyValues)) + 1;

  // Cap total hex count to avoid freezing on low zoom levels
  const count = (gridXMax - gridXMin) * (gridYMax - gridYMin);
  if (count > HEX_RENDER_LIMIT) {
    return { hexes: [], exceeded: true };
  }

  const seen = new Set<string>();
  const results: Array<{ code: string; center: LatLng; coords: LatLng[] }> = [];

  for (let gx = gridXMin; gx <= gridXMax; gx++) {
    for (let gy = gridYMin; gy <= gridYMax; gy++) {
      const adj = adjustXY(gx, gy, level);
      const mercY2 = (H_K * adj.x * unitX + adj.y * unitY) / 2;
      const mercX2 = (mercY2 - adj.y * unitY) / H_K;
      const center = xy2loc(mercX2, mercY2);

      const cell = encode(center.lat, center.lon, level);
      if (seen.has(cell.code)) {
        continue;
      }
      seen.add(cell.code);

      const coords = getHexCoords(cell.lat, cell.lon, level);
      results.push({
        code: cell.code,
        center: { lat: cell.lat, lng: cell.lon },
        coords,
      });
    }
  }

  return { hexes: results, exceeded: false };
}
