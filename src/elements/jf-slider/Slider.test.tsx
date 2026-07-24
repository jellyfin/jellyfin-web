import React, { act, createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('components/layoutManager', () => ({ default: { tv: false, mobile: false } }));
vi.mock('lib/globalize', () => ({ default: { getIsRTL: vi.fn(() => false), getIsElementRTL: vi.fn(() => false) } }));
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

import globalize from 'lib/globalize';
import Slider, { BubbleText, type JfSliderProps, type JfSliderHandle } from './Slider';

// bubbleContent that just shows the value.
const textBubble = (v: number) => <BubbleText>{String(v)}</BubbleText>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Every flow here is synchronous — the dispatch, handler and re-render all
// run inside act(), so tests assert immediately with no awaiting.

// Set the value the browser way, bypassing React's setter so its internal
// value tracker sees a real change.
function setNativeValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    setter?.set?.call(input, value);
}

interface Harness {
    container: HTMLElement;
    root: Root;
    ref: React.RefObject<JfSliderHandle>;
    render: (props: Partial<JfSliderProps> & { value: number }) => void;
    input: () => HTMLInputElement;
    track: () => HTMLElement;
    unmount: () => void;
}

const mounted: Harness[] = [];

// Mount a Slider once; `render` re-renders into the same root, so the
// value-tracking effects see it as a live parent re-render.
function mount(): Harness {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const ref = createRef<JfSliderHandle>();

    const render: Harness['render'] = (props) => {
        act(() => {
            root.render(<Slider ref={ref} {...props} />);
        });
    };

    const harness: Harness = {
        container,
        root,
        ref: ref as React.RefObject<JfSliderHandle>,
        render,
        input: () => {
            const el = container.querySelector('input');
            if (!el) throw new Error('input not rendered');
            return el;
        },
        track: () => {
            const el = container.querySelector<HTMLElement>('.jfSlider');
            if (!el) throw new Error('track not rendered');
            return el;
        },
        unmount: () => {
            act(() => {
                root.unmount();
            });
            container.remove();
        }
    };
    mounted.push(harness);
    return harness;
}

beforeEach(() => {
    vi.mocked(globalize.getIsRTL).mockReturnValue(false);
    vi.mocked(globalize.getIsElementRTL).mockReturnValue(false);
});

afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount();
});

function dragTick(input: HTMLInputElement, value: string) {
    act(() => {
        setNativeValue(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

// Drag release fires `change`; the handler reads input.value, so callers must
// have set it (via dragTick or setNativeValue) first.
function dragRelease(input: HTMLInputElement) {
    act(() => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

function keydown(input: HTMLInputElement, key: string): KeyboardEvent {
    const evt = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    act(() => {
        input.dispatchEvent(evt);
    });
    return evt;
}

// jsdom lacks PointerEvent; React reads clientX off the native event, so a
// MouseEvent named 'pointermove'/'pointerleave' routes to the synthetic handler.
function pointerMove(input: HTMLInputElement, clientX: number) {
    act(() => {
        input.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX }));
    });
}

function pointerLeave(input: HTMLInputElement) {
    // React derives onPointerLeave from the bubbling `pointerout`.
    act(() => {
        input.dispatchEvent(new MouseEvent('pointerout', { bubbles: true }));
    });
}

// React derives onBlur from the bubbling `focusout`.
function blur(input: HTMLInputElement) {
    act(() => {
        input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });
}

// jsdom returns a zero-size rect; the pointer/bubble code early-returns on
// width <= 0, so stub the track rect for those tests.
function stubTrackRect(track: HTMLElement, { left = 0, width = 100 } = {}) {
    Object.defineProperty(track, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            left, right: left + width, width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ''
        })
    });
}

const fillWidth = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('.jfSlider-fill')?.style.width;

// Call a handle method inside act() so its state updates flush.
function callHandle<T>(fn: () => T): T {
    let result: T;
    act(() => {
        result = fn();
    });
    return result!;
}

// ---------------------------------------------------------------------------

