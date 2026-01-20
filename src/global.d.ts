/// <reference types="vite/client" />

declare module './pkg/jellyfin_audio_wasm' {
    interface WasmTimeStretcher {
        set_tempo(tempo: number): void;
        get_tempo(): number;
        get_latency(): number;
        get_channels(): number;
        get_sample_rate(): number;
        process(input: Float32Array, num_frames: number): Float32Array;
        flush(): Float32Array;
        reset(): void;
    }

    interface WasmPitchShifter {
        shift_semitones(samples: Float32Array, semitones: number): Float32Array;
    }

    interface WasmModule {
        version(): string;
        info(): string;
        TimeStretcher: {
            new(sample_rate: number, channels: number, chunk_size: number): WasmTimeStretcher;
        };
        PitchShifter: {
            new(sample_rate: number, channels: number, fft_size: number): WasmPitchShifter;
        };
    }

    const wasm: WasmModule;
    export default wasm;
}

export declare global {
    import { ApiClient, Events } from 'jellyfin-apiclient';

    interface Window {
        ApiClient: ApiClient;
        Events: Events;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        NativeShell: any;
        Loading: {
            show();
            hide();
        }
    }

    interface DocumentEventMap {
        'viewshow': CustomEvent;
    }

    const __COMMIT_SHA__: string;
    const __JF_BUILD_VERSION__: string;
    const __PACKAGE_JSON_NAME__: string;
    const __PACKAGE_JSON_VERSION__: string;
    const __USE_SYSTEM_FONTS__: boolean;
    const __WEBPACK_SERVE__: boolean;
}
