/**
 * Visibility Utilities Test Suite
 * Tests document visibility state checking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { isVisible } from './visibility';

describe('visibility - Document Visibility', () => {
    const originalVisibilityState = document.visibilityState;

    const originalHidden = document.hidden;

    beforeEach(() => {
        // Reset to defaults
        Object.defineProperty(document, 'visibilityState', {
            writable: true,
            value: 'visible'
        });
        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: false
        });
    });

    afterEach(() => {
        // Restore originals
        Object.defineProperty(document, 'visibilityState', {
            writable: true,
            value: originalVisibilityState
        });
        Object.defineProperty(document, 'hidden', {
            writable: true,
            value: originalHidden
        });
    });

    describe('isVisible', () => {
        it('should return true when document is visible', () => {
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'visible'
            });
            expect(isVisible()).toBe(true);
        });

        it('should return false when document is hidden', () => {
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'hidden'
            });
            expect(isVisible()).toBe(false);
        });

        it('should return false when document visibilityState is prerender', () => {
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'prerender'
            });
            expect(isVisible()).toBe(false);
        });

        it('should return false when document visibilityState is unloaded', () => {
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'unloaded'
            });
            expect(isVisible()).toBe(false);
        });
    });
});
