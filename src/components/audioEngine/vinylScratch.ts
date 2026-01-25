export interface ScratchParams {
    velocity: number;
    pressure: number;
    material: 'vinyl' | 'cd' | 'digital';
}

export interface ScratchResult {
    samples: Float32Array;
    hasNoise: boolean;
}

export class VinylScratchSynth {
    private noiseBuffer: Float32Array;
    private readonly sampleRate: number;

    constructor(sampleRate: number = 48000) {
        this.sampleRate = sampleRate;
        this.noiseBuffer = this.generateNoiseBuffer(sampleRate * 2);
    }

    private generateNoiseBuffer(samples: number): Float32Array {
        const buffer = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            buffer[i] = (Math.random() * 2 - 1) * 0.3;
        }
        return buffer;
    }

    process(input: Float32Array, params: ScratchParams): Float32Array {
        const { velocity, pressure, material } = params;

        const absVelocity = Math.abs(velocity);
        const direction = Math.sign(velocity);

        const grainSize = this.getGrainSize(absVelocity, material);
        const noiseAmount = this.getNoiseAmount(pressure, absVelocity, material);
        const vinylTexture = this.getVinylTexture(material);

        for (let i = 0; i < input.length; i++) {
            const grainIndex = Math.floor(((i / grainSize) * absVelocity * this.sampleRate) / 1000);
            const noiseIndex = Math.floor(grainIndex) % this.noiseBuffer.length;
            const noiseSample = this.noiseBuffer[noiseIndex];

            input[i] = input[i] * (1 - noiseAmount) * direction + noiseSample * noiseAmount * vinylTexture;
        }

        return input;
    }

    private getGrainSize(velocity: number, material: 'vinyl' | 'cd' | 'digital'): number {
        const baseSize = 512;
        const velocityFactor = Math.max(0.1, 1 - velocity);

        switch (material) {
            case 'vinyl':
                return baseSize * velocityFactor * 1.5;
            case 'cd':
                return baseSize * velocityFactor * 0.8;
            case 'digital':
                return baseSize * velocityFactor * 0.5;
            default:
                return baseSize * velocityFactor;
        }
    }

    private getNoiseAmount(pressure: number, velocity: number, material: 'vinyl' | 'cd' | 'digital'): number {
        const baseNoise = 0.2;
        const pressureFactor = pressure * 0.4;
        const velocityFactor = (1 - velocity) * 0.2;

        switch (material) {
            case 'vinyl':
                return Math.min(0.5, baseNoise + pressureFactor + velocityFactor);
            case 'cd':
                return Math.min(0.3, baseNoise * 0.5 + pressureFactor * 0.5);
            case 'digital':
                return Math.min(0.15, baseNoise * 0.3 + pressureFactor * 0.3);
            default:
                return baseNoise;
        }
    }

    private getVinylTexture(material: 'vinyl' | 'cd' | 'digital'): number {
        switch (material) {
            case 'vinyl':
                return 1.0;
            case 'cd':
                return 0.6;
            case 'digital':
                return 0.3;
            default:
                return 0.5;
        }
    }

    processStereo(
        left: Float32Array,
        right: Float32Array,
        params: ScratchParams
    ): { left: Float32Array; right: Float32Array } {
        return {
            left: this.process(left, params),
            right: this.process(right, params)
        };
    }

    generateBackspinNoise(durationMs: number): Float32Array {
        const samples = Math.floor((durationMs / 1000) * this.sampleRate);
        const buffer = new Float32Array(samples);

        let lastNoise = 0;
        for (let i = 0; i < samples; i++) {
            const t = i / samples;
            const noise = (Math.random() * 2 - 1) * (1 - t) * 0.5;
            const filtered = lastNoise * 0.7 + noise * 0.3;
            buffer[i] = filtered;
            lastNoise = noise;
        }

        return buffer;
    }

    generateSpinUpNoise(durationMs: number): Float32Array {
        const samples = Math.floor((durationMs / 1000) * this.sampleRate);
        const buffer = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const t = i / samples;
            const noise = (Math.random() * 2 - 1) * t * 0.3;
            buffer[i] = noise;
        }

        return buffer;
    }
}

export const createVinylScratchSynth = (sampleRate?: number): VinylScratchSynth => {
    return new VinylScratchSynth(sampleRate);
};
