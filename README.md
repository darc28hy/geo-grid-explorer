# GeoHex Viewer

GeoHex v3の六角形グリッドをGoogle Maps上で可視化するWebアプリケーション。

## Setup

```bash
cp .env.example .env
# .envにGoogle Maps APIキーを設定
bun install
bun run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | 開発サーバー起動 (port 3000) |
| `bun run build` | TypeScriptチェック + プロダクションビルド |
| `bun run preview` | ビルド成果物のプレビュー (port 4173) |
| `bun test` | テスト実行 |
| `bun run test:watch` | テスト (watch mode) |
| `bun run lint` | ESLint |

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Maps (`@vis.gl/react-google-maps`)
- deck.gl (六角形グリッド描画)
- Tailwind CSS v4 + shadcn/ui + Lucide React
- Vitest
