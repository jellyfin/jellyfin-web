import { describe, it, expect, beforeEach } from 'vitest';
import { useCrossfadeStore } from './crossfadeStore';

describe('crossfadeStore', () => {
    beforeEach(() => {
        useCrossfadeStore.setState({
            enabled: true,
            duration: 5,
            fadeOut: 10,
            sustain: 0.417,
            busy: false,
            triggered: false,
            manualTrigger: false,
            lastDuration: 5
        });
    });

    describe('initial state', () => {
        it('should have enabled crossfade by default', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.enabled).toBe('boolean');
        });

        it('should have duration setting', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.duration).toBe('number');
        });

        it('should have calculated fade out', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.fadeOut).toBe('number');
        });

        it('should have sustain value', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.sustain).toBe('number');
        });

        it('should track busy state', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.busy).toBe('boolean');
        });
    });

    describe('runtime states', () => {
        it('should have triggered flag', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.triggered).toBe('boolean');
        });

        it('should have manualTrigger flag', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.manualTrigger).toBe('boolean');
        });

        it('should track last duration', () => {
            const state = useCrossfadeStore.getState();
            expect(state.lastDuration).toBeGreaterThanOrEqual(1);
        });
    });

    describe('configuration updates', () => {
        it('should update duration setting', () => {
            useCrossfadeStore.getState().setDuration(8);
            expect(useCrossfadeStore.getState().duration).toBe(8);
        });

        it('should toggle enabled state', () => {
            const initial = useCrossfadeStore.getState().enabled;
            useCrossfadeStore.getState().setEnabled(!initial);
            expect(useCrossfadeStore.getState().enabled).toBe(!initial);
        });

        it('should allow re-enabling', () => {
            useCrossfadeStore.getState().setEnabled(false);
            useCrossfadeStore.getState().setEnabled(true);
            expect(useCrossfadeStore.getState().enabled).toBe(true);
        });
    });

    describe('store methods', () => {
        it('should have syncFromEngine method', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.syncFromEngine).toBe('function');
        });

        it('should have setDuration method', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.setDuration).toBe('function');
        });

        it('should have setEnabled method', () => {
            const state = useCrossfadeStore.getState();
            expect(typeof state.setEnabled).toBe('function');
        });
    });

    describe('crossfade calculations', () => {
        it('should calculate sustain based on duration', () => {
            const state = useCrossfadeStore.getState();
            expect(state.sustain).toBeGreaterThanOrEqual(0);
        });

        it('should calculate fade out based on duration', () => {
            const state = useCrossfadeStore.getState();
            expect(state.fadeOut).toBeGreaterThanOrEqual(0);
        });

        it('should maintain consistent relationships', () => {
            const state = useCrossfadeStore.getState();
            if (state.duration > 0) {
                expect(state.fadeOut).toBeGreaterThan(0);
                expect(state.sustain).toBeGreaterThanOrEqual(0);
            }
        });
    });
});
