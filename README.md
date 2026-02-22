# Geo Grid Explorer

A web application for exploring geographic grid systems (GeoHex v3, GeoHash) on Google Maps.

## Setup

```bash
cp .env.example .env
# Set your Google Maps API key in .env
bun install
bun run dev
```

### Environment Variables

| Variable                   | Purpose             | File   |
| -------------------------- | ------------------- | ------ |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | `.env` |

`.env` is included in `.gitignore`, so each developer must configure it locally.

### Claude Code Preview

To use Claude Code's preview feature (`preview_start`), additional configuration in `.claude/launch.json` is required.

```bash
cp .claude/launch.example.json .claude/launch.json
# Set VITE_GOOGLE_MAPS_API_KEY in launch.json to the same value as `.env`
```

`.claude/launch.json` is also excluded via `.gitignore` since it contains the API key.

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `bun run dev`        | Start dev server (port 4173)        |
| `bun run build`      | TypeScript check + production build |
| `bun run preview`    | Preview build output (port 4173)    |
| `bun run test`       | Run tests                           |
| `bun run test:watch` | Run tests (watch mode)              |
| `bun run lint`       | Lint with oxlint                    |
| `bun run lint:fix`   | Lint with auto-fix                  |
| `bun run fmt`        | Format with oxfmt                   |
| `bun run fmt:check`  | Check formatting only               |
| `bun run fix`        | lint:fix + fmt                      |

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Maps (`@vis.gl/react-google-maps`)
- deck.gl (grid rendering)
- Tailwind CSS v4 + shadcn/ui + Lucide React
- Vitest
