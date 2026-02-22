import { describe, it, expect } from "vitest";
import { encode, decode } from "../geohex";
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
