export class CrossfadeWithFXSends {
    private readonly context: AudioContext;
    private readonly crossfadeGain: GainNode;
    private readonly send1Gain: GainNode;
    private readonly send2Gain: GainNode;
    private readonly masterOutput: GainNode;

    constructor(context: AudioContext) {
        this.context = context;

        this.crossfadeGain = context.createGain();
        this.crossfadeGain.gain.value = 1;

        this.send1Gain = context.createGain();
        this.send1Gain.gain.value = 0;

        this.send2Gain = context.createGain();
        this.send2Gain.gain.value = 0;

        this.masterOutput = context.createGain();
        this.masterOutput.gain.value = 1;

        this.crossfadeGain.connect(this.masterOutput);
        this.crossfadeGain.connect(this.send1Gain);
        this.crossfadeGain.connect(this.send2Gain);
    }

    public getInputNode(): GainNode {
        return this.crossfadeGain;
    }

    public getMasterOutput(): GainNode {
        return this.masterOutput;
    }

    public getSend1Node(): GainNode {
        return this.send1Gain;
    }

    public getSend2Node(): GainNode {
        return this.send2Gain;
    }

    public setCrossfadePosition(position: number): void {
        const gain = Math.cos(((position + 1) * Math.PI) / 4);
        this.crossfadeGain.gain.value = Math.max(0, gain);
    }

    public setSendLevels(send1: number, send2: number): void {
        this.send1Gain.gain.value = Math.max(0, Math.min(1, send1));
        this.send2Gain.gain.value = Math.max(0, Math.min(1, send2));
    }

    public getSend1Level(): number {
        return this.send1Gain.gain.value;
    }

    public getSend2Level(): number {
        return this.send2Gain.gain.value;
    }

    public disconnect(): void {
        this.crossfadeGain.disconnect();
        this.send1Gain.disconnect();
        this.send2Gain.disconnect();
        this.masterOutput.disconnect();
    }
}
