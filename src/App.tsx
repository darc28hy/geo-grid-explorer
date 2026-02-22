import { useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Menu } from "lucide-react";
import { MapView } from "@/components/MapView";
import { ControlPanel } from "@/components/ControlPanel";
import { useGridSystem } from "@/hooks/useGridSystem";
import { getAdapter } from "@/lib/grid-registry";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
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
    minLevel,
    maxLevel,
    renderLimit,
    codePlaceholder,
    adapterName,
    neighborCodes,
  } = useGridSystem();

  const adapter = getAdapter(mode);

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="flex w-full h-full">
        <div className="flex-1 relative min-h-0">
          <MapView
            mode={mode}
            level={level}
            onMapClick={encodeFromClick}
            flyTo={flyTo}
            selectedCode={
              allLevelCells.find((c) => c.level === level)?.code ?? null
            }
            getCellsInBounds={adapter.getCellsInBounds.bind(adapter)}
            renderLimit={renderLimit}
          />
          {/* Mobile toggle button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-3 right-3 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[420px]
            transition-transform duration-300 ease-in-out
            md:static md:w-[420px] md:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <ControlPanel
            mode={mode}
            onModeChange={setMode}
            level={level}
            minLevel={minLevel}
            maxLevel={maxLevel}
            onLevelChange={setLevel}
            onCodeSubmit={decodeFromInput}
            onLatLngSubmit={searchByLatLng}
            onLevelSelect={selectLevel}
            allLevelCells={allLevelCells}
            clickedLat={clickedLat}
            clickedLng={clickedLng}
            error={error}
            codePlaceholder={codePlaceholder}
            adapterName={adapterName}
            neighborCodes={neighborCodes}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>
    </APIProvider>
  );
}

export default App;
