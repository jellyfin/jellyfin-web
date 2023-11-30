/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Event {
    type: string;
}

type callback = (e: Event, ...args: any[]) => void;

function getCallbacks(obj: any, type: string): callback[] {
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

export default {
    on(obj: any, type: string, fn: callback): void {
        const callbacks = getCallbacks(obj, type);

        callbacks.push(fn);
    },

    off(obj: any, type: string, fn: callback): void {
        const callbacks = getCallbacks(obj, type);

        const i = callbacks.indexOf(fn);
        if (i !== -1) {
            callbacks.splice(i, 1);
        }
    },

    trigger(obj: any, type: string, args: any[] = []) {
        const eventArgs: [Event, ...any] = [{ type }, ...args];

        getCallbacks(obj, type).slice(0)
            .forEach(callback => {
                callback.apply(obj, eventArgs);
            });
    }
};
/* eslint-enable @typescript-eslint/no-explicit-any */
