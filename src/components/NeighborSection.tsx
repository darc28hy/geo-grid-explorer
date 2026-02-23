import { useState, useCallback } from "react";
import {
  Check,
  ClipboardCopy,
  ChevronDown,
  ChevronRight,
  Copy,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { GridMode } from "@/lib/grid-types";

const NEIGHBOR_DIRECTIONS: Record<GridMode, string[]> = {
  geohex: ["N", "NE", "SE", "S", "SW", "NW"],
  geohash: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};

export function NeighborSection({
  mode,
  neighborCodes,
}: {
  mode: GridMode;
  neighborCodes: string[];
}) {
  const [showNeighbors, setShowNeighbors] = useState(true);
  const [copiedNeighbor, setCopiedNeighbor] = useState<number | null>(null);

  const handleCopyNeighbor = useCallback((code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedNeighbor(index);
    setTimeout(() => setCopiedNeighbor(null), 1500);
  }, []);

  const handleCopyAll = useCallback(() => {
    navigator.clipboard.writeText(neighborCodes.join("\n"));
    setCopiedNeighbor(-1);
    setTimeout(() => setCopiedNeighbor(null), 1500);
  }, [neighborCodes]);

  return (
    <>
      <Separator />
      <div>
        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNeighbors(!showNeighbors)}
            className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
          >
            {showNeighbors ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer">
              Neighbors ({neighborCodes.length})
            </Label>
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            {copiedNeighbor === -1 ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Copy All
          </button>
        </div>
        {showNeighbors && (
          <div className="mt-2 space-y-0.5">
            {neighborCodes.map((code, i) => {
              const dir = NEIGHBOR_DIRECTIONS[mode][i];
              return (
                <div
                  key={code}
                  className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-muted/60 transition-colors group/row"
                >
                  <Badge
                    variant="outline"
                    className="w-7 h-5 text-[10px] font-medium shrink-0 justify-center"
                  >
                    {dir}
                  </Badge>
                  <span className="font-mono text-sm text-muted-foreground truncate flex-1 min-w-0">
                    {code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyNeighbor(code, i)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md cursor-pointer opacity-0 group-hover/row:opacity-100 hover:bg-black/10 transition-all"
                  >
                    {copiedNeighbor === i ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <ClipboardCopy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
