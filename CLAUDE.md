# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev        # Vite dev server on port 4173 (host: 0.0.0.0)
bun run build      # tsc -b && vite build
bun run preview    # Vite preview server on port 4173
bun run test       # Vitest (all tests, accepts file path/pattern args)
bun run lint       # oxlint
bun run fmt        # oxfmt (formatter)
bun install        # Install dependencies (uses bun.lock)
```

## Architecture

Geo Grid Explorer is a React SPA that visualizes geographic grid systems (GeoHex v3, GeoHash) on Google Maps.

### Component Hierarchy

```
App.tsx — Layout (responsive sidebar + map)
├── ControlPanel.tsx — Right panel: mode switch, level slider, code/coord search, cell list with copy
└── MapView.tsx — Google Maps wrapper (@vis.gl/react-google-maps)
    ├── Internal sub-components: MapClickHandler, FlyToHandler, MapStateTracker
    └── GridOverlay.tsx — deck.gl PolygonLayer + TextLayer for grid rendering
```

### Core Logic

- **`src/lib/grid-types.ts`** — Common types and `GridAdapter` interface for pluggable grid systems.
- **`src/lib/geohex.ts`** — Full GeoHex v3 TypeScript implementation. Render limit: 50,000 hexes.
- **`src/lib/geohash.ts`** — GeoHash implementation (base-32 encoding). Render limit: 50,000 cells.
- **`src/lib/geohex-adapter.ts`** / **`src/lib/geohash-adapter.ts`** — GridAdapter wrappers.
- **`src/lib/grid-registry.ts`** — `getAdapter(mode)` helper to retrieve adapters by GridMode.
- **`src/hooks/useGridSystem.ts`** — Central state hook managing mode, per-mode grid levels, selected point, and all derived computations.
- **`src/lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge).

### UI Stack

- **Tailwind CSS v4** (`@import "tailwindcss"` in index.css, with `@theme inline` for OKLCH custom colors)
- **shadcn/ui-style components** in `src/components/ui/` (Radix primitives)
- **Lucide React** for all icons
- **deck.gl + @deck.gl/google-maps** for high-performance grid overlay

### Key Technical Details

- Path alias: `@/*` maps to `src/*` (configured in tsconfig and vite/vitest configs)
- Google Maps API key via `VITE_GOOGLE_MAPS_API_KEY` env var (see `.env.example`)
- Responsive breakpoint at `md` (768px): mobile uses slide-out drawer, desktop uses fixed sidebar
- **Do not add `* { margin: 0; padding: 0; }` resets** — Tailwind v4 Preflight handles this, and a manual reset will break all Tailwind spacing utilities