describe('jf-slider: value & snapping', () => {
    it('pushes the initial value and tracks the value prop when idle', () => {
        const h = mount();
        h.render({ value: 30 });
        expect(h.input().value).toBe('30');
        h.render({ value: 45 });
        expect(h.input().value).toBe('45');
    });

    it('snaps a dragged value to step (round)', () => {
        const onInput = vi.fn();
        const h = mount();
        h.render({ value: 0, step: 10, onInput });
        dragTick(h.input(), '34');
        expect(onInput).toHaveBeenLastCalledWith(30);
    });

    it('snaps fractional steps using decimalCount (native-input parity)', () => {
        const onInput = vi.fn();
        const h = mount();
        h.render({ value: 0, min: 0, max: 100, step: 0.01, onInput });
        dragTick(h.input(), '60.005');
        expect(onInput).toHaveBeenLastCalledWith(60.01);
    });

    it('with step<=0 only clamps, without quantizing (emby step="any")', () => {
        const onInput = vi.fn();
        const h = mount();
        h.render({ value: 0, min: 0, max: 100, step: 0, onInput });
        dragTick(h.input(), '33.333');
        expect(onInput).toHaveBeenLastCalledWith(33.333);
        dragTick(h.input(), '200');
        expect(onInput).toHaveBeenLastCalledWith(100);
    });
});

describe('jf-slider: fill & keepProgress', () => {
    it('fill = value when idle, then follows the drag position without keepProgress', () => {
        const h = mount();
        h.render({ value: 40 });
        expect(fillWidth(h.container)).toBe('40%');
        dragTick(h.input(), '70');
        expect(fillWidth(h.container)).toBe('70%');
    });

    it('fill stays pinned to value with keepProgress during a drag', () => {
        const h = mount();
        h.render({ value: 40, keepProgress: true });
        dragTick(h.input(), '70');
        expect(fillWidth(h.container)).toBe('40%');
    });
});

describe('jf-slider: drag input/change -> onInput/onChange', () => {
    it('fires onInput each tick and not onChange until release', () => {
        const onInput = vi.fn();
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 0, onInput, onChange });
        dragTick(h.input(), '20');
        dragTick(h.input(), '25');
        expect(onInput.mock.calls).toEqual([[20], [25]]);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('holds the drag position mid-gesture; a progress tick must not overwrite it', () => {
        const h = mount();
        h.render({ value: 10, step: 0.01, keepProgress: true, onChange: vi.fn() });
        h.render({ value: 11 });
        expect(h.input().value).toBe('11');
        dragTick(h.input(), '80');
        h.render({ value: 11.5 });
        expect(h.input().value).toBe('80');
    });

    it('commits the snapped value on change, read from input.value not React state', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 0, step: 1, onChange });
        // No input event first: the change handler must read input.value itself.
        act(() => {
            setNativeValue(h.input(), '63');
        });
        dragRelease(h.input());
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(63);
    });

    it('hides the bubble after release', () => {
        const h = mount();
        h.render({ value: 0, bubbleContent: textBubble, onChange: vi.fn() });
        dragTick(h.input(), '60');
        expect(h.container.querySelector('.jfSlider-bubble')).not.toBeNull();
        dragRelease(h.input());
        expect(h.container.querySelector('.jfSlider-bubble')).toBeNull();
    });
});

