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
    'get_audio_relationships',
    'Understand how audio engine relates to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'playback-manager',
                            relationship: 'Playback controls audio pipeline',
                            direction: 'Playback → Audio',
                            integration: 'CrossfadeController, SyncManager trigger audio changes'
                        },
                        {
                            server: 'store-architecture',
                            relationship: 'Audio settings stored in audioStore/settingsStore',
                            direction: 'Store → Audio',
                            integration: 'syncWithMediaStore, volume from settingsStore'
                        },
                        {
                            server: 'components',
                            relationship: 'Visualizer displays audio data',
                            direction: 'Audio → Component',
                            integration: 'Butterchurn, WaveformCell, FrequencyAnalyzer'
                        },
                        {
                            server: 'api',
                            relationship: 'Audio streams come from API',
                            direction: 'API → Audio',
                            integration: 'getAudioStream() provides source URL'
                        },
                        {
                            server: 'performance',
                            relationship: 'Audio processing is monitored',
                            direction: 'Audio → Performance',
                            integration: 'AudioWorklet performance tracked'
                        },
                        {
                            server: 'architecture',
                            relationship: 'Audio is the processing layer',
                            direction: 'Processes audio data for playback',
                            integration: 'Web Audio API pipeline with multiple stages'
                        }
                    ],
                    audioToComponentFlow: [
                        {
                            audio: 'AudioContext analyzer',
                            component: 'Butterchurn',
                            data: 'getByteFrequencyData()',
                            file: 'src/components/visualizer/Butterchurn.tsx'
                        },
                        {
                            audio: 'AudioContext source',
                            component: 'WaveformCell',
                            data: 'decodeAudioData() peaks',
                            file: 'src/components/visualizer/WaveformCell.tsx'
                        },
                        {
                            audio: 'AudioContext analyzer',
                            component: 'FrequencyAnalyzer',
                            data: 'frequency data bars',
                            file: 'src/components/visualizer/FrequencyAnalyzer.tsx'
                        }
                    ],
                    storeToAudioFlow: [
                        {
                            store: 'settingsStore',
                            setting: 'audio.volume',
                            audioEffect: 'MasterMixer gain value',
                            file: 'src/components/audioEngine/master.logic.ts'
                        },
                        {
                            store: 'settingsStore',
                            setting: 'audio.makeupGain',
                            audioEffect: 'NormalizationGainNode',
                            file: 'src/components/audioEngine/master.logic.ts'
                        },
                        {
                            store: 'settingsStore',
                            setting: 'playback.crossfadeDuration',
                            audioEffect: 'CrossfadeController duration',
                            file: 'src/components/audioEngine/crossfadeController.ts'
                        }
                    ],
                    playbackToAudioTriggers: [
                        {
                            event: 'track start',
                            audioAction: 'Create source node, connect pipeline',
                            file: 'src/components/audioEngine/audioWorklets.ts'
                        },
                        {
                            event: 'crossfade start',
                            audioAction: 'Ramp gain nodes, sync tracks',
                            file: 'src/components/audioEngine/crossfadeController.ts'
                        },
                        {
                            event: 'volume change',
                            audioAction: 'Update MasterMixer gain',
                            file: 'src/components/audioEngine/master.logic.ts'
                        },
                        {
                            event: 'track end',
                            audioAction: 'Cleanup, prepare next track',
                            file: 'src/components/audioEngine/crossfader.logic.ts'
                        }
                    ]
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

