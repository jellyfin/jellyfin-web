import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from 'react';
import classNames from 'classnames';

import layoutManager from 'components/layoutManager';
import globalize from 'lib/globalize';
import { getKeyName } from 'scripts/keyboardNavigation';

import './jf-slider.scss';

/** A time/percent range, in the same units as the slider's min/max. */
export interface SliderRange {
    start: number;
    end: number;
}

/** A marker (e.g. a chapter boundary) at a fractional position 0-1. */
export interface SliderMarker {
    progress: number;
}

export interface JfSliderHandle {
    /** The underlying range input. */
    input: HTMLInputElement | null;
    /**
     * Stage a keyboard seek by one step in the given direction (used when a
     * parent owns focus and proxies the D-pad in — e.g. a list row). In "stage"
     * mode this moves the pending marker; in "live" mode it seeks immediately.
     * Returns true when handled.
     */
    nudge: (direction: 'left' | 'right') => boolean;
    /** True while a staged (pending) seek is awaiting commit — stage mode only. */
    hasPendingSeek: () => boolean;
    /** Commit a staged pending seek; returns true if one was committed. */
    commitPendingSeek: () => boolean;
    /** Abandon any staged pending seek. */
    clearPendingSeek: () => void;
}

export interface JfSliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
    /** Accessible label for the range input. */
    ariaLabel?: string;
    /**
     * When false, the range input is removed from the tab order (tabIndex=-1).
     * Use when a parent owns the focus stop and proxies the D-pad in via the
     * `nudge`/`commitPendingSeek` handle (e.g. a TV list row, since focusManager
     * cannot focus a range input anyway). Defaults to true.
     */
    focusable?: boolean;
    /**
     * Keep the fill pinned to `value` (live progress) while the user drags,
     * instead of following the drag position. Mirrors data-slider-keep-progress.
     */
    keepProgress?: boolean;
    /** Draw a lighter "buffered" band. Values share the slider's min/max scale. */
    bufferedRanges?: SliderRange[];
    /** Position (min/max scale) past which buffered bands are hidden. */
    bufferedPosition?: number;
    /** Chapter/segment markers; `progress` is a 0-1 fraction of the track. */
    markers?: SliderMarker[];
    /** Text for the hover/drag bubble. Return null to hide the bubble. */
    getBubbleText?: (value: number) => string | null;
    /**
     * Custom bubble renderer. Position `bubble` yourself and return true, or
     * return false to fall back to the default centered bubble.
     */
    updateBubbleHtml?: (bubble: HTMLElement, value: number) => boolean;
    /** Enable TV D-pad seeking (Left/Right). Defaults to layoutManager.tv. */
    enableKeyboardDragging?: boolean;
    /** Keyboard step per Left/Right press, in value units. */
    keyboardStep?: number;
    /**
     * "stage" (TV default): Left/Right stage a pending seek shown by a second
     * marker; playback isn't touched until OK. onChange fires only on commit.
     * "live": every value change is reported immediately.
     */
    keyboardMode?: 'live' | 'stage';
    /** Fired while dragging/hovering with the previewed value (0 = pointer). */
    onPreview?: (value: number | null) => void;
    /** Fired when a value is committed (drag release, keyboard commit, click). */
    onChange?: (value: number) => void;
    /**
     * Fired on OK/Enter when no seek is staged. Lets a consumer repurpose the
     * confirm press (e.g. toggle play/pause) once there's nothing to commit.
     */
    onActivate?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Reusable seek/progress slider — the modern React counterpart to the legacy
 * emby-slider custom element. It owns a native <input type="range"> and renders
 * the fill, buffered band, chapter markers and hover bubble around it, plus an
 * optional TV "stage then commit" keyboard-seek mode.
 */
