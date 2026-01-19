# Jellyfin Web MCP Servers

Custom MCP servers for debugging and development assistance.

## Custom Servers

| Server | Purpose | Tools |
|--------|---------|-------|
| `jellyfin-api` | Jellyfin API client, @jellyfin/sdk, Web Audio, WebSocket | 7 + docs |
| `jellyfin-audio-engine` | Audio pipeline, crossfade, SyncManager, visualizer | 7 + docs |
| `jellyfin-store-architecture` | Zustand stores, state shapes, patterns | 5 + docs |
| `jellyfin-playback-manager` | Playback pipeline, player selection, transcode policy | 6 + docs |
| `jellyfin-performance` | Performance monitoring, thresholds, baselines | 5 + docs |
| `jellyfin-components` | Component architecture, NowPlayingBar, Sit Back Mode | 6 + docs |
| `jellyfin-migrations` | Git-based rollback system | 4 + docs |

## Usage

MCP servers are configured in `.mcp.json` and automatically loaded by your MCP client.

## Adding a New MCP Server

1. Create directory: `src/mcp-servers/<name>/`
2. Add `package.json`, `tsconfig.json`, `index.ts`
3. Register in `.mcp.json`

## External MCP Servers

The following external MCP servers are also configured:
- `mcp-three` - Three.js/React Three Fiber
- `mui-mcp` - Material UI
- `typescript-mcp` - TypeScript diagnostics
- `context7` - Documentation fetching
- `filesystem` - File operations
- `vite-plugin-mcp` - Vite integration
