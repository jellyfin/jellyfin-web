// limiterWorklet.ts - AudioWorkletProcessor for limiting

class LimiterProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.threshold = 0.8; // dB
        this.ratio = 10;
        this.attack = 0.003; // seconds
        this.release = 0.25; // seconds
        this.envelope = 0;
    }

    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: 0.8, minValue: 0, maxValue: 1 },
            { name: 'ratio', defaultValue: 10, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.003, minValue: 0.001, maxValue: 0.1 },
            { name: 'release', defaultValue: 0.25, minValue: 0.01, maxValue: 1 }
        ];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !output) return true;

        const threshold = parameters.threshold[0] || this.threshold;
        const ratio = parameters.ratio[0] || this.ratio;
        const attack = parameters.attack[0] || this.attack;
        const release = parameters.release[0] || this.release;

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
