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
    'get_store_relationships',
    'Understand how stores relate to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'api',
                            relationship: 'Stores receive data from API responses',
                            direction: 'API → Store',
                            integration: 'TanStack Query onSuccess → store actions'
                        },
                        {
                            server: 'playback-manager',
                            relationship: 'Stores drive playback operations',
                            direction: 'Store → Playback',
                            integration: 'mediaStore status changes trigger playback actions'
                        },
                        {
                            server: 'audio-engine',
                            relationship: 'Audio settings sync with stores',
                            direction: 'Store ↔ Audio',
                            integration: 'audioStore.syncWithMediaStore()'
                        },
                        {
                            server: 'components',
                            relationship: 'Components subscribe to stores for UI',
                            direction: 'Store → Component',
                            integration: 'useStore() hooks in React components'
                        },
                        {
                            server: 'joy-ui',
                            relationship: 'Theme settings stored in settingsStore',
                            direction: 'Store → UI',
                            integration: 'settingsStore.ui drives Joy theme'
                        },
                        {
                            server: 'architecture',
                            relationship: 'Stores are the state layer of architecture',
                            direction: 'Central hub between API and UI',
                            integration: 'All other layers interact via stores'
                        }
                    ],
                    storeToPlaybackFlow: [
                        {
                            store: 'mediaStore',
                            action: 'setCurrentItem()',
                            effect: 'playbackManager loads and plays item',
                            file: 'src/components/playback/playbackmanager.ts'
                        },
                        {
                            store: 'queueStore',
                            action: 'next()',
                            effect: 'Playback advances to next track',
                            file: 'src/store/queueStore.ts'
                        },
                        {
                            store: 'playerStore',
                            action: 'setCurrentPlayer()',
                            effect: 'Playback switches to new player',
                            file: 'src/store/playerStore.ts'
                        }
                    ],
                    storeToComponentBindings: [
                        {
                            store: 'mediaStore',
                            components: ['NowPlayingBar', 'WaveformCell', 'VisualizerControls'],
                            bindings: ['status', 'progress', 'currentItem']
                        },
                        {
                            store: 'queueStore',
                            components: ['QueueTable', 'NowPlayingBar'],
                            bindings: ['items', 'currentIndex', 'shuffleMode']
                        },
                        {
                            store: 'audioStore',
                            components: ['VolumeControl', 'NowPlayingBar'],
                            bindings: ['volume', 'muted']
                        },
                        {
                            store: 'settingsStore',
                            components: ['SettingsForm', 'VisualizerControls'],
                            bindings: ['audio', 'visualizer', 'playback', 'ui']
                        }
                    ],
                    crossStoreSync: [
                        {
                            from: 'mediaStore',
                            to: 'audioStore',
                            pattern: 'syncWithMediaStore',
                            purpose: 'Keep audio settings in sync with playback'
                        },
                        {
                            from: 'mediaStore',
                            to: 'controlsStore',
                            pattern: 'syncWithMediaStore',
                            purpose: 'Update keyboard shortcuts availability'
                        }
                    ]
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

