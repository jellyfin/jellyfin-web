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
            new (sample_rate: number, channels: number, chunk_size: number): WasmTimeStretcher;
        };
        PitchShifter: {
            new (sample_rate: number, channels: number, fft_size: number): WasmPitchShifter;
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
        NativeShell?: NativeShell;
        TaskButton?: any;
        CredentialProvider?: any;
        Notification?: any;
        Loading: {
            show();
            hide();
        };
        appMode?: string;
        tizen?: any;
        webOS?: any;
        appHost: any;
        __PACKAGE_JSON_VERSION__: string;
    }

    interface NativeShellAppHost {
        getDeviceProfile?: (builder: any, version: string) => any;
        exit?: () => void;
        supports?: (command: string) => boolean;
        getDefaultLayout?: () => string;
        init?: () => { deviceId: string; deviceName: string };
        deviceName?: () => string;
        deviceId?: () => string;
        appName?: () => string;
        appVersion?: () => string;
        getPushTokenInfo?: () => any;
        screen?: () => { width: number; height: number; maxAllowedWidth?: number };
    }

    interface NativeShell {
        AppHost?: NativeShellAppHost;
        enableFullscreen?: () => void;
        disableFullscreen?: () => void;
        openClientSettings?: () => void;
        openDownloadManager?: () => void;
        openUrl?: (url: string, target?: string) => void;
        updateMediaSession?: (mediaInfo: any) => void;
        hideMediaSession?: () => void;
        updateVolumeLevel?: (volume: number) => void;
        downloadFiles?: (items: any[]) => void;
        downloadFile?: (item: any) => void;
        findServers?: (timeout: number) => Promise<any[]>;
        getPlugins?: () => any[];
        onLocalUserSignedOut?: (info: any) => void;
        onLocalUserSignedIn?: (user: any, token: string) => Promise<void>;
        selectServer?: () => void;
    }

    interface HTMLVideoElement {
        webkitEnterFullscreen?: () => void;
        webkitSupportsPresentationMode?: (mode: string) => boolean;
        webkitSetPresentationMode?: (mode: string) => void;
        webkitPresentationMode?: string;
    }

    interface DocumentEventMap {
        viewshow: CustomEvent;
    }

    declare const __COMMIT_SHA__: string;
    declare const __JF_BUILD_VERSION__: string;
    declare const __PACKAGE_JSON_NAME__: string;
    declare const __PACKAGE_JSON_VERSION__: string;
    declare const __USE_SYSTEM_FONTS__: boolean;
    declare const __DEV_SERVER_PROXY_TARGET__: string;
    const tizen: any;
    const webOS: any;
}

import 'react';

declare module 'react' {
    interface CSSProperties {
        [key: `--${string}`]: string | number | undefined;
    }
}

declare module '*.css' {
    const vars: Record<string, unknown>;
    export default vars;
}

declare module '*.css.ts' {
    const vars: Record<string, unknown>;
    export default vars;
}
