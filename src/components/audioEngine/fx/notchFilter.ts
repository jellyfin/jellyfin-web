export class NotchFilterNode {
    private readonly context: AudioContext;
    private readonly notch: BiquadFilterNode;
    private readonly bypassNode: GainNode;
    private readonly wetGain: GainNode;
    private readonly dryGain: GainNode;
    private readonly outputSum: GainNode;
    private enabled = false;
    private readonly rampTime = 0.005;

    constructor(context: AudioContext) {
        this.context = context;

        this.notch = context.createBiquadFilter();
        this.notch.type = 'notch';
        this.notch.frequency.value = 60;
        this.notch.Q.value = 10;
        this.notch.gain.value = 0;

        this.bypassNode = context.createGain();
        this.bypassNode.gain.value = 1;

        this.wetGain = context.createGain();
        this.wetGain.gain.value = 0;

        this.dryGain = context.createGain();
        this.dryGain.gain.value = 1;

        this.outputSum = context.createGain();
        this.outputSum.gain.value = 1;

        this.notch.connect(this.wetGain);
        this.bypassNode.connect(this.dryGain);
        this.wetGain.connect(this.outputSum);
        this.dryGain.connect(this.outputSum);
    }

    public getInputNode(): GainNode {
        return this.bypassNode;
    }

    public getOutputNode(): GainNode {
        return this.outputSum;
    }

    public setFrequency(frequency: number): void {
        this.notch.frequency.value = Math.max(20, Math.min(20000, frequency));
    }

    public setResonance(resonance: number): void {
        this.notch.Q.value = Math.max(0.1, Math.min(20, resonance));
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        const now = this.context.currentTime;

        if (enabled) {
            this.wetGain.gain.setTargetAtTime(1, now, this.rampTime);
            this.dryGain.gain.setTargetAtTime(0, now, this.rampTime);
        } else {
            this.wetGain.gain.setTargetAtTime(0, now, this.rampTime);
            this.dryGain.gain.setTargetAtTime(1, now, this.rampTime);
        }
    }

    public getEnabled(): boolean {
        return this.enabled;
    }

    public getFrequency(): number {
        return this.notch.frequency.value;
    }

    public getResonance(): number {
        return this.notch.Q.value;
    }

    public disconnect(): void {
        this.notch.disconnect();
        this.bypassNode.disconnect();
        this.wetGain.disconnect();
        this.dryGain.disconnect();
        this.outputSum.disconnect();
    }
}
