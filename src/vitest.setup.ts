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
    get() { return this.getBoundingClientRect().width * (window.devicePixelRatio || 1); },
    set(v) { }
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    get() { return this.getBoundingClientRect().height * (window.devicePixelRatio || 1); },
    set(v) { }
});
