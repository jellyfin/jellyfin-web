// gainWorklet.js - AudioWorkletProcessor for gain control

class GainProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.gain = 1.0;
    }

    static get parameterDescriptors() {
        return [
            { name: 'gain', defaultValue: 1.0, minValue: 0, maxValue: 10 }
        ];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const gain = parameters.gain[0] || this.gain;

        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; ++i) {
                outputChannel[i] = inputChannel[i] * gain;
            }
        }

        return true;
    }
}

registerProcessor('gain-processor', GainProcessor);