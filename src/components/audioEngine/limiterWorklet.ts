// limiterWorklet.ts - AudioWorkletProcessor for limiting

interface AudioWorkletParameters {
    threshold: Float32Array;
    ratio: Float32Array;
    attack: Float32Array;
    release: Float32Array;
}

interface AudioWorkletInputs extends Array<Float32Array[]> {}
interface AudioWorkletOutputs extends Array<Float32Array[]> {}

class LimiterProcessor extends AudioWorkletProcessor {
    private threshold: number = 0.8; // dB
    private ratio: number = 10;
    private attack: number = 0.003; // seconds
    private release: number = 0.25; // seconds
    private envelope: number = 0;

    constructor() {
        super();
    }

    static get parameterDescriptors(): AudioParamDescriptor[] {
        return [
            { name: 'threshold', defaultValue: 0.8, minValue: 0, maxValue: 1 },
            { name: 'ratio', defaultValue: 10, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.003, minValue: 0.001, maxValue: 0.1 },
            { name: 'release', defaultValue: 0.25, minValue: 0.01, maxValue: 1 }
        ];
    }

    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const threshold = parameters.threshold[0] ?? this.threshold;
        const ratio = parameters.ratio[0] ?? this.ratio;
        const attack = parameters.attack[0] ?? this.attack;
        const release = parameters.release[0] ?? this.release;

        for (let channel = 0; channel < input.length; ++channel) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            for (let i = 0; i < inputChannel.length; ++i) {
                const sample = inputChannel[i];
                const absSample = Math.abs(sample);

                // Simple envelope follower
                if (absSample > this.envelope) {
                    this.envelope += (absSample - this.envelope) * attack;
                } else {
                    this.envelope += (absSample - this.envelope) * release;
                }

                // Limiting - apply gain reduction when envelope exceeds threshold
                // Formula: gain = (threshold/envelope)^(1 - 1/ratio)
                // This ensures output stays closer to threshold as ratio increases
                let gain = 1;
                if (this.envelope > threshold) {
                    // Equivalent to (threshold/envelope)^(1 - 1/ratio)
                    const exponent = 1 - (1 / ratio);
                    gain = Math.pow(threshold / this.envelope, exponent);
                }

                outputChannel[i] = sample * gain;
            }
        }

        return true;
    }
}

registerProcessor('limiter-processor', LimiterProcessor);

export default LimiterProcessor;
