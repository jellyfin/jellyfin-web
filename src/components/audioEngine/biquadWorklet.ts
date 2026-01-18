// biquadWorklet.ts - AudioWorkletProcessor for biquad filter

interface AudioWorkletParameters {
    frequency: Float32Array;
    Q: Float32Array;
    gain: Float32Array;
}

interface AudioWorkletInputs extends Array<Float32Array[]> {}
interface AudioWorkletOutputs extends Array<Float32Array[]> {}

class BiquadProcessor extends AudioWorkletProcessor {
    private frequency: number = 1000;
    private Q: number = 1;
    private gain: number = 0;
    private type: string = 'lowpass'; // lowpass, highpass, bandpass, etc.
    private sampleRate: number = 44100;
    private b0: number = 1;
    private b1: number = 0;
    private b2: number = 0;
    private a1: number = 0;
    private a2: number = 0;

    constructor() {
        super();
        this.updateCoefficients();
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [
            { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000 },
            { name: 'Q', defaultValue: 1, minValue: 0.1, maxValue: 10 },
            { name: 'gain', defaultValue: 0, minValue: -40, maxValue: 40 }
        ];
    }

    updateCoefficients(): void {
        const f0 = this.frequency;
        const Q = this.Q;
        const gain = this.gain;
        const sampleRate = this.sampleRate;

        const A = Math.pow(10, gain / 40);
        const omega = 2 * Math.PI * f0 / sampleRate;
        const alpha = Math.sin(omega) / (2 * Q);

        let b0: number; let b1: number; let b2: number; let a0: number; let a1: number; let a2: number;

        switch (this.type) {
            case 'lowpass':
                b0 = (1 - Math.cos(omega)) / 2;
                b1 = 1 - Math.cos(omega);
                b2 = (1 - Math.cos(omega)) / 2;
                a0 = 1 + alpha;
                a1 = -2 * Math.cos(omega);
                a2 = 1 - alpha;
                break;
            case 'highpass':
                b0 = (1 + Math.cos(omega)) / 2;
                b1 = -(1 + Math.cos(omega));
                b2 = (1 + Math.cos(omega)) / 2;
                a0 = 1 + alpha;
                a1 = -2 * Math.cos(omega);
                a2 = 1 - alpha;
                break;
            default:
                // Identity filter
                b0 = 1; b1 = 0; b2 = 0;
                a0 = 1; a1 = 0; a2 = 0;
        }

        // Normalize
        b0 /= a0; b1 /= a0; b2 /= a0;
        a1 /= a0; a2 /= a0;
        a0 = 1;

        this.b0 = b0; this.b1 = b1; this.b2 = b2;
        this.a1 = a1; this.a2 = a2;
    }

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const frequency = parameters.frequency[0] ?? this.frequency;
        const Q = parameters.Q[0] ?? this.Q;
        const gain = parameters.gain[0] ?? this.gain;

        if (frequency !== this.frequency || Q !== this.Q || gain !== this.gain) {
            this.frequency = frequency;
            this.Q = Q;
            this.gain = gain;
            this.updateCoefficients();
        }

        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;

            for (let i = 0; i < inputChannel.length; ++i) {
                const x0 = inputChannel[i];
                const y0 = this.b0 * x0 + this.b1 * x1 + this.b2 * x2 - this.a1 * y1 - this.a2 * y2;

                outputChannel[i] = y0;

                x2 = x1; x1 = x0;
                y2 = y1; y1 = y0;
            }
        }

        return true;
    }
}

registerProcessor('biquad-processor', BiquadProcessor);

export default BiquadProcessor;
