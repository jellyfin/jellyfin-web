import { useBackspinStore } from '../../store/backspinStore';
import { HAPTIC_PATTERNS, type TransportState } from '../../types/transport';
import { logger } from '../../utils/logger';

export interface BackspinHandlerOptions {
    mediaElement: HTMLMediaElement | null;
    audioContext: AudioContext | null;
}

export type WorkletMessage =
    | { type: 'paused'; compensationSeconds: number }
    | { type: 'paused_with_compensation'; compensationSeconds: number }
    | { type: 'playing' }
    | { type: 'stopped_reset'; compensationSeconds: number }
    | { type: 'seek_end'; durationMs: number }
    | { type: 'rate_update'; rate: number };

export class BackspinHandler {
    private port: MessagePort | null = null;
    private node: AudioWorkletNode | null = null;
    private mediaElement: HTMLMediaElement | null = null;
    private audioContext: AudioContext | null = null;
    private isInitialized = false;

    constructor() {}

    async initialize(options: BackspinHandlerOptions): Promise<void> {
        const { mediaElement, audioContext } = options;

        if (this.isInitialized) {
            this.destroy();
        }

        this.mediaElement = mediaElement;
        this.audioContext = audioContext;

        if (!audioContext) {
            logger.warn('No AudioContext available', { component: 'BackspinHandler' });
            return;
        }

        try {
            const workletUrl = new URL('./backspinProcessor.ts', import.meta.url);
            await audioContext.audioWorklet.addModule(workletUrl);

            this.port = new MessagePort();
            this.port.start();

            this.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
                this.handleWorkletMessage(event.data);
            };

            this.node = new AudioWorkletNode(audioContext, 'backspin-processor');
            this.node.port.postMessage = this.port.postMessage.bind(this.port);

            this.node.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
                this.handleWorkletMessage(event.data);
            };

            this.isInitialized = true;
            useBackspinStore.getState().setMediaElement(mediaElement);
            useBackspinStore.getState().setAudioContext(audioContext);

            logger.info('Initialized successfully', { component: 'BackspinHandler' });
        } catch (error) {
            logger.error('Failed to initialize', { component: 'BackspinHandler' }, error as Error);
        }
    }

    private handleWorkletMessage(message: WorkletMessage): void {
        const store = useBackspinStore.getState();
        const hapticEnabled = store.config.hapticEnabled;

        switch (message.type) {
            case 'paused':
                this.handlePaused(message.compensationSeconds, hapticEnabled);
                break;
            case 'paused_with_compensation':
                this.handlePausedWithCompensation(message.compensationSeconds, hapticEnabled);
                break;
            case 'playing':
                this.handlePlaying(hapticEnabled);
                break;
            case 'stopped_reset':
                this.handleStoppedReset(message.compensationSeconds, hapticEnabled);
                break;
            case 'seek_end':
                this.handleSeekEnd(message.durationMs, hapticEnabled);
                break;
            case 'rate_update':
                store.setRate(message.rate);
                break;
        }
    }

    private handlePaused(compensationSeconds: number, hapticEnabled: boolean): void {
        if (this.mediaElement) {
            this.mediaElement.pause();
        }
        useBackspinStore.getState().setState('PAUSED_HELD');
        this.triggerHaptic('click', hapticEnabled);
    }

    private handlePausedWithCompensation(compensationSeconds: number, hapticEnabled: boolean): void {
        if (this.mediaElement) {
            const position = this.mediaElement.currentTime;
            const safePosition = Math.max(0, position - compensationSeconds);
            this.mediaElement.currentTime = safePosition;
            this.mediaElement.pause();
        }
        useBackspinStore.getState().setState('PAUSED_HELD');
        this.triggerHaptic('click', hapticEnabled);
    }

    private handlePlaying(hapticEnabled: boolean): void {
        useBackspinStore.getState().setState('RESUMING_SPINUP');
        this.triggerHaptic('spin_up_complete', hapticEnabled);
    }

    private handleStoppedReset(compensationSeconds: number, hapticEnabled: boolean): void {
        if (this.mediaElement) {
            const position = this.mediaElement.currentTime;
            const safePosition = Math.max(0, position - compensationSeconds);
            this.mediaElement.currentTime = safePosition;
            this.mediaElement.pause();
        }
        useBackspinStore.getState().setState('PAUSED_HELD');
        this.triggerHaptic('click', hapticEnabled);
    }

    private handleSeekEnd(durationMs: number, hapticEnabled: boolean): void {
        useBackspinStore.getState().setState('SEEK_END');
        this.triggerHaptic('seek_start', hapticEnabled);
    }

    private triggerHaptic(patternKey: string, enabled: boolean): void {
        if (!enabled) return;

        const pattern = HAPTIC_PATTERNS[patternKey];
        if (pattern && navigator.vibrate) {
            navigator.vibrate(pattern.pattern);
        }
    }

    pauseEngage(durationMs?: number): void {
        if (!this.isInitialized || !this.canPause()) return;
        const store = useBackspinStore.getState();
        const duration = durationMs ?? store.config.pauseDurationMs;
        this.port?.postMessage({ type: 'pause_engage', durationMs: duration });
        store.setState('PAUSING_SLOWDOWN');
        this.triggerHaptic('brake_start', store.config.hapticEnabled);
    }

    pauseDisengage(durationMs?: number): void {
        if (!this.isInitialized || !this.canPlay()) return;
        const store = useBackspinStore.getState();
        const duration = durationMs ?? store.config.resumeDurationMs;
        this.port?.postMessage({ type: 'pause_disengage', durationMs: duration });
    }

    stop(durationMs?: number): void {
        if (!this.isInitialized || !this.canStop()) return;
        const store = useBackspinStore.getState();
        const duration = durationMs ?? store.config.stopDurationMs;
        this.port?.postMessage({ type: 'stop', durationMs: duration });
        store.setState('STOPPING_BRAKE');
        this.triggerHaptic('brake_start', store.config.hapticEnabled);
    }

    scratchDrag(velocity: number, position: number): void {
        if (!this.isInitialized) return;
        this.port?.postMessage({ type: 'scratch_drag', velocity, position });
        useBackspinStore.getState().setScratching(true, velocity);
    }

    scratchEnd(durationMs?: number): void {
        if (!this.isInitialized) return;
        const store = useBackspinStore.getState();
        const duration = durationMs ?? store.config.seekEndDurationMs;
        this.port?.postMessage({ type: 'scratch_end', durationMs: duration });
        useBackspinStore.getState().setScratching(false);
    }

    private canPause(): boolean {
        const state = useBackspinStore.getState().state;
        return state === 'LOCKED_PLAYING' || state === 'RESUMING_SPINUP' || state === 'SCRATCH_DRAG';
    }

    private canPlay(): boolean {
        const state = useBackspinStore.getState().state;
        return state === 'PAUSED_HELD' || state === 'PAUSING_SLOWDOWN' || state === 'STOPPING_BRAKE';
    }

    private canStop(): boolean {
        const state = useBackspinStore.getState().state;
        return state === 'LOCKED_PLAYING' || state === 'RESUMING_SPINUP' || state === 'SCRATCH_DRAG';
    }

    destroy(): void {
        this.node?.disconnect();
        this.port?.close();
        this.port = null;
        this.node = null;
        this.isInitialized = false;
        useBackspinStore.getState().setMediaElement(null);
        useBackspinStore.getState().setAudioContext(null);
    }

    getNode(): AudioWorkletNode | null {
        return this.node;
    }

    isReady(): boolean {
        return this.isInitialized;
    }
}

export const backspinHandler = new BackspinHandler();
