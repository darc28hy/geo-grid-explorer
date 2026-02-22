import {
  useState,
  useCallback,
  type SyntheticEvent,
  type MouseEvent,
} from "react";
import {
  Hexagon,
  Grid3x3,
  X,
  Minus,
  Plus,
  Check,
  EllipsisVertical,
  ClipboardCopy,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { GridMode, GridCell } from "@/lib/grid-types";

interface ControlPanelProps {
  mode: GridMode;
  onModeChange: (mode: GridMode) => void;
  level: number;
  minLevel: number;
  maxLevel: number;
  onLevelChange: (level: number) => void;
  onCodeSubmit: (code: string) => boolean;
  onLatLngSubmit: (lat: number, lng: number) => void;
  onLevelSelect: (level: number) => void;
  allLevelCells: GridCell[];
  clickedLat: number | null;
  clickedLng: number | null;
  error: string | null;
  codePlaceholder: string;
  adapterName: string;
  onClose?: () => void;
}

const MODE_META: Record<GridMode, { subtitle: string; icon: typeof Hexagon }> =
  {
    geohex: { subtitle: "v3 Hexagonal Grid Explorer", icon: Hexagon },
    geohash: { subtitle: "Base-32 Rectangular Grid Explorer", icon: Grid3x3 },
  };

export function ControlPanel({
  mode,
  onModeChange,
  level,
  minLevel,
  maxLevel,
  onLevelChange,
  onCodeSubmit,
  onLatLngSubmit,
  onLevelSelect,
  allLevelCells,
  clickedLat,
  clickedLng,
  error,
  codePlaceholder,
  adapterName,
  onClose,
}: ControlPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [latLngError, setLatLngError] = useState<string | null>(null);
  const [searchTab, setSearchTab] = useState<"code" | "latlng">("code");
  const [copiedLevel, setCopiedLevel] = useState<number | null>(null);

  const handleCopy = useCallback(
    (code: string, cellLevel: number, e: MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(code);
      setCopiedLevel(cellLevel);
      setTimeout(() => setCopiedLevel(null), 1500);
    },
    [],
  );

  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCodeSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setCodeError("コードを入力してください");
      return;
    }
    setCodeError(null);
    onCodeSubmit(inputValue.trim());
  };

  const handleLatLngSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      setLatLngError("数値を入力してください");
      return;
    }
    if (lat < -90 || lat > 90) {
      setLatLngError("緯度は -90 ~ 90 の範囲で入力してください");
      return;
    }
    if (lng < -180 || lng > 180) {
      setLatLngError("経度は -180 ~ 180 の範囲で入力してください");
      return;
    }
    setLatLngError(null);
    onLatLngSubmit(lat, lng);
  };

  const meta = MODE_META[mode];
  const Icon = meta.icon;

  return (
    <div className="w-full h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">
              {adapterName} Explorer
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meta.subtitle}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Mode switch */}
        <div className="flex gap-1 rounded-md bg-muted p-0.5 mt-3">
          <button
            type="button"
            onClick={() => onModeChange("geohex")}
            className={`flex-1 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              mode === "geohex"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            GeoHex
          </button>
          <button
            type="button"
            onClick={() => onModeChange("geohash")}
            className={`flex-1 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              mode === "geohash"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            GeoHash
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-4">
          {/* Grid Level */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Grid Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onLevelChange(Math.max(minLevel, level - 1))}
                  disabled={level <= minLevel}
                  className="shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[level]}
                    onValueChange={(v) => onLevelChange(v[0])}
                    min={minLevel}
                    max={maxLevel}
                    step={1}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onLevelChange(Math.min(maxLevel, level + 1))}
                  disabled={level >= maxLevel}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="font-mono text-lg font-bold tabular-nums text-primary w-7 text-right shrink-0">
                  {level}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-1 rounded-md bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => setSearchTab("code")}
                  className={`flex-1 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    searchTab === "code"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setSearchTab("latlng")}
                  className={`flex-1 text-xs font-medium px-3 py-1.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    searchTab === "latlng"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Lat/Lng
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {searchTab === "code" ? (
                <>
                  <form onSubmit={handleCodeSubmit} className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={codePlaceholder}
                      className="font-mono text-sm flex-1 min-w-0"
                    />
                    <Button type="submit" className="gap-1">
                      Go
                      <kbd className="text-[10px] opacity-50 font-sans">↵</kbd>
                    </Button>
                  </form>
                  {(codeError || error) && (
                    <p className="text-xs text-destructive mt-2.5">
                      {codeError || error}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <form
                    onSubmit={handleLatLngSubmit}
                    className="flex gap-2 items-end"
                  >
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground">
                        Lat
                      </Label>
                      <Input
                        inputMode="decimal"
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        placeholder="35.6812"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-[10px] text-muted-foreground">
                        Lng
                      </Label>
                      <Input
                        inputMode="decimal"
                        value={lngInput}
                        onChange={(e) => setLngInput(e.target.value)}
                        placeholder="139.7671"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <Button type="submit" className="gap-1">
                      Go
                      <kbd className="text-[10px] opacity-50 font-sans">↵</kbd>
                    </Button>
                  </form>
                  {latLngError && (
                    <p className="text-xs text-destructive mt-2.5">
                      {latLngError}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Selected Point & All Levels */}
        {allLevelCells.length > 0 ? (
          <div className="p-5 space-y-3">
            {clickedLat !== null && clickedLng !== null && (
              <div>
                <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Selected Point
                </Label>
                <p className="font-mono text-xs text-foreground/80 tabular-nums mt-1">
                  {clickedLat.toFixed(6)}, {clickedLng.toFixed(6)}
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              {allLevelCells.map((cell) => {
                const isActive = cell.level === level;
                return (
                  <div
                    key={cell.level}
                    onClick={() => onLevelSelect(cell.level)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-left
                      transition-colors duration-75 cursor-pointer
                      ${isActive ? "bg-primary/8 ring-1 ring-primary/15" : "hover:bg-muted/60"}
                    `}
                  >
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="w-7 h-5 text-[10px] font-semibold shrink-0"
                    >
                      {cell.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`
                          font-mono text-sm truncate block
                          ${isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}
                        `}
                      >
                        {cell.code}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                        {cell.lat.toFixed(6)}, {cell.lon.toFixed(6)}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md cursor-pointer hover:bg-black/10 transition-colors group/menu focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {copiedLevel === cell.level ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <EllipsisVertical className="w-4 h-4 text-muted-foreground group-hover/menu:text-foreground transition-colors" />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom">
                        <DropdownMenuItem
                          onClick={(e) => handleCopy(cell.code, cell.level, e)}
                        >
                          <ClipboardCopy className="w-4 h-4" />
                          Copy Code
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3">
                <MapPin
                  className="w-5 h-5 text-muted-foreground/60"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground">Click on the map</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                to explore {adapterName} codes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