createTool(
    'get_middleware_patterns',
    'Understand Zustand middleware patterns for store enhancements',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    middlewareTypes: [
                        {
                            name: 'subscribeWithSelector',
                            purpose: 'Selective subscriptions to prevent unnecessary re-renders',
                            usage: "store.subscribe(selector, callback, options)",
                            example: "const volume = useStore(s => s.volume, shallow)"
                        },
                        {
                            name: 'persist',
                            purpose: 'Persist state to localStorage/sessionStorage',
                            usage: "persist middleware with storage configuration",
                            options: ['name', 'storage', 'partialize', 'merge']
                        },
                        {
                            name: 'devtools',
                            purpose: 'Redux DevTools integration for debugging',
                            usage: "devtools with name and actionSanitizer"
                        },
                        {
                            name: 'immer',
                            purpose: 'Immutability with mutable-style syntax',
                            usage: "immer middleware allows 'draft' state mutations"
                        }
                    ],
                    customMiddleware: [
                        {
                            name: 'createLogger',
                            purpose: 'Log state changes for debugging',
                            code: `const logger = (config) => (set, get, api) => {
    return config((state) => {
        console.log('Previous state:', get());
        set(state);
        console.log('Next state:', get());
    }, get, api);
};`
                        },
                        {
                            name: 'createThrottle',
                            purpose: 'Throttle rapid state updates',
                            code: `const throttle = (ms) => (config) => (set, get, api) => {
    let timeout;
    return config((state) => {
        if (!timeout) {
            timeout = setTimeout(() => {
                set(state);
                timeout = undefined;
            }, ms);
        }
    }, get, api);
};`
                        }
                    ],
                    jellyfinMiddleware: [
                        {
                            name: 'createStoreMonitor',
                            file: 'src/utils/performanceBaseline.ts',
                            purpose: 'Track store operation performance',
                            usage: "Wraps store to measure action execution time"
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_store_testing_patterns',
    'Understand testing patterns for Zustand stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    testingLibraries: [
                        {
                            name: 'vitest',
                            purpose: 'Test runner and assertion library',
                            usage: 'Unit tests, integration tests'
                        },
                        {
                            name: '@testing-library/react',
                            purpose: 'React component testing',
                            usage: 'Component + store integration tests'
                        },
                        {
                            name: 'happy-dom',
                            purpose: 'Lightweight DOM implementation',
                            usage: 'JSDOM alternative for faster tests'
                        }
                    ],
                    storeTestingPatterns: [
                        {
                            name: 'Create isolated store for testing',
                            code: `import { create } from 'zustand';
import { createMockLogger } from 'utils/testing';

const createTestStore = (initialState = {}) => {
    return create((set, get) => ({
        ...initialState,
        increment: () => set(state => ({ count: state.count + 1 })),
        decrement: () => set(state => ({ count: state.count - 1 })),
        reset: () => set({ count: 0 }),
    }), { name: 'test-store' });
};`
                        },
                        {
                            name: 'Test actions and state changes',
                            code: `import { describe, it, expect, beforeEach } from 'vitest';

describe('counterStore', () => {
    let store;
    
    beforeEach(() => {
        store = createTestStore({ count: 0 });
    });
    
    it('should increment count', () => {
        store.getState().increment();
        expect(store.getState().count).toBe(1);
    });
    
    it('should decrement count', () => {
        store.getState().decrement();
        expect(store.getState().count).toBe(-1);
    });
    
    it('should reset to zero', () => {
        store.setState({ count: 100 });
        store.getState().reset();
        expect(store.getState().count).toBe(0);
    });
});`
                        },
                        {
                            name: 'Test async actions',
                            code: `const useAsyncStore = create((set) => ({
    data: null,
    loading: false,
    error: null,
    fetchData: async (id) => {
        set({ loading: true, error: null });
        try {
            const data = await fetchApi(id);
            set({ data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));

it('should handle async fetch', async () => {
    const store = createTestStore();
    await store.getState().fetchData('123');
    expect(store.getState().loading).toBe(false);
    expect(store.getState().data).toEqual({ id: '123' });
});`
                        }
                    ],
                    componentIntegrationTesting: [
                        {
                            name: 'Render with store provider',
                            code: `import { render, screen, fireEvent } from '@testing-library/react';
import { useCounterStore } from './counterStore';

function TestComponent() {
    const { count, increment } = useCounterStore();
    return (
        <button onClick={increment}>{count}</button>
    );
}

it('should display and update count', () => {
    render(<TestComponent />);
    expect(screen.getByText('0')).toBeInTheDocument();
    fireEvent.click(screen.getByText('0'));
    expect(screen.getByText('1')).toBeInTheDocument();
});`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_reactive_patterns',
    'Understand reactive programming patterns with stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    derivedState: [
                        {
                            name: 'Selector-derived state',
                            pattern: 'Compute from store state',
                            code: `const isPlaying = useStore(state => state.status === 'playing');
const progress = useStore(state => state.progress.percent);
const hasQueue = useStore(state => state.items.length > 0);`
                        },
                        {
                            name: 'Memoized selectors',
                            pattern: 'Use createSelector for expensive computations',
                            code: `import { createSelector } from 'zustand';

const getFilteredItems = createSelector(
    (state) => state.items,
    (state) => state.filter,
    (items, filter) => items.filter(item => item.name.includes(filter))
);`
                        }
                    ],
                    subscriptions: [
                        {
                            name: 'useStore with selector',
                            pattern: 'React hook for reactive updates',
                            code: `const volume = useAudioStore(state => state.volume);
const isMuted = useAudioStore(state => state.muted);
// Re-renders only when these specific values change`
                        },
                        {
                            name: 'subscribe method',
                            pattern: 'Non-hook subscription for side effects',
                            code: `useAudioStore.subscribe(
    state => state.volume,
    (volume) => {
        console.log('Volume changed to:', volume);
        saveToPreferences({ volume });
    }
);`
                        },
                        {
                            name: 'batch updates',
                            pattern: 'Group multiple updates to prevent intermediate renders',
                            code: `import { batch } from 'zustand';

batch(() => {
    setVolume(50);
    setMuted(false);
    setPlaybackRate(1.5);
});`
                        }
                    ],
                    storeSelectors: [
                        {
                            name: 'mediaStore selectors',
                            selectors: [
                                'isPlaying: state.status === playing',
                                'currentItem: state.currentItem',
                                'progress: state.progress',
                                'hasError: state.lastError !== null'
                            ]
                        },
                        {
                            name: 'queueStore selectors',
                            selectors: [
                                'queueLength: state.items.length',
                                'currentTrack: state.items[state.currentIndex]',
                                'nextTrack: state.items[state.currentIndex + 1]',
                                'isShuffled: state.shuffleMode === Shuffled'
                            ]
                        },
                        {
                            name: 'playerStore selectors',
                            selectors: [
                                'currentPlayer: state.currentPlayer',
                                'canCast: availablePlayers.includes(CastPlayer)',
                                'isTransferring: state.isTransferring'
                            ]
                        }
                    ]
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
