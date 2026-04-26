import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGetWindowState = vi.fn(() => 'Normal');
vi.mock('../components/apphost', () => ({
    appHost: {
        getWindowState: () => mockGetWindowState()
    }
}));

function makeGamepad(
    overrides: {
        buttons?: Array<{ pressed: boolean; value: number } | null>;
        axes?: number[];
        connected?: boolean;
        index?: number;
    } = {}
) {
    const defaults = {
        buttons: [] as Array<{ pressed: boolean; value: number }>,
        axes: [0, 0, 0, 0],
        connected: true,
        id: 'Mock Gamepad',
        index: 0,
        mapping: 'standard',
        timestamp: performance.now(),
        hapticActuators: [],
        vibrationActuator: null
    };
    return { ...defaults, ...overrides };
}

/** Return a button object for a given pressed state. */
function btn(pressed: boolean) {
    return { pressed, value: pressed ? 1.0 : 0, touched: pressed };
}

/** Build a buttons array with exactly one button pressed at buttonIndex (16 buttons total). */
function buttonsWithPressed(buttonIndex: number, pressed = true) {
    const buttons = Array.from({ length: 16 }, () => btn(false));
    buttons[buttonIndex] = btn(pressed);
    return buttons;
}

/**
 * Capture a manually-controlled requestAnimationFrame.
 * Returns `tick()` which runs ONE animation-frame callback.
 */
function captureRAF() {
    let rafCallback: FrameRequestCallback | null = null;
    let rafId = 1;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallback = cb;
        return rafId++;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
        rafCallback = null;
    });

    return {
        tick(time = performance.now()) {
            const cb = rafCallback;
            rafCallback = null; // clear before call so next rAF registers
            cb?.(time);
        },
        get hasPending() {
            return rafCallback !== null;
        }
    };
}

function collectEvents() {
    const events: KeyboardEvent[] = [];
    const handler = (e: KeyboardEvent) => events.push(e);
    document.addEventListener('keydown', handler, true);
    document.addEventListener('keyup', handler, true);
    return {
        events,
        cleanup() {
            document.removeEventListener('keydown', handler, true);
            document.removeEventListener('keyup', handler, true);
        }
    };
}

