import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-architecture',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    server.tool(name, description, schema, handler);
}

createTool(
    'get_architecture_overview',
    'Get overview of Jellyfin architecture and how all layers connect',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    architectureLayers: [
                        {
                            layer: 'API Layer',
                            servers: ['api'],
                            responsibilities: ['HTTP requests', 'Authentication', 'WebSocket', 'Data fetching'],
                            files: ['src/apiclient.d.ts', 'src/lib/jellyfin-apiclient/', 'src/utils/jellyfin-apiclient/']
                        },
                        {
                            layer: 'State Layer',
                            servers: ['store-architecture'],
                            responsibilities: ['Playback state', 'Queue management', 'Settings', 'Player selection'],
                            files: ['src/store/*.ts']
                        },
                        {
                            layer: 'Playback Layer',
                            servers: ['playback-manager'],
                            responsibilities: ['Playback control', 'Player selection', 'Transcode decisions', 'Progress tracking'],
                            files: ['src/components/playback/', 'src/store/playerStore.ts', 'src/store/mediaStore.ts']
                        },
                        {
                            layer: 'Audio Layer',
                            servers: ['audio-engine'],
                            responsibilities: ['Audio processing', 'Crossfade', 'Equalization', 'Visualization'],
                            files: ['src/components/audioEngine/', 'src/components/visualizer/']
                        },
                        {
                            layer: 'UI Layer',
                            servers: ['components', 'joy-ui'],
                            responsibilities: ['Components', 'Forms', 'Theming', 'Layout'],
                            files: ['src/components/', 'src/themes/', 'src/apps/']
                        },
                        {
                            layer: 'Performance Layer',
                            servers: ['performance'],
                            responsibilities: ['Monitoring', 'Preloading', 'Optimization', 'Caching'],
                            files: ['src/utils/performanceBaseline.ts', 'src/utils/preload/']
                        }
                    ],
                    dataFlow: [
                        {
                            from: 'API Layer',
                            to: 'State Layer',
                            description: 'ApiClient responses update stores',
                            mechanism: 'TanStack Query mutations + store actions'
                        },
                        {
                            from: 'State Layer',
                            to: 'Playback Layer',
                            description: 'Store changes trigger playback operations',
                            mechanism: 'subscribeWithSelector subscriptions'
                        },
                        {
                            from: 'Playback Layer',
                            to: 'Audio Layer',
                            description: 'Playback commands control audio pipeline',
                            mechanism: 'CrossfadeController, SyncManager'
                        },
                        {
                            from: 'State Layer',
                            to: 'UI Layer',
                            description: 'Stores provide data for components',
                            mechanism: 'useStore hooks in React components'
                        },
                        {
                            from: 'Audio Layer',
                            to: 'UI Layer',
                            description: 'Visualizer displays audio data',
                            mechanism: 'AudioContext frequency data'
                        },
                        {
                            from: 'Performance Layer',
                            to: 'All Layers',
                            description: 'Monitoring and optimization across system',
                            mechanism: 'createStoreMonitor, PredictivePreloader'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_store_api_integration',
    'Understand how stores integrate with the Jellyfin API',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    storeApiMappings: [
                        {
                            store: 'mediaStore',
                            apiClient: 'ServerConnections.currentApiClient()',
                            operations: [
                                {
                                    storeAction: 'play()',
                                    apiCall: 'apiClient.getAudioStream()',
                                    file: 'src/apiclient.d.ts'
                                },
                                {
                                    storeAction: 'seek()',
                                    apiCall: 'apiClient.reportPlaybackProgress()',
                                    file: 'src/apiclient.d.ts'
                                },
                                {
                                    storeAction: 'stop()',
                                    apiCall: 'apiClient.reportPlaybackStopped()',
                                    file: 'src/apiclient.d.ts'
                                }
                            ]
                        },
                        {
                            store: 'queueStore',
                            apiClient: 'ServerConnections.currentApiClient()',
                            operations: [
                                {
                                    storeAction: 'setQueue()',
                                    apiCall: 'apiClient.getItems()',
                                    file: 'src/utils/jellyfin-apiclient/getItems.ts'
                                },
                                {
                                    storeAction: 'addToQueue()',
                                    apiCall: 'apiClient.getInstantMixFromItem()',
                                    file: 'src/apiclient.d.ts'
                                }
                            ]
                        },
                        {
                            store: 'settingsStore',
                            apiClient: 'apiClient.getUserSettings()',
                            operations: [
                                {
                                    storeAction: 'setVolume()',
                                    apiCall: 'apiClient.updateUserConfiguration()',
                                    file: 'src/apiclient.d.ts'
                                }
                            ]
                        }
                    ],
                    dataFetching: [
                        {
                            pattern: 'TanStack Query + Store',
                            code: `const { data } = useQuery({
    queryKey: ['items', playlistId],
    queryFn: () => apiClient.getItems(playlistId)
});

// On success, update store
if (data) {
    queueStore.setQueue(mapItemsToQueue(data));
}`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_playback_audio_integration',
    'Understand how playback manager integrates with audio engine',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    integrationPoints: [
                        {
                            from: 'playback-manager',
                            to: 'audio-engine',
                            mechanism: 'CrossfadeController',
                            file: 'src/components/audioEngine/crossfadeController.ts',
                            description: 'Playback triggers crossfade between tracks'
                        },
                        {
                            from: 'playback-manager',
                            to: 'audio-engine',
                            mechanism: 'SyncManager',
                            file: 'src/components/audioEngine/crossfader.logic.ts',
                            description: 'Coordinates multiple MediaElements during transitions'
                        },
                        {
                            from: 'playback-manager',
                            to: 'audio-engine',
                            mechanism: 'audioStore',
                            file: 'src/store/audioStore.ts',
                            description: 'Playback status syncs with audio volume/mute state'
                        },
                        {
                            from: 'audio-engine',
                            to: 'playback-manager',
                            mechanism: 'Events',
                            file: 'src/components/playback/playbackmanager.ts',
                            description: 'Audio errors and track changes notify playback'
                        }
                    ],
                    flowSequence: [
                        {
                            step: 1,
                            action: 'PlaybackManager detects track ending',
                            component: 'playbackmanager.ts'
                        },
                        {
                            step: 2,
                            action: 'Triggers CrossfadeController',
                            component: 'crossfadeController.ts'
                        },
                        {
                            step: 3,
                            action: 'SyncManager preloads next track',
                            component: 'crossfader.logic.ts'
                        },
                        {
                            step: 4,
                            action: 'Gain nodes ramp for crossfade',
                            component: 'crossfader.logic.ts'
                        },
                        {
                            step: 5,
                            action: 'Track switch completes',
                            component: 'playbackmanager.ts'
                        },
                        {
                            step: 6,
                            action: 'mediaStore updates currentItem',
                            component: 'mediaStore.ts'
                        }
                    ],
                    sharedState: [
                        {
                            state: 'crossfadeDuration',
                            source: 'settingsStore',
                            consumers: ['CrossfadeController', 'playbackmanager']
                        },
                        {
                            state: 'volume',
                            source: 'audioStore',
                            consumers: ['MasterMixer', 'NowPlayingBar']
                        },
                        {
                            state: 'currentItem',
                            source: 'mediaStore',
                            consumers: ['visualizer', 'NowPlayingBar', 'WaveformCell']
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_component_store_binding',
    'Understand how UI components bind to stores',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    componentStoreBindings: [
                        {
                            component: 'NowPlayingBar',
                            stores: ['mediaStore', 'audioStore', 'queueStore', 'playerStore'],
                            bindings: [
                                'mediaStore.status → play/pause button state',
                                'mediaStore.progress → progress slider',
                                'audioStore.volume → volume control',
                                'queueStore.currentIndex → queue info'
                            ]
                        },
                        {
                            component: 'QueueTable',
                            stores: ['queueStore', 'mediaStore'],
                            bindings: [
                                'queueStore.items → table data',
                                'queueStore.currentIndex → active row',
                                'mediaStore.progress → waveform progress'
                            ]
                        },
                        {
                            component: 'VisualizerControls',
                            stores: ['settingsStore'],
                            bindings: [
                                'settingsStore.visualizer.type → active visualizer',
                                'settingsStore.visualizer.butterchurnPreset → preset'
                            ]
                        },
                        {
                            component: 'SettingsForm',
                            stores: ['settingsStore'],
                            bindings: [
                                'settingsStore.audio → audio settings',
                                'settingsStore.playback → playback settings',
                                'settingsStore.visualizer → visualizer settings'
                            ]
                        }
                    ],
                    bindingPatterns: [
                        {
                            pattern: 'Direct store hook',
                            code: `const volume = useAudioStore(state => state.volume);
const isMuted = useAudioStore(state => state.muted);
return <VolumeControl volume={volume} muted={isMuted} />;`
                        },
                        {
                            pattern: 'Combined selector',
                            code: `const { volume, muted, isPlaying } = useStore(state => ({
    volume: state.volume,
    muted: state.muted,
    isPlaying: state.status === 'playing'
}));`
                        },
                        {
                            pattern: 'Event subscription',
                            code: `useEffect(() => {
    const handler = () => setPlaying(false);
    Events.on(playbackManager, 'playbackend', handler);
    return () => Events.off(playbackManager, 'playbackend', handler);
}, []);`
                        }
                    ],
                    performanceGuidelines: [
                        'Subscribe to specific values, not entire store',
                        'Use subscribeWithSelector middleware',
                        'Memoize selectors for expensive computations',
                        'Batch updates during transitions'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_integration',
    'Understand how Joy UI integrates with other architectural layers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    uiLayerIntegration: [
                        {
                            layer: 'State Layer',
                            direction: 'State → UI',
                            pattern: 'Components read from stores via useStore hooks',
                            example: 'useSettingsStore(state => state.audio.volume)'
                        },
                        {
                            layer: 'Playback Layer',
                            direction: 'UI → Playback',
                            pattern: 'Components trigger playback actions',
                            example: 'PlayButton onClick → playbackManager.play()'
                        },
                        {
                            layer: 'Audio Layer',
                            direction: 'UI → Audio',
                            pattern: 'Components control audio settings',
                            example: 'VolumeSlider → audioStore.setVolume()'
                        },
                        {
                            layer: 'API Layer',
                            direction: 'UI ↔ API',
                            pattern: 'Forms submit to API via TanStack Query',
                            example: 'SettingsForm → apiClient.updateUserConfiguration()'
                        },
                        {
                            layer: 'Performance Layer',
                            direction: 'Performance → UI',
                            pattern: 'Performance monitoring affects component rendering',
                            example: 'Virtualization for large lists'
                        }
                    ],
                    themeIntegration: [
                        {
                            file: 'src/themes/joyTheme.tsx',
                            purpose: 'Central theme configuration',
                            values: ['colors', 'typography', 'spacing', 'components']
                        },
                        {
                            file: 'src/store/settingsStore.ts',
                            purpose: 'Runtime theme preferences',
                            values: ['ui.theme', 'ui.animationsEnabled']
                        },
                        {
                            file: 'src/RootApp.tsx',
                            purpose: 'Theme provider wrapper',
                            pattern: '<CssVarsProvider theme={joyTheme}>'
                        }
                    ],
                    componentExamples: [
                        {
                            name: 'NowPlayingControls',
                            stores: ['mediaStore', 'audioStore'],
                            actions: ['playbackManager.play()', 'playbackManager.pause()'],
                            theme: 'Uses joyTheme for colors and spacing'
                        },
                        {
                            name: 'QueueTable',
                            stores: ['queueStore', 'mediaStore'],
                            actions: ['queueStore.moveItem()', 'queueStore.shuffle()'],
                            theme: 'Hybrid Joy UI + MUI Table'
                        },
                        {
                            name: 'SettingsForm',
                            stores: ['settingsStore'],
                            actions: ['settingsStore.setVolume()'],
                            api: 'apiClient.updateUserConfiguration()',
                            theme: 'Joy UI components with Zod validation'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_data_flow_patterns',
    'Understand how data flows through the Jellyfin architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    dataFlowPaths: [
                        {
                            path: 'API → Store → Component → Playback',
                            description: 'User initiates playback',
                            steps: [
                                { layer: 'API', action: 'fetchItems()', file: 'src/utils/jellyfin-apiclient/getItems.ts' },
                                { layer: 'Store', action: 'queueStore.setQueue()', file: 'src/store/queueStore.ts' },
                                { layer: 'Component', action: 'QueueTable renders', file: 'src/apps/stable/routes/lazyRoutes/QueueTable.tsx' },
                                { layer: 'Playback', action: 'playbackManager.play()', file: 'src/components/playback/playbackmanager.ts' }
                            ]
                        },
                        {
                            path: 'User Action → Component → Store → API',
                            description: 'User updates settings',
                            steps: [
                                { layer: 'Component', action: 'SettingsForm submits', file: 'src/components/forms/SettingsForm.tsx' },
                                { layer: 'Store', action: 'settingsStore.setVolume()', file: 'src/store/settingsStore.ts' },
                                { layer: 'API', action: 'apiClient.updateUserConfiguration()', file: 'src/apiclient.d.ts' }
                            ]
                        },
                        {
                            path: 'Server → WebSocket → Store → Component',
                            description: 'Real-time update from server',
                            steps: [
                                { layer: 'API', action: 'WebSocket message received', file: 'src/lib/jellyfin-apiclient/ServerConnections.ts' },
                                { layer: 'Store', action: 'mediaStore.updateProgress()', file: 'src/store/mediaStore.ts' },
                                { layer: 'Component', action: 'NowPlayingBar updates', file: 'src/components/nowPlayingBar/nowPlayingBar.ts' }
                            ]
                        },
                        {
                            path: 'Playback → Audio → Visualizer → Component',
                            description: 'Audio visualization flow',
                            steps: [
                                { layer: 'Playback', action: 'AudioContext creates analyzer', file: 'src/components/audioEngine/audioWorklets.ts' },
                                { layer: 'Audio', action: 'getByteFrequencyData()', file: 'Web Audio API' },
                                { layer: 'Visualizer', action: 'Butterchurn.render()', file: 'src/components/visualizer/Butterchurn.tsx' },
                                { layer: 'Component', action: 'VisualizerControls displays', file: 'src/components/visualizer/VisualizerControls.tsx' }
                            ]
                        }
                    ],
                    stateSyncPatterns: [
                        {
                            pattern: 'Store → Store Sync',
                            example: 'syncWithMediaStore in audioStore.ts',
                            purpose: 'Keep derived stores synchronized with primary store'
                        },
                        {
                            pattern: 'Store → Component',
                            example: 'useStore(state => state.volume)',
                            purpose: 'Reactive UI updates when store changes'
                        },
                        {
                            pattern: 'Component → Store',
                            example: 'setVolume(value) action',
                            purpose: 'User interactions update application state'
                        },
                        {
                            pattern: 'API → Store',
                            example: 'TanStack Query onSuccess → store.setData()',
                            purpose: 'Server data becomes application state'
                        }
                    ],
                    antiPatterns: [
                        {
                            issue: 'Bypassing store for component communication',
                            fix: 'Use shared store or context instead of prop drilling'
                        },
                        {
                            issue: 'Direct store mutation without actions',
                            fix: 'Always use store actions for state changes'
                        },
                        {
                            issue: 'Subscribing to entire store state',
                            fix: 'Use selective selectors to prevent unnecessary re-renders'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_architecture_decisions',
    'Understand key architectural decisions and trade-offs',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    decisions: [
                        {
                            decision: 'Zustand over Redux',
                            rationale: ['Simpler API', 'No boilerplate', 'Built-in TypeScript support', 'Smaller bundle'],
                            tradeoffs: ['Less middleware ecosystem', 'No DevTools by default'],
                            alternatives: ['Jotai', 'Recoil', 'Signals']
                        },
                        {
                            decision: 'TanStack Query for server state',
                            rationale: ['Caching built-in', 'Auto refetching', 'Loading states', 'Optimistic updates'],
                            tradeoffs: ['Learning curve', 'Additional dependency'],
                            alternatives: ['SWR', 'React Query (predecessor)', 'useEffect + useState']
                        },
                        {
                            decision: 'Joy UI over pure Material UI',
                            rationale: ['CSS variables theming', 'Lighter bundle', 'Easier customization'],
                            tradeoffs: ['Fewer pre-built components', 'Documentation gaps'],
                            alternatives: ['Custom design system', 'MUI v5 with theme overrides']
                        },
                        {
                            decision: 'Web Audio API over HTML5 Audio',
                            rationale: ['Fine-grained control', 'Audio processing', 'Visualization support'],
                            tradeoffs: ['Browser compatibility', 'More complex API'],
                            alternatives: ['Howler.js', 'Tone.js', 'Plain HTML5 Audio']
                        },
                        {
                            decision: 'TanStack Table for complex tables',
                            rationale: ['Headless (no UI assumptions)', 'Type-safe', 'Virtualization support'],
                            tradeoffs: ['More code to write', 'Learning curve'],
                            alternatives: ['Ag-Grid', 'react-table (predecessor)', 'MUI DataGrid']
                        }
                    ],
                    evolutionHistory: [
                        {
                            era: 'Legacy',
                            technologies: ['querySelector', 'FormData', 'Redux', 'MUI'],
                            files: ['src/controllers/', 'src/scripts/']
                        },
                        {
                            era: 'Migration',
                            technologies: ['Zustand', 'TanStack Query', 'Mixed MUI/Joy'],
                            files: ['src/apps/dashboard/routes/users/add.tsx']
                        },
                        {
                            era: 'Modern',
                            technologies: ['Joy UI', 'TanStack Table', 'React 19', 'Zod'],
                            files: ['src/components/forms/', 'src/apps/stable/routes/lazyRoutes/']
                        }
                    ],
                    futureConsiderations: [
                        'React Server Components for server-side rendering',
                        'Signals for fine-grained reactivity',
                        'WebGPU for visualization performance',
                        'Service Worker for offline-first capabilities'
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'architecture-docs',
    'jellyfin://architecture/overview',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://architecture/overview',
                mimeType: 'text/markdown',
                text: `# Jellyfin Architecture Overview

## Architecture Layers

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
│    Components | Forms | Theming | Layout (Joy UI + MUI)     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   State Layer                                │
│         Zustand Stores (media, queue, player, settings)      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Playback Layer                              │
│    PlaybackManager | TranscodePolicy | Progress Tracking     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Audio Layer                                │
│    Web Audio API | Crossfade | Equalizer | Visualizer        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     API Layer                                │
│    ApiClient | ServerConnections | WebSocket | SDK           │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Cross-Server Relationships

| From | To | Integration |
|------|-----|-------------|
| api | store-architecture | API responses update stores via TanStack Query |
| api | playback-manager | Stream URLs, playback progress reporting |
| api | components | Forms submit to API |
| store-architecture | playback-manager | Playback state triggers actions |
| store-architecture | components | Components subscribe to stores |
| store-architecture | joy-ui | Settings drive theme/styling |
| playback-manager | audio-engine | CrossfadeController, SyncManager |
| playback-manager | store-architecture | Status updates sync to stores |
| audio-engine | components | Visualizer displays frequency data |
| audio-engine | store-architecture | Volume/mute sync with settings |
| components | joy-ui | Joy UI components for all new UI |
| performance | all | Monitoring, preloading, optimization |

## Data Flow Examples

### Playback Initiation
\`\`\`
User clicks play
    ↓
Component → queueStore.setQueue() + mediaStore.setCurrentItem()
    ↓
playbackManager.selectPlayer() + loadItem()
    ↓
apiClient.getAudioStream() → stream URL
    ↓
AudioEngine → MediaElement plays
    ↓
mediaStore updates progress → NowPlayingBar reflects state
\`\`\`

### Settings Update
\`\`\`
User changes volume in SettingsForm
    ↓
settingsStore.setVolume()
    ↓
audioStore.syncWithMediaStore()
    ↓
MasterMixer updates gain
    ↓
apiClient.updateUserConfiguration() (persisted)
\`\`\`

## Key Files by Layer

- **API**: \`src/apiclient.d.ts\`, \`src/lib/jellyfin-apiclient/\`
- **State**: \`src/store/*.ts\`
- **Playback**: \`src/components/playback/\`
- **Audio**: \`src/components/audioEngine/\`, \`src/components/visualizer/\`
- **UI**: \`src/components/\`, \`src/themes/\`, \`src/apps/\`
- **Performance**: \`src/utils/performanceBaseline.ts\`, \`src/utils/preload/\`
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
