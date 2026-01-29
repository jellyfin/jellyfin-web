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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Callback = (e: Event, ...args: any[]) => void;

interface EventCallbacks {
    [key: string]: Callback[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventObject = any;

/**
 * Legacy Event Bus
 *
 * @deprecated Use Zustand store subscriptions (useMediaStore.subscribe, etc.)
 * for new features. This is kept for backward compatibility with legacy plugins.
 */
class EventBus {
    private static instance: EventBus | null = null;

    private constructor() {}

    public static getInstance(): EventBus {
        if (EventBus.instance == null) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    private getCallbacks(obj: EventObject, type: string): Callback[] {
        if (obj == null) {
            throw new Error('EventBus: obj cannot be null!');
        }

        if (obj._callbacks == null) {
            obj._callbacks = {};
        }
        if (obj._callbacks[type] == null) {
            obj._callbacks[type] = [];
        }

        return obj._callbacks[type];
    }

    public on(obj: EventObject, type: KnownEventName | string, fn: Callback): void {
        const callbacks = this.getCallbacks(obj, type);
        callbacks.push(fn);
    }

    public off(obj: EventObject, type: KnownEventName | string, fn: Callback): void {
        const callbacks = this.getCallbacks(obj, type);
        const i = callbacks.indexOf(fn);
        if (i !== -1) {
            callbacks.splice(i, 1);
        }
    }

    public trigger(obj: EventObject, type: KnownEventName | string, args: unknown[] = []): void {
        const eventArgs: [Event, ...unknown[]] = [{ type }, ...args];
        const callbacks = this.getCallbacks(obj, type);

        // Debug log for important events to help migration
        if (['playbackstart', 'playbackstop', 'playerchange'].includes(type)) {
            logger.debug(`[Events] Triggered: ${type}`, {
                component: 'EventBus',
                origin: obj.name ?? 'unknown'
            });
        }

        callbacks.slice(0).forEach((callback) => {
            try {
                callback.apply(obj, eventArgs);
            } catch (err) {
                logger.error(
                    `[Events] Error in callback for ${type}`,
                    { component: 'EventBus' },
                    err as Error
                );
            }
        });
    }
}

const eventBus = EventBus.getInstance();

export const on = eventBus.on.bind(eventBus);
export const off = eventBus.off.bind(eventBus);
export const trigger = eventBus.trigger.bind(eventBus);

export default { on, off, trigger };
