import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('components/layoutManager', () => ({ default: { tv: false, mobile: false } }));
vi.mock('lib/globalize', () => ({ default: { getIsRTL: vi.fn(() => false), getIsElementRTL: vi.fn(() => false) } }));
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
// iOS: this is the whole point of this file — the touch handlers are only wired
// when browser.iOS is true, and that flag is a static boolean on the mock, so it
// must live in a separate file from the pointer/keyboard tests.
vi.mock('scripts/browser', () => ({ default: { iOS: true } }));

import globalize from 'lib/globalize';
import Slider from './Slider';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Touch flows are synchronous: dispatching the event runs the handler and its
// re-render within act() before it returns, so tests assert immediately after.

let container: HTMLElement;
let root: Root;

function render(props: React.ComponentProps<typeof Slider>) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
        root.render(<Slider {...props} />);
    });
    const input = container.querySelector('input');
    if (!input) throw new Error('input not rendered');
    const track = container.querySelector<HTMLElement>('.jfSlider');
    if (!track) throw new Error('track not rendered');
    return { input, track };
}

beforeEach(() => {
    vi.mocked(globalize.getIsRTL).mockReturnValue(false);
    vi.mocked(globalize.getIsElementRTL).mockReturnValue(false);
});

afterEach(() => {
    act(() => {
        root.unmount();
    });
    container.remove();
});

function stubTrackRect(track: HTMLElement, { left = 0, width = 100 } = {}) {
    Object.defineProperty(track, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            left, right: left + width, width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ''
        })
    });
}

// jsdom has no TouchEvent; React reads `touches`/`changedTouches`/`type` and
// `preventDefault` off the native event, so a plain Event with those props set
// exercises the same code path a real touch would.
function touch(type: 'touchstart' | 'touchmove' | 'touchend', xs: number[]) {
    const evt = new Event(type, { bubbles: true, cancelable: true }) as Event & {
        touches: { clientX: number }[];
        changedTouches: { clientX: number }[];
    };
    const points = xs.map((clientX) => ({ clientX }));
    evt.touches = type === 'touchend' ? [] : points;
    evt.changedTouches = points;
    return evt;
}

describe('jf-slider: touch (iOS)', () => {
    it('touchstart maps a snapped clientX value, shows the bubble, previews input, preventDefault', () => {
        const onInput = vi.fn();
        // step 10 + clientX 34 pins both the clientX->value mapping and the snap.
        const { input, track } = render({ value: 0, min: 0, max: 100, step: 10, onInput });
        stubTrackRect(track);
        const evt = touch('touchstart', [34]);
        // React registers touchstart/touchmove as passive, so defaultPrevented
        // won't reflect the call; assert the handler invoked preventDefault.
        const prevent = vi.spyOn(evt, 'preventDefault');
        act(() => {
            input.dispatchEvent(evt);
        });
        expect(onInput).toHaveBeenCalledWith(30);
        expect(container.querySelector('.jfSlider-bubble')).not.toBeNull();
        // touchstart suppresses the trailing synthetic mouse/click.
        expect(prevent).toHaveBeenCalled();
    });

    it('touchmove updates the value without preventing default', () => {
        const onInput = vi.fn();
        const { input, track } = render({ value: 0, min: 0, max: 100, step: 1, onInput });
        stubTrackRect(track);
        const evt = touch('touchmove', [70]);
        const prevent = vi.spyOn(evt, 'preventDefault');
        act(() => {
            input.dispatchEvent(evt);
        });
        expect(onInput).toHaveBeenCalledWith(70);
        expect(prevent).not.toHaveBeenCalled();
    });

    it('ignores multi-touch gestures', () => {
        const onInput = vi.fn();
        const { input, track } = render({ value: 0, onInput });
        stubTrackRect(track);
        act(() => {
            input.dispatchEvent(touch('touchmove', [30, 60]));
        });
        expect(onInput).not.toHaveBeenCalled();
    });

    it('touchend commits from changedTouches and hides the bubble', () => {
        const onChange = vi.fn();
        const { input, track } = render({ value: 0, min: 0, max: 100, step: 1, onChange });
        stubTrackRect(track);
        act(() => {
            input.dispatchEvent(touch('touchstart', [30]));
        });
        act(() => {
            input.dispatchEvent(touch('touchend', [90]));
        });
        expect(onChange).toHaveBeenCalledWith(90);
        expect(container.querySelector('.jfSlider-bubble')).toBeNull();
    });

    // Snapping, the rect.width<=0 guard, and the RTL fraction-flip all live in the
    // shared valueFromClientX mapper, already pinned by the pointer-path tests in
    // Slider.test.tsx; the tests above prove the touch handlers are wired to it.
});
