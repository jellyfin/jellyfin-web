import { beforeEach, describe, expect, it, vi } from 'vitest';
import eventsUtils, { EventObject } from './events';

describe('Utils: events', () => {
    describe('Method: on', () => {
        it('should throw error if object is null', () => {
            const obj: EventObject = null as unknown as EventObject;
            const call = () => eventsUtils.on(obj, 'testEvent', vi.fn());

            expect(call).toThrowError(new Error('EventBus: obj cannot be null!'));
        });

        it('should init object callbacks with testEvent type if it does not exist', () => {
            const obj: EventObject = {};
            const callback = vi.fn();

            eventsUtils.on(obj, 'testEvent', callback);

            expect(obj).toHaveProperty('_callbacks', {
                testEvent: [callback]
            });
        });

        it('should add callback to existing object callbacks', () => {
            const initialCallback = vi.fn();
            const obj: EventObject = {
                _callbacks: { testEvent: [initialCallback] }
            };
            const otherCallback = vi.fn();

            eventsUtils.on(obj, 'testEvent', otherCallback);

            expect(obj).toHaveProperty('_callbacks', {
                testEvent: [initialCallback, otherCallback]
            });
        });
    });

    describe('Method: off', () => {
        let obj: EventObject;
        let initialCallback: ReturnType<typeof vi.fn>;
        beforeEach(() => {
            initialCallback = vi.fn();
            obj = {
                _callbacks: {
                    testEvent: [initialCallback]
                }
            };
        });

        it('should remove existing callbacks', () => {
            eventsUtils.off(obj, 'testEvent', initialCallback);

            expect(obj).toHaveProperty('_callbacks', { testEvent: [] });
        });
        it('should not remove callback if it is not registered for the given event', () => {
            eventsUtils.off(obj, 'otherEvent', initialCallback);

            expect(obj).toHaveProperty('_callbacks', {
                testEvent: [initialCallback],
                otherEvent: []
            });
        });
        it('should not remove callback if it is not registered', () => {
            const callbackToRemove = vi.fn();

            eventsUtils.off(obj, 'testEvent', callbackToRemove);

            expect(obj).toHaveProperty('_callbacks', {
                testEvent: [initialCallback]
            });
        });
    });

    describe('Method: trigger', () => {
        it('should trigger registered callback with given parameters', () => {
            const obj: EventObject = {};
            const callback = vi.fn();
            eventsUtils.on(obj, 'testEvent', callback);

            eventsUtils.trigger(obj, 'testEvent', ['testValue1', 'testValue2']);

            expect(callback).toHaveBeenCalledWith(
                { type: 'testEvent' },
                'testValue1',
                'testValue2'
            );
        });
    });
});