describe('jf-slider: thumb-hold bounce fix (live mode)', () => {
    it('holds the committed value until the value prop catches up', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 30, min: 0, max: 100, step: 0.01, keepProgress: true, onChange });

        dragTick(h.input(), '60');
        dragRelease(h.input());
        expect(onChange).toHaveBeenCalledWith(60);

        // Stale re-render: thumb must hold at 60, not snap back to 30.
        h.render({ value: 30 });
        expect(h.input().value).toBe('60');

        // Once value reflects the seek, tracking resumes.
        h.render({ value: 60.5 });
        expect(h.input().value).toBe('60.5');
        h.render({ value: 61 });
        expect(h.input().value).toBe('61');
    });

    it('resets the hold for a subsequent seek', () => {
        const h = mount();
        h.render({ value: 30, step: 0.01, keepProgress: true, onChange: vi.fn() });

        dragTick(h.input(), '60');
        dragRelease(h.input());
        h.render({ value: 60.5 }); // value catches up -> hold released
        expect(h.input().value).toBe('60.5');

        // Second seek: hold must engage again, not stay released.
        dragTick(h.input(), '20');
        dragRelease(h.input());
        h.render({ value: 60.5 }); // stale (parent hasn't applied 20 yet)
        expect(h.input().value).toBe('20');
    });

    it('does not hold the thumb in stage mode (staging survives value ticks)', () => {
        const stageProps = { step: 1, enableKeyboardDragging: true, keyboardMode: 'stage' as const, onChange: vi.fn() };
        const h = mount();
        h.render({ value: 40, ...stageProps });
        keydown(h.input(), 'ArrowRight'); // stages 41, does not commit
        // A live progress tick: thumb still tracks value (not held), staging remains.
        h.render({ value: 42, ...stageProps });
        expect(h.input().value).toBe('42');
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
    });
});

describe('jf-slider: pointer hover -> onPreview', () => {
    it('maps clientX to a snapped preview value, without onInput', () => {
        const onPreview = vi.fn();
        const onInput = vi.fn();
        const h = mount();
        // step 10 + clientX 34 exercises both the mapping and the snap.
        h.render({ value: 0, min: 0, max: 100, step: 10, bubbleContent: textBubble, onPreview, onInput });
        stubTrackRect(h.track());
        pointerMove(h.input(), 34);
        expect(onPreview).toHaveBeenLastCalledWith(30);
        expect(onInput).not.toHaveBeenCalled();
        expect(h.container.querySelector('.jfSlider-bubble')).not.toBeNull();
    });

    it('does not preview while dragging', () => {
        const onPreview = vi.fn();
        const h = mount();
        h.render({ value: 0, step: 1, onPreview });
        stubTrackRect(h.track());
        dragTick(h.input(), '50');
        onPreview.mockClear();
        pointerMove(h.input(), 25);
        expect(onPreview).not.toHaveBeenCalled();
    });

    it('pointerleave hides the bubble and previews null', () => {
        const onPreview = vi.fn();
        const h = mount();
        h.render({ value: 0, bubbleContent: textBubble, onPreview });
        stubTrackRect(h.track());
        pointerMove(h.input(), 25);
        expect(h.container.querySelector('.jfSlider-bubble')).not.toBeNull();
        pointerLeave(h.input());
        expect(onPreview).toHaveBeenLastCalledWith(null);
        expect(h.container.querySelector('.jfSlider-bubble')).toBeNull();
    });

    it('pointerleave during a drag does not hide the bubble', () => {
        const h = mount();
        h.render({ value: 0, bubbleContent: textBubble, onChange: vi.fn() });
        stubTrackRect(h.track());
        dragTick(h.input(), '50');
        pointerLeave(h.input());
        expect(h.container.querySelector('.jfSlider-bubble')).not.toBeNull();
    });

    it('no-ops on a zero-width track', () => {
        const onPreview = vi.fn();
        const h = mount();
        h.render({ value: 0, onPreview });
        // No stubTrackRect: jsdom rect width is 0.
        pointerMove(h.input(), 25);
        expect(onPreview).not.toHaveBeenCalled();
    });
});

