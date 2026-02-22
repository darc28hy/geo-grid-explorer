/** Grid system mode */
export type GridMode = "geohex" | "geohash";

/** Common cell type for all grid systems */
export interface GridCell {
  lat: number;
  lon: number;
  code: string;
  level: number;
}

/** Latitude/Longitude coordinate pair */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Cell data for rendering (polygon + label) */
export interface GridCellData {
  code: string;
  center: LatLng;
  coords: LatLng[];
}

/** Result of querying cells within map bounds */
export interface CellsInBoundsResult {
  cells: GridCellData[];
  exceeded: boolean;
}

/** Adapter interface that each grid system must implement */
export interface GridAdapter {
  /** Display name (e.g. "GeoHex", "GeoHash") */
  readonly name: string;
  /** Minimum level/precision */
  readonly minLevel: number;
  /** Maximum level/precision */
  readonly maxLevel: number;
  /** Max cells to render before showing warning */
  readonly renderLimit: number;
  /** Example code for input placeholder */
  readonly codePlaceholder: string;
  /** Error message for invalid code */
  readonly invalidCodeMessage: string;

  /** Encode lat/lon at given level into a cell */
  encode(lat: number, lon: number, level: number): GridCell;
  /** Decode a code string into a cell */
  decode(code: string): GridCell;
  /** Validate a code string */
  isValidCode(code: string): boolean;
  /** Extract level/precision from a code string */
  getLevelFromCode(code: string): number;
  /** Encode lat/lon at all available levels */
  encodeAllLevels(lat: number, lon: number): GridCell[];
  /** Get all cells within map bounds at given level */
  getCellsInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    level: number,
  ): CellsInBoundsResult;
  /** Convert grid level to Google Maps zoom level */
  levelToZoom(level: number): number;
}
