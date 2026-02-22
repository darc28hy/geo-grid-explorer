import { describe, it, expect } from "vitest";
import { geohexAdapter } from "../geohex-adapter";
import { geohashAdapter } from "../geohash-adapter";
import { getAdapter } from "../grid-registry";
import type { GridAdapter } from "../grid-types";

// ─── Grid Registry ───────────────────────────────────────────────

describe("getAdapter", () => {
  it("returns geohexAdapter for 'geohex'", () => {
    expect(getAdapter("geohex")).toBe(geohexAdapter);
  });

  it("returns geohashAdapter for 'geohash'", () => {
    expect(getAdapter("geohash")).toBe(geohashAdapter);
  });
});

// ─── GeoHex Adapter ──────────────────────────────────────────────

describe("geohexAdapter", () => {
  const adapter: GridAdapter = geohexAdapter;

  describe("static properties", () => {
    it("has correct name", () => {
      expect(adapter.name).toBe("GeoHex");
    });

    it("has level range 0-15", () => {
      expect(adapter.minLevel).toBe(0);
      expect(adapter.maxLevel).toBe(15);
    });

    it("has a positive render limit", () => {
      expect(adapter.renderLimit).toBe(50000);
    });

    it("has a valid code placeholder", () => {
      expect(adapter.isValidCode(adapter.codePlaceholder)).toBe(true);
    });

    it("has an invalidCodeMessage string", () => {
      expect(adapter.invalidCodeMessage).toBeTruthy();
    });
  });

  describe("encode / decode roundtrip", () => {
    it("encode then decode returns consistent coordinates", () => {
      const encoded = adapter.encode(35.6812, 139.7671, 7);
      const decoded = adapter.decode(encoded.code);
      expect(decoded.lat).toBeCloseTo(encoded.lat, 10);
      expect(decoded.lon).toBeCloseTo(encoded.lon, 10);
      expect(decoded.level).toBe(encoded.level);
    });

    it("returns GridCell shape (lat, lon, code, level)", () => {
      const cell = adapter.encode(35.6812, 139.7671, 4);
      expect(cell).toHaveProperty("lat");
      expect(cell).toHaveProperty("lon");
      expect(cell).toHaveProperty("code");
      expect(cell).toHaveProperty("level");
      expect(cell.level).toBe(4);
    });
  });

  describe("isValidCode", () => {
    it("validates codes correctly", () => {
      expect(adapter.isValidCode("XM4885413")).toBe(true);
      expect(adapter.isValidCode("invalid!")).toBe(false);
    });
  });

  describe("getLevelFromCode", () => {
    it("extracts level from code", () => {
      expect(adapter.getLevelFromCode("XM")).toBe(0);
      expect(adapter.getLevelFromCode("XM4885413")).toBe(7);
    });
  });

  describe("encodeAllLevels", () => {
    it("returns 16 cells (levels 0-15)", () => {
      const cells = adapter.encodeAllLevels(35.6812, 139.7671);
      expect(cells).toHaveLength(16);
      expect(cells[0].level).toBe(0);
      expect(cells[15].level).toBe(15);
    });

    it("returns GridCell objects without extra properties", () => {
      const cells = adapter.encodeAllLevels(35.6812, 139.7671);
      for (const cell of cells) {
        const keys = Object.keys(cell).sort();
        expect(keys).toEqual(["code", "lat", "level", "lon"]);
      }
    });
  });

  describe("getCellsInBounds", () => {
    it("returns cells with expected shape", () => {
      const result = adapter.getCellsInBounds(35.69, 35.67, 139.78, 139.76, 6);
      expect(result.exceeded).toBe(false);
      expect(result.cells.length).toBeGreaterThan(0);
      for (const cell of result.cells) {
        expect(cell).toHaveProperty("code");
        expect(cell).toHaveProperty("center");
        expect(cell).toHaveProperty("coords");
        expect(cell.center).toHaveProperty("lat");
        expect(cell.center).toHaveProperty("lng");
      }
    });
  });

  describe("levelToZoom", () => {
    it("returns a valid zoom for every level 0-15", () => {
      for (let level = 0; level <= 15; level++) {
        const zoom = adapter.levelToZoom(level);
        expect(zoom).toBeGreaterThanOrEqual(1);
        expect(zoom).toBeLessThanOrEqual(22);
      }
    });

    it("zoom increases monotonically with level", () => {
      for (let level = 1; level <= 15; level++) {
        expect(adapter.levelToZoom(level)).toBeGreaterThanOrEqual(
          adapter.levelToZoom(level - 1),
        );
      }
    });

    it("returns fallback for out-of-range level", () => {
      expect(adapter.levelToZoom(99)).toBe(12);
    });
  });

  describe("getNeighbors", () => {
    it("returns 6 neighbors", () => {
      expect(adapter.getNeighbors("XM488")).toHaveLength(6);
    });
  });
});

