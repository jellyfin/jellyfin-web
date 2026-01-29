import { vi } from 'vitest';
import '@testing-library/jest-dom';

HTMLCanvasElement.prototype.getContext = vi.fn();
HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    width: 200,
    height: 40,
    right: 200,
    bottom: 40,
    x: 0,
    y: 0,
    toJSON: () => {}
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    get() {
        return this.getBoundingClientRect().width * (window.devicePixelRatio || 1);
    },
    set(v) {}
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    get() {
        return this.getBoundingClientRect().height * (window.devicePixelRatio || 1);
    },
    set(v) {}
});

// Mock Worker
global.Worker = class {
    onmessage = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Mock textTracks for HTML5 video
Object.defineProperty(HTMLVideoElement.prototype, 'textTracks', {
    get() {
        return {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            length: 0
        };
    }
});
