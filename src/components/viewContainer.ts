import $ from 'jquery';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { importModule } from 'utils/importModule';
import { getPluginUrl } from 'utils/plugin';

import type { Nullable } from '@/types/nullable';
import type { BeforeChangeHandler, LoadViewOptions, ViewOptions } from 'types/viewManager';

import './viewManager/viewContainer.scss';

const getMainAnimatedPages = () => {
    return document.querySelector('.mainAnimatedPages');
};

function setControllerClass(view: HTMLElement, options: ViewOptions) {
    if (options.controllerFactory) {
        return Promise.resolve();
    }

    let controllerUrl = view.getAttribute('data-controller');

    if (controllerUrl) {
        if (controllerUrl.startsWith('__plugin/')) {
            controllerUrl = controllerUrl.substring('__plugin/'.length);
        }

        const api = ServerConnections.getApi();
        if (!api) {
            return Promise.reject(new Error('[viewContainer] No server available to load the view controller'));
        }

        controllerUrl = getPluginUrl(controllerUrl);
        const apiUrl = api.getUri('/web/' + controllerUrl);
        return importModule(apiUrl)
            .then((ControllerFactory) => {
                options.controllerFactory = ControllerFactory;
            })
            .catch((err) => {
                // Still show the view without its controller, as a broken controller previously did
                console.error('[viewContainer] failed to load the view controller', err);
            });
    }

    return Promise.resolve();
}

function createViewElement(newView: Nullable<HTMLElement | string>) {
    let view: Nullable<HTMLElement>;

    if (typeof newView == 'string') {
        view = document.createElement('div');
        view.innerHTML = newView;
    } else {
        view = newView;
    }

    if (!view) {
        throw new TypeError('[viewContainer] view element is not present');
    }

    view.classList.add('mainAnimatedPage');
    return view;
}

function insertView(mainAnimatedPages: Element, view: HTMLElement, currentPage: HTMLElement | undefined, hasScript: boolean) {
    // Views with scripts are inserted with jQuery so their scripts are executed
    if (hasScript) {
        if (currentPage) {
            mainAnimatedPages.removeChild(currentPage);
        }
        return $(view).appendTo(mainAnimatedPages)[0];
    }

    if (currentPage) {
        mainAnimatedPages.replaceChild(view, currentPage);
    } else {
        mainAnimatedPages.appendChild(view);
    }
    return view;
}

function setViewAttributes(view: HTMLElement, options: LoadViewOptions) {
    if (options.type) {
        view.setAttribute('data-type', options.type);
    }

    if (options.fullscreen) {
        view.setAttribute('data-properties', 'fullscreen');
    }
}

export function loadView(options: LoadViewOptions) {
    if (options.cancel) {
        return;
    }

    const selected = selectedPageIndex;
    const previousAnimatable = selected === -1 ? null : allPages[selected];
    const pageIndex = (selected + 1) % pageContainerCount;

    const isPluginpage = options.url.includes('configurationpage');
    const newViewInfo = normalizeNewView(options, isPluginpage);

    const currentPage = allPages[pageIndex];

    if (currentPage) {
        triggerDestroy(currentPage);
    }

    const newView = createViewElement(newViewInfo.elem);

    const mainAnimatedPages = getMainAnimatedPages();

    if (!mainAnimatedPages) {
        console.warn('[viewContainer] main animated pages element is not present');
        return;
    }

    const view = insertView(mainAnimatedPages, newView, currentPage, newViewInfo.hasScript);
    setViewAttributes(view, options);

    allPages[pageIndex] = view;

    return setControllerClass(view, options)
    // Timeout for polyfilled CustomElements (webOS 1.2)
        .then(() => new Promise((resolve) => setTimeout(resolve, 0)))
        .then(() => {
            onBeforeChange?.(view, false, options);

            beforeAnimate(allPages, pageIndex, selected);
            selectedPageIndex = pageIndex;
            currentUrls[pageIndex] = options.url;

            if (!options.cancel && previousAnimatable) {
                afterAnimate(allPages, pageIndex);
            }

            return view;
        });
}

