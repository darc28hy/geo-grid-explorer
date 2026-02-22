import { describe, it, expect } from "vitest";
import {
  encode,
  decode,
  isValidCode,
  getLevelFromCode,
  encodeAllLevels,
  getHexCoords,
  getHexesInBounds,
  getNeighbors,
} from "../geohex";
import coord2HexData from "./test_coord2HEX.json";
import code2HexData from "./test_code2HEX.json";

// coord2HEX: [level, lat, lon, expectedCode]
const coord2HexCases = coord2HexData as [number, number, number, string][];

// code2HEX: [code, expectedLat, expectedLon]
const code2HexCases = code2HexData as [string, number, number][];

describe("GeoHex v3.2 encode (coord2HEX)", () => {
  it.each(coord2HexCases)(
    "level=%i lat=%f lon=%f => %s",
    (level, lat, lon, expectedCode) => {
      const result = encode(lat, lon, level);
      expect(result.code).toBe(expectedCode);
    },
  );
});

describe("GeoHex v3.2 decode (code2HEX)", () => {
  it.each(code2HexCases)(
    "code=%s => lat=%f lon=%f",
    (code, expectedLat, expectedLon) => {
      const result = decode(code);
      // The test page uses a tolerance based on hex size
      // For practical purposes, use a small epsilon for float comparison
      expect(result.lat).toBeCloseTo(expectedLat, 10);
      expect(result.lon).toBeCloseTo(expectedLon, 10);
    },
  );
});

describe("GeoHex isValidCode", () => {
  it("accepts valid codes", () => {
    expect(isValidCode("XM")).toBe(true); // level 0
    expect(isValidCode("XM4885413")).toBe(true); // level 7
    expect(isValidCode("aB00000000000000000")).toBe(true); // level 17
  });

  it("rejects codes shorter than 2 chars", () => {
    expect(isValidCode("")).toBe(false);
    expect(isValidCode("X")).toBe(false);
  });

  it("rejects invalid first two characters", () => {
    expect(isValidCode("12")).toBe(false); // digits not in H_KEY
    expect(isValidCode("X1")).toBe(false); // second char is digit
    expect(isValidCode("1M")).toBe(false); // first char is digit
  });

  it("rejects digit body characters outside 0-8", () => {
    expect(isValidCode("XM9")).toBe(false); // '9' is invalid
    expect(isValidCode("XM48854a")).toBe(false); // letter in body
  });

  it("accepts all digits 0-8 in body", () => {
    expect(isValidCode("XM012345678")).toBe(true);
  });
});

describe("GeoHex getLevelFromCode", () => {
  it("returns code length minus 2", () => {
    expect(getLevelFromCode("XM")).toBe(0);
    expect(getLevelFromCode("XM4")).toBe(1);
    expect(getLevelFromCode("XM4885413")).toBe(7);
    expect(getLevelFromCode("XM48854130000000")).toBe(14);
  });
});

describe("GeoHex encodeAllLevels", () => {
  it("returns 16 cells for levels 0-15", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    expect(cells).toHaveLength(16);
    expect(cells[0].level).toBe(0);
    expect(cells[15].level).toBe(15);
  });

  it("all cells have valid codes", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    for (const cell of cells) {
      expect(isValidCode(cell.code)).toBe(true);
      expect(getLevelFromCode(cell.code)).toBe(cell.level);
    }
  });

  it("all cells have coordinates near input", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    for (const cell of cells) {
      expect(Math.abs(cell.lat - 35.6812)).toBeLessThan(90);
      expect(Math.abs(cell.lon - 139.7671)).toBeLessThan(180);
    }
  });

  it("higher levels produce finer codes (longer code strings)", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].code.length).toBeGreaterThan(cells[i - 1].code.length);
    }
  });
});

describe("GeoHex getHexCoords", () => {
  it("returns exactly 6 vertices", () => {
    const coords = getHexCoords(35.6812, 139.7671, 4);
    expect(coords).toHaveLength(6);
  });

  it("forms a flat-top hexagon (top edge is horizontal)", () => {
    const coords = getHexCoords(35.6812, 139.7671, 4);
    // Vertices: [left, top-left, top-right, right, bottom-right, bottom-left]
    // Top-left and top-right should have same latitude (flat top)
    expect(coords[1].lat).toBeCloseTo(coords[2].lat, 10);
    // Bottom-left and bottom-right should have same latitude (flat bottom)
    expect(coords[4].lat).toBeCloseTo(coords[5].lat, 10);
    // Left and right should have same latitude as center (mid-points)
    expect(coords[0].lat).toBeCloseTo(coords[3].lat, 10);
  });

  it("vertices are symmetric around center", () => {
    const lat = 35.6812;
    const lon = 139.7671;
    const coords = getHexCoords(lat, lon, 4);
    // Left and right longitude should be equidistant from center
    const leftDist = lon - coords[0].lng;
    const rightDist = coords[3].lng - lon;
    expect(leftDist).toBeCloseTo(rightDist, 5);
    // Top and bottom latitude should be approximately equidistant
    // (Mercator projection introduces slight asymmetry in latitude)
    const topDist = coords[1].lat - lat;
    const bottomDist = lat - coords[4].lat;
    expect(topDist).toBeCloseTo(bottomDist, 2);
  });

  it("higher levels produce smaller hexagons", () => {
    const c4 = getHexCoords(35.6812, 139.7671, 4);
    const c8 = getHexCoords(35.6812, 139.7671, 8);
    const width4 = c4[3].lng - c4[0].lng;
    const width8 = c8[3].lng - c8[0].lng;
    expect(width8).toBeLessThan(width4);
  });
});

