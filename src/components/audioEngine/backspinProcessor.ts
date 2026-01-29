declare const sampleRate: number;

type TransportState =
    | 'LOCKED_PLAYING'
    | 'PAUSING_SLOWDOWN'
    | 'PAUSED_HELD'
    | 'RESUMING_SPINUP'
    | 'STOPPING_BRAKE'
    | 'SCRATCH_DRAG'
    | 'SEEK_END'
    | 'SEEK_END_PAUSED';

interface Envelope {
    i: number;
    n: number;
}

interface Message {
    type: string;
    durationMs?: number;
    velocity?: number;
    position?: number;
    compensationSeconds?: number;
}

export class BackspinProcessor extends AudioWorkletProcessor {
    private static readonly STATES = {
        LOCKED_PLAYING: 'LOCKED_PLAYING' as TransportState,
        PAUSING_SLOWDOWN: 'PAUSING_SLOWDOWN' as TransportState,
        PAUSED_HELD: 'PAUSED_HELD' as TransportState,
        RESUMING_SPINUP: 'RESUMING_SPINUP' as TransportState,
        STOPPING_BRAKE: 'STOPPING_BRAKE' as TransportState,
        SCRATCH_DRAG: 'SCRATCH_DRAG' as TransportState,
        SEEK_END: 'SEEK_END' as TransportState,
        SEEK_END_PAUSED: 'SEEK_END_PAUSED' as TransportState
    };

    private state: TransportState = BackspinProcessor.STATES.LOCKED_PLAYING;
    private rate = 1.0;
    private env: Envelope | null = null;
    private pendingAction: 'pause' | 'play' | 'stop_reset' | null = null;

    private ringBufferL: Float32Array;
    private ringBufferR: Float32Array;
    private writePos = 0;
    private readPos = 0;
    private effectiveReadPos = 0;

    private readonly readDelaySeconds = 1.0;
    private readonly readDelaySamples: number;

    private scratchVelocity = 0;
    private lastScratchPos = 0;

    constructor() {
        super();

        this.readDelaySamples = Math.floor(this.readDelaySeconds * sampleRate);
        const bufferSize = this.readDelaySamples * 2;
        this.ringBufferL = new Float32Array(bufferSize);
        this.ringBufferR = new Float32Array(bufferSize);

        this.port.onmessage = (event: MessageEvent<Message>) => {
            const {
                type,
                durationMs = 300,
                velocity = 0,
                position = 0,
                compensationSeconds = 0
            } = event.data;

            switch (type) {
                case 'pause_engage':
                    this.handlePauseEngage(durationMs);
                    break;
                case 'pause_disengage':
                    this.handlePauseDisengage(durationMs);
                    break;
                case 'stop':
                    this.handleStop(durationMs);
                    break;
                case 'scratch_drag':
                    this.handleScratchDrag(velocity, position);
                    break;
                case 'scratch_end':
                    this.handleScratchEnd(durationMs);
                    break;
                case 'do_pause':
                    this.port.postMessage({ type: 'paused', compensationSeconds });
                    break;
                case 'do_pause_with_compensation':
                    this.port.postMessage({
                        type: 'paused_with_compensation',
                        compensationSeconds
                    });
                    break;
                case 'do_play':
                    this.port.postMessage({ type: 'playing' });
                    break;
                case 'do_stop_reset':
                    this.port.postMessage({ type: 'stopped_reset', compensationSeconds });
                    break;
            }
        };
    }

    private handlePauseEngage(durationMs: number): void {
        if (this.state === BackspinProcessor.STATES.PAUSED_HELD) return;
        this.startRamp(BackspinProcessor.STATES.PAUSING_SLOWDOWN, durationMs, 'pause');
    }

    private handlePauseDisengage(durationMs: number): void {
        if (this.state === BackspinProcessor.STATES.LOCKED_PLAYING) return;
        this.port.postMessage({ type: 'do_play' });
        this.startRamp(BackspinProcessor.STATES.RESUMING_SPINUP, durationMs, null);
    }

    private handleStop(durationMs: number): void {
        this.startRamp(BackspinProcessor.STATES.STOPPING_BRAKE, durationMs, 'stop_reset');
    }

    private handleScratchDrag(velocity: number, position: number): void {
        this.state = BackspinProcessor.STATES.SCRATCH_DRAG;
        this.scratchVelocity = velocity;
        this.lastScratchPos = position;
        this.env = null;
        this.pendingAction = null;
    }

    private handleScratchEnd(durationMs: number): void {
        this.port.postMessage({ type: 'seek_end', durationMs });
        this.startRamp(BackspinProcessor.STATES.SEEK_END, durationMs, null);
    }

    private startRamp(
        nextState: TransportState,
        durationMs: number,
        action: typeof this.pendingAction
    ): void {
        this.state = nextState;
        const samples = Math.max(1, Math.floor((durationMs / 1000) * sampleRate));
        this.env = { i: 0, n: samples };
        this.pendingAction = action;
    }

