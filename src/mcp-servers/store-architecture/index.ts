import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-store-architecture',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_store_overview',
    'Get overview of all Zustand stores and their purposes',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    stores: [
                        {
                            name: 'mediaStore',
                            purpose: 'Core playback state - current item, playback status, progress, track info',
                            file: 'src/store/mediaStore.ts',
                            actions: ['play', 'pause', 'stop', 'seek', 'setPlaybackRate', 'nextItem', 'prevItem'],
                            state: ['status', 'currentItem', 'progress', 'streamInfo', 'trackInfo', 'playbackRate']
                        },
                        {
                            name: 'queueStore',
                            purpose: 'Queue management - items, navigation, shuffle/repeat modes, history',
                            file: 'src/store/queueStore.ts',
                            actions: ['setQueue', 'addToQueue', 'removeFromQueue', 'next', 'prev', 'shuffle', 'moveItem'],
                            state: ['items', 'currentIndex', 'shuffleMode', 'repeatMode', 'queueHistory']
                        },
                        {
                            name: 'playerStore',
                            purpose: 'Player management - current player, available players, transfers, capabilities',
                            file: 'src/store/playerStore.ts',
                            actions: ['setCurrentPlayer', 'initiateTransfer', 'selectPlayer', 'canPlayMediaType'],
                            state: ['currentPlayer', 'availablePlayers', 'pendingTransfer', 'activePlayers']
                        },
                        {
                            name: 'audioStore',
                            purpose: 'Audio engine state - volume, mute, makeup gain (legacy, use mediaStore)',
                            file: 'src/store/audioStore.ts',
                            actions: ['setVolume', 'setMuted', 'setMakeupGain'],
                            state: ['volume', 'muted', 'makeupGain', 'isReady', 'isPlaying', 'currentTrack']
                        },
                        {
                            name: 'settingsStore',
                            purpose: 'User settings with persistence - audio, visualizer, playback, UI settings',
                            file: 'src/store/settingsStore.ts',
                            actions: ['setVolume', 'setVisualizerEnabled', 'setButterchurnPreset', 'setCrossfadeDuration'],
                            state: ['audio', 'visualizer', 'playback', 'ui']
                        },
                        {
                            name: 'controlsStore',
                            purpose: 'Playback controls state and shortcuts',
                            file: 'src/store/controlsStore.ts',
                            actions: [],
                            state: []
                        }
                    ],
                    patterns: {
                        middleware: 'subscribeWithSelector for selective subscriptions',
                        persistence: 'persist middleware with createJSONStorage for settings',
                        storeIntegration: 'syncWithMediaStore pattern to sync between stores'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_state_shapes',
    'Get TypeScript interfaces and state shapes for all stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    mediaStore: {
                        status: "'idle' | 'loading' | 'playing' | 'paused' | 'stopped'",
                        currentItem: 'PlayableItem | null',
                        progress: '{ currentTime: number; duration: number; percent: number; buffered: number }',
                        streamInfo: 'StreamInfo | null',
                        trackInfo: 'TrackInfo | null',
                        playbackRate: 'number',
                        lastError: '{ message: string; timestamp: number } | null'
                    },
                    queueStore: {
                        items: 'QueueItem[]',
                        currentIndex: 'number',
                        shuffleMode: "'Sorted' | 'Shuffled'",
                        repeatMode: "'None' | 'One' | 'All'",
                        isShuffled: 'boolean',
                        lastPlayedItemId: 'string | null',
                        queueHistory: 'string[]'
                    },
                    playerStore: {
                        currentPlayer: 'PlayerInfo | null',
                        availablePlayers: 'PlayerInfo[]',
                        pendingTransfer: 'TransferInfo | null',
                        isTransferring: 'boolean',
                        activePlayers: 'Map<string, PlayerInfo>'
                    },
                    audioStore: {
                        volume: 'number (0-100)',
                        muted: 'boolean',
                        makeupGain: 'number (0.5-2.0)',
                        isReady: 'boolean',
                        isPlaying: 'boolean',
                        currentTrack: 'Track | null',
                        currentTime: 'number',
                        duration: 'number'
                    },
                    settingsStore: {
                        audio: '{ volume: number; muted: boolean; makeupGain: number; enableNormalization: boolean }',
                        visualizer: '{ enabled: boolean; type: "waveform" | "frequency" | "butterchurn"; butterchurnPreset: string; colorScheme: string; sensitivity: number }',
                        playback: '{ defaultPlaybackRate: number; autoPlay: boolean; crossfadeDuration: number; gaplessPlayback: boolean }',
                        ui: '{ theme: "dark" | "light" | "system"; compactMode: boolean; animationsEnabled: boolean }'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_store_relationships',
    'Understand how stores interact and depend on each other',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relationships: [
                        {
                            from: 'mediaStore',
                            to: 'audioStore',
                            type: 'sync',
                            pattern: 'syncWithMediaStore action syncs volume, muted, isPlaying, progress'
                        },
                        {
                            from: 'mediaStore',
                            to: 'queueStore',
                            type: 'navigation',
                            pattern: 'nextItem/prevItem calls queueStore for navigation'
                        },
                        {
                            from: 'playerStore',
                            to: 'mediaStore',
                            type: 'playback',
                            pattern: 'Player changes trigger mediaStore status updates'
                        },
                        {
                            from: 'settingsStore',
                            to: 'audioStore',
                            type: 'configuration',
                            pattern: 'Volume settings from settingsStore apply to audioStore'
                        },
                        {
                            from: 'settingsStore',
                            to: 'visualizer',
                            type: 'configuration',
                            pattern: 'Visualizer settings control butterchurn/frequency/waveform display'
                        }
                    ],
                    dataFlow: {
                        'Playback': 'queueStore → mediaStore → playerStore → audio output',
                        'Volume': 'settingsStore → audioStore → audio output',
                        'Settings': 'settingsStore → persists to localStorage → reads on init'
                    },
                    antiPatterns: [
                        'Direct store access across components (should use hooks)',
                        'Mutating store state directly without actions',
                        'Ignoring subscription cleanup in useEffect'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_patterns_and_conventions',
    'Understand design patterns and coding conventions used in stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    patterns: [
                        {
                            name: 'subscribeWithSelector',
                            purpose: 'Selective subscriptions to avoid unnecessary re-renders',
                            example: "useAudioStore(state => state.volume)"
                        },
                        {
                            name: 'syncWithMediaStore',
                            purpose: 'Keep secondary stores in sync with primary media state',
                            location: 'audioStore.ts, controlsStore.ts'
                        },
                        {
                            name: 'createStoreMonitor',
                            purpose: 'Performance tracking wrapper for store operations',
                            location: 'utils/performanceBaseline.ts'
                        },
                        {
                            name: 'Omit/Extend patterns',
                            purpose: 'Extending base interfaces for store-specific state',
                            example: "QueueStoreState extends Omit<QueueState, 'shuffleMode'>"
                        }
                    ],
                    conventions: [
                        'State interfaces end with "State" (MediaState, QueueStoreState)',
                        'Action interfaces end with "Actions" (MediaActions, QueueStoreActions)',
                        'Zustand create with generic type: create<State>()(...)',
                        'Initial state in separate constant for testing',
                        'All actions are synchronous except where async is required'
                    ],
                    testing: [
                        'createMockLogger for isolated testing',
                        'createStoreMonitor for performance verification',
                        'Initial state factories for predictable tests'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_types_reference',
    'Get reference for shared types used across stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    PlayableItem: {
                        description: 'Unified item that can be played (audio, video, etc.)',
                        fields: ['id', 'name', 'type', 'url', 'metadata?']
                    },
                    QueueItem: {
                        description: 'Wrapped PlayableItem with queue metadata',
                        fields: ['id', 'item: PlayableItem', 'index', 'addedAt']
                    },
                    StreamInfo: {
                        description: 'Streaming configuration and quality info',
                        fields: ['url', 'codec', 'bitrate', 'container', 'transcodeDecision']
                    },
                    PlaybackProgress: {
                        description: 'Current playback position and status',
                        fields: ['currentTime', 'duration', 'percent', 'buffered']
                    },
                    PlayerInfo: {
                        description: 'Player capability and state',
                        fields: ['id', 'name', 'isLocalPlayer', 'supportedCommands', 'canPlayMediaTypes']
                    },
                    RepeatMode: "'None' | 'One' | 'All'",
                    ShuffleMode: "'Sorted' | 'Shuffled'"
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'store-architecture-docs',
    'jellyfin://stores/architecture',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://stores/architecture',
                mimeType: 'text/markdown',
                text: `# Jellyfin Store Architecture

## Overview
Jellyfin uses Zustand for state management with 6 main stores organized by domain.

## Store Diagram
\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   queueStore    │────▶│   mediaStore    │────▶│   playerStore   │
│  Queue Items    │     │  Playback Core  │     │  Player Mgmt    │
│  Navigation     │     │  Progress       │     │  Transfers      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐     ┌─────────────────┐
                       │   audioStore    │     │  settingsStore  │
                       │  Volume/Mute    │     │  User Settings  │
                       └─────────────────┘     └─────────────────┘
\`\`\`

## Key Patterns

### 1. Selective Subscriptions
\`\`\`typescript
// Good - subscribes only to volume changes
const volume = useAudioStore(state => state.volume);

// Bad - re-renders on ANY state change
const all = useAudioStore(state => state);
\`\`\`

### 2. Store Sync Pattern
\`\`\`typescript
// Secondary store syncs with primary
syncWithMediaStore: (mediaState) => {
    set({
        volume: mediaState.volume,
        isPlaying: mediaState.isPlaying
    });
}
\`\`\`

### 3. Performance Monitoring
\`\`\`typescript
const monitor = createStoreMonitor('mediaStore');
const stop = monitor.start('play');
// ... perform action
stop();
\`\`\`

## State Shape Guidelines

- **State interfaces**: Suffix with "State"
- **Action interfaces**: Suffix with "Actions"  
- **Initial state**: Separate constant for testability
- **Type exports**: All types in store/types/

## Files
- \`src/store/index.ts\` - Store exports
- \`src/store/*.ts\` - Individual stores
- \`src/store/types/*.ts\` - Shared types
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
