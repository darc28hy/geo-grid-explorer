import { describe, it, expect } from "vitest";
import { encode, decode, isValidCode, getNeighbors } from "../geohex";
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
});
