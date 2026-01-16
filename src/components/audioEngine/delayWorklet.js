// delayWorklet.js - AudioWorkletProcessor for delay effect

class DelayProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.delayTime = 0.1; // seconds
        this.feedback = 0.0;
        this.wet = 0.5;
        this.dry = 0.5;
        this.bufferSize = 44100; // 1 second at 44.1kHz
        this.buffer = new Float32Array(this.bufferSize);
        this.writeIndex = 0;
    }

    static get parameterDescriptors() {
        return [
            { name: 'delayTime', defaultValue: 0.1, minValue: 0.001, maxValue: 1.0 },
            { name: 'feedback', defaultValue: 0.0, minValue: 0.0, maxValue: 0.9 },
            { name: 'wet', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0 },
            { name: 'dry', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0 }
        ];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const delayTime = parameters.delayTime[0] || this.delayTime;
        const feedback = parameters.feedback[0] || this.feedback;
        const wet = parameters.wet[0] || this.wet;
        const dry = parameters.dry[0] || this.dry;

        const sampleRate = 44100; // Assume 44.1kHz
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