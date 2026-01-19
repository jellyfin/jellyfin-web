import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-audio-engine',
    version: '1.0.0'
});

const CROSSFADE_CONFIG = {
    enabled: true,
    sustain: 0.45,
    fadeOut: 1,
    busy: false,
    triggered: false,
    manualTrigger: false
};

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_crossfade_config',
    'Get the current crossfade configuration and state',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    config: CROSSFADE_CONFIG,
                    description: 'Crossfade manages seamless track transitions',
                    properties: {
                        enabled: 'Whether crossfade is active',
                        sustain: 'Duration to hold first track (seconds)',
                        fadeOut: 'Duration to fade out first track (seconds)',
                        busy: 'Whether crossfade is in progress',
                        triggered: 'Whether crossfade was triggered automatically',
                        manualTrigger: 'Whether crossfade was triggered manually'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'set_crossfade_duration',
    'Set the crossfade duration and update derived values',
    { duration: z.number().min(0).max(30).describe('Crossfade duration in seconds') },
    async ({ duration }: { duration: number }) => {
        if (duration < 0.01) {
            CROSSFADE_CONFIG.enabled = false;
            CROSSFADE_CONFIG.fadeOut = 0;
            CROSSFADE_CONFIG.sustain = 0;
        } else if (duration < 0.51) {
            CROSSFADE_CONFIG.enabled = true;
            CROSSFADE_CONFIG.fadeOut = duration;
            CROSSFADE_CONFIG.sustain = duration / 2;
        } else {
            CROSSFADE_CONFIG.enabled = true;
            CROSSFADE_CONFIG.fadeOut = duration * 2;
            CROSSFADE_CONFIG.sustain = duration / 12;
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    message: `Crossfade duration set to ${duration}s`,
                    config: CROSSFADE_CONFIG
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_syncmanager_info',
    'Get information about the SyncManager for MediaElement synchronization',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Global synchronization for MediaElements to reduce jitter from network delays',
                    features: [
                        'Registers MediaElements with start times',
                        'Calculates average playback time as master reference',
                        'Applies corrections via playback rate adjustments or seeking',
                        'Handles buffering delays to prevent crossfade during insufficient buffer',
                        'Automatic cleanup and error handling'
                    ],
                    architecture: {
                        elements: 'Map of HTMLMediaElement to start time',
                        masterTime: 'Reference time calculated from all elements',
                        intervals: { active: '100ms when synchronizing', idle: '1000ms when idle' },
                        activeInterval: 100,
                        idleInterval: 1000
                    },
                    keyMethods: {
                        registerElement: 'Add media element with optional start time',
                        unregisterElement: 'Remove element from sync',
                        stopSync: 'Stop all synchronization',
                        getMasterTime: 'Get synchronized time reference'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_audio_store_schema',
    'Get the Zustand audio store schema and methods',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    store: 'audioStore',
                    description: 'Zustand store for managing audio engine state',
                    state: {
                        volume: 'Current volume level (0-100)',
                        muted: 'Mute state',
                        makeupGain: 'Audio normalization gain (0.5-2.0)',
                        isReady: 'Whether audio engine is ready',
                        isPlaying: 'Playback state',
                        currentTrack: 'Current track info (id, name, artist, album, imageUrl, runtimeTicks, streamInfo)',
                        currentTime: 'Current playback position in seconds',
                        duration: 'Total track duration in seconds'
                    },
                    actions: {
                        setVolume: 'Set volume with clamping (0-100)',
                        setMuted: 'Toggle mute state',
                        setMakeupGain: 'Set makeup gain with clamping (0.5-2.0)',
                        setIsReady: 'Set ready state',
                        setIsPlaying: 'Set playing state',
                        setCurrentTrack: 'Set current track (null to clear)',
                        setCurrentTime: 'Set current time',
                        setDuration: 'Set duration',
                        syncWithMediaStore: 'Sync with mediaStore playback state'
                    },
                    integration: 'Syncs with mediaStore for playback and settingsStore for volume',
                    deprecationNote: 'Use mediaStore for playback state and settingsStore for volume'
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_audio_chain_info',
    'Get information about the audio chain architecture',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    audioChain: {
                        description: 'Web Audio API pipeline with separate gain nodes',
                        stages: [
                            { name: 'MediaElement', role: 'Audio source' },
                            { name: 'SourceNode', role: 'Web Audio source from media element' },
                            { name: 'DelayNode', role: 'Optional delay effects' },
                            { name: 'NormalizationGainNode', role: 'Per-track/album volume normalization' },
                            { name: 'CrossfadeGainNode', role: 'Crossfading automation (exponential ramps)' },
                            { name: 'MasterMixer', role: 'User volume control (global output level)' },
                            { name: 'Limiter', role: 'Brick-wall limiter (DynamicsCompressor fallback)' },
                            { name: 'Output', role: 'Final audio output' }
                        ]
                    },
                    audioWorklets: [
                        { name: 'limiterWorklet.js', role: 'Brick-wall limiter' },
                        { name: 'gainWorklet.js', role: 'Gain control' },
                        { name: 'delayWorklet.js', role: 'Delay effects' },
                        { name: 'biquadWorklet.js', role: 'EQ filtering' }
                    ],
                    keyConcepts: {
                        gaplessCrossfade: 'Seamless track transitions without gaps',
                        syncIntegration: 'SyncManager prevents jitter during crossfade',
                        separateGainNodes: 'Normalization, crossfade, and master volume are separate'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_visualizer_info',
    'Get information about the music visualizer system',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    visualizers: {
                        butterchurn: {
                            type: 'OpenGL visualizer',
                            features: ['Butterchurn presets', 'Full CSS blending support', 'Frequency analyzer integration', 'Waveform display'],
                            files: ['src/components/visualizer/visualizers.logic.ts', 'src/components/visualizer/visualizers.scss']
                        },
                        waveform: { type: 'Time-domain visualization', purpose: 'Display audio amplitude over time' },
                        frequency: { type: 'Frequency-domain visualization', purpose: 'Display frequency spectrum' }
                    },
                    settings: { persistence: 'Settings persist across sessions', presets: 'Pre-configured visualization modes' }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'cancel_crossfade',
    'Cancel all active crossfade timeouts and reset state',
    { _dummy: z.literal(0).optional() },
    async () => {
        CROSSFADE_CONFIG.busy = false;
        CROSSFADE_CONFIG.triggered = false;
        CROSSFADE_CONFIG.manualTrigger = false;
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({ message: 'Crossfade cancelled and state reset', config: CROSSFADE_CONFIG }, null, 2)
            }]
        };
    }
);

server.resource(
    'audio-engine-docs',
    'jellyfin://audio-engine/docs',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://audio-engine/docs',
                mimeType: 'text/markdown',
                text: `# Jellyfin Audio Engine

## Overview
The audio engine implements a sophisticated Web Audio API pipeline with separate gain nodes for normalization, crossfading, and user volume control.

## Audio Chain
MediaElement → SourceNode → [DelayNode] → NormalizationGainNode → CrossfadeGainNode → MasterMixer → Limiter → Output

## Crossfade System
- **gaplessCrossfade**: Seamless track transitions without gaps
- **Buffering-aware**: Prevents crossfade during insufficient buffer
- **Priority buffering**: Ensures smooth transitions

## SyncManager
Global synchronization for MediaElements to reduce jitter:
- Registers elements with start times
- Calculates average playback time as master reference
- Applies corrections via playback rate or seeking
- Automatic cleanup and error handling

## AudioWorklets
- \`limiterWorklet.js\`: Brick-wall limiter
- \`gainWorklet.js\`: Gain control
- \`delayWorklet.js\`: Delay effects
- \`biquadWorklet.js\`: EQ filtering

## Key Files
- \`src/components/audioEngine/crossfader.logic.ts\`: Crossfade state
- \`src/components/audioEngine/crossfadeController.ts\`: Crossfade control
- \`src/store/audioStore.ts\`: Zustand audio state store
- \`src/components/visualizer/visualizers.logic.ts\`: Visualizer system
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