const Slider = forwardRef<JfSliderHandle, JfSliderProps>(({
    value,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    className,
    ariaLabel,
    focusable = true,
    keepProgress = false,
    bufferedRanges,
    bufferedPosition,
    markers,
    getBubbleText,
    updateBubbleHtml,
    enableKeyboardDragging = layoutManager.tv,
    keyboardStep,
    keyboardMode = layoutManager.tv ? 'stage' : 'live',
    onPreview,
    onChange,
    onActivate
}, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);
    // Value shown in the bubble; null hides it.
    const [bubbleValue, setBubbleValue] = useState<number | null>(null);
    // Staged (pending) value in "stage" keyboard mode; null when not staging.
    const [pendingValue, setPendingValue] = useState<number | null>(null);

    const range = max - min;
    const valueToPercent = useCallback(
        (v: number) => (range !== 0 ? clamp((v - min) / range, 0, 1) * 100 : 0),
        [min, range]
    );

    // Fill tracks live `value`; while dragging (without keepProgress) it follows
    // the drag position instead.
    const fillValue = (dragging && !keepProgress && bubbleValue != null) ? bubbleValue : value;
    const fillPercent = valueToPercent(fillValue);
    // In "stage" mode the input thumb stays on the live value (the pending
    // position is shown only by jfSlider-pendingMarker); during a pointer drag
    // it follows the drag.
    const inputValue = (dragging && bubbleValue != null) ? bubbleValue : value;

    const effectiveStep = keyboardStep ?? (step > 0 ? step : 1);

    // Buffered band: first range that isn't already behind `bufferedPosition`.
    const buffered = useMemo(() => {
        if (!bufferedRanges?.length) return null;
        for (const r of bufferedRanges) {
            if (bufferedPosition != null && bufferedPosition >= r.end) continue;
            return { start: valueToPercent(r.start), end: valueToPercent(r.end) };
        }
        return null;
    }, [bufferedRanges, bufferedPosition, valueToPercent]);

    const bubbleTextFor = useCallback(
        (v: number) => (getBubbleText ? getBubbleText(v) : String(v)),
        [getBubbleText]
    );

    // Position the default bubble centered over the track point, unless the
    // consumer supplies its own updateBubbleHtml.
    useEffect(() => {
        const bubble = bubbleRef.current;
        const track = trackRef.current;
        if (bubble == null || track == null || bubbleValue == null) return;

        if (updateBubbleHtml?.(bubble, bubbleValue)) return;

        const trackRect = track.getBoundingClientRect();
        const pct = valueToPercent(bubbleValue) / 100;
        let left = trackRect.width * pct;
        if (globalize.getIsElementRTL(track)) left = trackRect.width - left;
        bubble.style.left = left + 'px';
        bubble.style.top = '';
    }, [bubbleValue, updateBubbleHtml, valueToPercent]);

    const showBubble = useCallback((v: number) => {
        setBubbleValue(v);
        onPreview?.(v);
    }, [onPreview]);

    const hideBubble = useCallback(() => {
        setBubbleValue(null);
        onPreview?.(null);
    }, [onPreview]);

    // React maps a range input's native `input` event to onChange, so it fires
    // on every value change during a drag; treat it as preview only.
    const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setDragging(true);
        showBubble(parseFloat(e.target.value));
    }, [showBubble]);

    // The native `change` event (drag release) is not surfaced distinctly by
    // React for range inputs, so listen for it directly to commit the seek.
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        const onNativeChange = () => {
            setDragging(false);
            hideBubble();
            onChange?.(parseFloat(input.value));
        };
        input.addEventListener('change', onNativeChange);
        return () => input.removeEventListener('change', onNativeChange);
    }, [hideBubble, onChange]);

    // Pointer hover preview (no drag).
    const onPointerMove = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
        if (dragging) return;
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        if (rect.width <= 0) return;
        let fraction = (e.clientX - rect.left) / rect.width;
        if (globalize.getIsElementRTL(track)) fraction = (rect.right - e.clientX) / rect.width;
        showBubble(min + clamp(fraction, 0, 1) * range);
    }, [dragging, showBubble, min, range]);

    const onPointerLeave = useCallback(() => {
        if (!dragging) hideBubble();
    }, [dragging, hideBubble]);

    const commitPending = useCallback(() => {
        if (pendingValue == null) return false;
        const target = pendingValue;
        setPendingValue(null);
        hideBubble();
        onChange?.(target);
        return true;
    }, [pendingValue, hideBubble, onChange]);

    const clearPending = useCallback(() => {
        setPendingValue(null);
        hideBubble();
    }, [hideBubble]);

    // Step by one keyboard increment. In "stage" mode this moves the pending
    // marker; in "live" mode it seeks immediately.
    const stepKeyboard = useCallback((direction: 'left' | 'right') => {
        const delta = direction === 'left' ? -effectiveStep : effectiveStep;
        if (keyboardMode === 'stage') {
            const next = clamp((pendingValue ?? value) + delta, min, max);
            setPendingValue(next);
            showBubble(next);
        } else {
            const next = clamp(value + delta, min, max);
            showBubble(next);
            onChange?.(next);
        }
    }, [effectiveStep, keyboardMode, pendingValue, value, min, max, showBubble, onChange]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!enableKeyboardDragging) return;
        const key = getKeyName(e.nativeEvent);

        if (key === 'ArrowLeft' || key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            stepKeyboard(key === 'ArrowLeft' ? 'left' : 'right');
            return;
        }

        // OK commits a staged seek, or activates when nothing is staged
        if (key === 'Enter') {
            if (keyboardMode === 'stage' && pendingValue != null) {
                e.preventDefault();
                e.stopPropagation();
                commitPending();
            } else if (onActivate) {
                e.preventDefault();
                onActivate();
            }
            return;
        }

        // Up/Down/Back abandon a staged seek; the key still bubbles for nav.
        if ((key === 'ArrowUp' || key === 'ArrowDown' || key === 'Escape' || key === 'Back')
                && pendingValue != null) {
            clearPending();
        }
    }, [enableKeyboardDragging, keyboardMode, pendingValue, stepKeyboard, onActivate, commitPending, clearPending]);

    const onBlur = useCallback(() => {
        setDragging(false);
        clearPending();
    }, [clearPending]);

    useImperativeHandle(ref, () => ({
        input: inputRef.current,
        nudge: (direction) => {
            stepKeyboard(direction);
            return true;
        },
        hasPendingSeek: () => pendingValue != null,
        commitPendingSeek: commitPending,
        clearPendingSeek: clearPending
    }), [stepKeyboard, pendingValue, commitPending, clearPending]);

    const staging = pendingValue != null;

    return (
        <div
            ref={trackRef}
            className={classNames('jfSlider', className, { 'jfSlider-staging': staging })}
            dir={globalize.getIsRTL() ? 'rtl' : 'ltr'}
        >
            <div className='jfSlider-rail'>
                {buffered && (
                    <div
                        className='jfSlider-buffered'
                        style={{ left: Math.max(buffered.start, 0) + '%', width: Math.max(0, buffered.end - buffered.start) + '%' }}
                    />
                )}
                <div className='jfSlider-fill' style={{ width: fillPercent + '%' }} />
            </div>
            {markers?.map((marker, i) => (
                <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className={classNames('jfSlider-marker', marker.progress * 100 <= valueToPercent(value) ? 'watched' : 'unwatched')}
                    style={{ left: marker.progress * 100 + '%' }}
                    aria-hidden='true'
                />
            ))}
            {staging && (
                <span
                    className='jfSlider-pendingMarker'
                    // Match the native thumb travel: centred at 0.54em (half
                    // thumb) at 0% and width - 0.54em at 100%.
                    style={{ left: `calc(0.54em + ${valueToPercent(pendingValue)}% - ${valueToPercent(pendingValue)} * 1.08em / 100)` }}
                    aria-hidden='true'
                />
            )}
            <input
                ref={inputRef}
                type='range'
                className='jfSlider-input'
                min={min}
                max={max}
                step={step}
                value={inputValue}
                disabled={disabled}
                aria-label={ariaLabel}
                tabIndex={focusable ? undefined : -1}
                onChange={onInput}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
            />
            {bubbleValue != null && bubbleTextFor(bubbleValue) != null && (
                <div ref={bubbleRef} className='jfSlider-bubble'>
                    <h1 className='jfSlider-bubbleText'>{bubbleTextFor(bubbleValue)}</h1>
                </div>
            )}
        </div>
    );
});

Slider.displayName = 'Slider';

export default Slider;
