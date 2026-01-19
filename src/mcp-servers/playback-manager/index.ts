import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-playback-manager',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_playback_overview',
    'Get overview of Jellyfin playback pipeline architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    coreComponents: [
                        {
                            name: 'PlaybackManager',
                            purpose: 'Central playback controller - manages players, queue, and playback state',
                            file: 'src/components/playback/playbackmanager.ts',
                            responsibilities: [
                                'Player selection and switching',
                                'Queue management via PlayQueueManager',
                                'Playback state management',
                                'Progress tracking and reporting',
                                'Crossfade coordination'
                            ]
                        },
                        {
                            name: 'PlayQueueManager',
                            purpose: 'Manages playback queue and item ordering',
                            file: 'src/components/playback/playqueuemanager.ts',
                            responsibilities: [
                                'Queue item ordering',
                                'Shuffle/repeat mode handling',
                                'Queue persistence'
                            ]
                        },
                        {
                            name: 'playerStore',
                            purpose: 'Zustand store for player state and capabilities',
                            file: 'src/store/playerStore.ts',
                            responsibilities: [
                                'Current player tracking',
                                'Available players enumeration',
                                'Player transfer management',
                                'Capability queries'
                            ]
                        },
                        {
                            name: 'mediaStore',
                            purpose: 'Zustand store for playback state',
                            file: 'src/store/mediaStore.ts',
                            responsibilities: [
                                'Current item tracking',
                                'Playback status (idle/loading/playing/paused)',
                                'Progress tracking',
                                'Stream info management'
                            ]
                        }
                    ],
                    playbackFlow: [
                        '1. User selects item to play',
                        '2. PlaybackManager selects best player',
                        '3. PlayQueueManager queues item',
                        '4. mediaStore sets currentItem',
                        '5. Player loads and starts playback',
                        '6. Progress updates flow to mediaStore',
                        '7. Report to server (Sessions API)'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_player_selection',
    'Understand how the system selects the best player for playback',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    playerTypes: [
                        {
                            name: 'HtmlAudioPlayer',
                            purpose: 'Primary audio playback via HTML5 Audio element',
                            features: ['HLS support', 'Crossfade', 'Normalization', 'Gapless playback'],
                            file: 'src/plugins/htmlAudioPlayer/plugin.ts'
                        },
                        {
                            name: 'VideoPlayer',
                            purpose: 'Video playback via HTML5 Video element',
                            features: ['Multiple codecs', 'Subtitle rendering', 'Quality selection']
                        },
                        {
                            name: 'ExternalPlayer',
                            purpose: 'Playback via external applications (AirPlay, Chromecast)',
                            features: ['Device streaming', 'Remote control']
                        }
                    ],
                    selectionCriteria: [
                        {
                            factor: 'Media Type',
                            logic: 'Audio items → HtmlAudioPlayer, Video items → VideoPlayer'
                        },
                        {
                            factor: 'Capability',
                            logic: 'Check player.canPlayMediaType(item.mediaType)'
                        },
                        {
                            factor: 'Local vs Remote',
                            logic: 'Local players preferred, external for device streaming'
                        },
                        {
                            factor: 'User Preference',
                            logic: 'settingsStore.ui.playerPreference'
                        }
                    ],
                    playerCapabilities: [
                        'play', 'pause', 'stop', 'seek',
                        'volume', 'mute',
                        'getPlayerState', 'getSupportedCommands'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_transcode_policy',
    'Understand how the system decides between direct play, direct stream, and transcode',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    decisionTypes: [
                        {
                            type: 'DirectPlay',
                            description: 'Stream file as-is without transcoding',
                            requirements: ['Codec supported by player', 'Container compatible', 'Bitrate within limits'],
                            performance: 'Best - no CPU overhead'
                        },
                        {
                            type: 'DirectStream',
                            description: 'Remux container without transcoding video/audio',
                            requirements: ['Player can remux', 'Different container needed'],
                            performance: 'Good - minimal CPU overhead'
                        },
                        {
                            type: 'Transcode',
                            description: 'Re-encode media for player compatibility',
                            requirements: ['Codec not supported', 'Container not supported', 'Quality limits'],
                            performance: 'Poor - high CPU usage, quality loss possible'
                        }
                    ],
                    decisionFactors: [
                        {
                            factor: 'Device Capabilities',
                            check: 'Player-supported codecs and containers'
                        },
                        {
                            factor: 'Bitrate Limits',
                            check: 'Device streaming limits from device profile'
                        },
                        {
                            factor: 'Transcode Policy',
                            check: 'Policy rules for when transcoding is allowed',
                            file: 'src/store/domain/playback/transcodePolicy.ts'
                        },
                        {
                            factor: 'User Settings',
                            check: 'allowTranscoding preference'
                        }
                    ],
                    policyRules: [
                        'Audio: Always direct play if possible',
                        'Video: Transcode if exceeds device limits or unsupported codec',
                        'Fallback: DirectStream if transcoding not allowed',
                        'Final: Transcode if no other option'
                    ],
                    loggingPatterns: [
                        'Direct play available → logger.info',
                        'Transcode required → logger.warn with reason',
                        'Transcode not allowed → logger.error'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_crossfade_integration',
    'Understand how crossfade integrates with playback',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    crossfadeTriggers: [
                        {
                            trigger: 'timeRunningOut() check',
                            logic: 'When remaining time <= crossfade.fadeOut * 1.5',
                            location: 'crossfader.logic.ts'
                        },
                        {
                            trigger: 'Manual skip',
                            logic: 'User clicks next before track ends'
                        },
                        {
                            trigger: 'Queue advance',
                            logic: 'Auto-advance to next track'
                        }
                    ],
                    crossfadeProcess: [
                        '1. timeRunningOut() detects near-end',
                        '2. Preload next track (crossfadePreloadHandler)',
                        '3. Start fading out current track',
                        '4. Fade in next track with overlap',
                        '5. Switch active track seamlessly'
                    ],
                    syncIntegration: [
                        'SyncManager coordinates timing between tracks',
                        'Prevents jitter during transition',
                        'Priority buffering for smooth crossfade'
                    ],
                    keyVariables: {
                        'xDuration.enabled': 'Whether crossfade is active',
                        'xDuration.fadeOut': 'Duration to fade out first track',
                        'xDuration.sustain': 'Duration to hold first track before fade'
                    },
                    userSettings: {
                        'crossfadeDuration': 'User-configured crossfade length',
                        'gaplessPlayback': 'Enable seamless track transitions'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_progress_tracking',
    'Understand how playback progress is tracked and reported',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    progressData: {
                        currentTime: 'Current playback position in seconds',
                        duration: 'Total item duration in seconds',
                        percent: 'Progress as percentage (0-100)',
                        buffered: 'Buffered amount as percentage'
                    },
                    updateFrequency: {
                        playing: 'Update every ~100ms via timeupdate event',
                        paused: 'No updates (cached state)',
                        buffering: 'Paused during buffer'
                    },
                    serverReporting: {
                        endpoint: 'Sessions/Playing (progress)',
                        trigger: 'timeupdate event with significant progress change',
                        stopped: 'Sessions/Playing/Stopped when playback ends',
                        events: ['PlaybackStart', 'PlaybackStop', 'PlaybackProgress']
                    },
                    mediaStoreIntegration: {
                        action: 'updateProgress(currentTime, duration)',
                        result: 'Updates progress state, recalculates percent and buffered'
                    },
                    progressAccuracy: {
                        source: 'Player timeupdate event',
                        accuracy: 'Limited to browser refresh rate (~60fps)',
                        drift: 'Corrected via periodic server sync'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_error_handling',
    'Understand playback error handling patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    errorTypes: [
                        {
                            type: 'MediaError',
                            source: 'HTML5 media element errors',
                            codes: ['MEDIA_ERR_ABORTED', 'MEDIA_ERR_NETWORK', 'MEDIA_ERR_DECODE', 'MEDIA_ERR_SRC_NOT_SUPPORTED']
                        },
                        {
                            type: 'PlaybackErrorCode',
                            source: 'Jellyfin SDK error codes',
                            handling: 'Mapped to user-friendly messages'
                        },
                        {
                            type: 'TranscodeError',
                            source: 'Transcoding pipeline failures',
                            handling: 'Fallback to direct play or report to server'
                        }
                    ],
                    errorHandlers: [
                        {
                            location: 'audioErrorHandler.ts',
                            purpose: 'Handle HTMLAudioPlayer errors',
                            actions: ['Retry with different quality', 'Fallback to direct play', 'Report to server']
                        },
                        {
                            location: 'getMediaError()',
                            purpose: 'Convert error codes to user messages',
                            output: 'Localized error messages for display'
                        }
                    ],
                    recoveryStrategies: [
                        '1. Retry same stream',
                        '2. Fallback to lower quality',
                        '3. Transcode instead of direct play',
                        '4. Report error and show user message'
                    ],
                    loggingPatterns: [
                        'logger.error for critical playback failures',
                        'logger.warn for degradations (transcode fallback)',
                        'logger.debug for retry attempts'
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'playback-docs',
    'jellyfin://playback/architecture',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://playback/architecture',
                mimeType: 'text/markdown',
                text: `# Jellyfin Playback Architecture

## Overview
Multi-layer playback system with player abstraction, queue management, and state tracking.

## Architecture
\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    PlaybackManager                               │
│  - Player selection & switching                                  │
│  - Queue management (PlayQueueManager)                          │
│  - Progress tracking & reporting                                 │
│  - Crossfade coordination                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  playerStore  │ │  mediaStore   │ │  queueStore   │
│  Player state │ │  Playback     │ │  Queue items  │
│  & capabilities│ │  status       │ │  & navigation │
└───────────────┘ └───────────────┘ └───────────────┘
        │                │                │
        ▼                ▼                ▼
┌───────────────────────────────────────────────────────────────┐
│                      Players                                    │
│  HtmlAudioPlayer │ VideoPlayer │ ExternalPlayer (AirPlay)     │
└───────────────────────────────────────────────────────────────┘
\`\`\`

## Playback Flow

### 1. Item Selection
User selects item → PlaybackManager.createPlayOptions()

### 2. Player Selection
\`\`\`typescript
// Criteria in order:
1. Media type matching (Audio → HtmlAudioPlayer)
2. Capability check (canPlayMediaType)
3. Local vs Remote preference
4. User settings
\`\`\`

### 3. Queue Setup
PlayQueueManager adds item to queue, sets currentIndex

### 4. Stream Decision
transcodePolicy.ts determines:
- DirectPlay: Stream as-is
- DirectStream: Remux container
- Transcode: Re-encode for compatibility

### 5. Playback
Player.load() → Player.play() → Progress tracking begins

### 6. Server Reporting
Sessions/Playing endpoint reports progress

## Crossfade Integration

\`\`\`typescript
// Crossfade triggers
timeRunningOut(player) → // Remaining <= fadeOut * 1.5
  → Preload next track
  → Fade out current
  → Fade in next
  → Seamless switch
\`\`\`

## Files
- \`src/components/playback/playbackmanager.ts\` - Main controller
- \`src/components/playback/playqueuemanager.ts\` - Queue management
- \`src/store/playerStore.ts\` - Player state
- \`src/store/mediaStore.ts\` - Playback state
- \`src/store/domain/playback/transcodePolicy.ts\` - Stream decisions
- \`src/components/audioEngine/crossfader.logic.ts\` - Crossfade
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
