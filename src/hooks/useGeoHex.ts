import { useState, useCallback } from "react";
import {
  decode,
  isValidCode,
  getLevelFromCode,
  encodeAllLevels,
  type GeoHexCell,
} from "@/lib/geohex";

interface FlyTo {
  lat: number;
  lng: number;
  zoom: number;
}

interface UseGeoHexReturn {
  level: number;
  setLevel: (level: number) => void;
  clickedLat: number | null;
  clickedLng: number | null;
  allLevelCells: GeoHexCell[];
  encodeFromClick: (lat: number, lng: number) => void;
  decodeFromInput: (code: string) => boolean;
  searchByLatLng: (lat: number, lng: number) => void;
  selectLevel: (level: number) => void;
  error: string | null;
  flyTo: FlyTo | null;
}

/**
 * Map GeoHex level to an appropriate Google Maps zoom level.
 * Higher GeoHex levels produce smaller hexes, requiring a closer zoom.
 */
function hexLevelToZoom(hexLevel: number): number {
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
  return table[hexLevel] ?? 12;
}

export function useGeoHex(initialLevel = 4): UseGeoHexReturn {
  const [level, setLevel] = useState(initialLevel);
  const [clickedLat, setClickedLat] = useState<number | null>(null);
  const [clickedLng, setClickedLng] = useState<number | null>(null);
  const [allLevelCells, setAllLevelCells] = useState<GeoHexCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);

  const encodeFromClick = useCallback(
    (lat: number, lng: number) => {
      setClickedLat(lat);
      setClickedLng(lng);
      setAllLevelCells(encodeAllLevels(lat, lng));
      setError(null);
    },
    []
  );

  const searchByLatLng = useCallback(
    (lat: number, lng: number) => {
      setClickedLat(lat);
      setClickedLng(lng);
      setAllLevelCells(encodeAllLevels(lat, lng));
      setFlyTo({ lat, lng, zoom: hexLevelToZoom(level) });
      setError(null);
    },
    [level]
  );

  const decodeFromInput = useCallback((code: string): boolean => {
    if (!isValidCode(code)) {
      setError("無効なGeoHexコードです");
      return false;
    }
    const result = decode(code);
    const codeLevel = getLevelFromCode(code);
    setClickedLat(result.lat);
    setClickedLng(result.lon);
    setLevel(codeLevel);
    setAllLevelCells(encodeAllLevels(result.lat, result.lon));
    setFlyTo({
      lat: result.lat,
      lng: result.lon,
      zoom: hexLevelToZoom(codeLevel),
    });
    setError(null);
    return true;
  }, []);

  const handleSetLevel = useCallback(
    (newLevel: number) => {
      setLevel(newLevel);
    },
    []
  );

  const selectLevel = useCallback(
    (newLevel: number) => {
      setLevel(newLevel);
      if (clickedLat !== null && clickedLng !== null) {
        setFlyTo({
          lat: clickedLat,
          lng: clickedLng,
          zoom: hexLevelToZoom(newLevel),
        });
      }
    },
    [clickedLat, clickedLng]
  );

  return {
    level,
    setLevel: handleSetLevel,
    clickedLat,
    clickedLng,
    allLevelCells,
    encodeFromClick,
    decodeFromInput,
    searchByLatLng,
    selectLevel,
    error,
    flyTo,
  };
}
