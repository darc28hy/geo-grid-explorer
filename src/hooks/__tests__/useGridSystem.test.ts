// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridSystem } from "../useGridSystem";

describe("useGridSystem", () => {
  // ─── Initial State ───────────────────────────────────────────

  describe("initial state", () => {
    it("defaults to geohex mode", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.mode).toBe("geohex");
    });

    it("accepts initial mode parameter", () => {
      const { result } = renderHook(() => useGridSystem("geohash"));
      expect(result.current.mode).toBe("geohash");
    });

    it("starts with level 4 for both modes", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.level).toBe(4);
    });

    it("has no selected point initially", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.clickedLat).toBeNull();
      expect(result.current.clickedLng).toBeNull();
    });

    it("has empty allLevelCells initially", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.allLevelCells).toHaveLength(0);
    });

    it("has no error initially", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.error).toBeNull();
    });

    it("has no flyTo initially", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.flyTo).toBeNull();
    });

    it("has null neighborCodes initially", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.neighborCodes).toBeNull();
    });

    it("exposes adapter properties for geohex", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      expect(result.current.adapterName).toBe("GeoHex");
      expect(result.current.minLevel).toBe(0);
      expect(result.current.maxLevel).toBe(15);
      expect(result.current.renderLimit).toBe(50000);
    });

    it("exposes adapter properties for geohash", () => {
      const { result } = renderHook(() => useGridSystem("geohash"));
      expect(result.current.adapterName).toBe("GeoHash");
      expect(result.current.minLevel).toBe(1);
      expect(result.current.maxLevel).toBe(9);
    });
  });

  // ─── encodeFromClick ─────────────────────────────────────────

  describe("encodeFromClick", () => {
    it("sets clicked coordinates", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.clickedLat).toBeCloseTo(35.6812, 4);
      expect(result.current.clickedLng).toBeCloseTo(139.7671, 4);
    });

    it("populates allLevelCells", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.allLevelCells.length).toBeGreaterThan(0);
    });

    it("clears previous error", () => {
      const { result } = renderHook(() => useGridSystem());
      // Trigger an error first
      act(() => result.current.decodeFromInput("INVALID!!!"));
      expect(result.current.error).not.toBeNull();
      // Click should clear it
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.error).toBeNull();
    });

    it("computes neighborCodes after click", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.neighborCodes).not.toBeNull();
      expect(result.current.neighborCodes).toHaveLength(6);
    });
  });

  // ─── decodeFromInput ─────────────────────────────────────────

  describe("decodeFromInput", () => {
    it("returns true for valid GeoHex code", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      let success = false;
      act(() => {
        success = result.current.decodeFromInput("XM4885413");
      });
      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("sets coordinates and flyTo on valid decode", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.decodeFromInput("XM4885413"));
      expect(result.current.clickedLat).not.toBeNull();
      expect(result.current.clickedLng).not.toBeNull();
      expect(result.current.flyTo).not.toBeNull();
      expect(result.current.flyTo!.lat).toBe(result.current.clickedLat);
      expect(result.current.flyTo!.lng).toBe(result.current.clickedLng);
    });

    it("sets level from decoded code", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.decodeFromInput("XM4885413"));
      // "XM4885413" is level 7 (length 9 - 2)
      expect(result.current.level).toBe(7);
    });

    it("returns false and sets error for invalid code", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      let success = true;
      act(() => {
        success = result.current.decodeFromInput("INVALID!!!");
      });
      expect(success).toBe(false);
      expect(result.current.error).not.toBeNull();
    });

    it("works with GeoHash codes", () => {
      const { result } = renderHook(() => useGridSystem("geohash"));
      let success = false;
      act(() => {
        success = result.current.decodeFromInput("xn76u");
      });
      expect(success).toBe(true);
      expect(result.current.level).toBe(5);
      expect(result.current.neighborCodes).toHaveLength(8);
    });
  });

  // ─── searchByLatLng ──────────────────────────────────────────

  describe("searchByLatLng", () => {
    it("sets coordinates and triggers flyTo", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.searchByLatLng(35.6812, 139.7671));
      expect(result.current.clickedLat).toBeCloseTo(35.6812, 4);
      expect(result.current.clickedLng).toBeCloseTo(139.7671, 4);
      expect(result.current.flyTo).not.toBeNull();
      expect(result.current.flyTo!.lat).toBeCloseTo(35.6812, 4);
      expect(result.current.flyTo!.lng).toBeCloseTo(139.7671, 4);
      expect(result.current.flyTo!.zoom).toBeGreaterThan(0);
    });

    it("populates allLevelCells", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.searchByLatLng(35.6812, 139.7671));
      expect(result.current.allLevelCells.length).toBeGreaterThan(0);
    });
  });

  // ─── setLevel ────────────────────────────────────────────────

  describe("setLevel", () => {
    it("changes the current level", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.setLevel(8));
      expect(result.current.level).toBe(8);
    });
  });

  // ─── selectLevel ─────────────────────────────────────────────

  describe("selectLevel", () => {
    it("changes level and triggers flyTo when point is selected", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      act(() => result.current.selectLevel(8));
      expect(result.current.level).toBe(8);
      expect(result.current.flyTo).not.toBeNull();
    });

    it("does not trigger flyTo when no point is selected", () => {
      const { result } = renderHook(() => useGridSystem());
      act(() => result.current.selectLevel(8));
      expect(result.current.level).toBe(8);
      expect(result.current.flyTo).toBeNull();
    });
  });

  // ─── setMode ─────────────────────────────────────────────────

  describe("setMode", () => {
    it("switches mode", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.setMode("geohash"));
      expect(result.current.mode).toBe("geohash");
      expect(result.current.adapterName).toBe("GeoHash");
    });

    it("preserves per-mode level", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.setLevel(10));
      act(() => result.current.setMode("geohash"));
      act(() => result.current.setLevel(3));
      // Switch back to geohex - level should be preserved
      act(() => result.current.setMode("geohex"));
      expect(result.current.level).toBe(10);
    });

    it("re-encodes cells when point is selected", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      const geohexCells = result.current.allLevelCells;
      act(() => result.current.setMode("geohash"));
      // Cells should change (different encoding system)
      expect(result.current.allLevelCells).not.toEqual(geohexCells);
      expect(result.current.allLevelCells.length).toBeGreaterThan(0);
    });

    it("clears error on mode switch", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.decodeFromInput("INVALID!!!"));
      expect(result.current.error).not.toBeNull();
      act(() => result.current.setMode("geohash"));
      expect(result.current.error).toBeNull();
    });
  });

  // ─── neighborCodes ───────────────────────────────────────────

  describe("neighborCodes", () => {
    it("returns null when no point is selected", () => {
      const { result } = renderHook(() => useGridSystem());
      expect(result.current.neighborCodes).toBeNull();
    });

    it("returns 6 neighbors in geohex mode", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.neighborCodes).toHaveLength(6);
    });

    it("returns 8 neighbors in geohash mode", () => {
      const { result } = renderHook(() => useGridSystem("geohash"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      expect(result.current.neighborCodes).toHaveLength(8);
    });

    it("updates when level changes", () => {
      const { result } = renderHook(() => useGridSystem("geohex"));
      act(() => result.current.encodeFromClick(35.6812, 139.7671));
      const neighborsAtLevel4 = result.current.neighborCodes;
      act(() => result.current.setLevel(8));
      const neighborsAtLevel8 = result.current.neighborCodes;
      // Different levels should give different neighbor codes
      expect(neighborsAtLevel8).not.toEqual(neighborsAtLevel4);
    });
  });
});
