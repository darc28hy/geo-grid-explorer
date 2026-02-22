import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useCallback, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import type {
  GridMode,
  GridCellData,
  CellsInBoundsResult,
} from "@/lib/grid-types";

interface GridOverlayProps {
  mode: GridMode;
  level: number;
  getCellsInBounds: (
    north: number,
    south: number,
    east: number,
    west: number,
    level: number,
  ) => CellsInBoundsResult;
  onExceeded?: (exceeded: boolean) => void;
  selectedCode?: string | null;
}

// Color schemes per grid mode
const COLORS = {
  geohex: {
    fill: [239, 68, 68, 12] as [number, number, number, number],
    fillSelected: [239, 68, 68, 60] as [number, number, number, number],
    line: [239, 68, 68, 180] as [number, number, number, number],
    text: [185, 28, 28, 255] as [number, number, number, number],
  },
  geohash: {
    fill: [59, 130, 246, 12] as [number, number, number, number],
    fillSelected: [59, 130, 246, 60] as [number, number, number, number],
    line: [59, 130, 246, 180] as [number, number, number, number],
    text: [30, 64, 175, 255] as [number, number, number, number],
  },
};

/**
 * Determine font size based on cell count in viewport.
 * Fewer cells = more space per cell = larger labels.
 */
function getLabelSize(cellCount: number): number {
  if (cellCount > 500) {
    return 12;
  }
  if (cellCount > 200) {
    return 14;
  }
  if (cellCount > 80) {
    return 16;
  }
  if (cellCount > 30) {
    return 18;
  }
  if (cellCount > 10) {
    return 22;
  }
  return 26;
}

/**
 * Determine line width in pixels based on cell count in viewport.
 * More cells = thinner lines to avoid visual clutter.
 */
function getLineWidthPixels(cellCount: number): number {
  if (cellCount > 1000) {
    return 0.5;
  }
  if (cellCount > 200) {
    return 1;
  }
  return 2;
}

export function GridOverlay({
  mode,
  level,
  getCellsInBounds,
  onExceeded,
  selectedCode,
}: GridOverlayProps) {
  const map = useMap();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const [cells, setCells] = useState<GridCellData[]>([]);
  const onExceededRef = useRef(onExceeded);
  onExceededRef.current = onExceeded;

  // Keep getCellsInBounds ref stable to avoid re-subscribing idle listener
  const getCellsRef = useRef(getCellsInBounds);
  getCellsRef.current = getCellsInBounds;

  const updateCells = useCallback(() => {
    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) {
      return;
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const result = getCellsRef.current(
      ne.lat(),
      sw.lat(),
      ne.lng(),
      sw.lng(),
      level,
    );

    setCells(result.cells);
    onExceededRef.current?.(result.exceeded);
  }, [map, level]);

  // Initialize overlay
  useEffect(() => {
    if (!map) {
      return;
    }

    const overlay = new GoogleMapsOverlay({ interleaved: true });
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.finalize();
      overlayRef.current = null;
    };
  }, [map]);

  // Listen for map idle to update cell data
  useEffect(() => {
    if (!map) {
      return;
    }

    updateCells();
    const idleListener = map.addListener("idle", updateCells);

    return () => {
      idleListener.remove();
    };
  }, [map, updateCells]);

  // Re-compute when mode changes (getCellsInBounds ref changes)
  useEffect(() => {
    updateCells();
  }, [mode, updateCells]);

  // Update deck.gl layers when cell data or colors change
  useEffect(() => {
    if (!overlayRef.current) {
      return;
    }

    const colors = COLORS[mode];
    const labelSize = getLabelSize(cells.length);
    const lineWidth = getLineWidthPixels(cells.length);

    const polygonLayer = new PolygonLayer<GridCellData>({
      id: "grid-polygons",
      data: cells,
      getPolygon: (d: GridCellData) => d.coords.map((c) => [c.lng, c.lat]),
      getFillColor: (d: GridCellData) =>
        selectedCode && d.code === selectedCode
          ? colors.fillSelected
          : colors.fill,
      getLineColor: colors.line,
      getLineWidth: 1,
      lineWidthMinPixels: lineWidth,
      filled: true,
      stroked: true,
      pickable: false,
      updateTriggers: {
        getFillColor: selectedCode,
      },
    });

    const textLayer = new TextLayer<GridCellData>({
      id: "grid-labels",
      data: cells,
      getPosition: (d: GridCellData) => [d.center.lng, d.center.lat],
      getText: (d: GridCellData) => d.code,
      getColor: colors.text,
      getSize: labelSize,
      fontFamily: "monospace",
      fontWeight: "bold",
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      outlineColor: [255, 255, 255, 220],
      outlineWidth: 3,
      pickable: false,
      sizeMaxPixels: 26,
      sizeMinPixels: 8,
    });

    overlayRef.current.setProps({
      layers: [polygonLayer, textLayer],
    });
  }, [cells, selectedCode, mode]);

  return null;
}
