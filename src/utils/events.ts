/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger';

/**
 * Event Interface
 */
export interface Event {
    type: string;
}

/**
 * Known Event Types (Internal Migration Map)
 * This helps track which events should be replaced by store subscriptions.
 */
export type KnownEventName = 
    | 'playbackstart' 
    | 'playbackstop' 
    | 'pause' 
    | 'unpause' 
    | 'timeupdate' 
    | 'volumechange' 
    | 'playerchange' 
    | 'modechange' 
    | 'fullscreenchange'
    | 'reportplayback'
    | 'registered';

type Callback = (e: Event, ...args: any[]) => void;

/**
 * Legacy Event Bus
 * 
 * @deprecated Use Zustand store subscriptions (useMediaStore.subscribe, etc.) 
 * for new features. This is kept for backward compatibility with legacy plugins.
 */
class EventBus {
    private static instance: EventBus;
    
    private constructor() {}

    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    private getCallbacks(obj: any, type: string): Callback[] {
        if (!obj) {
            throw new Error('EventBus: obj cannot be null!');
        }

        obj._callbacks = obj._callbacks || {};
        if (!obj._callbacks[type]) {
            obj._callbacks[type] = [];
        }

        return obj._callbacks[type];
    }

    on(obj: any, type: KnownEventName | string, fn: Callback): void {
        const callbacks = this.getCallbacks(obj, type);
        callbacks.push(fn);
    }

    off(obj: any, type: KnownEventName | string, fn: Callback): void {
        const callbacks = this.getCallbacks(obj, type);
        const i = callbacks.indexOf(fn);
        if (i !== -1) {
            callbacks.splice(i, 1);
        }
    }

    trigger(obj: any, type: KnownEventName | string, args: any[] = []): void {
        const eventArgs: [Event, ...any] = [{ type }, ...args];
        const callbacks = this.getCallbacks(obj, type);

        // Debug log for important events to help migration
        if (['playbackstart', 'playbackstop', 'playerchange'].includes(type)) {
            logger.debug(`[Events] Triggered: ${type}`, { component: 'EventBus', origin: obj?.name || 'unknown' });
        }

        callbacks.slice(0).forEach(callback => {
            try {
                callback.apply(obj, eventArgs);
            } catch (err) {
                logger.error(`[Events] Error in callback for ${type}`, { component: 'EventBus' }, err as Error);
            }
        });
    }
}

const eventBus = EventBus.getInstance();

export const on = eventBus.on.bind(eventBus);
export const off = eventBus.off.bind(eventBus);
export const trigger = eventBus.trigger.bind(eventBus);

export default { on, off, trigger };