describe("GeoHex getHexesInBounds", () => {
  it("returns cells within bounds", () => {
    const result = getHexesInBounds(35.69, 35.67, 139.78, 139.76, 6);
    expect(result.hexes.length).toBeGreaterThan(0);
    expect(result.exceeded).toBe(false);
    for (const h of result.hexes) {
      expect(h.center.lat).toBeGreaterThan(35.0);
      expect(h.center.lat).toBeLessThan(36.0);
      expect(h.center.lng).toBeGreaterThan(139.0);
      expect(h.center.lng).toBeLessThan(140.0);
    }
  });

  it("returns exceeded when too many cells", () => {
    const result = getHexesInBounds(90, -90, 180, -180, 5);
    expect(result.exceeded).toBe(true);
    expect(result.hexes).toHaveLength(0);
  });

  it("returns unique cells", () => {
    const result = getHexesInBounds(35.69, 35.67, 139.78, 139.76, 5);
    const codes = result.hexes.map((h) => h.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("each cell has 6 vertices", () => {
    const result = getHexesInBounds(35.69, 35.67, 139.78, 139.76, 6);
    for (const h of result.hexes) {
      expect(h.coords).toHaveLength(6);
    }
  });
});

describe("GeoHex getNeighbors", () => {
  it("returns 6 neighbor codes", () => {
    expect(getNeighbors("XM4885413")).toHaveLength(6);
  });

  it("all neighbors are valid codes at the same level", () => {
    const code = "XM4885413";
    const neighbors = getNeighbors(code);
    for (const n of neighbors) {
      expect(n).toHaveLength(code.length);
      expect(isValidCode(n)).toBe(true);
    }
  });

  it("neighbors are different from the original and unique", () => {
    const code = "XM4885413";
    const neighbors = getNeighbors(code);
    expect(new Set(neighbors).size).toBe(6);
    for (const n of neighbors) {
      expect(n).not.toBe(code);
    }
  });

  it("is symmetric: neighbor's neighbors include original", () => {
    const code = "XM488";
    const neighbors = getNeighbors(code);
    for (const n of neighbors) {
      expect(getNeighbors(n)).toContain(code);
    }
  });

  it("neighbor centers are close to original center", () => {
    const code = "XM4885413";
    const original = decode(code);
    for (const n of getNeighbors(code)) {
      const cell = decode(n);
      expect(Math.abs(cell.lat - original.lat)).toBeLessThan(1);
      expect(Math.abs(cell.lon - original.lon)).toBeLessThan(1);
    }
  });

  it("works at level 0", () => {
    const neighbors = getNeighbors("XM");
    expect(neighbors).toHaveLength(6);
    for (const n of neighbors) {
      expect(isValidCode(n)).toBe(true);
    }
  });

  it("works near the date line", () => {
    const cell = encode(0, 179.9, 3);
    const neighbors = getNeighbors(cell.code);
    expect(neighbors).toHaveLength(6);
    for (const n of neighbors) {
      expect(isValidCode(n)).toBe(true);
    }
  });

  it("returns neighbors in correct flat-top directions [N, NE, SE, S, SW, NW]", () => {
    const code = "XM488";
    const center = decode(code);
    const neighbors = getNeighbors(code);

    // Decode all neighbor centers
    const [n, ne, se, s, sw, nw] = neighbors.map((c) => decode(c));

    // N should be directly above (higher lat, roughly same lon)
    expect(n.lat).toBeGreaterThan(center.lat);
    expect(Math.abs(n.lon - center.lon)).toBeLessThan(
      Math.abs(n.lat - center.lat),
    );

    // S should be directly below (lower lat, roughly same lon)
    expect(s.lat).toBeLessThan(center.lat);
    expect(Math.abs(s.lon - center.lon)).toBeLessThan(
      Math.abs(s.lat - center.lat),
    );

    // NE should be upper-right (higher lat, higher lon)
    expect(ne.lat).toBeGreaterThan(center.lat);
    expect(ne.lon).toBeGreaterThan(center.lon);

    // SW should be lower-left (lower lat, lower lon)
    expect(sw.lat).toBeLessThan(center.lat);
    expect(sw.lon).toBeLessThan(center.lon);

    // SE should be lower-right (lower lat, higher lon)
    expect(se.lat).toBeLessThan(center.lat);
    expect(se.lon).toBeGreaterThan(center.lon);

    // NW should be upper-left (higher lat, lower lon)
    expect(nw.lat).toBeGreaterThan(center.lat);
    expect(nw.lon).toBeLessThan(center.lon);
  });

  it("N and S neighbors have no horizontal displacement (flat-top hex)", () => {
    const code = "XM4885413";
    const center = decode(code);
    const neighbors = getNeighbors(code);
    const n = decode(neighbors[0]);
    const s = decode(neighbors[3]);

    // N neighbor: lon should be very close to center
    expect(Math.abs(n.lon - center.lon)).toBeLessThan(0.0001);
    // S neighbor: lon should be very close to center
    expect(Math.abs(s.lon - center.lon)).toBeLessThan(0.0001);
  });
});
