/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Event {
    type: string;
}

type Callback = (e: Event, ...args: any[]) => void;

function getCallbacks(obj: any, type: string): Callback[] {
    if (!obj) {
        throw new Error('obj cannot be null!');
    }

    obj._callbacks = obj._callbacks || {};

    let callbacks = obj._callbacks[type];

    if (!callbacks) {
        obj._callbacks[type] = [];
        callbacks = obj._callbacks[type];
    }

    return callbacks;
}

export function on(obj: any, type: string, fn: Callback): void {
    const callbacks = getCallbacks(obj, type);

    callbacks.push(fn);
}

export function off(obj: any, type: string, fn: Callback): void {
    const callbacks = getCallbacks(obj, type);

    const i = callbacks.indexOf(fn);
    if (i !== -1) {
        callbacks.splice(i, 1);
    }
}

export function trigger(obj: any, type: string, args: any[] = []): void {
    const eventArgs: [Event, ...any] = [{ type }, ...args];

    getCallbacks(obj, type).slice(0)
        .forEach(callback => {
            callback.apply(obj, eventArgs);
        });
}

// Keep default export for backward compatibility
export default { on, off, trigger };
/* eslint-enable @typescript-eslint/no-explicit-any */
