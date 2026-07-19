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

import browser from 'scripts/browser';
import layoutManager from 'components/layoutManager';
import globalize from 'lib/globalize';
import { getKeyName } from 'scripts/keyboardNavigation';
import { decimalCount } from 'utils/number';

import './jf-slider.scss';

// A range in the slider's min/max units (e.g. a buffered span).
export interface SliderRange {
    start: number;
    end: number;
}

// A marker (e.g. a chapter boundary) at a fractional position 0-1.
export interface SliderMarker {
    progress: number;
}

// Imperative handle for a parent that owns the focus stop and proxies the
// D-pad in (see `focusable`).
export interface JfSliderHandle {
    input: HTMLInputElement | null;
    // Step one seek in a direction: stages in "stage" mode, seeks in "live".
    nudge: (direction: 'left' | 'right') => boolean;
    hasPendingSeek: () => boolean;
    commitPendingSeek: () => boolean;
    clearPendingSeek: () => void;
}

export interface JfSliderProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
    ariaLabel?: string;
    // When false, drops the input from the tab order; a parent owns the focus
    // stop and drives the slider via the handle. Defaults to true.
    focusable?: boolean;
    // Keep the fill on `value` (live progress) during a drag instead of
    // following the thumb. Mirrors emby's data-slider-keep-progress.
    keepProgress?: boolean;
    // Transparent fill, rail only (emby's setIsClear).
    isClear?: boolean;
    // Lighter "buffered" band, in min/max units.
    bufferedRanges?: SliderRange[];
    // Buffered bands at or behind this position are hidden.
    bufferedPosition?: number;
    markers?: SliderMarker[];
    // Bubble text; return null to hide the bubble.
    getBubbleText?: (value: number) => string | null;
    // Position the bubble yourself and return true, or return false for the
    // default centered placement.
    updateBubbleHtml?: (bubble: HTMLElement, value: number) => boolean;
    // Enable D-pad seeking (Left/Right). Defaults to layoutManager.tv.
    enableKeyboardDragging?: boolean;
    keyboardStep?: number;
    // Left/right steps fall back to keyboardStep; OSD skip-back can differ from forward.
    keyboardStepBack?: number;
    keyboardStepForward?: number;
    // "stage" (TV default): Left/Right stage a seek, committed on OK. "live":
    // every change reported immediately.
    keyboardMode?: 'live' | 'stage';
    // Live value on every drag tick (e.g. volume). Never on hover.
    onInput?: (value: number) => void;
    // Bubble/preview value while dragging or hovering; null on leave.
    onPreview?: (value: number | null) => void;
    // Committed value (drag release, keyboard commit, click).
    onChange?: (value: number) => void;
    // OK/Enter with nothing staged. Lets a consumer repurpose the press
    // (e.g. toggle play/pause).
    onActivate?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Seek/progress slider, the React counterpart to the emby-slider custom
