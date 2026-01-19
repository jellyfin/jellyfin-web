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
                    purpose: 'MUI + TanStack Table implementation for playback queue with drag-and-drop',
                    file: 'src/apps/stable/routes/lazyRoutes/QueueTable.tsx',
                    keyFeatures: [
                        'TanStack Table with drag-and-drop reordering (@dnd-kit)',
                        'MUI Table components (Table, TableCell, TableRow)',
                        'Virtualization for large playlists (100+ items) using @tanstack/react-virtual',
                        'Per-row WaveformCell for current/next tracks',
                        'Scroll position persistence (localStorage)',
                        'Auto-center on current track change',
                        'Context menu for CRUD operations',
                        'Playback time sync for waveform progress'
                    ],
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
                        '@mui/material'
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
    'get_form_patterns',
    'Understand form patterns in Jellyfin (TanStack Forms + Zod)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Form handling patterns with Zod validation and MUI components',
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
                    components: [
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
                        },
                        {
                            name: 'UserNew (modernized)',
                            file: 'src/apps/dashboard/routes/users/add.tsx',
                            purpose: 'User creation form with MUI + React state',
                            features: [
                                'Type-safe form fields',
                                'Zod schema for validation',
                                'Async mutation handling',
                                'Loading/error states'
                            ]
                        }
                    ],
                    migrationOpportunities: [
                        {
                            file: 'src/apps/dashboard/routes/users/parentalcontrol.tsx',
                            issue: 'window.ApiClient + manual validation',
                            benefit: 'TanStack Query integration, async validation'
                        },
                        {
                            file: 'src/apps/dashboard/routes/playback/transcoding.tsx',
                            issue: '40+ fields with useState',
                            benefit: 'Centralized state, validation, easier maintenance'
                        }
                    ],
                    formPattern: {
                        schema: 'Zod schema with field validation',
                        state: 'useState for field values',
                        validation: 'Zod parse on blur/change',
                        submission: 'async handler with error handling',
                        ui: 'MUI components (TextField, Switch, Select)'
                    },
                    recommendedMigrationOrder: [
                        '1. users/add.tsx ✅ DONE',
                        '2. users/parentalcontrol.tsx',
                        '3. playback/transcoding.tsx',
                        '4. users/access.tsx',
                        '5. users/profile.tsx'
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

server.resource(
    'components-docs',
    'jellyfin://components/architecture',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://components/architecture',
                mimeType: 'text/markdown',
                text: `# Jellyfin Component Architecture

## Overview
Modular component system with store-based state management and plugin extensibility.

## Component Organization
\`\`\`
src/components/
├── audioEngine/          # Core audio processing
│   ├── crossfader.logic.ts
│   ├── crossfadeController.ts
│   ├── master.logic.ts
│   └── audioWorklets.ts
├── playback/             # Playback management
│   ├── playbackmanager.ts
│   ├── playqueuemanager.ts
│   └── playerSelectionMenu.ts
├── visualizer/           # Music visualization
│   ├── visualizers.logic.ts
│   ├── butterchurn.logic.ts
│   └── WaveformCell.tsx        # Canvas-based waveform for playlists
├── nowPlayingBar/        # Playback controls
│   └── nowPlayingBar.ts
├── sitbackMode/          # Queue-focused UI
│   └── sitback.logic.ts
├── layoutManager/        # Responsive layout
├── loading/              # Loading states
└── forms/                # NEW: Form components
    └── SettingsForm.tsx  # MUI + Zod validation example

src/apps/stable/routes/lazyRoutes/
├── QueuePage.tsx         # Queue view using QueueTable
└── QueueTable.tsx        # TanStack Table with drag-and-drop

src/apps/dashboard/routes/users/
└── add.tsx               # MODERNIZED: MUI + React state (was querySelector)
\`\`\`

## Modernization Progress

### Playlist View Migration ✅
- **WaveformCell**: Canvas-based waveform rendering
- **QueueTable**: TanStack Table + @dnd-kit + @tanstack/react-virtual
- Features: Drag-and-drop, virtualization, scroll persistence, auto-center

### Form Modernization ✅
- **UserNew**: Migrated from querySelector to React state + MUI
- **SettingsForm**: Example form with Zod validation
- Pattern: Zod schema → useState → MUI components → async handlers

## Best Practices

### Do: React State for Forms
\`\`\`typescript
// ✅ GOOD: Use React state
const [formData, setFormData] = useState({ username: '', password: '' });
<TextField value={formData.username} onChange={(e) => setFormData(...)} />
\`\`\`

### Don't: querySelector
\`\`\`typescript
// ❌ BAD: Direct DOM manipulation
const username = (page.querySelector('#txtUsername') as HTMLInputElement).value;
\`\`\`

### Do: Zod Validation
\`\`\`typescript
// ✅ GOOD: Zod schema validation
const userSchema = z.object({
    username: z.string().min(1, 'Required'),
    password: z.string().optional()
});
type UserFormData = z.infer<typeof userSchema>;
\`\`\`

### Do: MUI Components
\`\`\`typescript
// ✅ GOOD: Use MUI
<TextField label='Username' required />
<Button type='submit' variant='contained'>Save</Button>
\`\`\`

### Do: Async/Await for Mutations
\`\`\`typescript
// ✅ GOOD: Async/await pattern
try {
    const response = await createUser.mutateAsync({ name: username });
    await updateUserPolicy.mutateAsync({ ... });
    navigate('/success');
} catch (error) {
    setErrorToastOpen(true);
}
\`\`\`

## TanStack Libraries Available

| Library | Purpose | Usage |
|---------|---------|-------|
| @tanstack/react-table | Data tables | QueueTable |
| @tanstack/react-virtual | Virtualization | Large lists |
| @tanstack/react-query | Data fetching | useFetchItems, useUsers |
| @tanstack/react-form | Form state | SettingsForm |
| @dnd-kit/* | Drag-and-drop | QueueTable reordering |

## Files
- \`src/components/layoutManager.ts\` - Layout coordination
- \`src/components/pluginManager.ts\` - Plugin system
- \`src/components/sitbackMode/sitback.logic.ts\` - Sit back mode
- \`src/components/forms/SettingsForm.tsx\` - Form pattern example
- \`src/apps/dashboard/routes/users/add.tsx\` - Modernized user form
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
