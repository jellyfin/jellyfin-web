import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-components',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_component_relationships',
    'Understand how components relate to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'store-architecture',
                            relationship: 'Components subscribe to stores for data',
                            direction: 'Store → Component',
                            integration: 'useStore() hooks provide reactive data'
                        },
                        {
                            server: 'playback-manager',
                            relationship: 'Components trigger playback actions',
                            direction: 'Component → Playback',
                            integration: 'NowPlayingBar, playerSelectionMenu'
                        },
                        {
                            server: 'joy-ui',
                            relationship: 'Components use Joy UI for styling',
                            direction: 'Component uses UI',
                            integration: '@mui/joy imports for all new components'
                        },
                        {
                            server: 'audio-engine',
                            relationship: 'Visualizer components display audio',
                            direction: 'Audio → Component',
                            integration: 'Butterchurn, WaveformCell, FrequencyAnalyzer'
                        },
                        {
                            server: 'api',
                            relationship: 'Forms submit data via API',
                            direction: 'Component → API',
                            integration: 'SettingsForm submits to apiClient'
                        },
                        {
                            server: 'architecture',
                            relationship: 'Components are the UI layer',
                            direction: 'Components present data to users',
                            integration: 'All user-facing code in this layer'
                        }
                    ],
                    componentToStoreBindings: [
                        {
                            component: 'NowPlayingBar',
                            stores: ['mediaStore', 'audioStore', 'queueStore', 'playerStore'],
                            pattern: 'useStore() hooks for reactive updates'
                        },
                        {
                            component: 'QueueTable',
                            stores: ['queueStore', 'mediaStore'],
                            pattern: 'TanStack Table with store data'
                        },
                        {
                            component: 'SettingsForm',
                            stores: ['settingsStore'],
                            pattern: 'Form state syncs with store'
                        },
                        {
                            component: 'VisualizerControls',
                            stores: ['settingsStore'],
                            pattern: 'Settings drive visualization type'
                        }
                    ],
                    componentToPlaybackActions: [
                        {
                            component: 'NowPlayingBar',
                            actions: ['play()', 'pause()', 'seek()', 'next()', 'prev()'],
                            file: 'src/components/nowPlayingBar/nowPlayingBar.ts'
                        },
                        {
                            component: 'playerSelectionMenu',
                            actions: ['selectPlayer()', 'initiateTransfer()'],
                            file: 'src/components/playback/playerSelectionMenu.ts'
                        },
                        {
                            component: 'QueueTable',
                            actions: ['moveItem()', 'shuffle()', 'removeFromQueue()'],
                            file: 'src/apps/stable/routes/lazyRoutes/QueueTable.tsx'
                        }
                    ],
                    componentToAudioFlow: [
                        {
                            component: 'Butterchurn',
                            audioData: 'Frequency analyzer output',
                            purpose: '3D visualization of music'
                        },
                        {
                            component: 'WaveformCell',
                            audioData: 'Decoded audio peaks',
                            purpose: 'Visual representation of audio waveform'
                        },
                        {
                            component: 'FrequencyAnalyzer',
                            audioData: 'Real-time FFT data',
                            purpose: 'Bar-graph spectrum display'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_component_overview',
    'Get overview of Jellyfin component organization',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    componentDirectories: [
                        {
                            name: 'audioEngine',
                            purpose: 'Core audio processing pipeline',
                            files: ['crossfader.logic.ts', 'crossfadeController.ts', 'master.logic.ts', 'audioWorklets.ts']
                        },
                        {
                            name: 'playback',
                            purpose: 'Playback management and player integration',
                            files: ['playbackmanager.ts', 'playqueuemanager.ts', 'playerSelectionMenu.ts']
                        },
                        {
                            name: 'visualizer',
                            purpose: 'Music visualization (Butterchurn, waveform, frequency)',
                            files: ['visualizers.logic.ts', 'butterchurn.logic.ts', 'WaveformCell.tsx', 'WaveSurfer.ts']
                        },
                        {
                            name: 'nowPlayingBar',
                            purpose: 'Playback controls and now playing display',
                            files: ['nowPlayingBar.ts']
                        },
                        {
                            name: 'sitbackMode',
                            purpose: 'Queue-focused UI with mouse-idle behavior',
                            files: ['sitback.logic.ts']
                        },
                        {
                            name: 'layoutManager',
                            purpose: 'Responsive layout and device detection',
                            file: 'layoutManager.ts'
                        },
                        {
                            name: 'loading',
                            purpose: 'Loading states and indicators',
                            files: ['loading.ts', 'loadingModal.ts']
                        },
                        {
                            name: 'forms',
                            purpose: 'Reusable form components with Zod validation',
                            files: ['SettingsForm.tsx']
                        }
                    ],
                    componentTypes: [
                        'Smart containers (manage their own data fetching)',
                        'Presentational components (receive data via props)',
                        'Plugin components (extensible via pluginManager)'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_now_playing_bar',
    'Understand the NowPlayingBar component architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Main playback controls and now playing information display',
                    file: 'src/components/nowPlayingBar/nowPlayingBar.ts',
                    keyFeatures: [
                        'Playback controls (play/pause, skip, volume)',
                        'Progress slider with scrubbing',
                        'Now playing information (track name, artist, album)',
                        'Album art display',
                        'Queue toggle',
                        'Player selection menu'
                    ],
                    stateDependencies: [
                        'mediaStore - for playback status and progress',
                        'audioStore - for volume and mute state',
                        'queueStore - for queue information',
                        'playerStore - for player selection'
                    ],
                    eventHandlers: [
                        'onPlaybackStarted - Initialize UI on play',
                        'onPlaybackStopped - Reset UI on stop',
                        'onStateChanged - Update play/pause button',
                        'onTimeUpdate - Update progress slider'
                    ],
                    subComponents: [
                        'progressSlider - Seek and progress display',
                        'volumeSlider - Volume control',
                        'nowPlayingInfo - Track metadata display',
                        'playerSelectionMenu - Device picker'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_sitback_mode',
    'Understand Sit Back mode for queue-focused experience',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Queue-focused Now Playing experience with mouse-idle UI behavior',
                    file: 'src/components/sitbackMode/sitback.logic.ts',
                    keyFeatures: [
                        'Mouse idle tracking (hides cursor after inactivity)',
                        'Track info display during transitions',
                        'Auto-hide timer for UI elements',
                        'Scroll to active playlist item',
                        'TV-friendly mode (mouseIdle-tv class)'
                    ],
                    configuration: {
                        trackInfoDuration: 'How long to show track info (default: 5s)',
                        autoHideTimer: 'Idle time before hiding cursor (default: 5s)'
                    },
                    behavior: {
                        onIdle: 'Add mouseIdle class to body',
                        onActive: 'Remove mouseIdle class',
                        visibilityChange: 'Reset idle timer when tab becomes visible'
                    },
                    integration: {
                        layoutManager: 'Detects mobile/TV mode',
                        visualizerSettings: 'Reads sitback configuration',
                        inputManager: 'Notifies of mouse movement'
                    },
                    cssClasses: {
                        'mouseIdle': 'Cursor hidden, UI elements dimmed',
                        'mouseIdle-tv': 'TV-specific idle styling',
                        'transition': 'Track info transition active',
                        'songEnd': 'Song ended, showing end state'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_visualizer_components',
    'Understand the music visualization components (Butterchurn, WaveformCell, frequency analyzer)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Music visualization and waveform display components',
                    keyComponents: [
                        {
                            name: 'WaveformCell',
                            file: 'src/components/visualizer/WaveformCell.tsx',
                            purpose: 'Canvas-based waveform rendering for playlist items',
                            features: [
                                'Low-resolution previews for non-playing tracks',
                                'High-resolution for current track with playback sync',
                                'Canvas-based rendering (no heavy WaveSurfer instances)',
                                'Cached peaks from WaveSurfer peak cache',
                                'Progress indicator showing playback position',
                                'Auto-destroy on unmount'
                            ],
                            props: {
                                itemId: 'Track ID for peak cache lookup',
                                peaks: 'Optional cached peak data',
                                duration: 'Track duration in ticks',
                                currentTime: 'Current playback time in seconds',
                                isCurrentTrack: 'Whether this is the playing track',
                                isNextTrack: 'Whether this is the next track',
                                height: 'Waveform height in pixels (default: 40)'
                            }
                        },
                        {
                            name: 'WaveSurfer',
                            file: 'src/components/visualizer/Wavefer.ts',
                            purpose: 'Full WaveSurfer integration for main progress/waveform display',
                            features: [
                                'Interactive waveform with click-to-seek',
                                'Peak data caching (LRU cache, max 10 items)',
                                'Timeline and zoom plugins',
                                'Color extraction from album art',
                                'Sync with media playback'
                            ],
                            exportedFunctions: [
                                'waveSurferInitialization(container, legacy, duration)',
                                'destroyWaveSurferInstance(fullDestroy)',
                                'getCachedPeaks(itemId, streamUrl)',
                                'setCachedPeaks(itemId, streamUrl, peaks, duration)'
                            ]
                        },
                        {
                            name: 'Butterchurn',
                            file: 'src/components/visualizer/Butterchurn.tsx',
                            purpose: '3D FFT visualizer for music playback',
                            features: [
                                'Preset management',
                                'WebGL rendering',
                                'Responsive to audio frequency data'
                            ]
                        },
                        {
                            name: 'FrequencyAnalyzer',
                            file: 'src/components/visualizer/FrequencyAnalyzer.tsx',
                            purpose: 'Real-time frequency spectrum display',
                            features: [
                                'Web Audio API integration',
                                'Bar-graph visualization',
                                'Customizable color schemes'
                            ]
                        }
                    ],
                    peakCaching: {
                        maxSize: 10,
                        keyFormat: 'item:{itemId} or url:{streamUrl}',
                        eviction: 'LRU based on timestamp'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_form_patterns',
    'Understand form patterns in Jellyfin (TanStack Forms + Zod)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Form handling patterns with TanStack Forms and Zod validation',
                    installedLibraries: [
                        {
                            name: '@tanstack/react-form',
                            version: '1.27.7',
                            purpose: 'Headless form state management',
                            features: [
                                'Type-safe form state',
                                'Field-level validation',
                                'Async submission support',
                                'Integration with any UI library'
                            ]
                        },
                        {
                            name: 'zod',
                            version: '4.3.5',
                            purpose: 'Schema validation and type inference',
                            features: [
                                'Type inference from schemas',
                                'Custom validation rules',
                                'Error message customization'
                            ]
                        }
                    ],
                    newComponents: [
                        {
                            name: 'SettingsForm',
                            file: 'src/components/forms/SettingsForm.tsx',
                            purpose: 'Example form with Zod validation and MUI components',
                            features: [
                                'Zod schema-based validation',
                                'Real-time field validation on blur',
                                'MUI TextField, Switch, Button integration',
                                'Submit/Reset handling',
                                'Loading state management'
                            ]
                        }
                    ],
                    migrationOpportunities: [
                        {
                            file: 'src/apps/dashboard/routes/users/add.tsx',
                            issue: 'Uses querySelector and FormData',
                            benefit: 'Type-safe fields, validation, submit handler'
                        },
                        {
                            file: 'src/apps/dashboard/routes/playback/transcoding.tsx',
                            issue: '40+ fields with useState',
                            benefit: 'Centralized state, validation, easier maintenance'
                        },
                        {
                            file: 'src/apps/dashboard/routes/users/parentalcontrol.tsx',
                            issue: 'window.ApiClient + manual validation',
                            benefit: 'TanStack Query integration, async validation'
                        }
                    ],
                    formPattern: {
                        schema: 'Zod schema with field validation',
                        state: 'useState or TanStack Forms for field values',
                        validation: 'Zod parse on blur/change',
                        submission: 'async handler with error handling',
                        ui: 'MUI components (TextField, Switch, Select)'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_queue_table',
    'Understand the QueueTable component for playlist display',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Joy UI + TanStack Table implementation for playback queue with drag-and-drop',
                    file: 'src/apps/stable/routes/lazyRoutes/QueueTable.tsx',
                    keyFeatures: [
                        'TanStack Table with drag-and-drop reordering (@dnd-kit)',
                        'Hybrid UI: Joy UI styling (Box, Typography, Menu, IconButton) + MUI Table components',
                        'Virtualization for large playlists (100+ items) using @tanstack/react-virtual',
                        'Per-row WaveformCell for current/next tracks',
                        'Scroll position persistence (localStorage)',
                        'Auto-center on current track change',
                        'Context menu for CRUD operations',
                        'Playback time sync for waveform progress'
                    ],
                    uiApproach: {
                        joyUI: ['Box', 'IconButton', 'Typography', 'Menu', 'MenuItem'],
                        muiTable: ['Table', 'TableBody', 'TableCell', 'TableContainer', 'TableHead', 'TableRow', 'Avatar'],
                        rationale: 'Joy UI provides better styling primitives; MUI Table for complex table structure'
                    },
                    columns: [
                        { id: 'drag', header: '', purpose: 'Drag handle for reordering' },
                        { id: 'index', header: '#', purpose: 'Track number with avatar' },
                        { id: 'Name', header: 'Title', purpose: 'Track name with artist info' },
                        { id: 'waveform', header: '', purpose: 'WaveformCell for visual' },
                        { id: 'RunTimeTicks', header: 'Duration', purpose: 'Formatted duration' },
                        { id: 'actions', header: '', purpose: 'Context menu trigger' }
                    ],
                    integrations: {
                        queueStore: 'Queue state management',
                        playbackManager: 'Current index and playback state',
                        WaveSurfer: 'Peak data for waveforms',
                        Events: 'timeupdate for playback sync'
                    },
                    performance: {
                        virtualization: 'Renders only visible rows',
                        scrollDebounce: '150ms before saving scroll position',
                        peakCache: 'Reuses cached peaks from WaveSurfer'
                    },
                    dependencies: [
                        '@tanstack/react-table',
                        '@tanstack/react-virtual',
                        '@dnd-kit/core',
                        '@dnd-kit/sortable',
                        '@dnd-kit/utilities',
                        '@mui/material',
                        '@mui/joy'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_user_new_form',
    'Understand the modernized UserNew form component with MUI and React state',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Modernized user creation form with MUI components and React state',
                    file: 'src/apps/dashboard/routes/users/add.tsx',
                    migrationFrom: {
                        pattern: 'querySelector + FormData + legacy elements',
                        issues: [
                            'Direct DOM manipulation via querySelector',
                            'Manual event listener setup/cleanup',
                            'Legacy Input/Button elements',
                            'No type safety for form fields'
                        ]
                    },
                    keyFeatures: [
                        'React useState for form field values',
                        'Zod schema validation (userSchema)',
                        'MUI TextField, Checkbox, Switch components',
                        'Type-safe form submission',
                        'Async/await pattern for mutations',
                        'Proper loading state management',
                        'Error handling with Toast component'
                    ],
                    formSchema: {
                        username: 'Required string',
                        password: 'Optional string',
                        enableAllFolders: 'boolean',
                        enableAllChannels: 'boolean',
                        enabledFolders: 'string[] (selected folder IDs)',
                        enabledChannels: 'string[] (selected channel IDs)'
                    },
                    bestPractices: [
                        'Use React state instead of querySelector',
                        'Use MUI components instead of legacy Input/Button',
                        'Use Zod for schema validation',
                        'Use async/await for mutation handling',
                        'Track isSubmitting for button disabled state',
                        'Centralize error handling in try/catch'
                    ],
                    dependencies: [
                        '@mui/material',
                        'zod',
                        '@tanstack/react-query (useCreateUser, useUpdateUserPolicy)'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_component_patterns',
    'Understand common component patterns in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    patterns: [
                        {
                            name: 'Store-based State',
                            description: 'Components read from Zustand stores, no local state',
                            example: 'NowPlayingBar uses mediaStore, audioStore, queueStore'
                        },
                        {
                            name: 'Event-based Updates',
                            description: 'Components listen to Events emitter for player updates',
                            example: 'onPlaybackStarted, onStateChanged handlers'
                        },
                        {
                            name: 'Plugin-based Extensions',
                            description: 'Core functionality extended via plugins',
                            example: 'HtmlAudioPlayer as plugin'
                        },
                        {
                            name: 'Smart Containers',
                            description: 'Components that fetch their own data',
                            example: 'itemDetail pages fetch item data'
                        },
                        {
                            name: 'Action Sheet',
                            description: 'Modal overlays for actions',
                            purpose: 'Secondary actions without leaving context'
                        },
                        {
                            name: 'TanStack Table Pattern',
                            description: 'Use @tanstack/react-table + @tanstack/react-virtual + @dnd-kit for data tables',
                            example: 'QueueTable.tsx with drag-and-drop reordering'
                        },
                        {
                            name: 'MUI + Zod Forms',
                            description: 'Use MUI components with Zod schema validation',
                            example: 'UserNew.tsx, SettingsForm.tsx'
                        }
                    ],
                    antiPatterns: [
                        {
                            issue: 'Direct DOM manipulation outside lifecycle',
                            fix: 'Use React refs and effects'
                        },
                        {
                            issue: 'Prop drilling deep component trees',
                            fix: 'Use store subscriptions'
                        },
                        {
                            issue: 'Missing cleanup in event listeners',
                            fix: 'Return cleanup function from useEffect'
                        }
                    ],
                    stylingApproaches: [
                        'SCSS modules for component-scoped styles',
                        'Global styles for shared utilities',
                        'CSS custom properties for theming'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_layout_patterns',
    'Understand responsive layout patterns and responsive design',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    breakpoints: {
                        xs: '0px',
                        sm: '600px',
                        md: '900px',
                        lg: '1200px',
                        xl: '1536px'
                    },
                    layoutPatterns: [
                        {
                            name: 'Responsive Grid',
                            code: `<Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}>Sidebar</Grid>
    <Grid size={{ xs: 12, md: 6 }}>Content</Grid>
</Grid>`
                        },
                        {
                            name: 'Responsive Stack',
                            code: `<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
    <Box>Item 1</Box>
    <Box>Item 2</Box>
</Stack>`
                        },
                        {
                            name: 'Hide/Show Pattern',
                            code: `<Box sx={{ display: { xs: 'none', md: 'block' } }}>
    Desktop only
</Box>`
                        }
                    ],
                    deviceDetection: [
                        {
                            type: 'Mobile',
                            condition: 'max-width: 599px',
                            features: ['Touch controls', 'Full-width buttons', 'Bottom navigation']
                        },
                        {
                            type: 'Tablet',
                            condition: '600px - 1199px',
                            features: ['Touch + pointer', 'Adaptive layouts', 'Side panel optional']
                        },
                        {
                            type: 'Desktop',
                            condition: '1200px+',
                            features: ['Full controls', 'Hover states', 'Multi-column layouts']
                        }
                    ],
                    layoutManager: {
                        file: 'src/components/layoutManager.ts',
                        features: [
                            'Device type detection',
                            'Orientation tracking',
                            'Breakpoint subscription',
                            'Touch capability detection'
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_animation_patterns',
    'Understand animation and transition patterns in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    animationLibraries: [
                        {
                            name: 'framer-motion',
                            version: '11.x',
                            purpose: 'Declarative animations and gestures',
                            usage: 'Page transitions, enter/exit animations'
                        },
                        {
                            name: '@react-spring/web',
                            version: '9.x',
                            purpose: 'Physics-based animations',
                            usage: 'Interactive UI elements, drag gestures'
                        }
                    ],
                    animationPatterns: [
                        {
                            name: 'Page Transition',
                            code: `<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
>
    {children}
</motion.div>`
                        },
                        {
                            name: 'Hover Scale',
                            code: `<motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
>
    <Card>{children}</Card>
</motion.div>`
                        },
                        {
                            name: 'List Stagger',
                            code: `<motion.div
    initial="hidden"
    animate="visible"
    variants={{
        visible: { transition: { staggerChildren: 0.1 } }
    }}
>
    {items.map(item => (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            {item.name}
        </motion.div>
    ))}
</motion.div>`
                        }
                    ],
                    performanceGuidelines: [
                        'Use transform/opacity for 60fps animations',
                        'Avoid animating layout properties (width, height)',
                        'Use will-change CSS property sparingly',
                        'Consider reduced motion preferences'
                    ],
                    reducedMotion: [
                        'Check prefers-reduced-motion media query',
                        'Disable complex animations for accessibility',
                        'Provide static alternatives',
                        'Use CSS prefers-reduced-motion: reduce'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_context_patterns',
    'Understand React context patterns for shared state',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    contexts: [
                        {
                            name: 'PlaybackContext',
                            purpose: 'Playback state and controls',
                            values: ['isPlaying', 'currentTime', 'volume', 'playbackRate'],
                            methods: ['play', 'pause', 'seek', 'setVolume']
                        },
                        {
                            name: 'ThemeContext',
                            purpose: 'Theme and styling preferences',
                            values: ['mode', 'primaryColor', 'compactMode'],
                            methods: ['setMode', 'setPrimaryColor']
                        },
                        {
                            name: 'UserContext',
                            purpose: 'Current user state',
                            values: ['user', 'permissions', 'settings'],
                            methods: ['updateSettings']
                        }
                    ],
                    contextPatterns: [
                        {
                            name: 'Provider Pattern',
                            code: `interface PlaybackContextType {
    isPlaying: boolean;
    play: () => void;
    pause: () => void;
}

export const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ children }) {
    const [isPlaying, setIsPlaying] = useState(false);
    
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    
    return (
        <PlaybackContext.Provider value={{ isPlaying, play, pause }}>
            {children}
        </PlaybackContext.Provider>
    );
}`
                        },
                        {
                            name: 'Custom Hook Pattern',
                            code: `export function usePlayback() {
    const context = useContext(PlaybackContext);
    if (!context) {
        throw new Error('usePlayback must be used within PlaybackProvider');
    }
    return context;
}`
                        },
                        {
                            name: 'Optimized Context',
                            code: `// Split contexts by update frequency
const PlaybackControlsContext = createContext({ play, pause, seek });
const PlaybackInfoContext = createContext({ currentItem, progress });

// Components subscribe only to what they need
const Controls = () => {
    const { play, pause } = useContext(PlaybackControlsContext);
};
const Info = () => {
    const { currentItem } = useContext(PlaybackInfoContext);
};`
                        }
                    ],
                    contextVsStore: {
                        useContext: [
                            'Static configuration',
                            'Rarely changing data',
                            'Component tree globals',
                            'Theme, user settings'
                        ],
                        useStore: [
                            'Frequent updates',
                            'Complex state logic',
                            'Cross-component sharing',
                            'Playback, queue, player'
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_mui_table_patterns',
    'Understand TanStack Table integration patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    librarySetup: [
                        {
                            package: '@tanstack/react-table',
                            version: '8.x',
                            purpose: 'Headless table logic'
                        },
                        {
                            package: '@tanstack/react-virtual',
                            version: '3.x',
                            purpose: 'Virtual scrolling for large lists'
                        },
                        {
                            package: '@tanstack/react-query',
                            version: '5.x',
                            purpose: 'Server state and caching'
                        }
                    ],
                    tablePattern: [
                        {
                            step: 'Define column defs',
                            code: `const columns = [
    { accessorKey: 'name', header: 'Name' },
    { 
        accessorKey: 'artist', 
        header: 'Artist',
        cell: ({ row }) => <span>{row.original.artistName}</span>
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => <Button onClick={() => play(row.original)}>Play</Button>
    }
];`
                        },
                        {
                            step: 'Create table instance',
                            code: `const table = useReactTable({
    data,
    columns,
    getRowId: row => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
});`
                        },
                        {
                            step: 'Render virtualized rows',
                            code: "const { rows } = table.getRowModel();\nconst rowVirtualizer = useVirtualizer({\n    count: rows.length,\n    getScrollElement: () => parentRef.current,\n    estimateSize: () => 60,\n});\n\nreturn (\n    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>\n        <div style={{ height: rowVirtualizer.getTotalSize() + 'px' }}>\n            {rowVirtualizer.getVirtualItems().map(virtualRow => {\n                const row = rows[virtualRow.index];\n                return (\n                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: virtualRow.size, transform: 'translateY(' + virtualRow.start + 'px)' }}>\n                        {row.getVisibleCells().map(cell => (\n                            <div>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>\n                        ))}\n                    </div>\n                );\n            })}\n        </div>\n    </div>\n);"
                        }
                    ],
                    jellyfinTableExamples: [
                        {
                            name: 'QueueTable',
                            file: 'src/apps/stable/routes/lazyRoutes/QueueTable.tsx',
                            features: ['Drag-and-drop sorting', 'WaveformCell per row', 'Scroll persistence']
                        },
                        {
                            name: 'Library Browser',
                            file: 'src/apps/stable/routes/library.tsx',
                            features: ['Infinite scroll', 'Column sorting', 'Row selection']
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_react_now_playing_bar',
    'Understand the React NowPlayingBar component (React + Joy UI + Zustand)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Modern React NowPlayingBar component with Joy UI, Zustand stores, and buffer progress overlay',
                    files: {
                        component: 'src/components/nowPlayingBar/ReactNowPlayingBar.tsx',
                        mount: 'src/components/nowPlayingBar/mountNowPlayingBar.tsx',
                        scss: 'src/components/nowPlayingBar/nowPlayingBar.scss'
                    },
                    keyFeatures: [
                        'React functional component with hooks',
                        'Joy UI components (IconButton, Stack, Slider, AspectRatio)',
                        'Zustand store hooks for all playback state',
                        'Buffer progress overlay with CSS custom properties',
                        'WaveSurfer container compatibility (id="barSurfer")',
                        'Favorites API integration',
                        'Lyrics button with hash-based page detection',
                        'AirPlay and context menu buttons',
                        'Framer Motion animations (AnimatePresence)',
                        'Responsive layout with layoutManager.mobile'
                    ],
                    stateManagement: {
                        hooks: [
                            'useIsPlaying() - Playing state',
                            'useCurrentItem() - Current track',
                            'useCurrentTime() - Playback position',
                            'useDuration() - Track duration',
                            'useVolume() / useIsMuted() - Audio settings',
                            'useRepeatMode() / useShuffleMode() - Playback modes',
                            'usePlaybackActions() - play, pause, seek, etc.',
                            'useQueueActions() - next, prev, toggle modes',
                            'useFormattedTime() - Time display formatting',
                            'useProgress() - Full progress with buffered data'
                        ],
                        local: [
                            'isMobile - layoutManager.mobile',
                            'isDragging - slider drag state',
                            'localSeekValue - temporary seek value',
                            'isVisible - visibility control',
                            'isLyricsActive - lyrics page detection',
                            'isFavorite - favorite state',
                            'showContextMenu - menu visibility',
                            'isFavoritesLoading - API loading state',
                            'bufferedRanges - buffer progress data'
                        ]
                    },
                    eventHandling: [
                        {
                            event: 'layoutManager modechange',
                            handler: 'handleLayoutChange',
                            purpose: 'Update isMobile state'
                        },
                        {
                            event: 'window hashchange',
                            handler: 'checkLyricsPage',
                            purpose: 'Detect lyrics page navigation'
                        },
                        {
                            event: 'document viewbeforeshow',
                            handler: 'handleViewBeforeShow',
                            purpose: 'Visibility control for TV/fullscreen'
                        },
                        {
                            event: 'serverNotifications UserDataChanged',
                            handler: 'handleUserDataChanged',
                            purpose: 'Real-time favorite updates from other tabs'
                        }
                    ],
                    bufferProgress: {
                        implementation: 'CSS overlay with custom properties',
                        dataSource: 'playbackManagerBridge.getBufferedRanges()',
                        polling: 'setInterval every 500ms',
                        normalization: 'Ranges converted to percentages (0-100)',
                        cssProperties: {
                            '--buffer-start': 'Start position %',
                            '--buffer-end': 'End position %'
                        },
                        containerId: 'barSurfer (for WaveSurfer compatibility)'
                    },
                    apiIntegration: {
                        favorites: {
                            import: "ServerConnections from 'lib/jellyfin-apiclient'",
                            method: 'apiClient.updateFavoriteStatus(userId, itemId, isFavorite)',
                            optimistic: 'Updates UI immediately, reverts on error',
                            events: 'Listens for UserDataChanged for real-time sync'
                        }
                    },
                    componentStructure: {
                        'AnimatePresence': 'Framer Motion for slide-in/out',
                        '.nowPlayingBar': 'Main container with motion',
                        '.nowPlayingBarTop': 'Progress slider container',
                        '#barSurfer': 'Slider + buffer overlay wrapper',
                        '.nowPlayingBarInfoContainer': 'Album art + track info',
                        '.nowPlayingBarCenter': 'Playback controls',
                        '.nowPlayingBarRight': 'Secondary controls (volume, repeat, etc.)'
                    },
                    migrationStatus: {
                        legacyFile: 'src/components/nowPlayingBar/nowPlayingBar.ts',
                        status: 'React version ready, legacy still active',
                        featuresComplete: [
                            'Playback controls',
                            'Progress slider',
                            'Volume control',
                            'Repeat/Shuffle',
                            'Album art',
                            'Lyrics button',
                            'Favorites (API integrated)',
                            'Buffer progress overlay',
                            'Visibility control'
                        ],
                        remaining: [
                            'Context menu content',
                            'Full WaveSurfer integration'
                        ]
                    },
                    performance: {
                        buffering: 'Polling every 500ms (not every frame)',
                        animations: 'Framer Motion with spring config',
                        stateBatching: 'React automatic batching in 18+'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_playback_components',
    'Understand Joy UI playback components (PlaybackIconButton, PlaybackSlider, VolumeSlider)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Joy UI components for playback UI (NowPlayingBar, player selection)',
                    directory: 'src/components/joy-ui/playback/',
                    components: [
                        {
                            name: 'PlaybackIconButton',
                            file: 'PlaybackIconButton.tsx',
                            purpose: 'IconButton wrapper for playback controls',
                            replaces: 'paper-icon-button-light, emby-button',
                            props: {
                                icon: {
                                    type: 'play | pause | previous | next | stop | volume-up | volume-off | repeat | repeat-one | shuffle | favorite | favorite-border | lyrics | airplay | more-vert',
                                    required: false,
                                    description: 'Icon type to display'
                                },
                                active: {
                                    type: 'boolean',
                                    default: false,
                                    description: 'Whether button is in active state'
                                },
                                size: {
                                    type: 'sm | md | lg',
                                    default: 'sm'
                                },
                                variant: {
                                    type: 'plain | soft | outlined | solid',
                                    default: 'plain'
                                }
                            },
                            usage: `<PlaybackIconButton
    icon="play"
    active={isPlaying}
    onClick={togglePlay}
    aria-label="Play"
/>`
                        },
                        {
                            name: 'PlaybackSlider',
                            file: 'PlaybackSlider.tsx',
                            purpose: 'Progress slider with buffer overlay support',
                            replaces: 'emby-slider',
                            features: [
                                'Buffer overlay via CSS custom properties',
                                'WaveSurfer-compatible container (id="barSurfer")',
                                'Pass-through Slider props'
                            ],
                            props: {
                                value: {
                                    type: 'number',
                                    required: true,
                                    description: 'Current position value'
                                },
                                max: {
                                    type: 'number',
                                    default: 100,
                                    description: 'Maximum value'
                                },
                                bufferedRanges: {
                                    type: '{ start: number; end: number }[]',
                                    default: '[]',
                                    description: 'Buffer ranges as percentages (0-100)'
                                },
                                showBuffer: {
                                    type: 'boolean',
                                    default: true,
                                    description: 'Whether to show buffer overlay'
                                },
                                waveSurferCompatible: {
                                    type: 'boolean',
                                    default: true,
                                    description: 'Adds barSurfer class for WaveSurfer integration'
                                }
                            },
                            cssVariables: {
                                '--buffer-start': 'Start position percentage',
                                '--buffer-end': 'End position percentage'
                            },
                            usage: `<PlaybackSlider
    value={currentTime}
    max={duration}
    bufferedRanges={[{ start: 0, end: 45 }]}
    onChange={handleSeek}
    waveSurferCompatible
/>`
                        },
                        {
                            name: 'VolumeSlider',
                            file: 'VolumeSlider.tsx',
                            purpose: 'Volume control with mute toggle',
                            replaces: 'emby-slider + emby-button (mute)',
                            features: [
                                'Built-in mute toggle button',
                                'Auto-unmute on volume change',
                                'Responsive width'
                            ],
                            props: {
                                volume: {
                                    type: 'number',
                                    required: true,
                                    description: 'Current volume level (0-100)'
                                },
                                muted: {
                                    type: 'boolean',
                                    required: true,
                                    description: 'Whether audio is muted'
                                },
                                onVolumeChange: {
                                    type: '(volume: number) => void',
                                    required: true
                                },
                                onMuteToggle: {
                                    type: '() => void',
                                    required: true
                                },
                                showSlider: {
                                    type: 'boolean',
                                    default: true
                                },
                                size: {
                                    type: 'sm | md | lg',
                                    default: 'sm'
                                }
                            },
                            usage: `<VolumeSlider
    volume={volume}
    muted={isMuted}
    onVolumeChange={setVolume}
    onMuteToggle={toggleMute}
/>`
                        }
                    ],
                    migrationNotes: [
                        'PlaybackIconButton handles all common playback icons via icon prop',
                        'PlaybackSlider is WaveSurfer-ready with barSurfer container class',
                        'VolumeSlider integrates mute toggle with volume control',
                        'All components accept standard Joy UI props (sx, className, etc.)',
                        'Use instead of paper-icon-button-light and emby-button in new code'
                    ],
                    dependencies: [
                        '@mui/joy',
                        '@mui/icons-material',
                        'react'
                    ],
                    integration: {
                        stores: [
                            'useIsPlaying() - for play/pause state',
                            'useVolume() - for volume level',
                            'useIsMuted() - for mute state',
                            'useCurrentTime() - for progress',
                            'useDuration() - for slider max value',
                            'useProgress() - for buffered ranges'
                        ],
                        legacyCompatibility: {
                            'paper-icon-button-light': 'Replace with PlaybackIconButton',
                            'emby-slider': 'Replace with PlaybackSlider',
                            'emby-button': 'Replace with PlaybackIconButton or Joy Button'
                        }
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_queue_components',
    'Understand Joy UI queue components (QueueTable, QueueNowPlaying, QueueControls, QueueView)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Queue/Playlist Manager React components with Joy UI, TanStack Table, and DnD-Kit',
                    directory: 'src/components/joy-ui/queue/',
                    components: [
                        {
                            name: 'useQueue',
                            file: 'useQueue.ts',
                            purpose: 'Zustand store hooks for queue state',
                            hooks: [
                                'useQueueItems() - Get all queue items',
                                'useCurrentIndex() - Current playing index',
                                'useCurrentQueueItem() - Current playing item',
                                'useRepeatMode() - Current repeat mode',
                                'useShuffleMode() - Current shuffle mode'
                            ],
                            actions: [
                                'setQueue(items, startIndex) - Set entire queue',
                                'addToQueue(items, position) - Add items',
                                'removeFromQueue(itemIds) - Remove items',
                                'clearQueue() - Clear all items',
                                'setCurrentIndex(index) - Jump to index',
                                'next() / prev() - Navigation',
                                'shuffle() / unshuffle() - Shuffle mode',
                                'moveItem(fromIndex, toIndex) - Reorder',
                                'setRepeatMode(mode) / setShuffleMode(mode) - Modes'
                            ]
                        },
                        {
                            name: 'QueueTable',
                            file: 'QueueTable.tsx',
                            purpose: 'Draggable playlist table with TanStack Table + DnD-Kit',
                            replaces: 'legacy playlist HTML with emby-itemscontainer',
                            features: [
                                '@dnd-kit/core for drag-and-drop',
                                '@dnd-kit/sortable for reorderable items',
                                '@tanstack/react-table for table structure',
                                'Buffer overlay support',
                                'Current track highlighting',
                                'Remove button per item',
                                'Album art + metadata'
                            ]
                        },
                        {
                            name: 'QueueNowPlaying',
                            file: 'QueueNowPlaying.tsx',
                            purpose: 'Now playing info display'
                        },
                        {
                            name: 'QueueControls',
                            file: 'QueueControls.tsx',
                            purpose: 'Playback controls for queue'
                        },
                        {
                            name: 'QueueView',
                            file: 'QueueView.tsx',
                            purpose: 'Main view combining all queue components'
                        }
                    ],
                    legacyFile: 'src/controllers/playback/queue/index.html'
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_video_controls',
    'Understand VideoControls component for video playback OSD',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Video on-screen display (OSD) component for video playback',
                    file: 'src/components/joy-ui/playback/VideoControls.tsx',
                    keyFeatures: [
                        'Play/pause toggle',
                        'Rewind/fast-forward (10s/30s skip)',
                        'Seek slider with buffer overlay',
                        'Volume control with mute toggle',
                        'Previous/next track navigation',
                        'Previous/next chapter navigation',
                        'Subtitle menu button',
                        'Audio track selection button',
                        'Fullscreen button',
                        'Auto-hide controls when playing'
                    ],
                    replaces: 'Legacy HTML video controls from htmlVideoPlayer plugin'
                }, null, 2)
            }]
        };
    }
);


const transport = new StdioServerTransport();
await server.connect(transport);