// element. Wraps a native range input with fill, buffered band, markers and a
// hover bubble, plus an optional TV "stage then commit" keyboard mode.
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
    isClear = false,
    bufferedRanges,
    bufferedPosition,
    markers,
    getBubbleText,
    updateBubbleHtml,
    enableKeyboardDragging = layoutManager.tv,
    keyboardStep,
    keyboardStepBack,
    keyboardStepForward,
    keyboardMode = layoutManager.tv ? 'stage' : 'live',
    onInput,
    onPreview,
    onChange,
    onActivate
}, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    const [dragging, setDragging] = useState(false);
    const [bubbleValue, setBubbleValue] = useState<number | null>(null);
    const [pendingValue, setPendingValue] = useState<number | null>(null);

    const range = max - min;
    const valueToPercent = useCallback(
        (v: number) => (range !== 0 ? clamp((v - min) / range, 0, 1) * 100 : 0),
        [min, range]
    );

    // Fill follows the drag position unless keepProgress pins it to `value`.
    const fillValue = (dragging && !keepProgress && bubbleValue != null) ? bubbleValue : value;
    const fillPercent = valueToPercent(fillValue);

    const stepBack = keyboardStepBack ?? keyboardStep ?? (step > 0 ? step : 1);
    const stepForward = keyboardStepForward ?? keyboardStep ?? (step > 0 ? step : 1);

    // Snap to `step` the way a native range input would, for emby parity.
    const snap = useCallback((v: number) => {
        if (step <= 0) return clamp(v, min, max);
        const decimals = Math.max(decimalCount(min), decimalCount(step));
        const snapped = Math.round((v - min) / step) * step + min;
        return clamp(parseFloat(snapped.toFixed(decimals)), min, max);
    }, [step, min, max]);

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

    // Default bubble positioning: centered over the track point.
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

    // React surfaces the native `input` event as onChange — one per drag tick.
    const onDragInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setDragging(true);
        const v = snap(parseFloat(e.target.value));
        showBubble(v);
        onInput?.(v);
    }, [snap, showBubble, onInput]);

    // React doesn't surface the native `change` (drag release) for range
    // inputs, so listen directly and read input.value — always current, no
    // state race. Hold the committed position in pendingValue until live
    // `value` catches up (see below).
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        const onNativeChange = () => {
            setDragging(false);
            hideBubble();
            const committed = snap(parseFloat(input.value));
            setPendingValue(committed);
            onChange?.(committed);
        };
        input.addEventListener('change', onNativeChange);
        return () => input.removeEventListener('change', onNativeChange);
    }, [hideBubble, onChange, snap]);

    // pendingValue means different things per mode: in "stage" it's the staged
    // target (drawn as a marker, thumb keeps tracking `value`); in "live" it's a
    // committed position the thumb itself holds until `value` catches up.
    const thumbHeld = keyboardMode !== 'stage' && pendingValue != null;

    // Uncontrolled input so the native thumb owns its position mid-drag. Push
    // `value` in except while the thumb is held (dragging or a mouse hold).
    useEffect(() => {
        const input = inputRef.current;
        if (input && !dragging && !thumbHeld) input.value = String(value);
    }, [value, dragging, thumbHeld]);

    // Release the hold on the first `value` change after commit — that's the
    // player reflecting the seek. Compare against the value at hold-start
    // rather than a proximity window, since `value` can jump many steps a tick.
    const heldFromValue = useRef<number | null>(null);
    useEffect(() => {
        if (!thumbHeld) {
            heldFromValue.current = null;
        } else if (heldFromValue.current == null) {
            heldFromValue.current = value;
        } else if (value !== heldFromValue.current) {
            setPendingValue(null);
        }
    }, [value, thumbHeld]);

    // Pointer hover preview (no drag).
    const onPointerMove = useCallback((e: React.PointerEvent<HTMLInputElement>) => {
        if (dragging) return;
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        if (rect.width <= 0) return;
        let fraction = (e.clientX - rect.left) / rect.width;
        if (globalize.getIsElementRTL(track)) fraction = (rect.right - e.clientX) / rect.width;
        showBubble(snap(min + clamp(fraction, 0, 1) * range));
    }, [dragging, showBubble, snap, min, range]);

    const onPointerLeave = useCallback(() => {
        if (!dragging) hideBubble();
    }, [dragging, hideBubble]);

    // iOS Safari doesn't update a range input's value on touch drag, so map the
    // touch position to a value ourselves (only wired on iOS).
    const valueFromClientX = useCallback((clientX: number) => {
        const track = trackRef.current;
        if (!track) return null;
        const rect = track.getBoundingClientRect();
        if (rect.width <= 0) return null;
        let fraction = (clientX - rect.left) / rect.width;
        if (globalize.getIsElementRTL(track)) fraction = (rect.right - clientX) / rect.width;
        return snap(min + clamp(fraction, 0, 1) * range);
    }, [snap, min, range]);

    const onTouchDrag = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
        if (e.touches.length !== 1) return;
        const v = valueFromClientX(e.touches[0].clientX);
        if (v == null) return;
        // Suppress the trailing pointermove/click iOS emits after touch.
        if (e.type === 'touchstart') e.preventDefault();
        setDragging(true);
        showBubble(v);
        onInput?.(v);
    }, [valueFromClientX, showBubble, onInput]);

    // Commit from the touch coordinates: a quick tap can end before React state
    // round-trips.
    const onTouchEnd = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
        setDragging(false);
        hideBubble();
        const v = valueFromClientX(e.changedTouches[0].clientX);
        if (v != null) onChange?.(v);
    }, [hideBubble, valueFromClientX, onChange]);

    const touchHandlers = browser.iOS ?
        { onTouchStart: onTouchDrag, onTouchMove: onTouchDrag, onTouchEnd } :
        undefined;

    const stepKeyboard = useCallback((direction: 'left' | 'right') => {
        const delta = direction === 'left' ? -stepBack : stepForward;
        if (keyboardMode === 'stage') {
            const next = snap((pendingValue ?? value) + delta);
            setPendingValue(next);
            showBubble(next);
        } else {
            const next = snap(value + delta);
            showBubble(next);
            onInput?.(next);
            onChange?.(next);
        }
    }, [stepBack, stepForward, keyboardMode, pendingValue, value, snap, showBubble, onInput, onChange]);

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

    // Don't let a seeking click bubble to a clickable ancestor (e.g. a list row).
    const onClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
    }, []);

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

    // Staged marker is stage-mode only; a live mouse hold moves the thumb instead.
    const staging = keyboardMode === 'stage' && pendingValue != null;

    return (
        <div
            ref={trackRef}
            className={classNames('jfSlider', className, { 'jfSlider-staging': staging, 'jfSlider-clear': isClear })}
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
            {staging && !dragging && (
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
                defaultValue={value}
                disabled={disabled}
                aria-label={ariaLabel}
                tabIndex={focusable ? undefined : -1}
                onChange={onDragInput}
                onClick={onClick}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                {...touchHandlers}
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
