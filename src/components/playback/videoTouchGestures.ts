import dom from 'utils/dom';

import './videoTouchGestures.scss';

const DOUBLE_TAP_MS = 300;
/** After a successful seek, keep the side hot a bit longer for rapid repeats. */
const CHAIN_SEEK_MS = 550;
const LONG_PRESS_MS = 500;
const TAP_MOVE_MAX_PX = 36;
const LONG_PRESS_MOVE_CANCEL_PX = 24;
const DOUBLE_TAP_SLOP_PX = 140;
const FEEDBACK_HIDE_MS = 700;
const EDGE_MARGIN_RATIO = 0.05;
const EDGE_MARGIN_MIN_PX = 24;

export type GestureRegion = 'left' | 'center' | 'right' | 'edge';

export interface VideoTouchGesturesOptions {
    element: HTMLElement;
    feedbackElement: HTMLElement;
    isEnabled: () => boolean;
    canSeek: () => boolean;
    isSyncPlayActive: () => boolean;
    getSkipBackSeconds: () => number;
    getSkipForwardSeconds: () => number;
    isPaused: () => boolean;
    isPlaying: () => boolean;
    isInteractiveTarget: (target: EventTarget | null) => boolean;
    onToggleOsd: () => void;
    onSeekBackward: () => void;
    onSeekForward: () => void;
    onPlayPause: () => void;
    onRateBoostStart: () => void;
    onRateBoostEnd: () => void;
    /** Fired when a gesture is recognized (seek / play-pause / 2x). */
    onGesture?: () => void;
}

function getRegion(clientX: number, element: HTMLElement): GestureRegion {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width || 1;
    const edge = Math.max(EDGE_MARGIN_MIN_PX, width * EDGE_MARGIN_RATIO);

    if (x < edge || x > width - edge) {
        return 'edge';
    }

    const usable = width - (2 * edge);
    const leftEnd = edge + (usable * 0.35);
    const rightStart = edge + (usable * 0.65);

    if (x < leftEnd) {
        return 'left';
    }

    if (x > rightStart) {
        return 'right';
    }

    return 'center';
}

function distanceSq(x1: number, y1: number, x2: number, y2: number) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return (dx * dx) + (dy * dy);
}

const instances = new WeakMap<HTMLElement, VideoTouchGestures>();

/**
 * Pointer-based video OSD touch gestures (double-tap seek / play-pause, long-press 2x).
 */
export class VideoTouchGestures {
    private readonly options: VideoTouchGesturesOptions;
    private destroyed = false;
    private singleTapTimer: ReturnType<typeof setTimeout> | null = null;
    private longPressTimer: ReturnType<typeof setTimeout> | null = null;
    private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
    private lastTapAt = 0;
    private lastTapRegion: GestureRegion | null = null;
    private lastTapX = 0;
    private lastTapY = 0;
    private pointerId: number | null = null;
    private startX = 0;
    private startY = 0;
    private rateBoostActive = false;
    private longPressCancelled = false;
    private ignoreNextClick = false;
    private suppressNextPointerUp = false;
    private tapToken = 0;
    private chainSeekArmed = false;

    private readonly onPointerDown: (e: PointerEvent) => void;
    private readonly onPointerMove: (e: PointerEvent) => void;
    private readonly onPointerUp: (e: PointerEvent) => void;
    private readonly onPointerCancel: (e: PointerEvent) => void;
    private readonly onClickCapture: (e: MouseEvent) => void;

    constructor(options: VideoTouchGesturesOptions) {
        this.options = options;

        this.onPointerDown = (e) => this.handlePointerDown(e);
        this.onPointerMove = (e) => this.handlePointerMove(e);
        this.onPointerUp = (e) => this.handlePointerUp(e);
        this.onPointerCancel = (e) => this.handlePointerCancel(e);
        this.onClickCapture = (e) => this.handleClickCapture(e);

        const { element } = options;
        const previous = instances.get(element);
        if (previous && previous !== this) {
            previous.destroy();
        }
        instances.set(element, this);

        element.classList.add('videoTouchGestures-enabled');
        dom.addEventListener(element, 'pointerdown', this.onPointerDown, { capture: true, passive: true });
        dom.addEventListener(element, 'pointermove', this.onPointerMove, { capture: true, passive: true });
        dom.addEventListener(element, 'pointerup', this.onPointerUp, { capture: true, passive: true });
        dom.addEventListener(element, 'pointercancel', this.onPointerCancel, { capture: true, passive: true });
        dom.addEventListener(element, 'click', this.onClickCapture, { capture: true, passive: false });
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.clearSingleTapTimer();
        this.clearLongPressTimer();
        this.clearFeedbackTimer();
        this.endRateBoost();
        this.hideFeedback();

        const { element } = this.options;
        if (instances.get(element) === this) {
            instances.delete(element);
        }
        element.classList.remove('videoTouchGestures-enabled');
        dom.removeEventListener(element, 'pointerdown', this.onPointerDown, { capture: true, passive: true });
        dom.removeEventListener(element, 'pointermove', this.onPointerMove, { capture: true, passive: true });
        dom.removeEventListener(element, 'pointerup', this.onPointerUp, { capture: true, passive: true });
        dom.removeEventListener(element, 'pointercancel', this.onPointerCancel, { capture: true, passive: true });
        dom.removeEventListener(element, 'click', this.onClickCapture, { capture: true, passive: false });
    }