// ─── GeoHash Adapter ─────────────────────────────────────────────

describe("geohashAdapter", () => {
  const adapter: GridAdapter = geohashAdapter;

  describe("static properties", () => {
    it("has correct name", () => {
      expect(adapter.name).toBe("GeoHash");
    });

    it("has level range 1-9", () => {
      expect(adapter.minLevel).toBe(1);
      expect(adapter.maxLevel).toBe(9);
    });

    it("has a positive render limit", () => {
      expect(adapter.renderLimit).toBe(50000);
    });

    it("has a valid code placeholder", () => {
      expect(adapter.isValidCode(adapter.codePlaceholder)).toBe(true);
    });

    it("has an invalidCodeMessage string", () => {
      expect(adapter.invalidCodeMessage).toBeTruthy();
    });
  });

  describe("encode / decode roundtrip", () => {
    it("encode then decode returns consistent coordinates", () => {
      const encoded = adapter.encode(35.6812, 139.7671, 7);
      const decoded = adapter.decode(encoded.code);
      expect(decoded.lat).toBeCloseTo(encoded.lat, 10);
      expect(decoded.lon).toBeCloseTo(encoded.lon, 10);
      expect(decoded.level).toBe(encoded.level);
    });

    it("returns GridCell shape (lat, lon, code, level)", () => {
      const cell = adapter.encode(35.6812, 139.7671, 5);
      expect(cell).toHaveProperty("lat");
      expect(cell).toHaveProperty("lon");
      expect(cell).toHaveProperty("code");
      expect(cell).toHaveProperty("level");
      expect(cell.level).toBe(5);
    });
  });

  describe("isValidCode", () => {
    it("validates codes correctly", () => {
      expect(adapter.isValidCode("xn76u")).toBe(true);
      expect(adapter.isValidCode("INVALID")).toBe(false);
    });
  });

  describe("getLevelFromCode", () => {
    it("extracts precision from code", () => {
      expect(adapter.getLevelFromCode("x")).toBe(1);
      expect(adapter.getLevelFromCode("xn76u")).toBe(5);
    });
  });

  describe("encodeAllLevels", () => {
    it("returns at most 9 cells (precision 1-9)", () => {
      const cells = adapter.encodeAllLevels(35.6812, 139.7671);
      expect(cells.length).toBeLessThanOrEqual(9);
      expect(cells[0].level).toBe(1);
    });

    it("caps at precision 9 (no higher precision cells)", () => {
      const cells = adapter.encodeAllLevels(35.6812, 139.7671);
      for (const cell of cells) {
        expect(cell.level).toBeLessThanOrEqual(9);
      }
    });
  });

  describe("getCellsInBounds", () => {
    it("returns cells with expected shape", () => {
      const result = adapter.getCellsInBounds(35.69, 35.67, 139.78, 139.76, 6);
      expect(result.exceeded).toBe(false);
      expect(result.cells.length).toBeGreaterThan(0);
      for (const cell of result.cells) {
        expect(cell).toHaveProperty("code");
        expect(cell).toHaveProperty("center");
        expect(cell).toHaveProperty("coords");
      }
    });
  });

  describe("levelToZoom", () => {
    it("returns a valid zoom for every precision 1-9", () => {
      for (let p = 1; p <= 9; p++) {
        const zoom = adapter.levelToZoom(p);
        expect(zoom).toBeGreaterThanOrEqual(1);
        expect(zoom).toBeLessThanOrEqual(22);
      }
    });

    it("zoom increases monotonically with precision", () => {
      for (let p = 2; p <= 9; p++) {
        expect(adapter.levelToZoom(p)).toBeGreaterThanOrEqual(
          adapter.levelToZoom(p - 1),
        );
      }
    });

    it("returns fallback for out-of-range precision", () => {
      expect(adapter.levelToZoom(99)).toBe(12);
    });
  });

  describe("getNeighbors", () => {
    it("returns 8 neighbors", () => {
      expect(adapter.getNeighbors("xn76u")).toHaveLength(8);
    });
  });
});
