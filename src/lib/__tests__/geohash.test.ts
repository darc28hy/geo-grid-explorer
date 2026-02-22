import { describe, it, expect } from "vitest";
import {
  encode,
  decode,
  decodeBounds,
  isValidCode,
  getLevelFromCode,
  encodeAllLevels,
  getRectCoords,
  getHashesInBounds,
  getNeighbors,
} from "../geohash";

describe("GeoHash encode", () => {
  it.each([
    // [lat, lon, precision, expectedCode]
    [35.6812, 139.7671, 1, "x"],
    [35.6812, 139.7671, 5, "xn76u"],
    [0, 0, 1, "s"],
    [-90, -180, 1, "0"],
    [90, 180, 1, "z"],
  ] as [number, number, number, string][])(
    "encode(%f, %f, %i) => %s",
    (lat, lon, precision, expected) => {
      expect(encode(lat, lon, precision).code).toBe(expected);
    },
  );

  it("returns center coordinates close to input", () => {
    const cell = encode(35.6812, 139.7671, 9);
    expect(cell.lat).toBeCloseTo(35.6812, 4);
    expect(cell.lon).toBeCloseTo(139.7671, 4);
    expect(cell.level).toBe(9);
  });
});

describe("GeoHash decode", () => {
  it("roundtrips through encode/decode", () => {
    const encoded = encode(35.6812, 139.7671, 7);
    const decoded = decode(encoded.code);
    expect(decoded.lat).toBeCloseTo(encoded.lat, 10);
    expect(decoded.lon).toBeCloseTo(encoded.lon, 10);
    expect(decoded.level).toBe(7);
  });

  it.each([
    ["xn76u", 35.68],
    ["s", 22.5],
  ] as [string, number][])(
    "decode(%s).lat is close to %f",
    (code, expectedLat) => {
      const result = decode(code);
      expect(result.lat).toBeCloseTo(expectedLat, 0);
    },
  );
});

describe("GeoHash decodeBounds", () => {
  it("returns a valid bounding box", () => {
    // Use the actual geohash for this coordinate
    const code = encode(35.6812, 139.7671, 5).code;
    const bounds = decodeBounds(code);
    expect(bounds.latMin).toBeLessThan(bounds.latMax);
    expect(bounds.lonMin).toBeLessThan(bounds.lonMax);
    expect(bounds.latMin).toBeLessThanOrEqual(35.6812);
    expect(bounds.latMax).toBeGreaterThanOrEqual(35.6812);
    expect(bounds.lonMin).toBeLessThanOrEqual(139.7671);
    expect(bounds.lonMax).toBeGreaterThanOrEqual(139.7671);
  });

  it("higher precision produces smaller bounds", () => {
    const b5 = decodeBounds("xn76g");
    const b7 = decodeBounds("xn76gge");
    expect(b7.latMax - b7.latMin).toBeLessThan(b5.latMax - b5.latMin);
    expect(b7.lonMax - b7.lonMin).toBeLessThan(b5.lonMax - b5.lonMin);
  });
});

describe("GeoHash isValidCode", () => {
  it("accepts valid codes", () => {
    expect(isValidCode("xn76g")).toBe(true);
    expect(isValidCode("s")).toBe(true);
    expect(isValidCode("0123456789bc")).toBe(true);
  });

  it("rejects invalid codes", () => {
    expect(isValidCode("")).toBe(false);
    expect(isValidCode("a")).toBe(false); // 'a' not in base32
    expect(isValidCode("i")).toBe(false); // 'i' not in base32
    expect(isValidCode("l")).toBe(false); // 'l' not in base32
    expect(isValidCode("o")).toBe(false); // 'o' not in base32
    expect(isValidCode("A")).toBe(false); // uppercase invalid
    expect(isValidCode("1234567890bcd")).toBe(false); // too long (13 chars)
  });
});

describe("GeoHash getLevelFromCode", () => {
  it("returns code length as precision", () => {
    expect(getLevelFromCode("x")).toBe(1);
    expect(getLevelFromCode("xn76g")).toBe(5);
    expect(getLevelFromCode("xn76gge1234b")).toBe(12);
  });
});

