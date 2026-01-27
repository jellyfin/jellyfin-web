/**
 * Rust/WASM Time Stretcher for Jellyfin
 *
 * High-quality time-stretching without pitch change using rubato (sinc interpolation)
 *
 * Usage:
 * ```typescript
 * import { loadAudioWasm, createTimeStretcher } from 'components/audioEngine';
 *
 * const stretcher = await createTimeStretcher(44100, 2, 1024);
 * stretcher.setTempo(1.5); // 50% faster
 *
 * const output = stretcher.process(inputSamples, numFrames);
 * ```
 */

interface WasmTimeStretcher {
    setTempo(tempo: number): void;
    getTempo(): number;
    getLatency(): number;
    getChannels(): number;
    getSampleRate(): number;
    process(input: Float32Array, numFrames: number): Float32Array;
    flush(): Float32Array;
    reset(): void;
}

interface WasmPitchShifter {
    shiftSemitones(samples: Float32Array, semitones: number): Float32Array;
}

interface WasmModule {
    version(): string;
    info(): string;
    TimeStretcher: {
        new (sampleRate: number, channels: number, chunkSize: number): WasmTimeStretcher;
    };
    PitchShifter: {
        new (sampleRate: number, channels: number, fftSize: number): WasmPitchShifter;
    };
}

import { logger } from '../../utils/logger';

let wasmModule: WasmModule | null = null;

async function loadWasmModule(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;

    try {
        // Use a require-based approach to avoid TypeScript module resolution issues
        // @ts-ignore - Dynamic module that may not exist at build time
        const wasmModuleImport = await import('../../audio-wasm/pkg/jellyfin_audio_wasm').catch(() => null);

        if (wasmModuleImport?.default) {
            wasmModule = wasmModuleImport.default;
            logger.info('Audio WASM loaded', { component: 'audioWasm', version: wasmModule!.version() });
            return wasmModule!;
        } else {
            throw new Error('WASM module not available');
        }
    } catch {
        logger.warn('Audio WASM not available, using JS fallback', { component: 'audioWasm' });
        wasmModule = createJSFallback();
        return wasmModule!;
    }
}

function createJSFallback(): WasmModule {
    logger.info('Using JS time-stretch fallback', { component: 'audioWasm' });

    class JSTimeStretcher implements WasmTimeStretcher {
        private readonly sampleRate: number;
        private readonly channels: number;
        private tempo = 1.0;

        constructor(sampleRate: number, channels: number, _chunkSize: number) {
            this.sampleRate = sampleRate;
            this.channels = channels;
        }

        public setTempo(tempo: number): void {
            this.tempo = Math.max(0.5, Math.min(2.0, tempo));
        }

        public getTempo(): number {
            return this.tempo;
        }
        public getLatency(): number {
            return 0;
        }
        public getChannels(): number {
            return this.channels;
        }
        public getSampleRate(): number {
            return this.sampleRate;
        }

        public process(input: Float32Array, numFrames: number): Float32Array {
            const ratio = 1.0 / this.tempo;
            const outputFrames = Math.ceil(numFrames / ratio);
            const output = new Float32Array(outputFrames * this.channels);

            for (let ch = 0; ch < this.channels; ch++) {
                for (let i = 0; i < outputFrames; i++) {
                    const srcPos = i * ratio;
                    const srcIdx = Math.floor(srcPos);
                    const frac = srcPos - srcIdx;

                    if (srcIdx < numFrames - 1) {
                        const s1 = input[srcIdx * this.channels + ch];
                        const s2 = input[(srcIdx + 1) * this.channels + ch];
                        output[i * this.channels + ch] = s1 + (s2 - s1) * frac;
                    } else {
                        output[i * this.channels + ch] = input[srcIdx * this.channels + ch] || 0;
                    }
                }
            }

            return output;
        }

        public flush(): Float32Array {
            return new Float32Array(0);
        }
        public reset(): void {
            this.tempo = 1.0;
        }
    }

    class JSPitchShifter implements WasmPitchShifter {
        private readonly channels: number;

        constructor(_sampleRate: number, channels: number, _fftSize: number) {
            this.channels = channels;
        }

        public shiftSemitones(samples: Float32Array, semitones: number): Float32Array {
            const ratio = Math.pow(2, semitones / 12);
            const samplesLength = samples.length;
            const outputFrames = Math.ceil(samplesLength / ratio / this.channels);
            const output = new Float32Array(outputFrames * this.channels);

            for (let ch = 0; ch < this.channels; ch++) {
                for (let i = 0; i < outputFrames; i++) {
                    const srcPos = i * ratio;
                    const srcIdx = Math.floor(srcPos);
                    const frac = srcPos - srcIdx;

                    const srcSampleIdx = srcIdx * this.channels + ch;
                    if (srcSampleIdx < samplesLength && srcSampleIdx >= 0) {
                        const s1 = samples[srcSampleIdx];
                        const s2 = samples[Math.min(srcSampleIdx + this.channels, samplesLength - 1)];
                        output[i * this.channels + ch] = s1 + (s2 - s1) * frac;
                    } else {
                        output[i * this.channels + ch] = 0;
                    }
                }
            }

            return output;
        }
    }

    return {
        version: () => 'jellyfin-audio-wasm v0.1.0-js-fallback',
        info: () => '{"version":"0.1.0-js","features":["time_stretch_js_fallback"]}',
        TimeStretcher: JSTimeStretcher as unknown as { new (): WasmTimeStretcher },
        PitchShifter: JSPitchShifter as unknown as { new (): WasmPitchShifter }
    };
}

export function loadAudioWasm(): Promise<WasmModule> {
    return loadWasmModule();
}

export async function createTimeStretcher(
    sampleRate: number,
    channels: number,
    chunkSize = 1024
): Promise<WasmTimeStretcher> {
    const wasm = await loadWasmModule();
    return new wasm.TimeStretcher(sampleRate, channels, chunkSize);
}

export async function createPitchShifter(
    sampleRate: number,
    channels: number,
    fftSize = 1024
): Promise<WasmPitchShifter> {
    const wasm = await loadWasmModule();
    return new wasm.PitchShifter(sampleRate, channels, fftSize);
}

export async function getAudioWasmInfo(): Promise<string> {
    const wasm = await loadWasmModule();
    return wasm.info();
}

export async function getAudioWasmVersion(): Promise<string> {
    const wasm = await loadWasmModule();
    return wasm.version();
}