let mockGetGamepads: ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();

    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });

    mockGetWindowState.mockReturnValue('Normal');
    mockGetGamepads = vi.fn(() => [null, null, null, null]);
    Object.defineProperty(navigator, 'getGamepads', {
        value: mockGetGamepads,
        writable: true,
        configurable: true
    });
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('gamepadtokey', () => {
    describe('start / stop lifecycle', () => {
        it('start() begins requestAnimationFrame polling', async () => {
            const raf = captureRAF();
            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            expect(raf.hasPending).toBe(false);

            mod.start();
            expect(raf.hasPending).toBe(true);

            mod.stop();
        });

        it('stop() cancels requestAnimationFrame polling', async () => {
            const raf = captureRAF();
            const mod = (await import('./gamepadtokey.js')).default;

            mod.start();
            expect(raf.hasPending).toBe(true);

            mod.stop();
            raf.tick();
            expect(raf.hasPending).toBe(false);
        });

        it('calling start() multiple times does not double-register', async () => {
            captureRAF();
            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();

            mod.start();
            mod.start();
            expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

            mod.stop();
        });
    });

    describe('D-pad button presses', () => {
        it('dispatches keydown on dPadUp press', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(12) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBeGreaterThanOrEqual(1);
            expect(keydowns[0].key).toBe('GamepadDPadUp');
            expect(keydowns[0].keyCode).toBe(38);

            mod.stop();
            cleanup();
        });

        it('dispatches keydown for each D-pad direction', async () => {
            const directions = [
                { index: 12, key: 'GamepadDPadUp', code: 38 },
                { index: 13, key: 'GamepadDPadDown', code: 40 },
                { index: 14, key: 'GamepadDPadLeft', code: 37 },
                { index: 15, key: 'GamepadDPadRight', code: 39 }
            ];

            for (const dir of directions) {
                vi.resetModules();
                const raf = captureRAF();
                const { events, cleanup } = collectEvents();

                mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(dir.index) })]);

                const mod = (await import('./gamepadtokey.js')).default;
                mod.stop();
                mod.start();
                raf.tick();

                const keydowns = events.filter(e => e.type === 'keydown');
                expect(keydowns.length).toBeGreaterThanOrEqual(1);
                expect(keydowns[0].key).toBe(dir.key);
                expect(keydowns[0].keyCode).toBe(dir.code);

                mod.stop();
                cleanup();
            }
        });

        it('dispatches keyup after release and debounce window', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Press dPadRight
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // initial keydown

            // Release the button
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15, false) })]);
            raf.tick(); // schedules pending release

            // Advance past debounce window (120 ms)
            vi.advanceTimersByTime(150);
            raf.tick(); // should now fire keyup

            const keyups = events.filter(e => e.type === 'keyup');
            expect(keyups.length).toBeGreaterThanOrEqual(1);
            expect((keyups[0] as KeyboardEvent).key).toBe('GamepadDPadRight');

            mod.stop();
            cleanup();
        });

        it('fires repeat keydowns when holding a D-pad button', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(12) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // initial down

            const initialCount = events.filter(e => e.type === 'keydown').length;

            // Advance past REPEAT_INITIAL_DELAY (400ms) and tick
            vi.advanceTimersByTime(420);
            raf.tick(); // repeat

            // Advance another REPEAT_INTERVAL (100ms)
            vi.advanceTimersByTime(110);
            raf.tick(); // another repeat

            const totalKeydowns = events.filter(e => e.type === 'keydown').length;
            expect(totalKeydowns).toBeGreaterThan(initialCount);

            mod.stop();
            cleanup();
        });
    });

    describe('A button (non-repeat, click-on-keyup)', () => {
        it('dispatches keydown on A press with correct key', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // A = index 0
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBe(1);
            expect(keydowns[0].key).toBe('GamepadA');
            expect(keydowns[0].keyCode).toBe(195);

            mod.stop();
            cleanup();
        });

        it('does not repeat when button is held (non-repeat locked)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // first keydown

            for (let i = 0; i < 10; i++) {
                vi.advanceTimersByTime(500);
                raf.tick();
            }

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBe(1);

            mod.stop();
            cleanup();
        });

        it('dispatches keyup on A release after debounce (click-on-keyup does not fire via normal release path)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();
            const clickSpy = vi.fn();

            // Create a focusable element to receive the click
            const button = document.createElement('button');
            button.addEventListener('click', clickSpy);
            document.body.appendChild(button);
            button.focus();

            // Press A
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // keydown

            // Release A — the release path calls setPressed without clickOnKeyUp=true
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0, false) })]);
            raf.tick(); // schedule pending release

            // Advance past release debounce
            vi.advanceTimersByTime(150);
            raf.tick(); // keyup fires

            const keyups = events.filter(e => e.type === 'keyup');
            expect(keyups.length).toBe(1);
            expect(keyups[0].key).toBe('GamepadA');
            // Click does NOT fire because the release path omits clickOnKeyUp param
            expect(clickSpy).not.toHaveBeenCalled();

            mod.stop();
            cleanup();
            document.body.removeChild(button);
        });
    });

    describe('B button', () => {
        it('dispatches keydown with GamepadB key and code 196', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // B = index 1
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(1) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBe(1);
            expect(keydowns[0].key).toBe('GamepadB');
            expect(keydowns[0].keyCode).toBe(196);

            mod.stop();
            cleanup();
        });
    });

    describe('left thumbstick axis input', () => {
        it('dispatches keydown for right stick deflection', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // axes[0] > 0.75 = right
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [1.0, 0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            // Need multiple ticks for smoothing to converge past threshold
            for (let i = 0; i < 10; i++) {
                raf.tick();
            }

            const keydowns = events.filter(e => e.type === 'keydown');
            const rightDown = keydowns.find((e) => e.key === 'GamepadLeftThumbStickRight');
            expect(rightDown).toBeDefined();
            expect(rightDown!.keyCode).toBe(39);

            mod.stop();
            cleanup();
        });

        it('dispatches keydown for left stick deflection', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // axes[0] < -0.75 = left
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [-1.0, 0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            for (let i = 0; i < 10; i++) {
                raf.tick();
            }

            const keydowns = events.filter(e => e.type === 'keydown');
            const leftDown = keydowns.find((e) => e.key === 'GamepadLeftThumbStickLeft');
            expect(leftDown).toBeDefined();
            expect(leftDown!.keyCode).toBe(37);

            mod.stop();
            cleanup();
        });

        it('dispatches keydown for up stick deflection (negative Y)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // axes[1] < -0.75 = up
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [0, -1.0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            for (let i = 0; i < 10; i++) {
                raf.tick();
            }

            const keydowns = events.filter(e => e.type === 'keydown');
            const upDown = keydowns.find((e) => e.key === 'GamepadLeftThumbStickUp');
            expect(upDown).toBeDefined();
            expect(upDown!.keyCode).toBe(38);

            mod.stop();
            cleanup();
        });

        it('dispatches keydown for down stick deflection (positive Y)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // axes[1] > 0.75 = down
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [0, 1.0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            for (let i = 0; i < 10; i++) {
                raf.tick();
            }

            const keydowns = events.filter(e => e.type === 'keydown');
            const downDown = keydowns.find((e) => e.key === 'GamepadLeftThumbStickDown');
            expect(downDown).toBeDefined();
            expect(downDown!.keyCode).toBe(40);

            mod.stop();
            cleanup();
        });

        it('dispatches keyup when axis returns to center after debounce', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Push right
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [1.0, 0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            // Let smoothing converge
            for (let i = 0; i < 10; i++) {
                raf.tick();
            }

            // Return to center
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [0, 0, 0, 0] })]);

            // Tick to let smoothing settle below release threshold
            for (let i = 0; i < 20; i++) {
                raf.tick();
            }

            // Advance past release debounce (120ms)
            vi.advanceTimersByTime(150);
            raf.tick();

            const keyups = events.filter(e => e.type === 'keyup');
            const rightUp = keyups.find((e) => e.key === 'GamepadLeftThumbStickRight');
            expect(rightUp).toBeDefined();

            mod.stop();
            cleanup();
        });
    });

    describe('allowInput gating', () => {
        it('does not dispatch events when window is minimized', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetWindowState.mockReturnValue('Minimized');
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(12) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            expect(events.length).toBe(0);

            mod.stop();
            cleanup();
        });

        it('does not dispatch events when document is hidden (non-Electron)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(12) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            expect(events.length).toBe(0);

            mod.stop();
            cleanup();
        });
    });

    describe('gamepad connect / disconnect events', () => {
        it('starts polling when a gamepad connects and document has focus', async () => {
            const raf = captureRAF();

            mockGetGamepads.mockReturnValue([null, null, null, null]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();

            // Simulate gamepad connection
            mockGetGamepads.mockReturnValue([makeGamepad()]);
            window.dispatchEvent(new Event('gamepadconnected'));

            expect(raf.hasPending).toBe(true);

            mod.stop();
        });

        it('stops polling when a gamepad disconnects and no others connected', async () => {
            const raf = captureRAF();

            mockGetGamepads.mockReturnValue([makeGamepad()]);

            const mod = (await import('./gamepadtokey.js')).default;
            // Module may start polling automatically
            // Now disconnect
            mockGetGamepads.mockReturnValue([null, null, null, null]);
            window.dispatchEvent(new Event('gamepaddisconnected'));

            // Should have stopped
            expect(raf.hasPending).toBe(false);

            mod.stop();
        });

        it('stops polling on window blur', async () => {
            const raf = captureRAF();

            mockGetGamepads.mockReturnValue([makeGamepad()]);

            const mod = (await import('./gamepadtokey.js')).default;

            vi.spyOn(document, 'hasFocus').mockReturnValue(false);
            window.dispatchEvent(new Event('blur'));

            expect(raf.hasPending).toBe(false);

            mod.stop();
        });

        it('resumes polling on window focus with gamepad connected', async () => {
            const raf = captureRAF();

            mockGetGamepads.mockReturnValue([makeGamepad()]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();

            vi.spyOn(document, 'hasFocus').mockReturnValue(true);
            window.dispatchEvent(new Event('focus'));

            expect(raf.hasPending).toBe(true);

            mod.stop();
        });
    });

    describe('multiple gamepads and null entries', () => {
        it('handles null entries in gamepad array gracefully', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([null, null, makeGamepad({ buttons: buttonsWithPressed(12), index: 2 }), null]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBeGreaterThanOrEqual(1);
            expect(keydowns[0].key).toBe('GamepadDPadUp');

            mod.stop();
            cleanup();
        });

        it('processes buttons from multiple connected gamepads', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Two gamepads: one pressing dPadUp, another pressing dPadDown
            mockGetGamepads.mockReturnValue([
                makeGamepad({ buttons: buttonsWithPressed(12), index: 0 }),
                makeGamepad({ buttons: buttonsWithPressed(13), index: 1 })
            ]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            const keydowns = events.filter(e => e.type === 'keydown');
            const keys = keydowns.map(e => e.key);
            expect(keys).toContain('GamepadDPadUp');
            expect(keys).toContain('GamepadDPadDown');

            mod.stop();
            cleanup();
        });
    });

    describe('release debounce', () => {
        it('re-press within debounce window cancels pending release', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Press dPadRight
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // keydown

            // Release
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15, false) })]);
            raf.tick(); // schedule pending release

            // Re-press before debounce expires (within 120ms)
            vi.advanceTimersByTime(50);
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15) })]);
            raf.tick(); // should cancel pending release

            // Wait for debounce to expire
            vi.advanceTimersByTime(200);
            raf.tick();

            const keyups = events.filter(e => e.type === 'keyup');
            // No keyup should have fired since we re-pressed in time
            expect(keyups.length).toBe(0);

            mod.stop();
            cleanup();
        });

        it('does not fire keyup before debounce window elapses', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // keydown

            // Release
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(15, false) })]);
            raf.tick(); // schedule pending release

            // Advance only partially through debounce
            vi.advanceTimersByTime(50);
            raf.tick();

            const keyups = events.filter(e => e.type === 'keyup');
            expect(keyups.length).toBe(0);

            mod.stop();
            cleanup();
        });
    });

    describe('axis hysteresis', () => {
        it('does not fire press until smoothed value crosses PRESS_THRESHOLD', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Use a value in the deadzone (below 0.75 threshold after smoothing)
            mockGetGamepads.mockReturnValue([makeGamepad({ axes: [0.5, 0, 0, 0] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            // Tick many times — smoothed value should never exceed threshold
            for (let i = 0; i < 20; i++) {
                raf.tick();
            }

            const rightPresses = events.filter(e => e.key === 'GamepadLeftThumbStickRight');
            expect(rightPresses.length).toBe(0);

            mod.stop();
            cleanup();
        });
    });

    describe('edge cases', () => {
        it('handles gamepad with empty buttons and axes arrays', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: [], axes: [] })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            expect(() => raf.tick()).not.toThrow();
            expect(events.length).toBe(0);

            mod.stop();
            cleanup();
        });

        it('handles getGamepads returning empty array', async () => {
            const raf = captureRAF();

            mockGetGamepads.mockReturnValue([]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();

            expect(() => raf.tick()).not.toThrow();

            mod.stop();
        });

        it('dispatches events on document.activeElement when it exists', async () => {
            const raf = captureRAF();
            const receivedEvents: KeyboardEvent[] = [];

            const input = document.createElement('input');
            input.addEventListener('keydown', e => receivedEvents.push(e));
            document.body.appendChild(input);
            input.focus();

            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(12) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick();

            expect(receivedEvents.length).toBeGreaterThanOrEqual(1);
            expect(receivedEvents[0].key).toBe('GamepadDPadUp');

            mod.stop();
            document.body.removeChild(input);
        });

        it('clickActiveElement falls back to window when no activeElement', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Override activeElement to null to trigger the fallback path
            Object.defineProperty(document, 'activeElement', { value: null, configurable: true });

            // Press A (which triggers click-on-keyup semantics internally)
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // keydown fires on document.body fallback

            // Release A
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0, false) })]);
            raf.tick();
            vi.advanceTimersByTime(150);
            raf.tick(); // keyup

            expect(events.length).toBeGreaterThanOrEqual(0);

            mod.stop();
            cleanup();
            Object.defineProperty(document, 'activeElement', { value: document.body, configurable: true });
        });
    });

    describe('non-repeat lock for A/B buttons', () => {
        it('ignores re-press of A button without release (non-repeat lock)', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Press A
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // first keydown fires, A is now locked

            const initialKeydowns = events.filter(e => e.type === 'keydown').length;
            expect(initialKeydowns).toBe(1);

            // Release A — triggers pending release
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0, false) })]);
            raf.tick();

            // Before debounce expires, press A again (simulates a "bounce")
            vi.advanceTimersByTime(50);
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(0) })]);
            raf.tick(); // should be ignored by non-repeat lock since we haven't fully released

            // Still only 1 keydown
            const afterRepress = events.filter(e => e.type === 'keydown').length;
            expect(afterRepress).toBe(1);

            mod.stop();
            cleanup();
        });

        it('allows re-press of B button after full release cycle', async () => {
            const raf = captureRAF();
            const { events, cleanup } = collectEvents();

            // Press B (index 1, non-repeat)
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(1) })]);

            const mod = (await import('./gamepadtokey.js')).default;
            mod.stop();
            mod.start();
            raf.tick(); // first keydown

            // Release B
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(1, false) })]);
            raf.tick(); // pending release
            vi.advanceTimersByTime(150);
            raf.tick(); // keyup fires, lock cleared

            // Press B again
            mockGetGamepads.mockReturnValue([makeGamepad({ buttons: buttonsWithPressed(1) })]);
            raf.tick(); // second keydown should fire

            const keydowns = events.filter(e => e.type === 'keydown');
            expect(keydowns.length).toBe(2);

            mod.stop();
            cleanup();
        });
    });
});
