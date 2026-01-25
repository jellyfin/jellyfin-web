// limiterWorklet.ts - Wasm-powered AudioWorkletProcessor for high-performance limiting

class LimiterProcessor extends AudioWorkletProcessor {
    private threshold: number = 0.8;
    private ratio: number = 10;
    private attack: number = 0.003;
    private release: number = 0.25;
    private envelope: number = 0;

    // Wasm state
    private wasmInstance: WebAssembly.Instance | null = null;
    private wasmMemory: WebAssembly.Memory | null = null;
    private inputPtr: number = 0;
    private outputPtr: number = 0;
    private bufferSize: number = 0;
    private wasmReady: boolean = false;

    constructor() {
        super();
        void this.loadWasm();
    }

    private async loadWasm() {
        try {
            // Note: In a real environment, the URL might need to be resolved correctly.
            // Since this runs in a Worklet, we fetch from the origin assets.
            const response = await fetch('/assets/audio/audio-engine.wasm');
            if (!response.ok) throw new Error('Failed to fetch Wasm');

            const bytes = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(bytes);

            this.wasmInstance = instance;
            this.wasmMemory = instance.exports.memory as WebAssembly.Memory;

            // Standard AudioWorklet block size is 128 samples
            this.bufferSize = 128;

            // Allocate memory in Wasm for input and output buffers
            const allocate = this.wasmInstance.exports.allocate as (size: number) => number;
            this.inputPtr = allocate(this.bufferSize);
            this.outputPtr = allocate(this.bufferSize);

            this.wasmReady = true;
        } catch {
            // Silently fall back to JS
        }
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [
            { name: 'threshold', defaultValue: 0.8, minValue: 0, maxValue: 1 },
            { name: 'ratio', defaultValue: 10, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.003, minValue: 0.001, maxValue: 0.1 },
            { name: 'release', defaultValue: 0.25, minValue: 0.01, maxValue: 1 }
        ];
    }

    private processJsFallback(
        input: Float32Array[],
        output: Float32Array[],
        threshold: number,
        ratio: number,
        attack: number,
        release: number
    ) {
        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; ++i) {
                const sample = inputChannel[i];
                const absSample = Math.abs(sample);

                if (absSample > this.envelope) {
                    this.envelope += (absSample - this.envelope) * attack;
                } else {
                    this.envelope += (absSample - this.envelope) * release;
                }

                let gain = 1;
                if (this.envelope > threshold) {
                    const exponent = 1 - 1 / ratio;
                    gain = Math.pow(threshold / this.envelope, exponent);
                }

                outputChannel[i] = sample * gain;
            }
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output || input.length === 0) return true;

        const threshold = parameters.threshold[0] ?? this.threshold;
        const ratio = parameters.ratio[0] ?? this.ratio;
        const attack = parameters.attack[0] ?? this.attack;
        const release = parameters.release[0] ?? this.release;

        // Use Wasm if ready
        if (this.wasmReady && this.wasmInstance && this.wasmMemory) {
            const processFn = this.wasmInstance.exports.process_limiter as (
                inPtr: number,
                outPtr: number,
                len: number,
                t: number,
                r: number,
                a: number,
                rel: number,
                env: number
            ) => number;
            const memoryBuffer = new Float32Array(this.wasmMemory.buffer);

            for (let channel = 0; channel < input.length; ++channel) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];

                // Copy JS input to Wasm memory
                memoryBuffer.set(inputChannel, this.inputPtr / 4);

                // Process in Wasm
                this.envelope = processFn(
                    this.inputPtr,
                    this.outputPtr,
                    inputChannel.length,
                    threshold,
                    ratio,
                    attack,
                    release,
                    this.envelope
                );

                // Copy Wasm output back to JS
                const result = memoryBuffer.subarray(this.outputPtr / 4, this.outputPtr / 4 + inputChannel.length);
                outputChannel.set(result);
            }
        } else {
            this.processJsFallback(input, output, threshold, ratio, attack, release);
        }

        return true;
    }
}

registerProcessor('limiter-processor', LimiterProcessor);

export default LimiterProcessor;
