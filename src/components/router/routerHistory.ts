/* eslint-disable @typescript-eslint/no-explicit-any */
import Events, { type Event } from 'utils/events';

const HISTORY_UPDATE_EVENT = 'HISTORY_UPDATE';

type Listener = (location: { action: string; location: any }) => void;
type To = string | { pathname: string; search?: string; hash?: string };

export class RouterHistory {
    _router: any;
    createHref: (arg: any) => string;

    constructor(router: any) {
        this._router = router;

        this._router.subscribe((state: any) => {
            console.debug('[RouterHistory] history update', state);
            Events.trigger(document, HISTORY_UPDATE_EVENT, [state]);
        });

        const historyCreateHref = router.history?.createHref;
        this.createHref = historyCreateHref ? historyCreateHref.bind(router.history) : () => '';
    }

    get action() {
        return this._router.state.historyAction;
    }

    get location() {
        return this._router.state.location;
    }

    back() {
        void this._router.navigate(-1);
    }

    forward() {
        void this._router.navigate(1);
    }

    go(delta: number) {
        void this._router.navigate(delta);
    }

    push(to: To, state?: any) {
        void this._router.navigate(to, { state });
    }

    replace(to: To, state?: any): void {
        void this._router.navigate(to, { state, replace: true });
    }

    block() {
        throw new Error('`history.block()` is not implemented');
    }

    listen(listener: Listener) {
        const compatListener = (_e: Event, state: any) => {
            return listener({ action: state.historyAction, location: state.location });
        };

        Events.on(document, HISTORY_UPDATE_EVENT, compatListener);

        return () => Events.off(document, HISTORY_UPDATE_EVENT, compatListener);
    }
}

export const createRouterHistory = (router: any) => {
    return new RouterHistory(router);
};

/* eslint-enable @typescript-eslint/no-explicit-any */
