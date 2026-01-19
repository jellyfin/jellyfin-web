// biquadWorklet.ts - Wasm-powered AudioWorkletProcessor for high-performance Biquad filtering

class BiquadProcessor extends AudioWorkletProcessor {
    // Wasm state
    private wasmInstance: WebAssembly.Instance | null = null;
    private wasmMemory: WebAssembly.Memory | null = null;
    private inputPtr: number = 0;
    private outputPtr: number = 0;
    private statePtrs: number[] = []; // One per channel
    private bufferSize: number = 0;
    private wasmReady: boolean = false;

    constructor() {
        super();
        void this.loadWasm();
    }

    private async loadWasm() {
        try {
            const response = await fetch('/assets/audio/audio-engine.wasm');
            if (!response.ok) throw new Error('Failed to fetch Wasm');

            const bytes = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(bytes);

            this.wasmInstance = instance;
            this.wasmMemory = (instance.exports.memory as WebAssembly.Memory);

            this.bufferSize = 128;

            const allocate = this.wasmInstance.exports.allocate as (size: number) => number;
            this.inputPtr = allocate(this.bufferSize);
            this.outputPtr = allocate(this.bufferSize);

            this.wasmReady = true;
        } catch {
            // Fallback to JS if Wasm fails
        }
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [
            { name: 'b0', defaultValue: 1, minValue: -10, maxValue: 10 },
            { name: 'b1', defaultValue: 0, minValue: -10, maxValue: 10 },
            { name: 'b2', defaultValue: 0, minValue: -10, maxValue: 10 },
            { name: 'a1', defaultValue: 0, minValue: -10, maxValue: 10 },
            { name: 'a2', defaultValue: 0, minValue: -10, maxValue: 10 }
        ];
    }

    // JS Fallback state
    private z1: number[] = [];
    private z2: number[] = [];

    private processJsFallback(input: Float32Array[], output: Float32Array[], b0: number, b1: number, b2: number, a1: number, a2: number) {
        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            
            if (this.z1[channel] === undefined) {
                this.z1[channel] = 0;
                this.z2[channel] = 0;
            }

            for (let i = 0; i < inputChannel.length; ++i) {
                const x = inputChannel[i];
                const y = b0 * x + this.z1[channel];
                this.z1[channel] = b1 * x - a1 * y + this.z2[channel];
                this.z2[channel] = b2 * x - a2 * y;
                outputChannel[i] = y;
            }
        }
    }

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output || input.length === 0) return true;

        const b0 = parameters.b0[0];
        const b1 = parameters.b1[0];
        const b2 = parameters.b2[0];
        const a1 = parameters.a1[0];
        const a2 = parameters.a2[0];

        if (this.wasmReady && this.wasmInstance && this.wasmMemory) {
            const processFn = this.wasmInstance.exports.process_biquad as Function;
            const allocateState = this.wasmInstance.exports.allocate_state as () => number;
            const memoryBuffer = new Float32Array(this.wasmMemory.buffer);

            // Ensure we have state pointers for all channels
            while (this.statePtrs.length < input.length) {
                this.statePtrs.push(allocateState());
            }

            for (let channel = 0; channel < input.length; ++channel) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];

                memoryBuffer.set(inputChannel, this.inputPtr / 4);

                processFn(
                    this.inputPtr,
                    this.outputPtr,
                    inputChannel.length,
                    this.statePtrs[channel],
                    b0, b1, b2, a1, a2
                );

                const result = memoryBuffer.subarray(this.outputPtr / 4, (this.outputPtr / 4) + inputChannel.length);
                outputChannel.set(result);
            }
        } else {
            this.processJsFallback(input, output, b0, b1, b2, a1, a2);
        }

        return true;
    }
}

registerProcessor('biquad-processor', BiquadProcessor);

export default BiquadProcessor;