describe('jf-slider: keyboard live mode', () => {
    const base = { value: 40, min: 0, max: 100, step: 1, enableKeyboardDragging: true, keyboardMode: 'live' as const };

    it('ArrowRight seeks immediately (onInput + onChange), without staging', () => {
        const onInput = vi.fn();
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onInput, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onInput).toHaveBeenCalledWith(41);
        expect(onChange).toHaveBeenCalledWith(41);
        // Live mode commits, it never stages: no pending marker / staging class.
        expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
    });

    it('arrow keys preventDefault and stopPropagation', () => {
        const stop = vi.fn();
        const h = mount();
        h.render({ ...base, onChange: vi.fn() });
        const input = h.input();
        const evt = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
        evt.stopPropagation = stop;
        act(() => {
            input.dispatchEvent(evt);
        });
        expect(evt.defaultPrevented).toBe(true);
        expect(stop).toHaveBeenCalled();
    });

    it('ignores arrows when keyboard dragging is disabled', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, enableKeyboardDragging: false, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('jf-slider: keyboard stage mode & pendingMarker', () => {
    const base = { value: 40, min: 0, max: 100, step: 1, enableKeyboardDragging: true, keyboardMode: 'stage' as const, bubbleContent: textBubble };

    it('ArrowRight stages without committing', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).not.toHaveBeenCalled();
        expect(h.track().classList.contains('jfSlider-staging')).toBe(true);
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
        expect(h.container.querySelector('.jfSlider-bubble')?.textContent).toBe('41');
    });

    it('successive arrows accumulate from the staged value', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onChange });
        keydown(h.input(), 'ArrowRight');
        keydown(h.input(), 'ArrowRight');
        keydown(h.input(), 'ArrowRight');
        expect(h.container.querySelector('.jfSlider-bubble')?.textContent).toBe('43');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('hides the pending marker while dragging', () => {
        const h = mount();
        h.render({ ...base, onChange: vi.fn() });
        keydown(h.input(), 'ArrowRight');
        dragTick(h.input(), '10');
        expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
    });

    it('Enter commits the staged seek', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onChange });
        keydown(h.input(), 'ArrowRight');
        const evt = keydown(h.input(), 'Enter');
        expect(onChange).toHaveBeenCalledWith(41);
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
        expect(h.container.querySelector('.jfSlider-bubble')).toBeNull();
        expect(evt.defaultPrevented).toBe(true);
    });

    // ArrowUp/Down/Escape/Back share one abandon branch; Escape stands in for all four.
    it('abandons the staged seek and still bubbles (ArrowUp/Down/Escape/Back)', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onChange });
        keydown(h.input(), 'ArrowRight');
        const evt = keydown(h.input(), 'Escape');
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
        expect(evt.defaultPrevented).toBe(false);
    });

    it('Enter activates when nothing is staged', () => {
        const onActivate = vi.fn();
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...base, onActivate, onChange });
        keydown(h.input(), 'Enter');
        expect(onActivate).toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('jf-slider: imperative handle', () => {
    const stage = { value: 40, min: 0, max: 100, step: 1, enableKeyboardDragging: true, keyboardMode: 'stage' as const };

    it('exposes the input element', () => {
        const h = mount();
        h.render({ value: 0 });
        expect(h.ref.current?.input).toBe(h.input());
    });

    it('nudge stages in stage mode and returns true', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...stage, onChange });
        expect(callHandle(() => h.ref.current!.nudge('right'))).toBe(true);
        expect(h.ref.current!.hasPendingSeek()).toBe(true);
        expect(onChange).not.toHaveBeenCalled();
        expect(h.container.querySelector('.jfSlider-pendingMarker')).not.toBeNull();
    });

    it('nudge seeks immediately in live mode', () => {
        const onChange = vi.fn();
        const onInput = vi.fn();
        const h = mount();
        h.render({ value: 40, step: 1, enableKeyboardDragging: true, keyboardMode: 'live', onChange, onInput });
        callHandle(() => h.ref.current!.nudge('right'));
        expect(onInput).toHaveBeenCalledWith(41);
        expect(onChange).toHaveBeenCalledWith(41);
        expect(h.ref.current!.hasPendingSeek()).toBe(false);
    });

    it('commitPendingSeek commits, returns true, and clears the pending state', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...stage, onChange });
        expect(h.ref.current!.hasPendingSeek()).toBe(false);
        callHandle(() => h.ref.current!.nudge('right'));
        expect(h.ref.current!.hasPendingSeek()).toBe(true);
        expect(callHandle(() => h.ref.current!.commitPendingSeek())).toBe(true);
        expect(onChange).toHaveBeenCalledWith(41);
        expect(h.ref.current!.hasPendingSeek()).toBe(false);
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
    });

    it('commitPendingSeek returns false when nothing is staged', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...stage, onChange });
        expect(callHandle(() => h.ref.current!.commitPendingSeek())).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('clearPendingSeek abandons the staged seek', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...stage, onChange });
        callHandle(() => h.ref.current!.nudge('right'));
        callHandle(() => h.ref.current!.clearPendingSeek());
        expect(h.ref.current!.hasPendingSeek()).toBe(false);
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('jf-slider: onActivate', () => {
    it('does not fire when a seek is staged (Enter commits instead)', () => {
        const onActivate = vi.fn();
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 40, step: 1, enableKeyboardDragging: true, keyboardMode: 'stage', onActivate, onChange });
        keydown(h.input(), 'ArrowRight');
        keydown(h.input(), 'Enter');
        expect(onChange).toHaveBeenCalledWith(41);
        expect(onActivate).not.toHaveBeenCalled();
    });

    it('Enter is a no-op with no handler and nothing staged', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 40, enableKeyboardDragging: true, keyboardMode: 'stage', onChange });
        const evt = keydown(h.input(), 'Enter');
        expect(onChange).not.toHaveBeenCalled();
        expect(evt.defaultPrevented).toBe(false);
    });
});

