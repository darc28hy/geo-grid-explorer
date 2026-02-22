import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useCallback, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { PolygonLayer, TextLayer } from "@deck.gl/layers";
import { getHexesInBounds, type LatLng } from "@/lib/geohex";

interface HexOverlayProps {
  level: number;
  onExceeded?: (exceeded: boolean) => void;
  selectedCode?: string | null;
}

type HexData = {
  code: string;
  center: LatLng;
  coords: LatLng[];
};

/**
 * Determine font size based on hex count in viewport.
 * Fewer hexes = more space per hex = larger labels.
 */
function getLabelSize(hexCount: number): number {
  if (hexCount > 500) return 12;
  if (hexCount > 200) return 14;
  if (hexCount > 80) return 16;
  if (hexCount > 30) return 18;
  if (hexCount > 10) return 22;
  return 26;
}

/**
 * Determine line width in pixels based on hex count in viewport.
 * More hexes = thinner lines to avoid visual clutter.
 */
function getLineWidthPixels(hexCount: number): number {
  if (hexCount > 1000) return 0.5;
  if (hexCount > 200) return 1;
  return 2;
}

export function HexOverlay({ level, onExceeded, selectedCode }: HexOverlayProps) {
  const map = useMap();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  const [hexes, setHexes] = useState<HexData[]>([]);
  const onExceededRef = useRef(onExceeded);
  onExceededRef.current = onExceeded;

  const updateHexes = useCallback(() => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const result = getHexesInBounds(
      ne.lat(),
      sw.lat(),
      ne.lng(),
      sw.lng(),
      level
    );

    setHexes(result.hexes);
    onExceededRef.current?.(result.exceeded);
  }, [map, level]);

  // Initialize overlay
  useEffect(() => {
    if (!map) return;

    const overlay = new GoogleMapsOverlay({ interleaved: true });
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.finalize();
      overlayRef.current = null;
    };
  }, [map]);

  // Listen for map idle to update hex data
  useEffect(() => {
    if (!map) return;

    updateHexes();
    const idleListener = map.addListener("idle", updateHexes);

    return () => {
      idleListener.remove();
    };
  }, [map, updateHexes]);

  // Update deck.gl layers when hex data changes
  useEffect(() => {
    if (!overlayRef.current) return;

    const labelSize = getLabelSize(hexes.length);
    const lineWidth = getLineWidthPixels(hexes.length);

    const polygonLayer = new PolygonLayer<HexData>({
      id: "hex-polygons",
      data: hexes,
      getPolygon: (d: HexData) => d.coords.map((c) => [c.lng, c.lat]),
      getFillColor: (d: HexData) =>
        selectedCode && d.code === selectedCode
          ? [239, 68, 68, 60]
          : [239, 68, 68, 12],
      getLineColor: [239, 68, 68, 180],
      getLineWidth: 1,
      lineWidthMinPixels: lineWidth,
      filled: true,
      stroked: true,
      pickable: false,
      updateTriggers: {
        getFillColor: selectedCode,
      },
    });

    const textLayer = new TextLayer<HexData>({
      id: "hex-labels",
      data: hexes,
      getPosition: (d: HexData) => [d.center.lng, d.center.lat],
      getText: (d: HexData) => d.code,
      getColor: [185, 28, 28, 255],
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
  }, [hexes, selectedCode]);

  return null;
}