function parseHtml(html: string, hasScript: boolean): Nullable<HTMLElement> {
    if (hasScript) {
        html = html
            .replace(/<!--<script/g, '<script')
            .replace(/<\/script>-->/g, '</script>');
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.querySelector<HTMLElement>('div[data-role="page"]');
}

function normalizeNewView(options: LoadViewOptions, isPluginPage: boolean) {
    const viewHtml = options.view;

    if (viewHtml.indexOf('data-role="page"') === -1) {
        return {
            elem: viewHtml,
            hasScript: false,
            hasjQuerySelect: false,
            hasjQueryChecked: false,
            hasjQuery: false
        };
    }

    let hasScript = viewHtml.indexOf('<script') !== -1;
    const elem = parseHtml(viewHtml, hasScript);

    if (hasScript) {
        hasScript = elem?.querySelector('script') != null;
    }

    let hasjQuery = false;
    let hasjQuerySelect = false;
    let hasjQueryChecked = false;

    if (isPluginPage) {
        hasjQuery = viewHtml.indexOf('jQuery') != -1 || viewHtml.indexOf('$(') != -1 || viewHtml.indexOf('$.') != -1;
        hasjQueryChecked = viewHtml.indexOf('.checked(') != -1;
        hasjQuerySelect = viewHtml.indexOf('.selectmenu(') != -1;
    }

    return {
        elem: elem,
        hasScript: hasScript,
        hasjQuerySelect: hasjQuerySelect,
        hasjQueryChecked: hasjQueryChecked,
        hasjQuery: hasjQuery
    };
}

function beforeAnimate(allPages: HTMLElement[], newPageIndex: number, oldPageIndex: number) {
    for (let index = 0, length = allPages.length; index < length; index++) {
        if (newPageIndex !== index && oldPageIndex !== index) {
            allPages[index].classList.add('hide');
        }
    }
}

function afterAnimate(allPages: HTMLElement[], newPageIndex: number) {
    for (let index = 0, length = allPages.length; index < length; index++) {
        if (newPageIndex !== index) {
            allPages[index].classList.add('hide');
        }
    }
}

export function setOnBeforeChange(fn: BeforeChangeHandler) {
    onBeforeChange = fn;
}

export function tryRestoreView(options: ViewOptions) {
    console.debug('[viewContainer] tryRestoreView', options);
    const url = options.url;
    const index = currentUrls.indexOf(url);

    if (index !== -1) {
        const animatable = allPages[index];
        const view = animatable;

        if (view) {
            if (options.cancel) {
                return;
            }

            const selected = selectedPageIndex;
            const previousAnimatable = selected === -1 ? null : allPages[selected];
            return setControllerClass(view, options).then(() => {
                if (onBeforeChange) {
                    onBeforeChange(view, true, options);
                }

                beforeAnimate(allPages, index, selected);
                animatable.classList.remove('hide');
                selectedPageIndex = index;

                if (!options.cancel && previousAnimatable) {
                    afterAnimate(allPages, index);
                }

                return view;
            });
        }
    }

    return Promise.reject();
}

function triggerDestroy(view: HTMLElement) {
    view.dispatchEvent(new CustomEvent('viewdestroy', {}));
}

export function reset() {
    console.debug('[viewContainer] resetting view cache');
    allPages = [];
    currentUrls = [];
    const mainAnimatedPages = getMainAnimatedPages();
    if (mainAnimatedPages) mainAnimatedPages.innerHTML = '';
    selectedPageIndex = -1;
}

let onBeforeChange: BeforeChangeHandler | undefined;
let allPages: HTMLElement[] = [];
let currentUrls: string[] = [];
const pageContainerCount = 3;
let selectedPageIndex = -1;
reset();
getMainAnimatedPages()?.classList.remove('hide');

export default {
    loadView,
    tryRestoreView,
    reset,
    setOnBeforeChange
};