describe('jf-slider: buffered ranges & bufferedPosition', () => {
    const band = (c: HTMLElement) => c.querySelector<HTMLElement>('.jfSlider-buffered');

    it('renders a band from the first range in min/max scale (no runtime scaling)', () => {
        // Non-100 max so this also pins the valueToPercent scaling.
        const h = mount();
        h.render({ value: 0, min: 0, max: 200, bufferedRanges: [{ start: 20, end: 100 }] });
        const el = band(h.container);
        expect(el).not.toBeNull();
        expect(el!.style.left).toBe('10%');
        expect(el!.style.width).toBe('40%');
    });

    it('skips ranges at or behind bufferedPosition, or renders none when all are behind', () => {
        const h = mount();
        h.render({
            value: 0, min: 0, max: 100,
            bufferedRanges: [{ start: 0, end: 30 }, { start: 40, end: 70 }],
            bufferedPosition: 30
        });
        expect(band(h.container)!.style.left).toBe('40%');
        // All ranges behind the position -> the loop exhausts -> no band.
        h.render({ value: 0, bufferedRanges: [{ start: 0, end: 30 }], bufferedPosition: 30 });
        expect(band(h.container)).toBeNull();
    });

    it('renders no band for empty or undefined ranges', () => {
        const h = mount();
        h.render({ value: 0, bufferedRanges: [] });
        expect(band(h.container)).toBeNull();
        h.render({ value: 0 });
        expect(band(h.container)).toBeNull();
    });

    it('clamps a negative range start to 0', () => {
        const h = mount();
        h.render({ value: 0, min: 0, max: 100, bufferedRanges: [{ start: -10, end: 20 }] });
        expect(band(h.container)!.style.left).toBe('0%');
    });
});

describe('jf-slider: markers', () => {
    const markerAt = (c: HTMLElement, i: number) => c.querySelectorAll<HTMLElement>('.jfSlider-marker')[i];

    it('renders one span per marker, positioned, aria-hidden, watched behind value / unwatched ahead', () => {
        const h = mount();
        h.render({ value: 50, markers: [{ progress: 0.25 }, { progress: 0.75 }] });
        const markers = h.container.querySelectorAll('.jfSlider-marker');
        expect(markers).toHaveLength(2);
        expect(markerAt(h.container, 0).style.left).toBe('25%');
        expect(markerAt(h.container, 1).style.left).toBe('75%');
        expect(markerAt(h.container, 0).getAttribute('aria-hidden')).toBe('true');
        expect(markerAt(h.container, 0).classList.contains('watched')).toBe(true);
        expect(markerAt(h.container, 1).classList.contains('unwatched')).toBe(true);
    });

    it('treats a marker exactly at the value as watched', () => {
        const h = mount();
        h.render({ value: 50, markers: [{ progress: 0.5 }] });
        expect(markerAt(h.container, 0).classList.contains('watched')).toBe(true);
    });

    it('uses value, not the drag position, for watched state', () => {
        const h = mount();
        h.render({ value: 50, markers: [{ progress: 0.75 }], onChange: vi.fn() });
        dragTick(h.input(), '90');
        expect(markerAt(h.container, 0).classList.contains('unwatched')).toBe(true);
    });

    it('surfaces the optional marker name as a title (e.g. chapter names in the OSD)', () => {
        const h = mount();
        h.render({ value: 50, markers: [{ progress: 0.25, name: 'Chapter 1' }, { progress: 0.75 }] });
        expect(markerAt(h.container, 0).getAttribute('title')).toBe('Chapter 1');
        // No name -> no title attribute.
        expect(markerAt(h.container, 1).hasAttribute('title')).toBe(false);
    });
});