    private handleClickCapture(e: MouseEvent) {
        if (!this.ignoreNextClick) {
            return;
        }

        this.ignoreNextClick = false;
        e.stopPropagation();
        e.preventDefault();
    }

    private shouldHandle(e: PointerEvent) {
        if (!this.options.isEnabled()) {
            return false;
        }

        const pointerType = e.pointerType || 'touch';
        if (pointerType !== 'touch') {
            return false;
        }

        if (this.options.isInteractiveTarget(e.target)) {
            return false;
        }

        return true;
    }

    private invalidatePendingOsdTap() {
        this.tapToken += 1;
        this.clearSingleTapTimer();
    }

    private isDoubleTap(clientX: number, clientY: number, region: GestureRegion, now: number) {
        if (!this.lastTapRegion) {
            return false;
        }

        const windowMs = this.chainSeekArmed ? CHAIN_SEEK_MS : DOUBLE_TAP_MS;
        if ((now - this.lastTapAt) > windowMs) {
            return false;
        }

        if (this.lastTapRegion === region) {
            return true;
        }

        return distanceSq(clientX, clientY, this.lastTapX, this.lastTapY)
            <= (DOUBLE_TAP_SLOP_PX * DOUBLE_TAP_SLOP_PX);
    }

    private armChainedSeek(clientX: number, clientY: number, region: GestureRegion) {
        this.chainSeekArmed = true;
        this.lastTapAt = Date.now();
        this.lastTapRegion = region === 'edge' ? this.lastTapRegion : region;
        this.lastTapX = clientX;
        this.lastTapY = clientY;
        this.clearSingleTapTimer();
    }

    private clearTapCandidate() {
        this.chainSeekArmed = false;
        this.lastTapAt = 0;
        this.lastTapRegion = null;
    }

    private handlePointerDown(e: PointerEvent) {
        if (!this.shouldHandle(e)) {
            return;
        }

        const region = getRegion(e.clientX, this.options.element);
        const now = Date.now();
        const windowMs = this.chainSeekArmed ? CHAIN_SEEK_MS : DOUBLE_TAP_MS;

        if (this.lastTapRegion && (now - this.lastTapAt) <= windowMs) {
            this.clearSingleTapTimer();

            if (this.isDoubleTap(e.clientX, e.clientY, region, now)) {
                const actionRegion = this.lastTapRegion !== 'edge' ? this.lastTapRegion : region;
                this.invalidatePendingOsdTap();
                this.ignoreNextClick = true;
                this.suppressNextPointerUp = true;
                this.pointerId = e.pointerId;
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.longPressCancelled = true;
                this.clearLongPressTimer();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.fireDoubleTap(actionRegion);
                this.armChainedSeek(e.clientX, e.clientY, actionRegion);
                return;
            }

            this.clearTapCandidate();
        }

        this.pointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.longPressCancelled = false;
        this.suppressNextPointerUp = false;

        this.clearLongPressTimer();

        if (!this.options.isSyncPlayActive() && this.options.isPlaying()) {
            this.longPressTimer = setTimeout(() => {
                this.longPressTimer = null;
                if (this.longPressCancelled || this.pointerId !== e.pointerId) {
                    return;
                }

                this.clearTapCandidate();
                this.invalidatePendingOsdTap();
                this.startRateBoost();
            }, LONG_PRESS_MS);
        }
    }

    private handlePointerMove(e: PointerEvent) {
        if (this.pointerId !== e.pointerId) {
            return;
        }

        if (distanceSq(e.clientX, e.clientY, this.startX, this.startY)
            > (LONG_PRESS_MOVE_CANCEL_PX * LONG_PRESS_MOVE_CANCEL_PX)) {
            this.longPressCancelled = true;
            this.clearLongPressTimer();
            if (this.rateBoostActive) {
                this.endRateBoost();
            }
        }
    }

