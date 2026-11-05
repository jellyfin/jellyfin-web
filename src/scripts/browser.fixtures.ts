import { afterEach, beforeEach, vi } from 'vitest';

/** Shape of the module namespace of `./browser` (named + default export). */
export type BrowserModule = typeof import('./browser');

type NavigatorKey = 'userAgent' | 'platform' | 'appVersion' | 'maxTouchPoints';

/** Deterministic user agent installed as `navigator.userAgent` in the baseline environment. */
export const BASELINE_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const navigatorSnapshots = new Map<NavigatorKey, PropertyDescriptor | undefined>();
const windowSnapshots = new Map<string, PropertyDescriptor | undefined>();
const undoCallbacks: (() => void)[] = [];

/**
 * Stub a navigator property. jsdom has no `maxTouchPoints` at all, so `vi.spyOn(navigator, key, 'get')` cannot be
 * used for it. Defining an own accessor on the instance works for all four keys.
 */
export function stubNavigator(key: NavigatorKey, value: string | number | undefined) {
    if (!navigatorSnapshots.has(key)) {
        navigatorSnapshots.set(key, Object.getOwnPropertyDescriptor(navigator, key));
    }
    Object.defineProperty(navigator, key, { configurable: true, get: () => value });
}

function snapshotWindow(key: string) {
    if (!windowSnapshots.has(key)) {
        windowSnapshots.set(key, Object.getOwnPropertyDescriptor(window, key));
    }
}

/** Define `window[key]` (for example `tizen` or `ontouchstart`). */
export function setWindowProp(key: string, value: unknown) {
    snapshotWindow(key);
    Object.defineProperty(window, key, { configurable: true, writable: true, value });
}

/** Remove `window[key]` so that `key in window` is false. */
export function removeWindowProp(key: string) {
    snapshotWindow(key);
    Reflect.deleteProperty(window, key);
}

/** Make `document.documentElement.animate` present (a mock function or the given value) or absent. */
export function stubAnimate(value: unknown = vi.fn()) {
    const root = document.documentElement;
    undoCallbacks.push(() => Reflect.deleteProperty(root, 'animate'));
    Object.defineProperty(root, 'animate', { configurable: true, writable: true, value });
}

/** Every element created through `document.createElement` gets a plain `style` object with only the given keys. */
export function stubDivStyle(style: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const real = document.createElement.bind(document);
    return vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
        const el = real(tag, options);
        Object.defineProperty(el, 'style', { configurable: true, value: { ...style } });
        return el;
    });
}

/**
 * Install a deterministic baseline: no touch support, no `window.tizen`, no `animate`, empty platform and
 * appVersion, `maxTouchPoints` 0 and a fixed `navigator.userAgent`.
 */
export function applyBaselineEnvironment() {
    stubNavigator('userAgent', BASELINE_USER_AGENT);
    stubNavigator('platform', '');
    stubNavigator('appVersion', '');
    stubNavigator('maxTouchPoints', 0);
    removeWindowProp('ontouchstart');
    removeWindowProp('tizen');
}

/** Make the global `document` undefined (non-DOM environment); undone by `restoreEnvironment`. */
export function stubNoDocument() {
    vi.stubGlobal('document', undefined);
}

/** Undo everything done by the helpers above. Spies are restored by `restoreMocks` in vite.config.ts. */
export function restoreEnvironment() {
    vi.unstubAllGlobals();

    for (const [key, desc] of navigatorSnapshots) {
        if (desc) {
            Object.defineProperty(navigator, key, desc);
        } else {
            Reflect.deleteProperty(navigator, key);
        }
    }
    navigatorSnapshots.clear();

    for (const [key, desc] of windowSnapshots) {
        if (desc) {
            Object.defineProperty(window, key, desc);
        } else {
            Reflect.deleteProperty(window, key);
        }
    }
    windowSnapshots.clear();

    for (const undo of undoCallbacks.splice(0)) {
        undo();
    }
}

/** Call once per test file (top level or inside a describe): baseline before each test, full restore after. */
export function installEnvironment() {
    beforeEach(applyBaselineEnvironment);
    afterEach(restoreEnvironment);
}

/** Fresh module instance: re-evaluates the default export and resets the supportsCssAnimation caches. */
export async function loadFreshBrowser(): Promise<BrowserModule> {
    vi.resetModules();
    return import('./browser');
}

/** Silenced console spies. */
export function silenceConsole() {
    return {
        warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
        error: vi.spyOn(console, 'error').mockImplementation(() => undefined)
    };
}
