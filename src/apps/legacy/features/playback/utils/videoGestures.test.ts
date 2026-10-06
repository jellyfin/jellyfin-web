import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVideoGestures } from './videoGestures';

describe.each(['pointer', 'fallback'])('video gestures using %s events', mode => {
    let surface: HTMLDivElement;
    let control: HTMLButtonElement;
    let gestures: ReturnType<typeof createVideoGestures>;
    let enabled: boolean;
    const single = vi.fn();
    const double = vi.fn();

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        vi.stubGlobal('PointerEvent', mode === 'pointer' ? MouseEvent : undefined);
        document.body.innerHTML = '<div><button>Control</button></div>';
        surface = document.querySelector('div')!;
        control = document.querySelector('button')!;
        surface.getBoundingClientRect = () => ({ left: 100, right: 900, top: 0, bottom: 600, width: 800 } as DOMRect);
        single.mockClear();
        double.mockClear();
        enabled = true;
        gestures = createVideoGestures(surface, { enabled: () => enabled, single, double });
    });

    afterEach(() => {
        gestures.destroy();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    function event(type: 'down' | 'up' | 'move' | 'cancel', kind = 'mouse', x = 700, target: Element = surface,
        id = 1, primary = true, button = 0) {
        if (mode === 'pointer') {
            const e = new MouseEvent(`pointer${type}`, { bubbles: true, clientX: x, clientY: 200, button });
            Object.assign(e, { pointerType: kind, pointerId: id, isPrimary: primary });
            target.dispatchEvent(e);
        } else if (kind === 'mouse') {
            if (type !== 'cancel') target.dispatchEvent(new MouseEvent(`mouse${type}`, { bubbles: true, clientX: x, clientY: 200, button }));
        } else {
            const touch = { identifier: id, clientX: x, clientY: 200 };
            const e = new Event(`touch${{ down: 'start', up: 'end', move: 'move', cancel: 'cancel' }[type]}`, { bubbles: true });
            const touchCount = primary ? 1 : 2;
            Object.assign(e, { changedTouches: [touch], touches: type === 'up' || type === 'cancel' ? [] : Array(touchCount).fill(touch) });
            target.dispatchEvent(e);
        }
    }

    function click(kind = 'mouse', x = 700, target: Element = surface) {
        event('down', kind, x, target);
        event('up', kind, x, target);
    }

    it.each(['mouse', 'touch'])('recognizes left and right %s pairs without single actions', kind => {
        for (const [x, direction] of [[200, -1], [700, 1]]) {
            click(kind, x);
            vi.advanceTimersByTime(350);
            click(kind, x);
            expect(double).toHaveBeenLastCalledWith(direction);
        }
        vi.advanceTimersByTime(600);
        expect(double).toHaveBeenCalledTimes(2);
        expect(single).not.toHaveBeenCalled();
    });

    it.each([100, 350, 499, 500])('consumes a %ims pair, then clicks three and four form a new pair', gap => {
        click();
        vi.advanceTimersByTime(gap);
        click();
        click();
        vi.advanceTimersByTime(gap);
        click();
        vi.advanceTimersByTime(600);
        expect(double).toHaveBeenCalledTimes(2);
        expect(single).not.toHaveBeenCalled();
    });

    it.each(['mouse', 'touch'])('delivers an isolated %s single and treats late contacts as singles', kind => {
        click(kind);
        vi.advanceTimersByTime(499);
        expect(single).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2);
        expect(single).toHaveBeenCalledWith(kind);
        click(kind);
        vi.advanceTimersByTime(600);
        expect(single).toHaveBeenCalledTimes(2);
        expect(double).not.toHaveBeenCalled();
    });

    it('does not pair opposite halves or distant contacts', () => {
        click('mouse', 499);
        vi.advanceTimersByTime(100);
        click('mouse', 500);
        vi.advanceTimersByTime(100);
        click('mouse', 550);
        vi.advanceTimersByTime(600);
        expect(single).toHaveBeenCalledTimes(3);
        expect(double).not.toHaveBeenCalled();
    });

    it('excludes controls and cancels a pending surface single when controls are used', () => {
        click();
        click('mouse', 700, control);
        click('mouse', 700, control);
        vi.advanceTimersByTime(600);
        expect(single).not.toHaveBeenCalled();
        expect(double).not.toHaveBeenCalled();
    });

    it('rejects secondary buttons, drags, and holds without leaving singles', () => {
        event('down', 'mouse', 700, surface, 1, true, 2);
        event('up', 'mouse', 700, surface, 1, true, 2);
        event('down');
        event('move', 'mouse', 730);
        event('up');
        event('down');
        vi.advanceTimersByTime(501);
        event('up');
        vi.advanceTimersByTime(600);
        expect(single).not.toHaveBeenCalled();
        expect(double).not.toHaveBeenCalled();
    });

    it('rejects canceled and multiple simultaneous touch contacts', () => {
        click('touch');
        event('down', 'touch');
        event('cancel', 'touch');
        event('down', 'touch');
        event('down', 'touch', 710, surface, 2, false);
        event('up', 'touch');
        event('up', 'touch', 710, surface, 2);
        vi.advanceTimersByTime(600);
        expect(single).not.toHaveBeenCalled();
        expect(double).not.toHaveBeenCalled();
    });

    it('ignores compatibility mouse contacts after a touch pair', () => {
        click('touch');
        vi.advanceTimersByTime(100);
        click('touch');
        click('mouse');
        click('mouse');
        surface.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        vi.advanceTimersByTime(600);
        expect(double).toHaveBeenCalledTimes(1);
        expect(single).not.toHaveBeenCalled();
    });

    it('reset, disabled playback, and destroy cancel pending actions; reopening does not duplicate', () => {
        click();
        gestures.reset();
        vi.advanceTimersByTime(600);
        click();
        enabled = false;
        vi.advanceTimersByTime(600);
        enabled = true;
        click();
        gestures.destroy();
        gestures = createVideoGestures(surface, { enabled: () => enabled, single, double });
        click();
        vi.advanceTimersByTime(100);
        click();
        vi.advanceTimersByTime(600);
        expect(double).toHaveBeenCalledTimes(1);
        expect(single).not.toHaveBeenCalled();
    });
});