describe('jf-slider: bubble content & placement', () => {
    const bubbleLeft = (c: HTMLElement) => c.querySelector<HTMLElement>('.jfSlider-bubble')?.style.left;

    const kb = { step: 1, enableKeyboardDragging: true, keyboardMode: 'live' as const };

    it('shows no bubble when bubbleContent is omitted', () => {
        const h = mount();
        h.render({ value: 40, ...kb, onChange: vi.fn() });
        keydown(h.input(), 'ArrowRight');
        expect(h.container.querySelector('.jfSlider-bubble')).toBeNull();
    });

    it('renders bubbleContent JSX into the bubble, called with the value', () => {
        const bubbleContent = vi.fn((v: number) => <div className='customBubble'>{`c${v}`}</div>);
        const h = mount();
        h.render({ value: 40, ...kb, bubbleContent, onChange: vi.fn() });
        keydown(h.input(), 'ArrowRight');
        expect(bubbleContent).toHaveBeenCalledWith(41);
        expect(h.container.querySelector('.jfSlider-bubble .customBubble')?.textContent).toBe('c41');
    });

    it('hides the bubble when bubbleContent returns null for this value', () => {
        const h = mount();
        h.render({ value: 40, ...kb, bubbleContent: () => null, onChange: vi.fn() });
        keydown(h.input(), 'ArrowRight');
        expect(h.container.querySelector('.jfSlider-bubble')).toBeNull();
    });

    it('BubbleText renders a text body inside the bubble', () => {
        const h = mount();
        h.render({ value: 40, ...kb, bubbleContent: textBubble, onChange: vi.fn() });
        keydown(h.input(), 'ArrowRight');
        expect(h.container.querySelector('.jfSlider-bubble')?.textContent).toBe('41');
    });

    // left is a percent of the track, so no getBoundingClientRect stub needed.
    it('positions the bubble at the value percent (min/max aware), no track measurement', () => {
        const h = mount();
        h.render({ value: 0, min: 0, max: 200, step: 1, bubbleContent: textBubble, onChange: vi.fn() });
        dragTick(h.input(), '50'); // 50 of [0..200] -> 25%
        expect(bubbleLeft(h.container)).toBe('25%');
    });
});

// focusable has real logic; the other presentation props
// (disabled/ariaLabel/className/isClear) are bare pass-throughs, untested here.
describe('jf-slider: focusable', () => {
    it('removes the input from the tab order when focusable=false, keeps it tabbable by default', () => {
        const h = mount();
        h.render({ value: 0, focusable: false });
        expect(h.input().getAttribute('tabindex')).toBe('-1');
        h.render({ value: 0 });
        expect(h.input().getAttribute('tabindex')).not.toBe('-1');
    });

    it('adds the `focusable` class to the input when focusable (TV spatial nav needs it on the range input), not when focusable=false', () => {
        const h = mount();
        h.render({ value: 0 });
        expect(h.input().classList.contains('focusable')).toBe(true);
        h.render({ value: 0, focusable: false });
        expect(h.input().classList.contains('focusable')).toBe(false);
    });
});

