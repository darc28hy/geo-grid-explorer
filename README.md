# GeoHex Viewer

GeoHex v3の六角形グリッドをGoogle Maps上で可視化するWebアプリケーション。

## Setup

```bash
cp .env.example .env
# .envにGoogle Maps APIキーを設定
bun install
bun run dev
```

### 環境変数

| 変数名                       | 用途                  | 設定ファイル             |
| ---------------------------- | --------------------- | ------------------------ |
| `VITE_GOOGLE_MAPS_API_KEY`   | Google Maps APIキー   | `.env`                   |

`.env`は`.gitignore`に含まれるため、各開発者がローカルで設定する。

### Claude Codeプレビュー

Claude Codeのプレビュー機能(`preview_start`)を使用する場合、別途`.claude/launch.json`の設定が必要。

```bash
cp .claude/launch.example.json .claude/launch.json
# launch.json内のVITE_GOOGLE_MAPS_API_KEYを.envと同じ値に設定
```

`.claude/launch.json`もAPIキーを含むため`.gitignore`で除外されている。

## Scripts

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `bun run dev`        | 開発サーバー起動 (port 4173)              |
| `bun run build`      | TypeScriptチェック + プロダクションビルド |
| `bun run preview`    | ビルド成果物のプレビュー (port 4173)      |
| `bun run test`       | テスト実行                                |
| `bun run test:watch` | テスト (watch mode)                       |
| `bun run lint`       | oxlint                                    |
| `bun run lint:fix`   | oxlint (自動修正)                         |
| `bun run fmt`        | oxfmt (formatter)                         |
| `bun run fmt:check`  | oxfmt (チェックのみ)                      |
| `bun run fix`        | lint:fix + fmt                             |

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Maps (`@vis.gl/react-google-maps`)
- deck.gl (六角形グリッド描画)
- Tailwind CSS v4 + shadcn/ui + Lucide React
- Vitest
