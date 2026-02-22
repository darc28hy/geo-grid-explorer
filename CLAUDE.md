# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev        # Vite dev server on port 3000 (host: 0.0.0.0)
bun run build      # tsc -b && vite build
bun run lint       # ESLint
bun test           # Vitest (all tests, accepts file path/pattern args)
bun run preview    # Vite preview server on port 4173
bun install        # Install dependencies (uses bun.lock)
```

## Architecture

GeoHex Viewer is a React SPA that visualizes hexagonal grids (GeoHex v3) on Google Maps.

### Component Hierarchy

```
App.tsx — Layout (responsive sidebar + map)
├── ControlPanel.tsx — Right panel: level slider, code/coord search, cell list with copy
└── MapView.tsx — Google Maps wrapper (@vis.gl/react-google-maps)
    ├── Internal sub-components: MapClickHandler, FlyToHandler, MapStateTracker
    └── HexOverlay.tsx — deck.gl PolygonLayer + TextLayer for hex rendering
```

### Core Logic

- **`src/lib/geohex.ts`** — Full GeoHex v3 TypeScript implementation. Key functions: `encode()`, `decode()`, `encodeAllLevels()`, `getHexCoords()`, `getHexesInBounds()`. Uses Web Mercator internally with base-9/base-52 encoding. Render limit: 50,000 hexes.
- **`src/hooks/useGeoHex.ts`** — Central state hook managing selected point, grid level, map state, and all derived hex computations.
- **`src/lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).

### UI Stack

- **Tailwind CSS v4** (`@import "tailwindcss"` in index.css, with `@theme inline` for OKLCH custom colors)
- **shadcn/ui-style components** in `src/components/ui/` (Radix primitives)
- **Lucide React** for all icons
- **deck.gl + @deck.gl/google-maps** for high-performance hex overlay

### Key Technical Details

- Path alias: `@/*` maps to `src/*` (configured in tsconfig and vite/vitest configs)
- Google Maps API key via `VITE_GOOGLE_MAPS_API_KEY` env var (see `.env.example`)
- Responsive breakpoint at `md` (768px): mobile uses slide-out drawer, desktop uses fixed sidebar
- **Do not add `* { margin: 0; padding: 0; }` resets** — Tailwind v4 Preflight handles this, and a manual reset will break all Tailwind spacing utilities
