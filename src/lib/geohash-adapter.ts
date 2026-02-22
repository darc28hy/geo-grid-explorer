import type {
  GridAdapter,
  GridCell,
  CellsInBoundsResult,
} from "./grid-types";
import {
  encode,
  decode,
  isValidCode,
  getLevelFromCode,
  encodeAllLevels,
  getHashesInBounds,
  GEOHASH_RENDER_LIMIT,
} from "./geohash";

export const geohashAdapter: GridAdapter = {
  name: "GeoHash",
  minLevel: 1,
  maxLevel: 9,
  renderLimit: GEOHASH_RENDER_LIMIT,
  codePlaceholder: "xn76u",
  invalidCodeMessage: "無効なGeoHashコードです",

  encode(lat, lon, level): GridCell {
    return encode(lat, lon, level);
  },

  decode(code): GridCell {
    return decode(code);
  },

  isValidCode,
  getLevelFromCode,

  encodeAllLevels(lat, lon): GridCell[] {
    return encodeAllLevels(lat, lon).slice(0, 9);
  },

  getCellsInBounds(north, south, east, west, level): CellsInBoundsResult {
    const result = getHashesInBounds(north, south, east, west, level);
    return {
      cells: result.hashes.map((h) => ({
        code: h.code,
        center: h.center,
        coords: h.coords,
      })),
      exceeded: result.exceeded,
    };
  },

  levelToZoom(level) {
    // GeoHash precision → appropriate Google Maps zoom
    // precision 1: ~5000km cells → zoom 2
    // precision 5: ~5km cells → zoom 12
    // precision 9: ~5m cells → zoom 19
    const table: Record<number, number> = {
      1: 2,
      2: 5,
      3: 7,
      4: 10,
      5: 12,
      6: 14,
      7: 16,
      8: 18,
      9: 19,
    };
    return table[level] ?? 12;
  },
};