    private handlePointerUp(e: PointerEvent) {
        const suppressUp = this.suppressNextPointerUp;

        if (this.pointerId !== e.pointerId && !suppressUp) {
            return;
        }

        const wasBoosting = this.rateBoostActive;
        this.suppressNextPointerUp = false;
        this.clearLongPressTimer();
        this.endRateBoost();
        this.pointerId = null;

        if (suppressUp) {
            this.ignoreNextClick = true;
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }

        if (!this.shouldHandle(e)) {
            return;
        }

        if (wasBoosting) {
            this.ignoreNextClick = true;
            return;
        }

        if (distanceSq(e.clientX, e.clientY, this.startX, this.startY)
            > (TAP_MOVE_MAX_PX * TAP_MOVE_MAX_PX)) {
            return;
        }

        const region = getRegion(e.clientX, this.options.element);

        this.chainSeekArmed = false;
        this.lastTapAt = Date.now();
        this.lastTapRegion = region;
        this.lastTapX = e.clientX;
        this.lastTapY = e.clientY;
        this.clearSingleTapTimer();
        const token = ++this.tapToken;
        this.singleTapTimer = setTimeout(() => {
            this.singleTapTimer = null;
            if (this.destroyed || token !== this.tapToken) {
                return;
            }
            this.clearTapCandidate();
            this.options.onToggleOsd();
        }, DOUBLE_TAP_MS);
    }

    private handlePointerCancel(e: PointerEvent) {
        if (this.pointerId !== e.pointerId) {
            return;
        }

        this.clearLongPressTimer();
        this.endRateBoost();
        this.pointerId = null;
        this.longPressCancelled = true;
    }

    private fireDoubleTap(region: GestureRegion) {
        const syncPlay = this.options.isSyncPlayActive();

        switch (region) {
            case 'left':
                if (syncPlay || !this.options.canSeek()) {
                    return;
                }
                this.options.onGesture?.();
                this.options.onSeekBackward();
                this.showFeedback('left', 'fast_rewind', `-${this.options.getSkipBackSeconds()}`);
                break;
            case 'right':
                if (syncPlay || !this.options.canSeek()) {
                    return;
                }
                this.options.onGesture?.();
                this.options.onSeekForward();
                this.showFeedback('right', 'fast_forward', `+${this.options.getSkipForwardSeconds()}`);
                break;
            case 'center': {
                const wasPaused = this.options.isPaused();
                this.options.onGesture?.();
                this.options.onPlayPause();
                this.showFeedback('center', wasPaused ? 'play_arrow' : 'pause');
                break;
            }
            case 'edge':
                break;
        }
    }

    private startRateBoost() {
        if (this.rateBoostActive) {
            return;
        }

        this.rateBoostActive = true;
        this.options.onGesture?.();
        this.options.onRateBoostStart();
        this.showFeedback('center', null, '2x', true);
    }

    private endRateBoost() {
        if (!this.rateBoostActive) {
            return;
        }

        this.rateBoostActive = false;
        this.options.onRateBoostEnd();
        this.hideFeedback();
    }

    private showFeedback(
        region: GestureRegion,
        iconName: string | null,
        label?: string,
        persistent = false
    ) {
        const { feedbackElement } = this.options;
        this.clearFeedbackTimer();

        feedbackElement.dataset.region = region === 'edge' ? 'center' : region;
        feedbackElement.classList.remove('hide');

        const icon = feedbackElement.querySelector('.videoTouchGestureFeedback-icon');
        const labelEl = feedbackElement.querySelector('.videoTouchGestureFeedback-label');

        if (icon) {
            if (iconName) {
                icon.className = `videoTouchGestureFeedback-icon material-icons ${iconName}`;
                icon.classList.remove('hide');
            } else {
                icon.className = 'videoTouchGestureFeedback-icon material-icons hide';
            }
        }

        if (labelEl) {
            labelEl.textContent = label || '';
            labelEl.classList.toggle('hide', !label);
        }

        feedbackElement.classList.remove('videoTouchGestureFeedback-visible');
        void feedbackElement.offsetWidth;
        feedbackElement.classList.add('videoTouchGestureFeedback-visible');

        if (!persistent) {
            this.feedbackTimer = setTimeout(() => {
                this.feedbackTimer = null;
                this.hideFeedback();
            }, FEEDBACK_HIDE_MS);
        }
    }

    private hideFeedback() {
        const { feedbackElement } = this.options;
        feedbackElement.classList.remove('videoTouchGestureFeedback-visible');
        feedbackElement.classList.add('hide');
    }

    private clearSingleTapTimer() {
        if (this.singleTapTimer) {
            clearTimeout(this.singleTapTimer);
            this.singleTapTimer = null;
        }
    }

    private clearLongPressTimer() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    private clearFeedbackTimer() {
        if (this.feedbackTimer) {
            clearTimeout(this.feedbackTimer);
            this.feedbackTimer = null;
        }
    }
}

export default VideoTouchGestures;
