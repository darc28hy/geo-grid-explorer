import { useState, useCallback, useMemo } from "react";
import type { GridMode, GridCell } from "@/lib/grid-types";
import { getAdapter } from "@/lib/grid-registry";

interface FlyTo {
  lat: number;
  lng: number;
  zoom: number;
}

export interface UseGridSystemReturn {
  mode: GridMode;
  setMode: (mode: GridMode) => void;
  level: number;
  setLevel: (level: number) => void;
  clickedLat: number | null;
  clickedLng: number | null;
  allLevelCells: GridCell[];
  encodeFromClick: (lat: number, lng: number) => void;
  decodeFromInput: (code: string) => boolean;
  searchByLatLng: (lat: number, lng: number) => void;
  selectLevel: (level: number) => void;
  error: string | null;
  flyTo: FlyTo | null;
  minLevel: number;
  maxLevel: number;
  renderLimit: number;
  codePlaceholder: string;
  adapterName: string;
}

export function useGridSystem(
  initialMode: GridMode = "geohex",
): UseGridSystemReturn {
  const [mode, setModeInternal] = useState<GridMode>(initialMode);
  // Manage levels independently per grid mode
  const [levels, setLevels] = useState<Record<GridMode, number>>({
    geohex: 4,
    geohash: 4,
  });
  const [clickedLat, setClickedLat] = useState<number | null>(null);
  const [clickedLng, setClickedLng] = useState<number | null>(null);
  const [allLevelCells, setAllLevelCells] = useState<GridCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);

  const adapter = useMemo(() => getAdapter(mode), [mode]);
  const level = levels[mode];

  const setLevel = useCallback(
    (newLevel: number) => {
      setLevels((prev) => ({ ...prev, [mode]: newLevel }));
    },
    [mode],
  );

  const setMode = useCallback(
    (newMode: GridMode) => {
      setModeInternal(newMode);

      // Re-encode if a point is selected
      if (clickedLat !== null && clickedLng !== null) {
        const newAdapter = getAdapter(newMode);
        setAllLevelCells(newAdapter.encodeAllLevels(clickedLat, clickedLng));
      }
      setError(null);
    },
    [clickedLat, clickedLng],
  );

  const encodeFromClick = useCallback(
    (lat: number, lng: number) => {
      setClickedLat(lat);
      setClickedLng(lng);
      setAllLevelCells(adapter.encodeAllLevels(lat, lng));
      setError(null);
    },
    [adapter],
  );

  const searchByLatLng = useCallback(
    (lat: number, lng: number) => {
      setClickedLat(lat);
      setClickedLng(lng);
      setAllLevelCells(adapter.encodeAllLevels(lat, lng));
      setFlyTo({ lat, lng, zoom: adapter.levelToZoom(level) });
      setError(null);
    },
    [adapter, level],
  );

  const decodeFromInput = useCallback(
    (code: string): boolean => {
      if (!adapter.isValidCode(code)) {
        setError(adapter.invalidCodeMessage);
        return false;
      }
      const result = adapter.decode(code);
      const codeLevel = adapter.getLevelFromCode(code);
      setClickedLat(result.lat);
      setClickedLng(result.lon);
      setLevel(codeLevel);
      setAllLevelCells(adapter.encodeAllLevels(result.lat, result.lon));
      setFlyTo({
        lat: result.lat,
        lng: result.lon,
        zoom: adapter.levelToZoom(codeLevel),
      });
      setError(null);
      return true;
    },
    [adapter, setLevel],
  );

  const selectLevel = useCallback(
    (newLevel: number) => {
      setLevel(newLevel);
      if (clickedLat !== null && clickedLng !== null) {
        setFlyTo({
          lat: clickedLat,
          lng: clickedLng,
          zoom: adapter.levelToZoom(newLevel),
        });
      }
    },
    [adapter, clickedLat, clickedLng, setLevel],
  );

  return {
    mode,
    setMode,
    level,
    setLevel,
    clickedLat,
    clickedLng,
    allLevelCells,
    encodeFromClick,
    decodeFromInput,
    searchByLatLng,
    selectLevel,
    error,
    flyTo,
    minLevel: adapter.minLevel,
    maxLevel: adapter.maxLevel,
    renderLimit: adapter.renderLimit,
    codePlaceholder: adapter.codePlaceholder,
    adapterName: adapter.name,
  };
}
