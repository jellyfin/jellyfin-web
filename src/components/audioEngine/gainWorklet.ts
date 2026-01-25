// gainWorklet.ts - AudioWorkletProcessor for gain control

declare const AudioWorkletProcessor: any;
declare const registerProcessor: (name: string, processor: any) => void;

interface AudioParamDescriptor {
    name: string;
    defaultValue: number;
    minValue?: number;
    maxValue?: number;
}

interface AudioWorkletParameters {
    gain: Float32Array;
}

interface AudioWorkletInputs extends Array<Float32Array[]> {}
interface AudioWorkletOutputs extends Array<Float32Array[]> {}

class GainProcessor extends AudioWorkletProcessor {
    private gain: number = 1.0;

    constructor() {
        super();
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [{ name: 'gain', defaultValue: 1.0, minValue: 0, maxValue: 10 }];
    }

    process(inputs: AudioWorkletInputs, outputs: AudioWorkletOutputs, parameters: AudioWorkletParameters): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const gain = parameters.gain[0] ?? this.gain;

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

export default GainProcessor;
