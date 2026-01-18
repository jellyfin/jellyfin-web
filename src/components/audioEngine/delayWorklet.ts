// delayWorklet.ts - AudioWorkletProcessor for delay effect

declare const sampleRate: number;

interface AudioWorkletParameters {
    delayTime: Float32Array;
    feedback: Float32Array;
    wet: Float32Array;
    dry: Float32Array;
}

interface AudioWorkletInputs extends Array<Float32Array[]> {}
interface AudioWorkletOutputs extends Array<Float32Array[]> {}

class DelayProcessor extends AudioWorkletProcessor {
    private delayTime: number = 0.1; // seconds
    private feedback: number = 0.0;
    private wet: number = 0.5;
    private dry: number = 0.5;
    private bufferSize: number;
    private buffer: Float32Array;
    private writeIndex: number = 0;

    constructor() {
        super();
        // Use actual sample rate from AudioWorkletGlobalScope (sampleRate is globally available)
        this.bufferSize = sampleRate; // 1 second buffer at actual sample rate
        this.buffer = new Float32Array(this.bufferSize);
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [
            { name: 'delayTime', defaultValue: 0.1, minValue: 0.001, maxValue: 1.0 },
            { name: 'feedback', defaultValue: 0.0, minValue: 0.0, maxValue: 0.9 },
            { name: 'wet', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0 },
            { name: 'dry', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0 }
        ];
    }

    process(
        inputs: AudioWorkletInputs,
        outputs: AudioWorkletOutputs,
        parameters: AudioWorkletParameters
    ): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const delayTime = parameters.delayTime[0] ?? this.delayTime;
        const feedback = parameters.feedback[0] ?? this.feedback;
        const wet = parameters.wet[0] ?? this.wet;
        const dry = parameters.dry[0] ?? this.dry;

        // sampleRate is globally available in AudioWorkletGlobalScope
        const delaySamples = Math.floor(delayTime * sampleRate);

        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; ++i) {
                const inputSample = inputChannel[i];
                const readIndex = (this.writeIndex - delaySamples + this.bufferSize) % this.bufferSize;
                const delayedSample = this.buffer[readIndex] || 0;

                const outputSample = dry * inputSample + wet * delayedSample;

                outputChannel[i] = outputSample;

                // Feedback
                this.buffer[this.writeIndex] = inputSample + feedback * delayedSample;
                this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
            }
        }

        return true;
    }
}

registerProcessor('delay-processor', DelayProcessor);
