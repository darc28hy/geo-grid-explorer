import type { GridAdapter, GridCell, CellsInBoundsResult } from "./grid-types";
import {
  encode as ghEncode,
  decode as ghDecode,
  isValidCode as ghIsValid,
  getLevelFromCode as ghGetLevel,
  encodeAllLevels as ghEncodeAll,
  getHexesInBounds,
  HEX_RENDER_LIMIT,
} from "./geohex";

function toGridCell(cell: {
  lat: number;
  lon: number;
  code: string;
  level: number;
}): GridCell {
  return { lat: cell.lat, lon: cell.lon, code: cell.code, level: cell.level };
}

export const geohexAdapter: GridAdapter = {
  name: "GeoHex",
  minLevel: 0,
  maxLevel: 15,
  renderLimit: HEX_RENDER_LIMIT,
  codePlaceholder: "XM4885413",
  invalidCodeMessage: "Invalid GeoHex code",

  encode(lat, lon, level) {
    return toGridCell(ghEncode(lat, lon, level));
  },

  decode(code) {
    return toGridCell(ghDecode(code));
  },

  isValidCode: ghIsValid,
  getLevelFromCode: ghGetLevel,

  encodeAllLevels(lat, lon) {
    return ghEncodeAll(lat, lon).map(toGridCell);
  },

  getCellsInBounds(north, south, east, west, level): CellsInBoundsResult {
    const result = getHexesInBounds(north, south, east, west, level);
    return {
      cells: result.hexes.map((h) => ({
        code: h.code,
        center: h.center,
        coords: h.coords,
      })),
      exceeded: result.exceeded,
    };
  },

  levelToZoom(level) {
    const table: Record<number, number> = {
      0: 3,
      1: 5,
      2: 7,
      3: 8,
      4: 10,
      5: 11,
      6: 12,
      7: 14,
      8: 15,
      9: 16,
      10: 17,
      11: 18,
      12: 19,
      13: 20,
      14: 20,
      15: 21,
    };
    return table[level] ?? 12;
  },
};