    private rateForState(t: number): number {
        if (this.state === BackspinProcessor.STATES.PAUSING_SLOWDOWN) {
            return Math.max(0, (1 - t) ** 2);
        }
        if (this.state === BackspinProcessor.STATES.STOPPING_BRAKE) {
            return Math.max(0, 1 - t);
        }
        if (this.state === BackspinProcessor.STATES.RESUMING_SPINUP) {
            return Math.min(1, t * t);
        }
        if (this.state === BackspinProcessor.STATES.SEEK_END) {
            return Math.min(1, t * t);
        }
        return 1.0;
    }

    private interpolateCubic(x: number, y0: number, y1: number, y2: number, y3: number): number {
        const mu2 = x * x;
        const a0 = y3 - y2 - y0 + y1;
        const a1 = y0 - y1 - a0;
        const a2 = y2 - y0;
        const a3 = y1;
        return a0 * x * mu2 + a1 * mu2 + a2 * x + a3;
    }

    private getInterpolatedSample(buffer: Float32Array, readIndex: number): number {
        const bufferLen = buffer.length;
        const readIndexInt = Math.floor(readIndex);
        const readIndexNext = (readIndexInt + 1) % bufferLen;
        const readIndexPrev = (readIndexInt - 1 + bufferLen) % bufferLen;
        const readIndexPrev2 = (readIndexInt - 2 + bufferLen) % bufferLen;
        const frac = readIndex - readIndexInt;

        const y0 = buffer[readIndexPrev2];
        const y1 = buffer[readIndexPrev];
        const y2 = buffer[readIndexInt];
        const y3 = buffer[readIndexNext];

        return this.interpolateCubic(frac, y0, y1, y2, y3);
    }

    private normalizeReadPos(readPos: number, bufferLen: number): number {
        while (readPos < 0) readPos += bufferLen;
        while (readPos >= bufferLen) readPos -= bufferLen;
        return readPos;
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || input.length < 2) {
            for (let ch = 0; ch < output.length; ch++) {
                output[ch].fill(0);
            }
            return true;
        }

        const inputL = input[0];
        const inputR = input[1] || input[0];
        const outputL = output[0];
        const outputR = output[1] || output[0];

        const bufferLen = this.ringBufferL.length;
        const isPaused = this.state === BackspinProcessor.STATES.PAUSED_HELD;

        for (let i = 0; i < outputL.length; i++) {
            if (!isPaused) {
                this.ringBufferL[this.writePos] = inputL[i];
                this.ringBufferR[this.writePos] = inputR[i];
            }

            if (this.env) {
                const t = this.env.i / this.env.n;
                this.rate = this.rateForState(t);
                this.env.i++;

                if (this.env.i >= this.env.n) {
                    if (
                        this.state === BackspinProcessor.STATES.PAUSING_SLOWDOWN ||
                        this.state === BackspinProcessor.STATES.STOPPING_BRAKE
                    ) {
                        this.rate = 0;
                        this.state = BackspinProcessor.STATES.PAUSED_HELD;
                        if (this.pendingAction === 'pause') {
                            this.port.postMessage({
                                type: 'do_pause',
                                compensationSeconds: this.readDelaySeconds
                            });
                        } else if (this.pendingAction === 'stop_reset') {
                            this.port.postMessage({
                                type: 'do_stop_reset',
                                compensationSeconds: this.readDelaySeconds
                            });
                        }
                    } else if (
                        this.state === BackspinProcessor.STATES.RESUMING_SPINUP ||
                        this.state === BackspinProcessor.STATES.SEEK_END
                    ) {
                        this.rate = 1;
                        this.state = BackspinProcessor.STATES.LOCKED_PLAYING;
                    }
                    this.env = null;
                    this.pendingAction = null;
                }
            } else if (this.state === BackspinProcessor.STATES.SCRATCH_DRAG) {
                this.rate = this.scratchVelocity;
            } else if (this.state === BackspinProcessor.STATES.LOCKED_PLAYING) {
                this.rate = 1;
            } else if (this.state === BackspinProcessor.STATES.PAUSED_HELD) {
                this.rate = 0;
            }

            const effectiveReadIndex = (this.effectiveReadPos + this.readDelaySamples) % bufferLen;

            if (Math.abs(this.rate) > 0.001) {
                const sampleL = this.getInterpolatedSample(this.ringBufferL, effectiveReadIndex);
                const sampleR = this.getInterpolatedSample(this.ringBufferR, effectiveReadIndex);
                outputL[i] = sampleL;
                outputR[i] = sampleR;
            } else {
                outputL[i] = 0;
                outputR[i] = 0;
            }

            this.effectiveReadPos = this.normalizeReadPos(
                this.effectiveReadPos + this.rate,
                bufferLen
            );
        }

        if (!isPaused) {
            this.writePos = (this.writePos + outputL.length) % bufferLen;
        }

        this.port.postMessage({ type: 'rate_update', rate: this.rate });

        return true;
    }
}

registerProcessor('backspin-processor', BackspinProcessor);
