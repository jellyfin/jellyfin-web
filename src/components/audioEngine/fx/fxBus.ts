export class FXBus {
    private readonly context: AudioContext;
    private readonly busId: number;
    private readonly inputGain: GainNode;
    private readonly wetGain: GainNode;
    private readonly dryGain: GainNode;
    private readonly returnGain: GainNode;
    private readonly effects: AudioNode[] = [];
    private enabled = true;
    private rubberLFO: OscillatorNode | null = null;
    private rubberFilter: BiquadFilterNode | null = null;
    private readonly rampTime = 0.01;

    constructor(context: AudioContext, busId: number) {
        this.context = context;
        this.busId = busId;

        this.inputGain = context.createGain();
        this.inputGain.gain.value = 1;

        this.wetGain = context.createGain();
        this.wetGain.gain.value = 0.5;

        this.dryGain = context.createGain();
        this.dryGain.gain.value = 0.5;

        this.returnGain = context.createGain();
        this.returnGain.gain.value = 1;
    }

    public getInputNode(): GainNode {
        return this.inputGain;
    }

    public getReturnNode(): GainNode {
        return this.returnGain;
    }

    public getDryNode(): GainNode {
        return this.dryGain;
    }

    public getWetNode(): GainNode {
        return this.wetGain;
    }

    public addEffect(effect: AudioNode): void {
        if (this.effects.length === 0) {
            this.inputGain.connect(effect);
        } else {
            this.effects[this.effects.length - 1].connect(effect);
        }
        effect.connect(this.wetGain);
        this.effects.push(effect);
    }

    public addReverb(decay = 2, wetMix = 0.3): void {
        const convolver = this.context.createConvolver();
        const length = this.context.sampleRate * decay;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const amplitude = Math.pow(1 - i / length, 2);
                data[i] = (Math.random() * 2 - 1) * amplitude;
            }
        }

        convolver.buffer = impulse;
        this.addEffect(convolver);
        this.setWetMix(wetMix);
    }

    public addEcho(time = 500, feedback = 0.4, wetMix = 0.3): void {
        const delay = this.context.createDelay(2);
        delay.delayTime.value = time / 1000;

        const feedbackGain = this.context.createGain();
        feedbackGain.gain.value = feedback;

        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(this.wetGain);

        this.addEffect(delay);
        this.setWetMix(wetMix);
    }

    public addRubberBanding(intensity = 0.5): void {
        this.stopRubberBanding();

        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2;

        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 500 * intensity;

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        filter.Q.value = 10;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const wetOutput = this.context.createGain();
        wetOutput.gain.value = 0.5 * intensity;

        filter.connect(wetOutput);

        this.addEffect(filter);

        this.rubberLFO = lfo;
        this.rubberFilter = filter;

        lfo.start();
    }

    public setRubberBandingRate(rateHz: number): void {
        if (this.rubberLFO) {
            this.rubberLFO.frequency.value = rateHz;
        }
    }

    public setRubberBandingIntensity(intensity: number): void {
        if (this.rubberFilter && this.rubberLFO) {
            this.rubberLFO.frequency.value = 2 + intensity * 2;
            this.rubberFilter.Q.value = 5 + 10 * intensity;
        }
    }

    public stopRubberBanding(): void {
        if (this.rubberLFO) {
            try {
                this.rubberLFO.stop();
            } catch {
                // LFO may already be stopped
            }
            this.rubberLFO = null;
            this.rubberFilter = null;
        }
    }

    public setWetMix(mix: number): void {
        const now = this.context.currentTime;
        this.wetGain.gain.setTargetAtTime(Math.max(0, Math.min(1, mix)), now, this.rampTime);
        this.dryGain.gain.setTargetAtTime(Math.max(0, Math.min(1, 1 - mix)), now, this.rampTime);
    }

    public setReturnLevel(level: number): void {
        this.returnGain.gain.value = Math.max(0, Math.min(1, level));
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            if (this.effects.length > 0) {
                this.inputGain.connect(this.effects[0]);
            } else {
                this.inputGain.connect(this.wetGain);
            }
        } else {
            this.inputGain.disconnect();
        }
    }

    public getEnabled(): boolean {
        return this.enabled;
    }

    public getBusId(): number {
        return this.busId;
    }

    public disconnect(): void {
        this.inputGain.disconnect();
        this.wetGain.disconnect();
        this.dryGain.disconnect();
        this.returnGain.disconnect();
        this.stopRubberBanding();
        this.effects.forEach(effect => {
            effect.disconnect();
        });
        this.effects.length = 0;
    }
}