describe("GeoHash encodeAllLevels", () => {
  it("returns 12 cells for precision 1-12", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    expect(cells).toHaveLength(12);
    expect(cells[0].level).toBe(1);
    expect(cells[11].level).toBe(12);
  });

  it("all cells have consistent coordinates", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    for (const cell of cells) {
      // All should be near the input coordinate
      expect(Math.abs(cell.lat - 35.6812)).toBeLessThan(90);
      expect(Math.abs(cell.lon - 139.7671)).toBeLessThan(180);
    }
  });

  it("higher precision gives closer coordinates", () => {
    const cells = encodeAllLevels(35.6812, 139.7671);
    const dist1 = Math.abs(cells[0].lat - 35.6812);
    const dist12 = Math.abs(cells[11].lat - 35.6812);
    expect(dist12).toBeLessThan(dist1);
  });
});

describe("GeoHash getRectCoords", () => {
  it("returns 4 vertices forming a rectangle", () => {
    const coords = getRectCoords("xn76u");
    expect(coords).toHaveLength(4);
    // SW, NW, NE, SE order
    // SW.lat < NW.lat
    expect(coords[0].lat).toBeLessThan(coords[1].lat);
    // SW.lng === NW.lng (left edge)
    expect(coords[0].lng).toBe(coords[1].lng);
    // NW.lng < NE.lng (top edge)
    expect(coords[1].lng).toBeLessThan(coords[2].lng);
    // NE.lat === NW.lat (top edge)
    expect(coords[2].lat).toBe(coords[1].lat);
  });
});

describe("GeoHash getHashesInBounds", () => {
  it("returns cells within bounds", () => {
    // Small area around Tokyo at precision 6
    const result = getHashesInBounds(35.69, 35.67, 139.78, 139.76, 6);
    expect(result.hashes.length).toBeGreaterThan(0);
    expect(result.exceeded).toBe(false);

    // All cells should be within or overlapping bounds
    for (const h of result.hashes) {
      expect(h.center.lat).toBeGreaterThan(35.0);
      expect(h.center.lat).toBeLessThan(36.0);
      expect(h.center.lng).toBeGreaterThan(139.0);
      expect(h.center.lng).toBeLessThan(140.0);
    }
  });

  it("returns exceeded when too many cells", () => {
    // World-wide area at high precision should exceed limit
    const result = getHashesInBounds(90, -90, 180, -180, 5);
    expect(result.exceeded).toBe(true);
    expect(result.hashes).toHaveLength(0);
  });

  it("returns unique cells", () => {
    const result = getHashesInBounds(35.69, 35.67, 139.78, 139.76, 5);
    const codes = result.hashes.map((h) => h.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("each cell has 4 vertices", () => {
    const result = getHashesInBounds(35.69, 35.67, 139.78, 139.76, 6);
    for (const h of result.hashes) {
      expect(h.coords).toHaveLength(4);
    }
  });
});

describe("GeoHash getNeighbors", () => {
  it("returns 8 neighbor codes", () => {
    expect(getNeighbors("xn76u")).toHaveLength(8);
  });

  it("all neighbors are valid and same precision", () => {
    for (const n of getNeighbors("xn76u")) {
      expect(isValidCode(n)).toBe(true);
      expect(n).toHaveLength(5);
    }
  });

  it("neighbors are different from original and unique", () => {
    const code = "xn76u";
    const neighbors = getNeighbors(code);
    expect(new Set(neighbors).size).toBe(8);
    for (const n of neighbors) {
      expect(n).not.toBe(code);
    }
  });

  it("is symmetric: neighbor's neighbors include original", () => {
    const code = "xn76u";
    for (const n of getNeighbors(code)) {
      expect(getNeighbors(n)).toContain(code);
    }
  });

  it("works at precision 1", () => {
    const neighbors = getNeighbors("s");
    expect(neighbors).toHaveLength(8);
    for (const n of neighbors) {
      expect(isValidCode(n)).toBe(true);
    }
  });

  it("handles date line wrapping", () => {
    const cell = encode(0, 179.99, 3);
    const neighbors = getNeighbors(cell.code);
    expect(neighbors).toHaveLength(8);
    for (const n of neighbors) {
      expect(isValidCode(n)).toBe(true);
    }
  });

  it("handles pole proximity", () => {
    const cell = encode(89.9, 0, 3);
    const neighbors = getNeighbors(cell.code);
    expect(neighbors).toHaveLength(8);
    for (const n of neighbors) {
      expect(isValidCode(n)).toBe(true);
    }
  });
});