describe('jf-slider: RTL', () => {
    it('sets dir=rtl when the layout is RTL', () => {
        vi.mocked(globalize.getIsRTL).mockReturnValue(true);
        const h = mount();
        h.render({ value: 0 });
        expect(h.track().getAttribute('dir')).toBe('rtl');
    });

    it('flips the pointer fraction in RTL', () => {
        vi.mocked(globalize.getIsElementRTL).mockReturnValue(true);
        const onPreview = vi.fn();
        const h = mount();
        h.render({ value: 0, min: 0, max: 100, step: 1, onPreview });
        stubTrackRect(h.track(), { left: 0, width: 100 });
        pointerMove(h.input(), 25);
        expect(onPreview).toHaveBeenLastCalledWith(75);
    });

    it('mirrors the bubble position in RTL (percent, matching the track dir)', () => {
        vi.mocked(globalize.getIsRTL).mockReturnValue(true);
        const h = mount();
        h.render({ value: 0, min: 0, max: 100, step: 1, bubbleContent: textBubble, onChange: vi.fn() });
        dragTick(h.input(), '60'); // 60% -> mirrored to 40%
        const bubble = h.container.querySelector<HTMLElement>('.jfSlider-bubble');
        expect(bubble!.style.left).toBe('40%');
    });
});

describe('jf-slider: blur & click', () => {
    it('blur clears dragging so the thumb resumes tracking value', () => {
        const h = mount();
        h.render({ value: 10, step: 1, keepProgress: true, onChange: vi.fn() });
        dragTick(h.input(), '80');
        blur(h.input());
        h.render({ value: 12, step: 1, keepProgress: true, onChange: vi.fn() });
        expect(h.input().value).toBe('12');
    });

    it('blur abandons a staged seek', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ value: 40, step: 1, enableKeyboardDragging: true, keyboardMode: 'stage', onChange });
        keydown(h.input(), 'ArrowRight');
        blur(h.input());
        expect(h.track().classList.contains('jfSlider-staging')).toBe(false);
        expect(h.container.querySelector('.jfSlider-pendingMarker')).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('stops a seeking click from bubbling to an ancestor', () => {
        // Listener must sit outside the root: React 18 delegates at the
        // container, so stopPropagation only shields ancestors above it.
        const ancestorClick = vi.fn();
        document.body.addEventListener('click', ancestorClick);
        const h = mount();
        h.render({ value: 0 });
        const evt = new MouseEvent('click', { bubbles: true, cancelable: true });
        act(() => {
            h.input().dispatchEvent(evt);
        });
        document.body.removeEventListener('click', ancestorClick);
        expect(ancestorClick).not.toHaveBeenCalled();
        expect(evt.defaultPrevented).toBe(false);
    });
});

describe('jf-slider: keyboard step back/forward asymmetry', () => {
    const live = { value: 50, min: 0, max: 100, enableKeyboardDragging: true, keyboardMode: 'live' as const };

    it('keyboardStep applies to both directions', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...live, step: 1, keyboardStep: 5, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith(55);
        h.render({ ...live, step: 1, keyboardStep: 5, onChange });
        keydown(h.input(), 'ArrowLeft');
        expect(onChange).toHaveBeenLastCalledWith(45);
    });

    it('keyboardStepForward overrides only the forward step', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...live, step: 1, keyboardStep: 5, keyboardStepForward: 10, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith(60);
        h.render({ ...live, step: 1, keyboardStep: 5, keyboardStepForward: 10, onChange });
        keydown(h.input(), 'ArrowLeft');
        expect(onChange).toHaveBeenLastCalledWith(45);
    });

    it('keyboardStepBack overrides only the back step', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...live, step: 1, keyboardStep: 5, keyboardStepBack: 20, onChange });
        keydown(h.input(), 'ArrowLeft');
        expect(onChange).toHaveBeenLastCalledWith(30);
        h.render({ ...live, step: 1, keyboardStep: 5, keyboardStepBack: 20, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith(55);
    });

    it('falls back to step when no keyboard step props are given', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...live, step: 2, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith(52);
    });

    it('falls back to 1 when step<=0', () => {
        const onChange = vi.fn();
        const h = mount();
        h.render({ ...live, step: 0, onChange });
        keydown(h.input(), 'ArrowRight');
        expect(onChange).toHaveBeenLastCalledWith(51);
    });
});
