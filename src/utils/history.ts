export interface SimpleHistoryState {
    pathname: string;
    search: string;
    state?: Record<string, unknown> | null;
}

export interface SimpleHistoryListenerEvent {
    action: string;
    location: SimpleHistoryState;
}

export interface SimpleHistory {
    location: SimpleHistoryState;
    push(to: string, state?: Record<string, unknown>): void;
    replace(to: string, state?: Record<string, unknown>): void;
    back(): void;
    go(delta: number): void;
    listen(listener: (event: SimpleHistoryListenerEvent) => void): () => void;
}

export function createSimpleHistory(): SimpleHistory {
    let currentLocation: SimpleHistoryState = {
        pathname: window.location.pathname,
        search: window.location.search
    };

    const listeners: Set<(event: SimpleHistoryListenerEvent) => void> = new Set();

    const notify = (action: string) => {
        const event = { action, location: currentLocation };
        listeners.forEach(listener => listener(event));
    };

    return {
        get location() {
            return currentLocation;
        },
        push(to: string, state?: Record<string, unknown>) {
            const url = new URL(to, window.location.origin);
            currentLocation = {
                pathname: url.pathname,
                search: url.search,
                state: state || null
            };
            window.history.pushState(state || null, '', to);
            notify('PUSH');
        },
        replace(to: string, state?: Record<string, unknown>) {
            const url = new URL(to, window.location.origin);
            currentLocation = {
                pathname: url.pathname,
                search: url.search,
                state: state || null
            };
            window.history.replaceState(state || null, '', to);
            notify('REPLACE');
        },
        back() {
            window.history.back();
            notify('POP');
        },
        go(delta: number) {
            window.history.go(delta);
            notify('POP');
        },
        listen(listener: (event: SimpleHistoryListenerEvent) => void) {
            listeners.add(listener);
            const handlePopState = () => {
                currentLocation = {
                    pathname: window.location.pathname,
                    search: window.location.search
                };
                notify('POP');
            };
            window.addEventListener('popstate', handlePopState);
            return () => {
                listeners.delete(listener);
                window.removeEventListener('popstate', handlePopState);
            };
        }
    };
}

export const simpleHistory = createSimpleHistory();