createTool(
    'get_audio_worklet_patterns',
    'Understand AudioWorklet patterns for custom audio processing',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    workletFiles: [
                        {
                            name: 'limiterWorklet.js',
                            purpose: 'Brick-wall limiter to prevent overs',
                            parameters: ['threshold', 'release', 'ratio'],
                            process: 'Dynamic range compression'
                        },
                        {
                            name: 'gainWorklet.js',
                            purpose: 'Gain control with smooth transitions',
                            parameters: ['gain'],
                            process: 'Volume control with ramp smoothing'
                        },
                        {
                            name: 'delayWorklet.js',
                            purpose: 'Delay effects for timing',
                            parameters: ['delayTime', 'feedback', 'mix'],
                            process: 'Echo/delay effects'
                        },
                        {
                            name: 'biquadWorklet.js',
                            purpose: 'EQ filtering',
                            parameters: ['type', 'frequency', 'Q', 'gain'],
                            process: 'Lowpass, highpass, peaking, etc.'
                        }
                    ],
                    workletPattern: [
                        {
                            name: 'Loading a worklet',
                            code: "const loadWorklet = async (context, name) => {\n    const url = new URL('/assets/audio/' + name + '.js', window.location.origin);\n    await context.audioWorklet.addModule(url);\n    return new AudioWorkletNode(context, name.replace('Worklet', ''));\n};"
                        },
                        {
                            name: 'Creating limiter node',
                            code: "const limiter = await loadWorklet(audioContext, 'limiterWorklet');\nlimiter.parameters.get('threshold').value = -3;\nlimiter.parameters.get('release').value = 0.25;\nsource.connect(limiter);\nlimiter.connect(destination);"
                        },
                        {
                            name: 'Parameter automation',
                            code: "// Smooth gain transitions\ngainNode.gain.setValueAtTime(0, context.currentTime);\ngainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.1);\n\n// Immediate parameter change\ngainNode.parameters.get('gain').value = 0.5;"
                        }
                    ],
                    workletFallback: [
                        'Use DynamicsCompressorNode if AudioWorklet unavailable',
                        'Prefer native nodes for simple gain/volume',
                        'Test in browsers without worklet support',
                        'Provide graceful degradation'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_sync_manager',
    'Understand SyncManager for audio synchronization',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    purpose: 'Keep multiple MediaElements synchronized during crossfade transitions',
                    file: 'src/components/audioEngine/crossfader.logic.ts',
                    class: 'SyncManager',
                    responsibilities: [
                        'Coordinate multiple audio elements',
                        'Maintain sample-accurate timing',
                        'Handle crossfade transitions',
                        'Prevent audio glitches'
                    ],
                    syncTechniques: [
                        {
                            technique: 'Dual-playback',
                            description: 'Pre-load next track while current plays',
                            code: "const syncManager = new SyncManager();\nsyncManager.startCrossfade(currentElement, nextElement, duration);"
                        },
                        {
                            technique: 'Sample-accurate seek',
                            description: 'Seek both elements to same position',
                            code: "const targetTime = currentElement.currentTime;\nnextElement.currentTime = targetTime;"
                        },
                        {
                            technique: 'Gain coordination',
                            description: 'Coordinate crossfade curves',
                            code: "currentGain.gain.setTargetAtTime(0, time, fadeTime);\nnextGain.gain.setTargetAtTime(1, time, fadeTime);"
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_current_audio_architecture',
    'Understand the current audio architecture and what stays unchanged',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    principle: 'Conservative approach - optimize existing, avoid unnecessary changes',
                    currentArchitecture: {
                        status: 'stable',
                        lastModified: '2024',
                        testCoverage: 'Comprehensive'
                    },
                    nativeWebAudioNodes: {
                        status: 'Keep as-is',
                        nodes: [
                            {
                                node: 'GainNode',
                                usage: ['Master volume', 'Normalization gain', 'Crossfade gain'],
                                reason: 'Hardware-accelerated, built-in ramp automation, zero JS overhead'
                            },
                            {
                                node: 'BiquadFilterNode',
                                usage: ['Simple tone control', 'Basic EQ'],
                                reason: 'Native implementation, sufficient for 1-3 bands'
                            },
                            {
                                node: 'DelayNode',
                                usage: ['Waveform visualizer delay'],
                                reason: 'Built-in, highly optimized'
                            },
                            {
                                node: 'DynamicsCompressorNode',
                                usage: ['Limiter fallback'],
                                reason: 'Platform-specific optimization, well-tuned defaults'
                            }
                        ]
                    },
                    wasmProcessors: {
                        status: 'Keep and optimize',
                        processors: [
                            {
                                worklet: 'limiterWorklet.ts',
                                wasm: 'audio-engine.wasm',
                                functions: ['process_limiter', 'allocate'],
                                status: 'active_with_js_fallback',
                                optimization: 'Focus on improving existing implementation'
                            },
                            {
                                worklet: 'biquadWorklet.ts',
                                wasm: 'audio-engine.wasm',
                                functions: ['process_biquad', 'allocate_state'],
                                status: 'active_with_js_fallback',
                                optimization: 'Focus on improving existing implementation'
                            }
                        ]
                    },
                    jsWorklets: {
                        status: 'Keep as-is',
                        worklets: [
                            {
                                worklet: 'gainWorklet.ts',
                                complexity: 'low',
                                reason: 'Simple multiplication, native GainNode available for complex cases'
                            },
                            {
                                worklet: 'delayWorklet.ts',
                                complexity: 'medium',
                                reason: 'Stateful delay, native DelayNode available'
                            }
                        ]
                    },
                    doNotChange: [
                        'Audio chain topology (MediaElement → Source → Gain → Limiter → Destination)',
                        'GainNode usage for all volume control',
                        'Existing worklet fallback patterns',
                        'CrossfadeController logic',
                        'SyncManager synchronization'
                    ],
                    potentialOptimizations: [
                        {
                            priority: 'low',
                            item: 'Upgrade limiter with true peak detection',
                            file: 'src/components/audioEngine/limiterWorklet.ts',
                            effort: 'medium',
                            benefit: 'Improved audio quality'
                        },
                        {
                            priority: 'low',
                            item: 'Enhance biquad for multi-band EQ',
                            file: 'src/components/audioEngine/biquadWorklet.ts',
                            effort: 'medium',
                            benefit: 'Better EQ flexibility'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_native_webaudio_patterns',
    'Understand when to use native Web Audio API nodes',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    decisionMatrix: [
                        {
                            operation: 'Gain/Volume',
                            useApi: 'GainNode',
                            reason: 'Hardware accelerated, setTargetAtTime for smooth ramps',
                            example: "gainNode.gain.setTargetAtTime(volume, context.currentTime, 0.05)"
                        },
                        {
                            operation: 'Simple EQ (1-3 bands)',
                            useApi: 'BiquadFilterNode',
                            reason: 'Native implementation, sufficient for basic tone control',
                            example: "context.createBiquadFilter()"
                        },
                        {
                            operation: 'Delay',
                            useApi: 'DelayNode',
                            reason: 'Built-in, highly optimized',
                            example: "context.createDelay(1.0)"
                        },
                        {
                            operation: 'Compression fallback',
                            useApi: 'DynamicsCompressorNode',
                            reason: 'Platform optimization when WASM unavailable',
                            example: "context.createDynamicsCompressor()"
                        }
                    ],
                    nativePatterns: [
                        {
                            name: 'Master Volume',
                            code: "const masterGain = context.createGain();\nmasterGain.gain.value = volume / 100;\nmasterGain.connect(context.destination);"
                        },
                        {
                            name: 'Crossfade Ramp',
                            code: "sourceGain.gain.cancelScheduledValues(now);\nsourceGain.gain.setTargetAtTime(0, now, fadeTime);\nnextGain.gain.setTargetAtTime(1, now, fadeTime);"
                        },
                        {
                            name: 'Simple Delay',
                            code: "const delay = context.createDelay(1.0);\ndelay.delayTime.value = 0.3;\nsource.connect(delay);\ndelay.connect(destination);"
                        },
                        {
                            name: 'WASM Fallback',
                            code: "try {\n    limiter = new AudioWorkletNode(context, 'limiter-processor');\n} catch {\n    limiter = context.createDynamicsCompressor();\n    limiter.threshold.value = -1;\n    limiter.ratio.value = 20;\n}"
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_audio_bypass_patterns',
    'Understand clean bypass patterns for all audio processing',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    bypassPrinciple: 'Every audio processor should have a clean bypass path to ensure:\n- Zero latency when disabled\n- Bit-perfect signal passthrough\n- No artifacts or coloration when bypassed\n- Instant switching without clicks',
                    bypassImplementation: {
                        pattern: 'Switch between direct path and processed path',
                        code: "class BypassProcessor {\n    private bypassGain: GainNode;\n    private processGain: GainNode;\n    private bypass: boolean = true;\n    \n    constructor(context: AudioContext) {\n        this.bypassGain = context.createGain();\n        this.bypassGain.gain.value = 1;\n        \n        this.processGain = context.createGain();\n        this.processGain.gain.value = 0;\n        \n        // Wire up bypass and process paths\n    }\n    \n    setBypass(enabled: boolean) {\n        const now = this.context.currentTime;\n        // Smooth transition to prevent clicks\n        this.bypassGain.gain.cancelScheduledValues(now);\n        this.processGain.gain.cancelScheduledValues(now);\n        \n        if (enabled) {\n            this.bypassGain.gain.setTargetAtTime(1, now, 0.005);\n            this.processGain.gain.setTargetAtTime(0, now, 0.005);\n        } else {\n            this.bypassGain.gain.setTargetAtTime(0, now, 0.005);\n            this.processGain.gain.setTargetAtTime(1, now, 0.005);\n        }\n        \n        this.bypass = enabled;\n    }\n}"
                    },
                    bypassForBalance: {
                        pattern: 'StereoPanner bypass',
                        code: "class StereoBalanceWithBypass {\n    private panner: StereoPannerNode;\n    private dryGain: GainNode;\n    private wetGain: GainNode;\n    private merger: ChannelMergerNode;\n    \n    setBypass(enabled: boolean) {\n        const now = this.context.currentTime;\n        this.dryGain.gain.setTargetAtTime(enabled ? 1 : 0, now, 0.005);\n        this.wetGain.gain.setTargetAtTime(enabled ? 0 : 1, now, 0.005);\n    }\n}"
                    },
                    bypassForMonoSum: {
                        pattern: 'Mono sum bypass',
                        code: "class MonoSumWithBypass {\n    private merger: ChannelMergerNode;\n    private bypassSwitch: GainNode;\n    \n    setMono(enabled: boolean) {\n        if (enabled) {\n            // Route through merger\n        } else {\n            // Direct passthrough\n        }\n    }\n}"
                    },
                    bypassForTiltEQ: {
                        pattern: 'Tilt EQ bypass',
                        code: "class TiltEQWithBypass {\n    private lowShelf: BiquadFilterNode;\n    private highShelf: BiquadFilterNode;\n    private dryGain: GainNode;\n    private wetGain: GainNode;\n    \n    setBypass(enabled: boolean) {\n        const now = this.context.currentTime;\n        this.dryGain.gain.setTargetAtTime(enabled ? 1 : 0, now, 0.005);\n        this.wetGain.gain.setTargetAtTime(enabled ? 0 : 1, now, 0.005);\n        \n        // Also bypass filters to save CPU\n        this.lowShelf.enabled = !enabled;\n        this.highShelf.enabled = !enabled;\n    }\n}"
                    },
                    bypassForNotch: {
                        pattern: 'Notch filter bypass',
                        code: "class NotchFilterWithBypass {\n    private notch: BiquadFilterNode;\n    private bypassSwitch: GainNode;\n    \n    constructor(context: AudioContext) {\n        this.notch = context.createBiquadFilter();\n        this.notch.type = 'notch';\n        \n        this.bypassSwitch = context.createGain();\n        this.bypassSwitch.gain.value = 1;\n    }\n    \n    setBypass(enabled: boolean) {\n        if (enabled) {\n            // Disable filter, pass through\n            this.notch.disconnect();\n            // Wire direct path\n        }\n    }\n}"
                    },
                    bypassForLimiter: {
                        pattern: 'Limiter bypass for transparent pass-through',
                        code: "class LimiterWithBypass {\n    private limiter: DynamicsCompressorNode | AudioWorkletNode;\n    private bypassGain: GainNode;\n    \n    setBypass(enabled: boolean) {\n        const now = this.context.currentTime;\n        \n        if (enabled) {\n            // Transparent bypass - no processing\n            this.limiter.disconnect();\n        } else {\n            // Reconnect limiter\n        }\n    }\n}"
                    },
                    masterBypass: {
                        description: 'Master bypass for all audio processing',
                        implementation: 'Single toggle to bypass entire processing chain',
                        code: "class MasterAudioProcessor {\n    private inputGain: GainNode;\n    private outputGain: GainNode;\n    private processors: AudioNode[] = [];\n    \n    setMasterBypass(enabled: boolean) {\n        const now = this.context.currentTime;\n        \n        if (enabled) {\n            // Short-circuit: input -> output directly\n            this.inputGain.disconnect();\n            this.outputGain.disconnect();\n            this.inputGain.connect(this.outputGain);\n        } else {\n            // Reconnect through processing chain\n            this.rebuildProcessingChain();\n        }\n    }\n    \n    private rebuildProcessingChain() {\n        this.inputGain.disconnect();\n        this.outputGain.disconnect();\n        \n        let last = this.inputGain;\n        for (const proc of this.processors) {\n            last.connect(proc);\n            last = proc;\n        }\n        last.connect(this.outputGain);\n    }\n}"
                    },
                    bypassConsiderations: [
                        'Use smooth gain transitions (5-10ms) to prevent clicks',
                        'Bypass processing to save CPU when disabled',
                        'Test bypass with signal generator to verify flat response',
                        'Consider phase implications when bypassing crossovers',
                        'Store bypass state for session restoration'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_stereo_processing',
    'Understand stereo processing: balance, mono sum, and stereo enhancement',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    balanceControl: {
                        description: 'Stereo balance/pan control',
                        implementation: 'StereoPannerNode',
                        api: 'context.createStereoPanner()',
                        range: { min: -1, max: 1, description: 'Full left to full right' },
                        code: "const panner = context.createStereoPanner();\npanner.pan.value = balance; // -1 to 1"
                    },
                    monoSum: {
                        description: 'Combine stereo channels to mono',
                        implementation: 'ChannelMergerNode with equal gains',
                        code: "const merger = context.createChannelMerger(2);\nconst leftGain = context.createGain();\nconst rightGain = context.createGain();\nleftGain.gain.value = 0.5;\nrightGain.gain.value = 0.5;\nsource.connect(leftGain, 0, 0);\nsource.connect(rightGain, 1, 0);\nleftGain.connect(merger, 0, 0);\nrightGain.connect(merger, 0, 1);\nmerger.connect(destination);"
                    },
                    stereoEnhancement: {
                        description: 'Widen stereo image',
                        implementation: 'Mid-side processing with gain boost',
                        code: "const splitters = context.createChannelSplitter(2);\nconst merger = context.createChannelMerger(2);\nconst midGain = context.createGain();\nconst sideGain = context.createGain();\n\n// Mid = L + R, Side = L - R\nsource.connect(splitters);\nsplitters.connect(midGain, 0, 0);\nsplitters.connect(midGain, 1, 0);\nsplitters.connect(sideGain, 0, 0);\nsplitters.connect(sideGain, 1, 0);\n\nmidGain.connect(merger, 0, 0);\nsideGain.connect(merger, 0, 1);\n\nsideGain.gain.value = 1.5; // Stereo widen\nmidGain.connect(merger, 0, 1); // Mid to right channel"
                    },
                    stereoToMonoSwitch: {
                        description: 'Toggle between stereo and mono',
                        implementation: 'Switch between direct and merged paths',
                        code: "function setMonoMode(mono: boolean) {\n    if (mono) {\n        leftGain.disconnect();\n        rightGain.disconnect();\n        leftGain.connect(merger, 0, 0);\n        rightGain.connect(merger, 0, 1);\n    } else {\n        leftGain.disconnect();\n        rightGain.disconnect();\n        leftGain.connect(merger, 0, 0);\n        rightGain.connect(merger, 0, 1);\n    }\n}"
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_tilt_eq',
    'Understand tilt EQ for spectral tilt/shelving',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    tiltEq: {
                        description: 'Tilt EQ boosts highs while cutting lows (or vice versa)',
                        implementation: 'Two biquad filters - high shelf + low shelf',
                        frequency: 'Typically 1kHz to 3kHz',
                        gain: 'Positive = brighter, Negative = warmer',
                        code: "function createTiltEQ(context: AudioContext, frequency: number = 1000) {\n    const lowShelf = context.createBiquadFilter();\n    lowShelf.type = 'lowshelf';\n    lowShelf.frequency.value = frequency;\n    lowShelf.gain.value = 0; // Will be controlled\n    \n    const highShelf = context.createBiquadFilter();\n    highShelf.type = 'highshelf';\n    highShelf.frequency.value = frequency;\n    highShelf.gain.value = 0; // Will be controlled (opposite of lowShelf)\n    \n    lowShelf.connect(highShelf);\n    return { lowShelf, highShelf };\n}\n\nfunction setTilt(tiltEq: { lowShelf: BiquadFilterNode, highShelf: BiquadFilterNode }, gainDb: number) {\n    tiltEq.lowShelf.gain.value = gainDb;\n    tiltEq.highShelf.gain.value = -gainDb;\n}"
                    },
                    toneControl: {
                        description: 'Simple tone control (bass/treble)',
                        implementation: 'Low shelf + High shelf with fixed frequency',
                        bassFreq: '100Hz to 200Hz',
                        trebleFreq: '3000Hz to 6000Hz',
                        code: "function createToneControl(context: AudioContext) {\n    const bass = context.createBiquadFilter();\n    bass.type = 'lowshelf';\n    bass.frequency.value = 200;\n    bass.gain.value = 0;\n    \n    const treble = context.createBiquadFilter();\n    treble.type = 'highshelf';\n    treble.frequency.value = 3000;\n    treble.gain.value = 0;\n    \n    bass.connect(treble);\n    return { bass, treble };\n}"
                    },
                    loudnessCompensation: {
                        description: 'Fletcher-Munson curve compensation',
                        implementation: 'Tilt EQ that varies with volume',
                        code: "function applyLoudnessCompensation(volume: number, tiltGain: number) {\n    // At low volumes, humans perceive less bass and treble\n    // Compensate by tilting EQ based on volume level\n    const compensation = (1 - volume) * 3; // dB boost at low volume\n    return tiltGain + compensation;\n}"
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_timeshift_processing',
    'Understand time-shift and pitch processing options',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    playbackRate: {
                        description: 'Simple playback rate change (speed up/slow down)',
                        implementation: 'MediaElement or AudioBufferSourceNode playbackRate',
                        sideEffect: 'Changes pitch when rate != 1',
                        code: "const audio = new Audio();\naudio.src = url;\naudio.playbackRate = 0.5; // Half speed, half pitch\n// For pitch-correct: use AudioWorklet with resampling"
                    },
                    simplePitchShift: {
                        description: 'Pitch shift without speed change',
                        implementation: 'Requires time-stretching algorithm',
                        options: ['Rubberband library (high quality)', 'Phase vocoder (faster)', 'Elastique (professional)']
                    },
                    rubberbandIntegration: {
                        description: 'Rubberband library for professional time/pitch',
                        source: 'https://github.com/breakfastquay/rubberband',
                        wasm: 'rubberband-js (WASM build available)',
                        features: ['Time-stretching', 'Pitch-shifting', 'High quality modes'],
                        status: 'External library - consider if needed'
                    },
                    elasticPitch: {
                        description: 'Web Audio API pitch shifting (basic)',
                        implementation: 'playbackRate + resampling for pitch correction',
                        code: "// Simplified pitch-corrected playback\nfunction playWithPitchCorrected(audio: HTMLAudioElement, targetRate: number) {\n    const source = context.createMediaElementSource(audio);\n    const playbackRate = audio.playbackRate;\n    \n    // For true pitch correction, need Rubberband or similar\n    // This is a basic example only\n    source.connect(context.destination);\n}"
                    },
                    timeStretchUseCases: [
                        'Match tempo to running pace',
                        'Key correction for singing',
                        'Practice tools (slow down without pitch change)',
                        'Audio alignment for video'
                    ],
                    considerations: [
                        'Quality vs latency tradeoff',
                        'CPU usage for real-time processing',
                        'Rubberband provides best quality but heaviest',
                        'Consider offline processing for maximum quality'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_notch_filter',
    'Understand notch filters with custom resonance for frequency removal',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    notchFilter: {
                        description: 'Narrow band-stop filter for removing specific frequencies',
                        useCases: ['Remove electrical hum (50/60Hz)', 'Eliminate feedback frequencies', 'Notch out interference'],
                        implementation: 'BiquadFilterNode with type notch',
                        code: "const notch = context.createBiquadFilter();\nnotch.type = 'notch';\nnotch.frequency.value = 60; // 50Hz or 60Hz for hum removal\nnotch.Q.value = 10; // High Q for narrow notch"
                    },
                    notchWithResonance: {
                        description: 'Notch filter with adjustable resonance (Q factor)',
                        parameters: {
                            frequency: { range: '20Hz to 20000Hz', description: 'Center frequency of notch' },
                            Q: { range: '0.1 to 20', description: 'Resonance factor - higher = narrower' },
                            gain: { range: '-20 to 20 dB', description: 'Boost/cut at center (notch depth)' }
                        },
                        code: "const notch = context.createBiquadFilter();\nnotch.type = 'notch';\nnotch.frequency.value = frequency; // Center freq\nnotch.Q.value = resonance; // Higher = narrower, more resonant\nnotch.gain.value = 0; // Notch depth controlled by Q"
                    },
                    dynamicNotch: {
                        description: 'Auto-notch for feedback detection',
                        implementation: 'Track peak frequency and apply notch dynamically',
                        code: "class DynamicNotch {\n    private analyzer: AnalyserNode;\n    private notch: BiquadFilterNode;\n    \n    constructor(context: AudioContext) {\n        this.analyzer = context.createAnalyser();\n        this.analyzer.fftSize = 2048;\n        this.notch = context.createBiquadFilter();\n        this.notch.type = 'notch';\n        this.notch.Q.value = 30; // Very narrow\n    }\n    \n    findAndNotchPeak(): number {\n        const data = new Float32Array(this.analyzer.frequencyBinCount);\n        this.analyzer.getFloatFrequencyData(data);\n        const peakIndex = data.reduce((maxIdx, val, idx) => \n            val > data[maxIdx] ? idx : maxIdx, 0);\n        const peakFreq = peakIndex * context.sampleRate / this.analyzer.fftSize;\n        this.notch.frequency.setValueAtTime(peakFreq, context.currentTime);\n        return peakFreq;\n    }\n}"
                    },
                    multipleNotches: {
                        description: 'Cascaded notch filters for multiple frequencies',
                        implementation: 'Series of notch filters for multi-band interference',
                        code: "function createMultiNotch(context: AudioContext, frequencies: number[]) {\n    let lastNode: AudioNode | null = null;\n    \n    for (const freq of frequencies) {\n        const notch = context.createBiquadFilter();\n        notch.type = 'notch';\n        notch.frequency.value = freq;\n        notch.Q.value = 20;\n        \n        if (lastNode) {\n            lastNode.connect(notch);\n        }\n        lastNode = notch;\n    }\n    \n    return lastNode;\n}"
                    },
                    peakingFilter: {
                        description: 'Peaking filter (inverse of notch) for boosts',
                        implementation: 'Same structure as notch but adds gain',
                        code: "const peak = context.createBiquadFilter();\npeak.type = 'peaking';\npeak.frequency.value = centerFreq;\npeak.Q.value = resonance;\npeak.gain.value = boostDb; // Positive to boost, negative to cut"
                    },
                    bandpassWithResonance: {
                        description: 'Narrow band-pass with high Q',
                        implementation: 'Pass specific frequency, reject others',
                        code: "const bandpass = context.createBiquadFilter();\nbandpass.type = 'bandpass';\nbandpass.frequency.value = centerFreq;\nbandpass.Q.value = 50; // Very narrow passband"
                    },
                    allpassFilter: {
                        description: 'All-pass filter for phase manipulation',
                        useCases: ['Phase correction', 'Delay compensation', 'Crossover alignment'],
                        implementation: 'BiquadFilterNode with type allpass',
                        code: "const allpass = context.createBiquadFilter();\nallpass.type = 'allpass';\nallpass.frequency.value = crossoverFreq;\nallpass.Q.value = 0.707; // Butterworth alignment"
                    },
                    filterComparison: [
                        { type: 'notch', bandwidth: 'Narrow', useCase: 'Remove specific frequencies' },
                        { type: 'peaking', bandwidth: 'Narrow', useCase: 'Boost/cut specific frequencies' },
                        { type: 'bandpass', bandwidth: 'Selectable', useCase: 'Isolate frequency bands' },
                        { type: 'allpass', bandwidth: 'N/A', useCase: 'Phase manipulation only' }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_equalizer_patterns',
    'Understand equalizer and audio filter patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    filterTypes: [
                        {
                            type: 'lowpass',
                            description: 'Allow frequencies below cutoff',
                            parameters: ['frequency', 'Q'],
                            useCase: 'Bass boost, rumble removal'
                        },
                        {
                            type: 'highpass',
                            description: 'Allow frequencies above cutoff',
                            parameters: ['frequency', 'Q'],
                            useCase: 'Remove low rumble, hiss removal'
                        },
                        {
                            type: 'peaking',
                            description: 'Boost/cut at specific frequency',
                            parameters: ['frequency', 'Q', 'gain'],
                            useCase: 'EQ adjustments, room correction'
                        },
                        {
                            type: 'dynamic',
                            description: 'Compressor/limiter behavior',
                            parameters: ['threshold', 'ratio', 'attack', 'release'],
                            useCase: 'Loudness normalization'
                        }
                    ],
                    presetPatterns: [
                        {
                            name: 'Flat',
                            description: 'No adjustments',
                            filters: []
                        },
                        {
                            name: 'Bass Boost',
                            description: 'Enhanced low frequencies',
                            filters: [{ type: 'lowpass', frequency: 200, Q: 1, gain: 3 }]
                        },
                        {
                            name: 'Vocal Clarity',
                            description: 'Reduce lows, enhance presence',
                            filters: [
                                { type: 'highpass', frequency: 80, Q: 0.7 },
                                { type: 'peaking', frequency: 3000, Q: 1, gain: 2 }
                            ]
                        }
                    ],
                    equalizerImplementation: [
                        {
                            pattern: 'BiquadFilterNode chain',
                            code: "const createEqualizer = (context) => {\n    const bands = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];\n    return bands.map(freq => {\n        const filter = context.createBiquadFilter();\n        filter.type = 'peaking';\n        filter.frequency.value = freq;\n        filter.Q.value = 0.5;\n        filter.gain.value = 0;\n        return filter;\n    }).reduce((prev, curr) => {\n        prev.connect(curr);\n        return curr;\n    });\n};"
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_fx_send_architecture',
    'Understand DJ-style FX send architecture with 2 busses, notch filter, and crossfader integration',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    fxSendArchitecture: {
                        description: 'DJ-style send/return architecture with 2 effect busses',
                        chain: `
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  MediaElement   │────▶│   SourceNode     │────▶│  Normalization  │────▶│   Notch Filter   │
│                 │     │                  │     │     Gain        │     │  (Pre-Fader)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘     │                  │
                                                                          │                  │
                                                                          ▼                  │
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     │  ┌──────────────┐ │
│   FX Bus 1      │◀────│  Send 1 Gain     │◀────┤ CrossfadeGain   │────▶│  │ MasterMixer  │ │
│  (Reverb/Echo)  │     │  (0-100%)        │     │   Node          │     │  │              │ │
│                 │     │                  │     │                  │     │  └──────┬─────┘ │
│ Effects:        │     └──────────────────┘     └─────────────────┘     │         │       │
│ - Reverb        │                                                    │         ▼       │
│ - Echo          │     ┌──────────────────┐     ┌─────────────────┐     │  ┌──────────────┐ │
│ - Delay         │◀────│  Send 2 Gain     │◀────│                  │     │  │   Limiter    │ │
└─────────────────┘     │  (0-100%)        │     │                  │     │  │              │ │
                        └──────────────────┘     └─────────────────┘     │  └──────────────┘ │
                                                                          │                  │
                                                                          ▼                  ▼
                                                                ┌──────────────────┐
                                                                │    FX Bus 2      │
                                                                │ (Reverb/Echo)    │
                                                                │                  │
                                                                │ Effects:         │
                                                                │ - Reverb         │
                                                                │ - Echo           │
                                                                │ - Delay          │
                                                                └──────────────────┘
                        `,
                        signalFlow: [
                            'Source → Normalization → Notch Filter → CrossfadeGain',
                            'CrossfadeGain splits signal to: MasterMix, FX Bus 1, FX Bus 2',
                            'Each FX Bus processes independently and returns to MasterMix',
                            'Notch filter applies before crossfade (pre-fader)'
                        ]
                    },
                    notchFilterWithBypass: {
                        description: 'Pre-fader notch filter with adjustable Q and bypass',
                        parameters: {
                            frequency: { range: '20Hz to 20kHz', default: 60, description: 'Notch center frequency' },
                            resonance: { range: '0.1 to 20', default: 10, description: 'Q factor - higher = narrower' },
                            enabled: { type: 'boolean', default: false, description: 'Bypass when disabled' }
                        },
                        implementation: {
                            code: "class NotchFilterWithBypass {\n    private notch: BiquadFilterNode;\n    private bypassNode: GainNode;\n    private wetGain: GainNode;\n    private dryGain: GainNode;\n    \n    constructor(context: AudioContext) {\n        this.notch = context.createBiquadFilter();\n        this.notch.type = 'notch';\n        this.notch.frequency.value = 60;\n        this.notch.Q.value = 10;\n        \n        this.bypassNode = context.createGain();\n        this.wetGain = context.createGain();\n        this.dryGain = context.createGain();\n        \n        // Dry path: bypassNode\n        this.dryGain.gain.value = 1;\n        this.wetGain.gain.value = 0;\n        \n        // Connect: Input → [notch → wetGain] + [bypass → dryGain]\n    }\n    \n    setFrequency(freq: number) {\n        this.notch.frequency.value = freq;\n    }\n    \n    setResonance(q: number) {\n        this.notch.Q.value = q;\n    }\n    \n    setEnabled(enabled: boolean) {\n        const now = this.context.currentTime;\n        const rampTime = 0.005;\n        \n        if (enabled) {\n            this.wetGain.gain.setTargetAtTime(1, now, rampTime);\n            this.dryGain.gain.setTargetAtTime(0, now, rampTime);\n        } else {\n            this.wetGain.gain.setTargetAtTime(0, now, rampTime);\n            this.dryGain.gain.setTargetAtTime(1, now, rampTime);\n        }\n    }\n}"
                        },
                        useCases: [
                            'Remove electrical hum (50Hz/60Hz)',
                            'Eliminate feedback frequencies',
                            'Notch out problematic resonances'
                        ]
                    },
                    fxSendsFromCrossfade: {
                        description: 'CrossfadeGainNode has 2 sends to FX busses',
                        implementation: {
                            code: "class CrossfadeWithFXSends {\n    private crossfadeGain: GainNode;\n    private send1Gain: GainNode;\n    private send2Gain: GainNode;\n    \n    constructor(context: AudioContext) {\n        this.crossfadeGain = context.createGain();\n        this.crossfadeGain.gain.value = 1;\n        \n        this.send1Gain = context.createGain();\n        this.send1Gain.gain.value = 0; // 0% send initially\n        \n        this.send2Gain = context.createGain();\n        this.send2Gain.gain.value = 0; // 0% send initially\n        \n        // Connect: CrossfadeGain splits to: Main, Send1, Send2\n        this.crossfadeGain.connect(this.send1Gain);\n        this.crossfadeGain.connect(this.send2Gain);\n    }\n    \n    setSendLevels(send1: number, send2: number) {\n        // 0 to 1 (0% to 100%)\n        this.send1Gain.gain.value = send1;\n        this.send2Gain.gain.value = send2;\n    }\n    \n    getOutputNode(): GainNode {\n        return this.crossfadeGain;\n    }\n    \n    getSend1Node(): GainNode {\n        return this.send1Gain;\n    }\n    \n    getSend2Node(): GainNode {\n        return this.send2Gain;\n    }\n}"
                        },
                        sendConfiguration: [
                            { send: 1, defaultEffect: 'Reverb', purpose: 'Space/time effects' },
                            { send: 2, defaultEffect: 'Echo/Delay', purpose: 'Rhythmic effects' }
                        ]
                    },
                    fxBusImplementation: {
                        description: 'Independent FX bus with effects chain and return',
                        structure: {
                            input: 'Gain-controlled from crossfade send',
                            effects: 'Series connection of effect processors',
                            wetDry: 'Mix control for effect intensity',
                            return: 'Gain-controlled return to master mix'
                        },
                        code: "class FXBus {\n    private context: AudioContext;\n    private busId: number;\n    private inputGain: GainNode;\n    private effects: AudioNode[] = [];\n    private wetGain: GainNode;\n    private dryGain: GainNode;\n    private returnGain: GainNode;\n    private enabled: boolean = true;\n    \n    constructor(context: AudioContext, busId: number) {\n        this.context = context;\n        this.busId = busId;\n        \n        this.inputGain = context.createGain();\n        \n        this.wetGain = context.createGain();\n        this.wetGain.gain.value = 0.5;\n        \n        this.dryGain = context.createGain();\n        this.dryGain.gain.value = 0.5;\n        \n        this.returnGain = context.createGain();\n        this.returnGain.gain.value = 1;\n    }\n    \n    addEffect(effect: AudioNode) {\n        if (this.effects.length === 0) {\n            this.inputGain.connect(effect);\n        } else {\n            this.effects[this.effects.length - 1].connect(effect);\n        }\n        effect.connect(this.wetGain);\n        this.effects.push(effect);\n    }\n    \n    addReverb(decay: number = 2, mix: number = 0.5) {\n        const convolver = this.context.createConvolver();\n        // Generate reverb impulse response...\n        this.addEffect(convolver);\n        this.wetGain.gain.value = mix;\n    }\n    \n    addEcho(time: number = 0.5, feedback: number = 0.4, mix: number = 0.3) {\n        const delay = this.context.createDelay(2);\n        delay.delayTime.value = time;\n        \n        const feedbackGain = this.context.createGain();\n        feedbackGain.gain.value = feedback;\n        \n        const wet = this.context.createGain();\n        wet.gain.value = mix;\n        \n        delay.connect(feedbackGain);\n        feedbackGain.connect(delay);\n        delay.connect(wet);\n        \n        this.addEffect(delay);\n        this.wetGain.gain.value = mix;\n    }\n    \n    setWetMix(mix: number) {\n        const now = this.context.currentTime;\n        this.wetGain.gain.setTargetAtTime(mix, now, 0.01);\n        this.dryGain.gain.setTargetAtTime(1 - mix, now, 0.01);\n    }\n    \n    setReturnLevel(level: number) {\n        this.returnGain.gain.value = level;\n    }\n    \n    connectToMaster(masterMixer: GainNode) {\n        this.returnGain.connect(masterMixer);\n    }\n    \n    connectInput(sourceNode: AudioNode) {\n        sourceNode.connect(this.inputGain);\n    }\n    \n    setEnabled(enabled: boolean) {\n        this.enabled = enabled;\n        if (enabled) {\n            this.inputGain.connect(this.effects[0] || this.wetGain);\n        } else {\n            this.inputGain.disconnect();\n        }\n    }\n}"
                    },
                    audioChainIntegration: {
                        description: 'Complete chain with FX sends and notch filter',
                        code: "function createDJAudioChain(context: AudioContext, masterMixer: GainNode, limiter: AudioNode) {\n    // 1. Source\n    const source = context.createMediaElementSource(element);\n    \n    // 2. Normalization\n    const normalizationGain = context.createGain();\n    normalizationGain.gain.value = item?.MediaSources?.[0]?.VolumeLevel || 1;\n    \n    // 3. Notch Filter (pre-fader)\n    const notchFilter = new NotchFilterWithBypass(context);\n    \n    // 4. Crossfade Gain with FX Sends\n    const crossfadeWithFX = new CrossfadeWithFXSends(context);\n    \n    // 5. FX Busses\n    const fxBus1 = new FXBus(context, 1); // Reverb\n    fxBus1.addReverb(2, 0.3);\n    fxBus1.connectToMaster(masterMixer);\n    crossfadeWithFX.getSend1Node().connect(fxBus1.getInputNode());\n    \n    const fxBus2 = new FXBus(context, 2); // Echo\n    fxBus2.addEcho(0.5, 0.4, 0.3);\n    fxBus2.connectToMaster(masterMixer);\n    crossfadeWithFX.getSend2Node().connect(fxBus2.getInputNode());\n    \n    // 6. Master chain\n    crossfadeWithFX.getOutputNode().connect(masterMixer);\n    masterMixer.connect(limiter);\n    limiter.connect(context.destination);\n    \n    // Chain: Source → Normalization → Notch → Crossfade → [Master + FX1 + FX2]\n    source.connect(normalizationGain);\n    normalizationGain.connect(notchFilter.getInputNode());\n    notchFilter.getOutputNode().connect(crossfadeWithFX.getInputNode());\n    \n    return {\n        source,\n        normalizationGain,\n        notchFilter,\n        crossfadeWithFX,\n        fxBus1,\n        fxBus2,\n        masterMixer,\n        limiter\n    };\n}"
                    },
                    fxBusRouting: {
                        description: 'How audio routes through FX busses',
                        bus1: {
                            name: 'FX Send 1',
                            defaultEffect: 'Reverb',
                            typicalUse: 'Space and depth effects',
                            returnTo: 'MasterMixer (before limiter)',
                            wetMix: 'Adjustable 0-100%'
                        },
                        bus2: {
                            name: 'FX Send 2',
                            defaultEffect: 'Echo/Delay',
                            typicalUse: 'Rhythmic echo effects',
                            returnTo: 'MasterMixer (before limiter)',
                            wetMix: 'Adjustable 0-100%'
                        }
                    },
                    channelStripWithFXSends: {
                        description: 'Complete channel strip with EQ, notch, and FX sends',
                        code: "interface DJChannelStrip {\n    inputGain: GainNode;\n    highEQ: BiquadFilterNode;\n    midEQ: BiquadFilterNode;\n    lowEQ: BiquadFilterNode;\n    notchFilter: NotchFilterWithBypass;\n    channelVolume: GainNode;\n    fxSend1: GainNode;\n    fxSend2: GainNode;\n    pfl: GainNode;\n    \n    connect(source: AudioNode): void;\n    getOutput(): AudioNode;\n    getFXSend1(): AudioNode;\n    getFXSend2(): AudioNode;\n    setFXSendLevels(send1: number, send2: number): void;\n    setNotch(frequency: number, resonance: number): void;\n    toggleNotch(enabled: boolean): void;\n}"
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_dj_bus_architecture',
    'Understand DJ-style bus architecture with 2 decks, 2 effect sends, and crossfader automation',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    architectureOverview: 'Pioneer DDJ-REV7 style audio chain with 2 decks, 2 effect sends, and crossfader',
                    deckCount: 2,
                    effectSends: 2,
                    architecture: {
                        decks: ['Deck A (Left)', 'Deck B (Right)'],
                        effectBusses: ['Effect Send 1', 'Effect Send 2'],
                        mainMix: 'Master Output',
                        crossfader: 'Dual-rail crossfader with curve control'
                    },
                    audioChainFlow: `
┌──────────┐     ┌──────────────────────────────────────┐     ┌──────────────┐
│  Deck A  │────▶│ Channel Strip A                      │────▶│              │
│ (Source) │     │ Gain → EQ(H/M/L) → Filter → Vol → Send│     │              │
│          │     │                        ↓       ↓     │     │   Master     │
│          │     │                  [Send 1] [Send 2]   │     │   Mix        │
└──────────┘     └──────────────────────────────────────┘     │              │
                                                           │   │              │
┌──────────┐     ┌──────────────────────────────────────┐     │              │
│  Deck B  │────▶│ Channel Strip B                      │────▶│   Crossfader │
│ (Source) │     │ Gain → EQ(H/M/L) → Filter → Vol → Send│     │   A ─── B    │
│          │     │                        ↓       ↓     │     │              │
│          │     │                  [Send 1] [Send 2]   │     │              │
└──────────┘     └──────────────────────────────────────┘     └──────────────┘
                              │                                    │
                              ▼                                    ▼
                    ┌─────────────────────────────────┐   ┌──────────────┐
                    │      Effect Bus 1                │   │   Output     │
                    │ Input → [Effect 1] → [Effect 2] │   │   Limiter    │
                    │        → Return to Main Mix      │   │   → DAC      │
                    └─────────────────────────────────┘   └──────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │      Effect Bus 2                │
                    │ Input → [Effect 1] → [Effect 2] │
                    │        → Return to Main Mix      │
                    └─────────────────────────────────┘
                    `
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_channel_strip',
    'Understand DJ channel strip with EQ, filter, volume, and effect sends',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    channelStrip: {
                        description: 'Per-deck channel strip (2 decks, A and B)',
                        components: [
                            { name: 'Input Gain', range: '-∞ to +12 dB', default: 0, purpose: 'Match source level' },
                            { name: 'High EQ', range: '-∞ to +6 dB', default: 0, purpose: 'Treble control' },
                            { name: 'Mid EQ', range: '-∞ to +6 dB', default: 0, purpose: 'Vocal/presence' },
                            { name: 'Low EQ', range: '-∞ to +6 dB', default: 0, purpose: 'Bass control' },
                            { name: 'Filter', type: 'Low/High pass', range: '20Hz-20kHz', default: 'Off', purpose: 'Sweep effect' },
                            { name: 'Channel Volume', range: '-∞ to 0 dB', default: 0, purpose: 'Channel level' },
                            { name: 'Send 1 Level', range: '0% to 100%', default: 0, purpose: 'Send to Effect Bus 1' },
                            { name: 'Send 2 Level', range: '0% to 100%', default: 0, purpose: 'Send to Effect Bus 2' },
                            { name: 'PFL', type: 'Toggle', default: 'Off', purpose: 'Pre-fade listen' }
                        ]
                    },
                    eqImplementation: {
                        type: '3-band parametric or shelving',
                        frequencies: { high: '10kHz', mid: '1kHz', low: '100Hz' },
                        code: "const createChannelStrip = (context: AudioContext) => {\n    const inputGain = context.createGain();\n    \n    const highEQ = context.createBiquadFilter();\n    highEQ.type = 'highshelf';\n    highEQ.frequency.value = 10000;\n    \n    const midEQ = context.createPeakingFilter();\n    midEQ.frequency.value = 1000;\n    \n    const lowEQ = context.createBiquadFilter();\n    lowEQ.type = 'lowshelf';\n    lowEQ.frequency.value = 100;\n    \n    const filter = context.createBiquadFilter();\n    filter.type = 'lowpass'; // or 'highpass'\n    \n    const channelVolume = context.createGain();\n    \n    const send1 = context.createGain();\n    send1.gain.value = 0;\n    \n    const send2 = context.createGain();\n    send2.gain.value = 0;\n    \n    // Chain: Gain → EQ → Filter → Volume → Main\n    //                        ↘ Send 1\n    //                          ↘ Send 2\n    \n    return { inputGain, highEQ, midEQ, lowEQ, filter, channelVolume, send1, send2 };\n}"
                    },
                    filterSection: {
                        type: 'Resonant low-pass or high-pass',
                        range: '20Hz to 20kHz',
                        resonance: 'Adjustable Q factor',
                        usage: 'Filter sweep effect during transitions',
                        code: "function setFilter(channelStrip: ChannelStrip, type: 'lowpass' | 'highpass', frequency: number, resonance: number) {\n    channelStrip.filter.type = type;\n    channelStrip.filter.frequency.value = frequency;\n    channelStrip.filter.Q.value = resonance;\n}"
                    },
                    effectSends: {
                        description: 'Independent sends to each effect bus',
                        topology: 'Pre-fader or post-fader (configurable)',
                        code: "class EffectSends {\n    private send1Gain: GainNode;\n    private send2Gain: GainNode;\n    private preFader: boolean = false;\n    \n    constructor(context: AudioContext) {\n        this.send1Gain = context.createGain();\n        this.send2Gain = context.createGain();\n    }\n    \n    setSendLevels(send1: number, send2: number) {\n        this.send1Gain.gain.value = send1;\n        this.send2Gain.gain.value = send2;\n    }\n    \n    setPreFader(enabled: boolean) {\n        this.preFader = enabled;\n        // Reconnect based on pre/post fader\n    }\n}"
                    },
                    channelStripState: {
                        interface: 'interface ChannelStripState { deckId: string; gain: number; high: number; mid: number; low: number; filterFreq: number; filterType: string; volume: number; send1: number; send2: number; pfl: boolean; }',
                        persistence: 'Saved to settingsStore for session recall'
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_effect_bus',
    'Understand effect send/return bus architecture with parallel processing',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    effectBusArchitecture: {
                        busCount: 2,
                        description: 'Two independent effect send/return busses',
                        topology: 'Send → Effects → Return → Mix',
                        usage: 'Reverb, delay, echo, and other time-based effects'
                    },
                    effectBusStructure: {
                        send: 'Gain-controlled tap from channel strips',
                        effectsChain: 'Series of effects processors',
                        return: 'Gain-controlled return to main mix',
                        wetDry: 'Adjustable wet/dry mix per effect'
                    },
                    effectBusImplementation: {
                        code: "class EffectBus {\n    private context: AudioContext;\n    private sendGain: GainNode;\n    private effects: AudioNode[] = [];\n    private returnGain: GainNode;\n    private wetGain: GainNode;\n    private dryGain: GainNode;\n    \n    constructor(context: AudioContext, busId: string) {\n        this.context = context;\n        this.sendGain = context.createGain();\n        this.returnGain = context.createGain();\n        this.wetGain = context.createGain();\n        this.dryGain = context.createGain();\n        \n        this.wetGain.gain.value = 0.5;\n        this.dryGain.gain.value = 0.5;\n    }\n    \n    addEffect(effect: AudioNode) {\n        if (this.effects.length === 0) {\n            this.sendGain.connect(effect);\n        } else {\n            this.effects[this.effects.length - 1].connect(effect);\n        }\n        effect.connect(this.returnGain);\n        this.effects.push(effect);\n    }\n    \n    setWetMix(wet: number) {\n        const now = this.context.currentTime;\n        this.wetGain.gain.setTargetAtTime(wet, now, 0.01);\n        this.dryGain.gain.setTargetAtTime(1 - wet, now, 0.01);\n    }\n    \n    connectToChannelStrip(strip: ChannelStrip, sendNumber: 1 | 2) {\n        const send = sendNumber === 1 ? strip.send1 : strip.send2;\n        send.connect(this.sendGain);\n    }\n    \n    connectToMain(mix: GainNode) {\n        this.returnGain.connect(mix);\n    }\n}"
                    },
                    availableEffects: {
                        effect1: [
                            { name: 'Reverb', types: ['Hall', 'Room', 'Plate', 'Spring'], parameters: ['decay', 'pre-delay', 'mix'] },
                            { name: 'Delay', types: ['Echo', 'Ping-Pong', 'Filter'], parameters: ['time', 'feedback', 'mix'] },
                            { name: 'Echo', types: ['Simple', 'Multi-tap'], parameters: ['time', 'tap count', 'pattern'] }
                        ],
                        effect2: [
                            { name: 'Filter', types: ['Low-pass', 'High-pass', 'Band-pass'], parameters: ['frequency', 'resonance'] },
                            { name: 'Flanger', types: ['Classic', 'Modern'], parameters: ['rate', 'depth', 'feedback'] },
                            { name: 'Phaser', types: ['4-stage', '8-stage'], parameters: ['rate', 'depth', 'stages'] },
                            { name: 'Bit Crusher', types: ['Retro', 'Glitch'], parameters: ['bit depth', 'sample rate'] }
                        ]
                    },
                    effectAutomation: {
                        description: 'Pre-configured effect chains for common DJ transitions',
                        patterns: [
                            {
                                name: 'Echo Out',
                                description: 'Echo fade during track transition',
                                effect: 'Delay with long feedback',
                                automation: 'Echo level increases as crossfader moves'
                            },
                            {
                                name: 'Spin Out',
                                description: 'Filter sweep out',
                                effect: 'High-pass filter sweep',
                                automation: 'Filter frequency increases during transition'
                            },
                            {
                                name: 'Reverb Transition',
                                description: 'Reverb build during transition',
                                effect: 'Reverb with increasing mix',
                                automation: 'Reverb wet mix follows crossfader'
                            },
                            {
                                name: 'Backspin',
                                description: 'Reverse effect with filter',
                                effect: 'Reverse delay + filter',
                                automation: 'Triggers on crossfader edge'
                            }
                        ]
                    },
                    effectParameters: {
                        common: [
                            { param: 'wetMix', range: '0 to 100%', description: 'Effect intensity' },
                            { param: 'time', range: '1ms to 2s', description: 'Delay/time parameters' },
                            { param: 'feedback', range: '0 to 100%', description: 'Regeneration amount' },
                            { param: 'frequency', range: '20Hz to 20kHz', description: 'Filter cutoff' },
                            { param: 'resonance', range: '0.1 to 20', description: 'Filter Q factor' }
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_crossfader_automation',
    'Understand DJ crossfader with automation and curve control',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    crossfaderArchitecture: {
                        type: 'Dual-rail crossfader (A/B)',
                        range: '-1 (Deck A) to +1 (Deck B)',
                        center: '0 (both decks equal)',
                        usage: 'Smooth transitions between tracks'
                    },
                    crossfaderCurve: {
                        description: 'Control transition curve sharpness',
                        types: [
                            { name: 'Sharp', curve: 'Fast transition near center', use: 'Quick cuts' },
                            { name: 'Smooth', curve: 'Gradual transition', use: 'Long blends' },
                            { name: 'Linear', curve: 'Equal power at all positions', use: 'Consistent mix' },
                            { name: 'Constant Power', curve: 'Sine curve, maintains loudness', use: 'Professional mixing' }
                        ],
                        implementation: {
                            code: "class Crossfader {\n    private curveType: 'sharp' | 'smooth' | 'linear' | 'constant-power' = 'constant-power';\n    private position: number = 0; // -1 to 1\n    \n    setCurve(type: string) {\n        this.curveType = type as CrossfaderCurveType;\n    }\n    \n    getGainA(): number {\n        // Deck A gain based on position and curve\n        const p = (1 - this.position) / 2; // 0 to 1\n        switch (this.curveType) {\n            case 'sharp': return p < 0.5 ? 1 : 1 - (p - 0.5) * 4;\n            case 'smooth': return 1 - Math.pow(p, 2);\n            case 'linear': return 1 - p;\n            case 'constant-power': return Math.cos(p * Math.PI / 2);\n            default: return 1 - p;\n        }\n    }\n    \n    getGainB(): number {\n        const p = (1 + this.position) / 2; // 0 to 1\n        switch (this.curveType) {\n            case 'sharp': return p < 0.5 ? 1 : 1 - (p - 0.5) * 4;\n            case 'smooth': return 1 - Math.pow(p - 1, 2);\n            case 'linear': return p;\n            case 'constant-power': return Math.cos(p * Math.PI / 2);\n            default: return p;\n        }\n    }\n}"
                        }
                    },
                    crossfaderAutomation: {
                        description: 'Automated crossfades with optional effect triggering',
                        patterns: [
                            {
                                name: 'Auto Fade',
                                description: 'Automated crossfade over set duration',
                                parameters: ['duration', 'curve', 'effect trigger'],
                                code: "async function autoFade(durationSeconds: number, curve: string) {\n    const startTime = Date.now();\n    const crossfader = getCrossfader();\n    \n    while (Date.now() - startTime < durationSeconds * 1000) {\n        const progress = (Date.now() - startTime) / (durationSeconds * 1000);\n        crossfader.setPosition(-1 + progress * 2);\n        await nextFrame();\n    }\n    crossfader.setPosition(1);\n}"
                            },
                            {
                                name: 'Loop Crossfade',
                                description: 'Crossfade during loop playback',
                                parameters: ['loop points', 'crossfade length']
                            },
                            {
                                name: 'Phrased Transition',
                                description: 'Crossfade on beat boundaries',
                                parameters: ['phrase length', 'timing']
                            }
                        ]
                    },
                    crossfaderEffects: {
                        description: 'Effects triggered by crossfader position',
                        triggers: [
                            {
                                zone: 'Left edge (-1)',
                                action: 'Deck A full, Deck B muted',
                                effects: ['PFL on Deck A', 'Cue preview']
                            },
                            {
                                zone: 'Center (0)',
                                action: 'Both decks at set curve levels',
                                effects: ['Transition effects active']
                            },
                            {
                                zone: 'Right edge (+1)',
                                action: 'Deck B full, Deck A muted',
                                effects: ['PFL on Deck B', 'Cue preview']
                            },
                            {
                                zone: 'Edge hold',
                                action: 'Hold crossfader at edge',
                                effects: ['Auto loop', 'Spin out effect']
                            }
                        ]
                    },
                    crossfaderCalibration: {
                        description: 'Calibrate crossfader response',
                        parameters: ['dead zone', 'curve multiplier', 'threshold'],
                        code: "interface CrossfaderCalibration {\n    deadZone: number; // Zone where both decks are muted\n    curveMultiplier: number; // Adjust curve steepness\n    autoReset: boolean; // Return to center on release\n    threshold: number; // Velocity threshold for cut\n}"
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_dj_transitions',
    'Understand professional DJ transition patterns and automations',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    transitionPatterns: [
                        {
                            name: 'Blend',
                            description: 'Basic crossfade with EQ matching',
                            duration: '16-32 bars',
                            technique: 'Match BPM, eq lows out, gradually crossfade',
                            settings: { curve: 'smooth', effect: 'None' }
                        },
                        {
                            name: 'Cut',
                            description: 'Quick switch between tracks',
                            duration: '1-2 beats',
                            technique: 'Sharp curve, no fade',
                            settings: { curve: 'sharp', effect: 'None' }
                        },
                        {
                            name: 'Echo Out',
                            description: 'Echo fade with track switch',
                            duration: '4-8 bars',
                            technique: 'Add delay to outgoing track, crossfade during echo',
                            settings: { curve: 'smooth', effect: 'Delay on Send 1' }
                        },
                        {
                            name: 'Spin Out',
                            description: 'Filter sweep transition',
                            duration: '4-8 beats',
                            technique: 'High-pass filter sweep on outgoing track',
                            settings: { curve: 'sharp', effect: 'Filter sweep on Send 2' }
                        },
                        {
                            name: 'Backspin',
                            description: 'Reverse audio effect transition',
                            duration: '2-4 beats',
                            technique: 'Trigger backspin, quick crossfade',
                            settings: { curve: 'sharp', effect: 'Reverse delay' }
                        },
                        {
                            name: 'Fliptime',
                            description: 'Reverse and filter transition',
                            duration: '1-2 bars',
                            technique: 'Play track backward with filter buildup',
                            settings: { curve: 'medium', effect: 'Filter + reverb' }
                        },
                        {
                            name: 'Phrase Transition',
                            description: 'Transition on musical phrase boundary',
                            duration: 'Phrase dependent',
                            technique: 'Analyze track structure, crossfade at breakdown',
                            settings: { curve: 'smooth', effect: 'Reverb on Send 1' }
                        },
                        {
                            name: 'Long Mix',
                            description: 'Extended blend for harmonic mixing',
                            duration: '32-64 bars',
                            technique: 'Match keys, slow crossfade, minimal EQ',
                            settings: { curve: 'constant-power', effect: 'Subtle reverb' }
                        }
                    ],
                    transitionAutomation: {
                        description: 'Automated transition execution',
                        code: "interface DJTransition {\n    type: 'blend' | 'cut' | 'echo' | 'spin' | 'backspin' | 'fliptime' | 'phrase' | 'long';\n    duration: number; // seconds or bars\n    curve: 'sharp' | 'smooth' | 'linear' | 'constant-power';\n    effectBus1: { effect: string; intensity: number; };\n    effectBus2: { effect: string; intensity: number; };\n    eqAction: { high: number; mid: number; low: number; };\n}\n\nclass TransitionEngine {\n    async execute(transition: DJTransition, deckA: ChannelStrip, deckB: ChannelStrip, crossfader: Crossfader) {\n        // Apply EQ changes\n        this.setEQ(deckA, transition.eqAction);\n        this.setEQ(deckB, transition.eqAction);\n        \n        // Enable effects\n        if (transition.effectBus1.effect) {\n            this.enableEffect(1, transition.effectBus1.effect, transition.effectBus1.intensity);\n        }\n        \n        // Execute crossfade\n        await this.crossfade(crossfader, transition.duration, transition.curve);\n        \n        // Reset after transition\n        this.resetEQ(deckA);\n        this.resetEQ(deckB);\n    }\n}"
                    },
                    beatMatching: {
                        description: 'BPM synchronization for smooth transitions',
                        implementation: [
                            'Detect BPM from track metadata or analysis',
                            'Adjust playback rate to match master BPM',
                            'Phase align for beat-synchronous transitions',
                            'Use Sync button for automatic matching'
                        ],
                        code: "function syncBPM(targetBPM: number, deck: ChannelStrip) {\n    const currentBPM = deck.getBPM();\n    const ratio = targetBPM / currentBPM;\n    deck.setPlaybackRate(ratio);\n}"
                    },
                    rekordboxIntegration: {
                        description: 'Integration with Pioneer rekordbox ecosystem',
                        features: [
                            'Import cue points and loops',
                            'Sync BPM and key data',
                            'Load saved transitions',
                            'Access cloud library'
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_dj_effect_parameters',
    'Understand DJ effect parameters and their audio implementations',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    effectParameters: {
                        reverb: {
                            types: ['Hall', 'Room', 'Plate', 'Spring'],
                            parameters: [
                                { name: 'decay', range: '0.1s to 10s', description: 'Reverb tail length' },
                                { name: 'preDelay', range: '0ms to 100ms', description: 'Initial reflection delay' },
                                { name: 'mix', range: '0% to 100%', description: 'Wet/dry balance' },
                                { name: 'highCut', range: '1kHz to 20kHz', description: 'Reverb high frequency damping' }
                            ],
                            code: "function createReverb(context: AudioContext, decay: number, mix: number) {\n    const convolver = context.createConvolver();\n    const wetGain = context.createGain();\n    const dryGain = context.createGain();\n    \n    // Generate impulse response for reverb\n    const length = context.sampleRate * decay;\n    const impulse = context.createBuffer(2, length, context.sampleRate);\n    for (let channel = 0; channel < 2; channel++) {\n        const data = impulse.getChannelData(channel);\n        for (let i = 0; i < length; i++) {\n            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);\n        }\n    }\n    convolver.buffer = impulse;\n    \n    wetGain.gain.value = mix;\n    dryGain.gain.value = 1 - mix;\n    \n    return { convolver, wetGain, dryGain };\n}"
                        },
                        delay: {
                            types: ['Echo', 'Ping-Pong', 'Dub'],
                            parameters: [
                                { name: 'time', range: '1ms to 2000ms', description: 'Delay time' },
                                { name: 'feedback', range: '0% to 100%', description: 'Regeneration amount' },
                                { name: 'mix', range: '0% to 100%', description: 'Wet/dry balance' },
                                { name: 'sync', range: 'Note values', description: 'Tempo-synced delay' }
                            ],
                            code: "function createDelay(context: AudioContext, time: number, feedback: number) {\n    const delay = context.createDelay(2);\n    delay.delayTime.value = time;\n    \n    const feedbackGain = context.createGain();\n    feedbackGain.gain.value = feedback;\n    \n    const wetGain = context.createGain();\n    wetGain.gain.value = 0.5;\n    \n    delay.connect(feedbackGain);\n    feedbackGain.connect(delay);\n    \n    return { delay, feedbackGain, wetGain };\n}"
                        },
                        filter: {
                            types: ['Low-pass', 'High-pass', 'Band-pass', 'Notch'],
                            parameters: [
                                { name: 'frequency', range: '20Hz to 20kHz', description: 'Filter cutoff' },
                                { name: 'resonance', range: '0.1 to 20', description: 'Filter Q factor' },
                                { name: 'drive', range: '0 to 20', description: 'Saturation amount' }
                            ],
                            code: "function createFilter(context: AudioContext, type: BiquadFilterType, frequency: number, resonance: number) {\n    const filter = context.createBiquadFilter();\n    filter.type = type;\n    filter.frequency.value = frequency;\n    filter.Q.value = resonance;\n    filter.gain.value = 0;\n    \n    return filter;\n}"
                        },
                        flanger: {
                            types: ['Classic', 'Modern'],
                            parameters: [
                                { name: 'rate', range: '0.1Hz to 10Hz', description: 'LFO rate' },
                                { name: 'depth', range: '0% to 100%', description: 'Effect intensity' },
                                { name: 'feedback', range: '-90% to 90%', description: 'Regeneration phase' }
                            ],
                            code: "function createFlanger(context: AudioContext, rate: number, depth: number) {\n    const delay = context.createDelay();\n    delay.delayTime.value = 0.005;\n    \n    const lfo = context.createOscillator();\n    lfo.frequency.value = rate;\n    \n    const lfoGain = context.createGain();\n    lfoGain.gain.value = depth * 0.002;\n    \n    const wetGain = context.createGain();\n    \n    lfo.connect(lfoGain);\n    lfoGain.connect(delay.delayTime);\n    \n    return { delay, lfo, lfoGain, wetGain };\n}"
                        }
                    },
                    effectRouting: {
                        description: 'Route effects to appropriate busses',
                        code: "class DJEffects {\n    private effectBus1: EffectBus;\n    private effectBus2: EffectBus;\n    \n    constructor(context: AudioContext) {\n        this.effectBus1 = new EffectBus(context, 'bus1');\n        this.effectBus2 = new EffectBus(context, 'bus2');\n    }\n    \n    assignEffect(busId: 1 | 2, effectType: string, parameters: Record<string, number>) {\n        const bus = busId === 1 ? this.effectBus1 : this.effectBus2;\n        \n        switch (effectType) {\n            case 'reverb':\n                bus.addEffect(createReverb(parameters.decay, parameters.mix));\n                break;\n            case 'delay':\n                bus.addEffect(createDelay(parameters.time, parameters.feedback));\n                break;\n            case 'filter':\n                bus.addEffect(createFilter(parameters.type, parameters.frequency, parameters.resonance));\n                break;\n        }\n    }\n    \n    setBusMix(busId: 1 | 2, wet: number) {\n        const bus = busId === 1 ? this.effectBus1 : this.effectBus2;\n        bus.setWetMix(wet);\n    }\n}"
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_bit_perfect_output',
    'Understand bit-perfect and exclusive audio output options',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    bitPerfectPrinciple: 'Direct hardware output without sample rate conversion or bit depth alteration',
                    bitPerfectRequirements: [
                        'Output sample rate matches source sample rate',
                        'Output bit depth matches or exceeds source bit depth',
                        'No DSP processing in the chain',
                        'Exclusive mode access (platform-specific)'
                    ],
                    webAudioConstraints: [
                        'Web Audio API does not expose exclusive mode',
                        'Browser handles sample rate conversion',
                        'Bit depth determined by AudioContext',
                        'Platform-specific APIs required for true bit-perfect'
                    ],
                    webAudioOutputQuality: [
                        {
                            mode: 'Standard Web Audio',
                            sampleRate: 'AudioContext.sampleRate (often 44.1kHz or 48kHz)',
                            bitDepth: '32-bit float',
                            limitations: 'Browser may resample'
                        },
                        {
                            mode: 'High Sample Rate Context',
                            sampleRate: 'Request 96kHz or 192kHz if supported',
                            bitDepth: '32-bit float',
                            limitations: 'Still float, not integer'
                        }
                    ],
                    exclusiveModeOptions: [
                        {
                            platform: 'Windows',
                            api: 'WASAPI Exclusive Mode',
                            access: 'C++/Rust native extension required',
                            benefits: ['True bit-perfect output', 'No software mixing', 'Lowest latency'],
                            implementation: 'Windows Runtime or DirectSound'
                        },
                        {
                            platform: 'macOS',
                            api: 'CoreAudio Exclusive Mode',
                            access: 'Native extension or WebAudio with specific constraints',
                            benefits: ['Sample-accurate output', 'No sample rate conversion']
                        },
                        {
                            platform: 'Linux',
                            api: 'ALSA Direct',
                            access: 'Native extension required',
                            benefits: ['ALSA dmix bypass', 'Direct hardware access']
                        },
                        {
                            platform: 'iOS',
                            api: 'CoreAudio Constraints',
                            access: 'Limited web access',
                            benefits: ['Best available output']
                        }
                    ],
                    webBitPerfectPattern: {
                        description: 'Best effort within Web Audio API constraints',
                        code: "// Request highest available sample rate\nconst audioContext = new AudioContext({ sampleRate: 0 }); // 0 = prefer hardware rate\n\n// Check actual sample rate\nconst actualSampleRate = audioContext.sampleRate;\n\n// For bit-perfect, avoid any processing\nfunction setupBitPerfectPlayback(context: AudioContext, audioElement: HTMLAudioElement) {\n    const source = context.createMediaElementSource(audioElement);\n    // No processing nodes - direct to destination\n    source.connect(context.destination);\n    \n    return {\n        sourceSampleRate: audioElement.getAttribute('data-sample-rate') || 'unknown',\n        contextSampleRate: actualSampleRate,\n        isBitPerfect: false, // Cannot guarantee in Web Audio\n        output: 'Direct to hardware (with browser processing)'\n    };\n}"
                    },
                    nativeExtensionPattern: {
                        description: 'Native extension pattern for true bit-perfect',
                        code: "// This would require a native extension\n// Example concept:\n\ninterface BitPerfectDevice {\n    open(deviceId: string, sampleRate: number, bitDepth: number): Promise<void>;\n    write(buffer: AudioBuffer): Promise<void>;\n    close(): void;\n    getLatency(): number;\n}\n\n// Usage with native extension\nconst bitPerfect = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: 'exclusive' } });\n// Note: Web platform does not currently expose this"
                    },
                    highResPlayback: {
                        description: 'Best practices for high-resolution audio',
                        recommendations: [
                            'Prefer native sample rates (44.1kHz, 48kHz, 96kHz, 192kHz)',
                            'Avoid sample rate conversion when possible',
                            'Use highest available AudioContext sample rate',
                            'Disable any unnecessary processing',
                            'Consider native extension for critical listening'
                        ],
                        sourceFormats: [
                            { format: 'PCM 16-bit', resolution: '16-bit', quality: 'CD quality' },
                            { format: 'PCM 24-bit', resolution: '24-bit', quality: 'Hi-Res' },
                            { format: 'PCM 32-bit float', resolution: '32-bit float', quality: 'Maximum' },
                            { format: 'DSD', resolution: '1-bit', quality: 'Studio master' },
                            { format: 'MQA', resolution: 'Variable', quality: 'High resolution' }
                        ]
                    },
                    limitations: [
                        'Web Audio API cannot guarantee bit-perfect output',
                        'Browsers may resample to system sample rate',
                        'Exclusive mode requires platform-specific code',
                        'Consider Electron app with native audio for true bit-perfect'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_audio_chain_visualization',
    'Understand how to visualize the audio chain with bit depth and sample rate at each step',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    audioChainVisualization: {
                        description: 'Display audio chain topology with quality metrics',
                        dataStructure: {
                            chain: [
                                {
                                    stage: 'Source',
                                    type: 'MediaElement',
                                    bitDepth: 'Source dependent (16/24/32)',
                                    sampleRate: 'Source rate (44.1k/48k/96k/192k)',
                                    format: 'PCM/DSD/MQA',
                                    path: 'file/network'
                                },
                                {
                                    stage: 'SourceNode',
                                    type: 'MediaElementAudioSourceNode',
                                    bitDepth: '32-bit float',
                                    sampleRate: 'Context rate',
                                    note: 'Browser decodes to float'
                                },
                                {
                                    stage: 'Processing',
                                    type: 'GainNode/BiquadFilter',
                                    bitDepth: '32-bit float',
                                    sampleRate: 'Context rate',
                                    processing: 'Volume/EQ applied'
                                },
                                {
                                    stage: 'Limiter',
                                    type: 'DynamicsCompressorNode/AudioWorklet',
                                    bitDepth: '32-bit float',
                                    sampleRate: 'Context rate',
                                    note: 'Peak limiting applied'
                                },
                                {
                                    stage: 'Destination',
                                    type: 'AudioDestinationNode',
                                    bitDepth: 'Platform dependent',
                                    sampleRate: 'System rate',
                                    note: 'Final output to DAC'
                                }
                            ],
                            summary: {
                                overallBitDepth: '32-bit float (internal)',
                                overallSampleRate: 'AudioContext.sampleRate',
                                processingActive: 'true/false',
                                bitPerfect: 'true/false',
                                latency: 'N ms'
                            }
                        }
                    },
                    chainDisplayCode: {
                        dataStructure: "interface AudioChainNode { stage: string; type: string; bitDepth: string; sampleRate: string; status: string; }",
                        renderFunction: "function renderAudioChain(chain: AudioChainNode[]) { return chain.map(node => `[${node.stage}] Type: ${node.type}`).join(' → '); }"
                    },
                    liveMetrics: {
                        description: 'Real-time audio quality monitoring',
                        metrics: [
                            {
                                metric: 'Input Bit Depth',
                                source: 'File metadata or network header',
                                display: '16-bit / 24-bit / 32-bit float / DSD'
                            },
                            {
                                metric: 'Input Sample Rate',
                                source: 'File header or network stream',
                                display: '44.1kHz / 48kHz / 96kHz / 192kHz'
                            },
                            {
                                metric: 'Context Sample Rate',
                                source: 'audioContext.sampleRate',
                                display: 'N kHz'
                            },
                            {
                                metric: 'Output Bit Depth',
                                source: 'Platform audio API',
                                display: '16-bit / 24-bit / 32-bit float'
                            },
                            {
                                metric: 'Buffer Size',
                                source: 'audioContext.baseLatency',
                                display: 'N samples (M ms)'
                            },
                            {
                                metric: 'Processing Latency',
                                source: 'Sum of all node latencies',
                                display: 'N ms'
                            }
                        ]
                    },
                    chainDiagram: {
                        description: 'Visual representation of audio chain',
                        textFormat: `
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│     Source      │ →  │   SourceNode     │ →  │   Processing    │ →  │     Limiter      │ →  │   Destination    │
│                 │    │                  │    │   (Gain/EQ)     │    │                  │    │                  │
│ Bit Depth: 24   │    │ Bit Depth: 32f   │    │ Bit Depth: 32f  │    │ Bit Depth: 32f   │    │ Bit Depth: 24    │
│ Sample: 96kHz   │    │ Sample: 96kHz    │    │ Sample: 96kHz   │    │ Sample: 96kHz    │    │ Sample: 96kHz    │
│ Format: PCM     │    │ Format: Float    │    │ Format: Float   │    │ Format: Float    │    │ Format: PCM      │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────────┘    └─────────────────┘
                          ↑                                        ↑                          ↑
                          |                                        |                          |
                    [Buffer: 512]                            [Latency: 5ms]            [Device: USB DAC]
                        `,
                        statusIndicators: [
                            { status: 'green', meaning: 'Bit-perfect path (no conversion)' },
                            { status: 'yellow', meaning: 'Sample rate conversion active' },
                            { status: 'red', meaning: 'Bit depth reduction or issues' }
                        ]
                    },
                    qualityReporting: {
                        currentTrack: {
                            bitDepth: '24-bit',
                            sampleRate: '96kHz',
                            format: 'PCM',
                            codec: 'FLAC',
                            fileSize: '45.2 MB',
                            duration: '4:32'
                        },
                        playbackChain: {
                            sourceFormat: '24-bit / 96kHz',
                            contextRate: '96kHz',
                            processing: 'Gain + Limiter',
                            outputFormat: '24-bit / 96kHz (if supported)',
                            actualOutput: 'System dependent'
                        },
                        diagnostics: {
                            underruns: 0,
                            glitches: 0,
                            xruns: 0,
                            latencyMs: 12.5
                        }
                    },
                    visualizationComponent: {
                        description: 'React component for audio chain display',
                        code: "interface AudioChainVisualizerProps {\n    sourceInfo: { bitDepth: number; sampleRate: number; format: string };\n    context: AudioContext;\n    processingNodes: AudioNode[];\n    destination: AudioDestinationNode;\n}\n\nfunction AudioChainVisualizer({ sourceInfo, context, processingNodes, destination }: AudioChainVisualizerProps) {\n    const chain = [\n        { stage: 'Source', bitDepth: sourceInfo.bitDepth, sampleRate: sourceInfo.sampleRate, format: sourceInfo.format },\n        { stage: 'SourceNode', bitDepth: 32, sampleRate: context.sampleRate, format: 'Float32' },\n        ...processingNodes.map(node => ({ stage: node.constructor.name, bitDepth: 32, sampleRate: context.sampleRate, format: 'Float32' })),\n        { stage: 'Destination', bitDepth: 'System', sampleRate: context.sampleRate, format: 'System' }\n    ];\n    \n    return (\n        <div className=\"audio-chain\">\n            {chain.map((node, i) => (\n                <ChainNode key={i} node={node} />\n            ))}\n        </div>\n    );\n}"
                    },
                    errorIndicators: [
                        { type: 'Sample rate mismatch', icon: '⚠️', description: 'Source and context rates differ' },
                        { type: 'Buffer underrun', icon: '❌', description: 'Audio callback late' },
                        { type: 'Glitch', icon: '🔊', description: 'Audio artifact detected' },
                        { type: 'Format not supported', icon: '🚫', description: 'DAC cannot handle format' }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_hardware_output_options',
    'Understand hardware output configuration and device selection',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    deviceSelection: {
                        description: 'Query available audio output devices',
                        api: 'navigator.mediaDevices.enumerateDevices()',
                        code: "async function getAudioDevices() {\n    const devices = await navigator.mediaDevices.enumerateDevices();\n    return devices.filter(d => d.kind === 'audiooutput');\n}",
                        properties: ['deviceId', 'label', 'groupId', 'deviceId']
                    },
                    deviceInfo: {
                        fields: [
                            'deviceId - Unique identifier',
                            'label - Human readable name',
                            'groupId - Device group identifier',
                            'deviceId - Hardware device ID'
                        ]
                    },
                    setSinkId: {
                        description: 'Route audio to specific device',
                        api: 'HTMLMediaElement.setSinkId()',
                        code: "const audio = new Audio();\naudio.src = 'music.mp3';\n\n// Set output device\naudio.setSinkId(deviceId).then(() => {\n    console.log('Audio routed to:', deviceId);\n}).catch(err => {\n    console.error('Failed to set sink:', err);\n});",
                        browserSupport: 'Chrome, Edge, Firefox (limited)'
                    },
                    deviceCapabilities: {
                        description: 'Query device sample rate and bit depth support',
                        limitation: 'Web API does not expose detailed capabilities',
                        workarounds: [
                            'User manual configuration',
                            'System audio settings',
                            'Native extension for detailed info'
                        ]
                    },
                    exclusiveVsShared: {
                        shared: {
                            mode: 'shared',
                            description: 'Browser shares audio with other applications',
                            pros: ['Works on all platforms', 'No special permissions'],
                            cons: ['Sample rate conversion', 'Latency varies', 'Other apps can interrupt']
                        },
                        exclusive: {
                            mode: 'exclusive',
                            description: 'Direct hardware access',
                            pros: ['Lowest latency', 'No mixing artifacts', 'Bit-perfect possible'],
                            cons: ['Platform specific', 'Requires permissions', 'Other apps blocked'],
                            platforms: {
                                windows: 'WASAPI Exclusive Mode',
                                macOS: 'CoreAudio Exclusive',
                                linux: 'ALSA dmix bypass'
                            }
                        }
                    },
                    deviceEvents: {
                        description: 'Handle device changes',
                        code: "// Listen for device changes\nnavigator.mediaDevices.addEventListener('devicechange', () => {\n    console.log('Audio devices changed');\n    refreshDeviceList();\n});\n\n// Handle device disconnection\nnavigator.mediaDevices.addEventListener('devicechange', (e) => {\n    const devices = e.target.getAudioOutputDevices();\n    if (!devices.has(currentDeviceId)) {\n        console.log('Current device disconnected');\n        switchToDefaultDevice();\n    }\n});"
                    },
                    optimalDeviceSelection: {
                        description: 'Criteria for selecting best audio device',
                        criteria: [
                            'Sample rate match with content',
                            'Bit depth support',
                            'Low latency',
                            'Dedicated DAC vs integrated',
                            'USB vs HDMI vs onboard'
                        ],
                        selectionAlgorithm: `function selectOptimalDevice(devices: AudioDeviceInfo[], sourceRate: number): string {\n    // Prefer device with matching sample rate\n    const matchingRate = devices.find(d => d.supportedRates.includes(sourceRate));\n    if (matchingRate) return matchingRate.deviceId;\n    \n    // Fall back to highest rate device\n    const highestRate = devices.reduce((best, d) => \n        d.maxSampleRate > best.maxSampleRate ? d : best\n    );\n    return highestRate.deviceId;\n}`
                    },
                    highResDeviceConfig: {
                        description: 'Configure for high-resolution audio',
                        settings: [
                            { setting: 'Exclusive mode', required: 'Native extension', priority: 'high' },
                            { setting: 'Bit depth', required: 'System config', priority: 'high' },
                            { setting: 'Sample rate', required: 'Match source', priority: 'high' },
                            { setting: 'Buffer size', recommendation: '256-512 samples', priority: 'medium' },
                            { setting: 'Power saving', recommendation: 'Disable', priority: 'medium' }
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_sample_rate_handling',
    'Understand sample rate conversion and handling in the audio chain',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    sampleRateBasics: {
                        description: 'Common audio sample rates',
                        rates: [
                            { rate: '44.1kHz', use: 'CD audio, most music' },
                            { rate: '48kHz', use: 'Video, professional audio' },
                            { rate: '88.2kHz', use: 'High-res (2x 44.1)' },
                            { rate: '96kHz', use: 'High-res (2x 48)' },
                            { rate: '176.4kHz', use: 'Studio master (4x 44.1)' },
                            { rate: '192kHz', use: 'Studio master (4x 48)' },
                            { rate: '352.8kHz', use: 'DSD high-res' },
                            { rate: '384kHz', use: 'Extreme high-res' }
                        ]
                    },
                    sampleRateConversion: {
                        description: 'When browser converts sample rates',
                        scenarios: [
                            'Source rate ≠ AudioContext rate',
                            'Device does not support source rate',
                            'System audio settings force different rate'
                        ],
                        methods: [
                            { method: 'Browser SRC', quality: 'Good (varies by browser)' },
                            { method: 'SoX-based', quality: 'High (some browsers)' },
                            { method: 'User disabled SRC', quality: 'N/A - no conversion' }
                        ]
                    },
                    srcBehavior: {
                        browsers: [
                            { browser: 'Chrome/Edge', resampler: 'libsamplerate (high quality)' },
                            { browser: 'Firefox', resampler: 'Internal resampler' },
                            { browser: 'Safari', resampler: 'CoreAudio resampler' }
                        ],
                        note: 'Quality and latency vary by browser'
                    },
                    avoidSrc: {
                        description: 'Prevent sample rate conversion',
                        methods: [
                            'Set AudioContext sampleRate to 0 (prefer hardware)',
                            'Create separate context for each source rate',
                            'Use native extension for direct output',
                            'Configure system for matching sample rates'
                        ],
                        code: "// Create context that prefers hardware sample rate\nconst audioContext = new AudioContext({ sampleRate: 0 });\n\n// Or force specific rate (may enable SRC if unsupported)\naudioContext = new AudioContext({ sampleRate: 96000 });"
                    },
                    multiRatePlayback: {
                        description: 'Handling multiple sample rates',
                        approach: 'Create separate AudioContext per sample rate',
                        code: "const contexts = new Map<number, AudioContext>();\n\nfunction getContextForRate(rate: number): AudioContext {\n    if (!contexts.has(rate)) {\n        const ctx = new AudioContext({ sampleRate: rate });\n        contexts.set(rate, ctx);\n    }\n    return contexts.get(rate)!;\n}\n\n// Use appropriate context for each track\nconst context = getContextForRate(track.sampleRate);"
                    },
                    bitDepthHandling: {
                        description: 'Bit depth throughout the chain',
                        chain: [
                            { stage: 'Source', depth: '16/24/32-bit integer', note: 'File format' },
                            { stage: 'Decode', depth: '32-bit float', note: 'Web Audio standard' },
                            { stage: 'Processing', depth: '32-bit float', note: 'Full precision' },
                            { stage: 'Output', depth: '16/24/32-bit', note: 'System/DAC dependent' }
                        ],
                        dithering: {
                            description: 'When reducing bit depth',
                            when: 'Converting float to integer output',
                            methods: ['None (truncation)', 'Noise shaping', 'TPDF dither'],
                            recommendation: 'Browser handles automatically'
                        }
                    },
                    sampleRateDisplay: {
                        description: 'Show sample rate at each stage',
                        code: "function getAudioChainMetrics(context: AudioContext, source: HTMLAudioElement) {\n    return {\n        source: {\n            sampleRate: source.getAttribute('data-sample-rate') || 'unknown',\n            bitDepth: source.getAttribute('data-bit-depth') || 'unknown'\n        },\n        context: {\n            sampleRate: context.sampleRate,\n            baseLatency: context.baseLatency,\n            outputLatency: context.outputLatency\n        },\n        conversion: {\n            needed: (source.getAttribute('data-sample-rate') || '44100') !== context.sampleRate.toString(),\n            method: context.sampleRate > 0 ? 'Browser SRC' : 'Unknown'\n        },\n        destination: {\n            deviceRate: 'System dependent',\n            deviceDepth: 'System dependent'\n        }\n    };\n}"
                    },
                    highResConsiderations: [
                        'Higher sample rates require more CPU and memory',
                        'Not all DACs actually process at advertised rates',
                        'Nyquist theorem: 96kHz captures up to 48kHz accurately',
                        'Human hearing limited to ~20kHz',
                        'Benefits of >96kHz debated in audio community'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_volume_normalization',
    'Understand Jellyfin server-provided volume normalization',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    jellyfinNormalization: {
                        source: 'Jellyfin Server API',
                        location: 'BaseItemDto.MediaStreams[].VolumeLevel',
                        usage: 'Pre-calculated normalization gain from server analysis',
                        integration: 'Already utilized by audioStore normalizationGainNode'
                    },
                    jellyfinApiData: {
                        interface: 'interface JellyfinVolumeData { volumeLevel: number; supportsVolumeControl: boolean; }',
                        source: 'GET /Items/{id}/PlaybackInfo',
                        integration: 'Parsed by jellyfin-apiclient and stored in mediaStore'
                    },
                    normalizationChain: {
                        description: 'Server-provided normalization integrated into audio chain',
                        chain: `
┌─────────────────┐     ┌────────────────────┐     ┌─────────────────┐     ┌───────────────┐
│     Source      │────▶│  Jellyfin Server   │────▶│  Channel Strip  │────▶│   Master      │
│  Jellyfin API   │     │  Normalization     │     │  (EQ + Filter)  │     │   Mix +       │
│                 │     │  (volumeLevel)     │     │                 │     │   Crossfader  │
│ Media Source    │     │  From Metadata     │     │  - Gain         │     │               │
│ Info            │     │                    │     │  - 3-band EQ    │     │               │
└─────────────────┘     │  Gain =            │     │  - Filter       │     │               │
                        │  volumeLevel       │     │  - Volume       │     │               │
                        └────────────────────┘     └─────────────────┘     └───────────────┘
                        `,
                        code: "const normalizationGain = context.createGain();\nnormalizationGain.gain.value = item.MediaSources?.[0]?.MediaStreams?.[0]?.VolumeLevel || 1;\nsource.connect(normalizationGain);"
                    },
                    jellyfinVolumeApi: {
                        description: 'Jellyfin provides volume normalization levels via API',
                        endpoint: 'GET /Items/{itemId}/PlaybackInfo',
                        response: 'MediaSourceInfo with VolumeLevel property',
                        usage: 'Applied automatically during playback initialization',
                        implementation: 'Parsed in jellyfin-apiclient, stored in mediaStore'
                    },
                    volumeLevelTypes: [
                        { type: 'Linear', description: 'Linear gain multiplier (0 to 1)' },
                        { type: 'Decibels', description: 'dB adjustment value' },
                        { type: 'Percentage', description: 'Percentage of full scale' }
                    ],
                    volumeLevelUsage: {
                        description: 'How Jellyfin volume levels are applied',
                        code: "// From Jellyfin API response\ninterface MediaSourceInfo {\n    Id: string;\n    VolumeLevel: number | null; // Normalization gain\n    SupportsTranscoding: boolean;\n    MediaStreams: MediaStreamInfo[];\n}\n\n// Apply normalization from server\nfunction applyJellyfinNormalization(\n    mediaStore: MediaStore, \n    item: BaseItemDto\n) {\n    const volumeLevel = item.MediaSources?.[0]?.VolumeLevel;\n    if (volumeLevel !== null && volumeLevel !== undefined) {\n        mediaStore.setNormalizationGain(volumeLevel);\n    }\n}"
                    },
                    benefits: [
                        'Server-side analysis - no client CPU required',
                        'Consistent across all clients',
                        'Based on actual audio content analysis',
                        'Updated with server library changes',
                        'Supports all file formats Jellyfin can play'
                    ],
                    integrationPoints: [
                        {
                            layer: 'api',
                            file: 'src/apiclient.d.ts',
                            usage: 'GET /Items/{id}/PlaybackInfo returns VolumeLevel'
                        },
                        {
                            layer: 'store',
                            file: 'src/store/mediaStore.ts',
                            usage: 'normalizationGain state managed by mediaStore'
                        },
                        {
                            layer: 'audio',
                            file: 'src/components/audioEngine/master.logic.ts',
                            usage: 'normalizationGainNode applies server-provided gain'
                        }
                    ],
                    manualOverride: {
                        description: 'User can adjust normalization',
                        options: [
                            'Disable normalization completely',
                            'Adjust offset (+/- dB)',
                            'Use track vs album mode',
                            'Apply true peak limiting'
                        ],
                        settingsLocation: 'settingsStore.audio normalization settings'
                    },
                    truePeakProtection: {
                        description: 'Even with server normalization, apply true peak limiting',
                        implementation: 'Look-ahead limiter at end of chain',
                        reason: 'Prevent overs from file errors or unexpected peaks',
                        code: "class TruePeakLimiter {\n    private threshold: number = -1; // -1 dBTP\n    \n    process(samples: Float32Array): Float32Array {\n        // Detect and limit true peaks\n        // Apply gentle limiting to prevent any overs\n    }\n}"
                    }
                }, null, 2)
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
