import { Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { GridOverlay } from "./GridOverlay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GridMode, CellsInBoundsResult } from "@/lib/grid-types";

interface MapViewProps {
  mode: GridMode;
  level: number;
  onMapClick: (lat: number, lng: number) => void;
  flyTo?: { lat: number; lng: number; zoom: number } | null;
  selectedCode?: string | null;
  getCellsInBounds: (
    north: number,
    south: number,
    east: number,
    west: number,
    level: number,
  ) => CellsInBoundsResult;
  renderLimit: number;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }
    const listener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      },
    );
    return () => listener.remove();
  }, [map, onMapClick]);

  return null;
}

function FlyToHandler({
  flyTo,
}: {
  flyTo: { lat: number; lng: number; zoom: number } | null;
}) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lng: number; zoom: number } | null>(
    null,
  );

  useEffect(() => {
    if (!map || !flyTo) {
      return;
    }
    if (
      prevRef.current &&
      prevRef.current.lat === flyTo.lat &&
      prevRef.current.lng === flyTo.lng &&
      prevRef.current.zoom === flyTo.zoom
    ) {
      return;
    }
    prevRef.current = flyTo;
    map.panTo({ lat: flyTo.lat, lng: flyTo.lng });
    map.setZoom(flyTo.zoom);
  }, [map, flyTo]);

  return null;
}

interface MapState {
  zoom: number;
  centerLat: number;
  centerLng: number;
}

function MapStateTracker({
  onChange,
}: {
  onChange: (state: MapState) => void;
}) {
  const map = useMap();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!map) {
      return;
    }

    const update = () => {
      const center = map.getCenter();
      onChangeRef.current({
        zoom: map.getZoom() ?? 12,
        centerLat: center?.lat() ?? 0,
        centerLng: center?.lng() ?? 0,
      });
    };

    update();
    const zoomListener = map.addListener("zoom_changed", update);
    const centerListener = map.addListener("center_changed", update);
    return () => {
      zoomListener.remove();
      centerListener.remove();
    };
  }, [map]);

  return null;
}

export function MapView({
  mode,
  level,
  onMapClick,
  flyTo,
  selectedCode,
  getCellsInBounds,
  renderLimit,
}: MapViewProps) {
  const [exceeded, setExceeded] = useState(false);
  const [mapState, setMapState] = useState<MapState>({
    zoom: 12,
    centerLat: 35.6812,
    centerLng: 139.7671,
  });
  const [infoExpanded, setInfoExpanded] = useState(true);

  const handleClick = useCallback(
    (lat: number, lng: number) => {
      onMapClick(lat, lng);
    },
    [onMapClick],
  );

  const handleMapStateChange = useCallback((s: MapState) => setMapState(s), []);

  return (
    <>
      <Map
        defaultCenter={{ lat: 35.6812, lng: 139.7671 }}
        defaultZoom={12}
        gestureHandling="greedy"
        clickableIcons={false}
        mapTypeControl={false}
        fullscreenControl={false}
        streetViewControl={false}
        className="w-full h-full"
      >
        <MapClickHandler onMapClick={handleClick} />
        <FlyToHandler flyTo={flyTo ?? null} />
        <MapStateTracker onChange={handleMapStateChange} />
        <GridOverlay
          mode={mode}
          level={level}
          getCellsInBounds={getCellsInBounds}
          onExceeded={setExceeded}
          selectedCode={selectedCode ?? null}
        />
      </Map>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-red-500/70 text-4xl font-light leading-none select-none">
        +
      </div>
      {infoExpanded ? (
        <div className="absolute top-3 max-md:left-3 md:right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md select-none px-3 py-2 md:px-4 md:py-3">
          <div className="flex items-start gap-2">
            <div className="space-y-1 md:space-y-2 text-left">
              <div>
                <span className="text-[9px] md:text-xs font-medium uppercase tracking-wider text-gray-500">
                  Zoom
                </span>
                <p className="font-mono text-xs md:text-sm text-gray-800 tabular-nums">
                  {Math.round(mapState.zoom)}
                </p>
              </div>
              <div>
                <span className="text-[9px] md:text-xs font-medium uppercase tracking-wider text-gray-500">
                  Center
                </span>
                <p className="font-mono text-xs md:text-sm text-gray-800 tabular-nums">
                  {mapState.centerLat.toFixed(6)},{" "}
                  {mapState.centerLng.toFixed(6)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInfoExpanded(false)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setInfoExpanded(true)}
          className="absolute top-3 max-md:left-3 md:right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md cursor-pointer select-none px-3 py-2 md:px-4 md:py-3"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-gray-800 tabular-nums">
              Z{Math.round(mapState.zoom)}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </div>
        </button>
      )}
      {exceeded && (
        <Alert
          variant="warning"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-md shadow-lg pointer-events-none"
        >
          <AlertDescription>
            {`Grid hidden: exceeded ${renderLimit.toLocaleString()} cell limit. Zoom in or lower the grid level.`}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
