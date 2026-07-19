import React, { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';

vi.mock('components/layoutManager', () => ({ default: { tv: false, mobile: false } }));
vi.mock('lib/globalize', () => ({ default: { getIsRTL: () => false, getIsElementRTL: () => false } }));
vi.mock('scripts/keyboardNavigation', () => ({ getKeyName: (e: KeyboardEvent) => e.key }));
vi.mock('scripts/browser', () => ({ default: { iOS: false } }));

import Slider from './Slider';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Set the value the way a browser does during a user gesture (bypassing
// React's value setter so its internal tracker sees a real change).
function setNativeValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    setter?.set?.call(input, value);
}

describe('jf-slider pointer seek', () => {
    it('commits the clicked value and the thumb follows the value prop afterwards', () => {
        const onChange = vi.fn();
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const render = (value: number) => {
            act(() => {
                root.render(
                    <Slider
                        value={value}
                        min={0}
                        max={100}
                        step={0.01}
                        keepProgress
                        onChange={onChange}
                    />
                );
            });
        };

        render(30);
        const input = container.querySelector('input');
        if (!input) throw new Error('input not rendered');
        expect(input.value).toBe('30');

        // Click at 60%: the browser sets the value and fires input, then change
        act(() => {
            setNativeValue(input, '60');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        act(() => {
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        expect(onChange).toHaveBeenCalledWith(60);

        // The bounce bug: a re-render lands with the still-stale value prop
        // (parent hasn't applied the seek yet). The thumb must hold at 60, not
        // snap back to 30.
        render(30);
        expect(input.value).toBe('60');

        // Once the value prop reflects the seek, the thumb tracks it again.
        render(60.5);
        expect(input.value).toBe('60.5');
        render(61);
        expect(input.value).toBe('61');
    });

    it('tracks live value when idle, and holds the drag position mid-gesture', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        const render = (value: number) => act(() => {
            root.render(<Slider value={value} min={0} max={100} step={0.01} keepProgress onChange={vi.fn()} />);
        });

        render(10);
        const input = container.querySelector('input');
        if (!input) throw new Error('input not rendered');

        // Idle: live progress ticks move the thumb.
        render(11);
        expect(input.value).toBe('11');

        // Mid-drag: input owns its value; a progress tick must not overwrite it.
        act(() => {
            setNativeValue(input, '80');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        render(11.5);
        expect(input.value).toBe('80');
    });
});
