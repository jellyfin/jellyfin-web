import viewContainer from '../viewContainer';
import focusManager from '../focusManager';
import layoutManager from '../layoutManager';

export interface ViewElement extends HTMLElement {
    initComplete?: boolean;
    activeElement?: HTMLElement | null;
    [key: string]: any;
}

export interface ViewOptions {
    controllerFactory?: any;
    autoFocus?: boolean;
    cancel?: boolean;
    state?: any;
    url: string;
    view?: string;
    type?: string;
    fullscreen?: boolean;
    options?: any;
}

let currentView: ViewElement | null = null;
let dispatchPageEvents = false;

viewContainer.setOnBeforeChange((newView: ViewElement, isRestored: boolean, options: ViewOptions) => {
    const lastView = currentView;
    if (lastView) {
        const beforeHideResult = dispatchViewEvent(lastView, null, 'viewbeforehide', true);

        if (!beforeHideResult) {
            // todo: cancel
        }
    }

    const eventDetail = getViewEventDetail(newView, options, isRestored);

    if (!newView.initComplete) {
        newView.initComplete = true;

        if (typeof options.controllerFactory === 'function') {
            // eslint-disable-next-line new-cap
            new options.controllerFactory(newView, eventDetail.detail.params);
        } else if (options.controllerFactory && typeof options.controllerFactory.default === 'function') {
            new options.controllerFactory.default(newView, eventDetail.detail.params);
        }

        if (!options.controllerFactory || dispatchPageEvents) {
            dispatchViewEvent(newView, eventDetail, 'viewinit');
        }
    }

    dispatchViewEvent(newView, eventDetail, 'viewbeforeshow');
});

function onViewChange(view: ViewElement, options: ViewOptions, isRestore?: boolean) {
    const lastView = currentView;
    if (lastView) {
        dispatchViewEvent(lastView, null, 'viewhide');
    }

    currentView = view;

    const eventDetail = getViewEventDetail(view, options, !!isRestore);

    if (!isRestore) {
        if (options.autoFocus !== false) {
            focusManager.autoFocus(view);
        }
    } else if (!layoutManager.mobile) {
        if (
            view.activeElement &&
            document.body.contains(view.activeElement) &&
            focusManager.isCurrentlyFocusable(view.activeElement)
        ) {
            focusManager.focus(view.activeElement);
        } else {
            focusManager.autoFocus(view);
        }
    }

    view.dispatchEvent(new CustomEvent('viewshow', eventDetail));

    if (dispatchPageEvents) {
        view.dispatchEvent(new CustomEvent('pageshow', eventDetail));
    }
}

function getProperties(view: ViewElement): string[] {
    const props = view.getAttribute('data-properties');

    if (props) {
        return props.split(',');
    }

    return [];
}

function dispatchViewEvent(view: ViewElement, eventInfo: any, eventName: string, isCancellable?: boolean): boolean {
    if (!eventInfo) {
        eventInfo = {
            detail: {
                type: view.getAttribute('data-type'),
                properties: getProperties(view)
            },
            bubbles: true,
            cancelable: isCancellable
        };
    }

    eventInfo.cancelable = isCancellable || false;

    const eventResult = view.dispatchEvent(new CustomEvent(eventName, eventInfo));

    if (dispatchPageEvents) {
        eventInfo.cancelable = false;
        view.dispatchEvent(new CustomEvent(eventName.replace('view', 'page'), eventInfo));
    }

    return eventResult;
}

function getViewEventDetail(view: ViewElement, { state, url, options = {} }: ViewOptions, isRestored: boolean) {
    const index = url.indexOf('?');
    // eslint-disable-next-line compat/compat
    const searchParams = new URLSearchParams(url.substring(index + 1));
    const params: Record<string, string> = {};

    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return {
        detail: {
            type: view.getAttribute('data-type'),
            properties: getProperties(view),
            params,
            isRestored,
            state,
            // The route options
            options
        },
        bubbles: true,
        cancelable: false
    };
}

function resetCachedViews() {
    // Reset all cached views whenever the skin changes
    viewContainer.reset();
}

document.addEventListener('skinunload', resetCachedViews);

class ViewManager {
    loadView(options: ViewOptions) {
        const lastView = currentView;

        // Record the element that has focus
        if (lastView) {
            lastView.activeElement = document.activeElement;
        }

        if (options.cancel) {
            return;
        }

        const result = viewContainer.loadView(options as any);
        if (result && typeof result.then === 'function') {
            result.then((view: any) => {
                onViewChange(view as ViewElement, options);
            });
        }
    }

    hideView() {
        if (currentView) {
            dispatchViewEvent(currentView, null, 'viewbeforehide');
            dispatchViewEvent(currentView, null, 'viewhide');
            currentView.classList.add('hide');
            currentView = null;
        }
    }

    tryRestoreView(options: ViewOptions, onViewChanging?: () => void): Promise<void> {
        if (options.cancel) {
            return Promise.reject({ cancelled: true });
        }

        // Record the element that has focus
        if (currentView) {
            currentView.activeElement = document.activeElement;
        }

        return viewContainer.tryRestoreView(options as any).then((view: any) => {
            if (onViewChanging) onViewChanging();
            onViewChange(view as ViewElement, options, true);
        });
    }

    currentView(): ViewElement | null {
        return currentView;
    }

    setDispatchPageEvents(value: boolean) {
        dispatchPageEvents = value;
    }
}

const viewManager = new ViewManager();
viewManager.setDispatchPageEvents(true);

export default viewManager;
