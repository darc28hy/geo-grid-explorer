import type { GridMode, GridAdapter } from "./grid-types";
import { geohexAdapter } from "./geohex-adapter";
import { geohashAdapter } from "./geohash-adapter";

/** Map of available grid system adapters */
const adapters: Record<GridMode, GridAdapter> = {
  geohex: geohexAdapter,
  geohash: geohashAdapter,
};

export function getAdapter(mode: GridMode): GridAdapter {
  return adapters[mode];
}
