import './viewManager/viewContainer.scss';
import Dashboard from '../utils/dashboard';
import { logger } from '../utils/logger';

export interface ViewOptions {
    url: string;
    view: string;
    cancel?: boolean;
    controllerFactory?: any;
    type?: string;
    fullscreen?: boolean;
}

interface NewViewInfo {
    elem: HTMLElement;
    hasScript: boolean;
}

let onBeforeChange:
    | ((view: HTMLElement, isRestored: boolean, options: ViewOptions) => void)
    | undefined;
let allPages: HTMLElement[] = [];
let currentUrls: string[] = [];
const pageContainerCount = 3;
let selectedPageIndex = -1;

const getMainAnimatedPages = (): HTMLElement | null => {
    return document.querySelector('.mainAnimatedPages');
};

function setControllerClass(view: HTMLElement, options: ViewOptions): Promise<void> {
    if (options.controllerFactory) return Promise.resolve();

    let controllerUrl = view.getAttribute('data-controller');
    if (controllerUrl) {
        if (controllerUrl.indexOf('__plugin/') === 0) {
            controllerUrl = controllerUrl.substring('__plugin/'.length);
        }
        controllerUrl = Dashboard.getPluginUrl(controllerUrl);
        const apiUrl = (window as any).ApiClient.getUrl('/web/' + controllerUrl);
        return fetch(apiUrl)
            .then((response) => response.text())
            .then((scriptText) => {
                const blob = new Blob([scriptText], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                return import(/* @vite-ignore */ blobUrl).then((ControllerFactory) => {
                    options.controllerFactory = ControllerFactory;
                    URL.revokeObjectURL(blobUrl);
                });
            })
            .catch((err) => {
                logger.warn(
                    '[viewContainer] Failed to load controller',
                    { component: 'ViewContainer' },
                    err
                );
                return Promise.resolve();
            });
    }
    return Promise.resolve();
}

function parseHtml(html: string, hasScript: boolean): HTMLElement | null {
    let processedHtml = html;
    if (hasScript) {
        processedHtml = html
            .replaceAll('\x3c!--<script', '<script')
            .replaceAll('</script>--\x3e', '</script>');
    }
    const wrapper = document.createElement('div');
    wrapper.innerHTML = processedHtml;
    return wrapper.querySelector('div[data-role="page"]');
}

function normalizeNewView(options: ViewOptions, isPluginpage: boolean): NewViewInfo {
    const viewHtml = options.view;
    if (viewHtml.indexOf('data-role="page"') === -1) {
        const elem = document.createElement('div');
        elem.innerHTML = viewHtml;
        return { elem, hasScript: false };
    }

    let hasScript = viewHtml.indexOf('<script') !== -1;
    const elem = parseHtml(viewHtml, hasScript);
    if (hasScript && elem) hasScript = elem.querySelector('script') != null;

    return {
        elem: elem as HTMLElement,
        hasScript
    };
}

function triggerDestroy(view: HTMLElement): void {
    view.dispatchEvent(new CustomEvent('viewdestroy', {}));
}

export function loadView(options: ViewOptions): Promise<HTMLElement | void> | void {
    if (options.cancel) return;

    const selected = selectedPageIndex;
    const previousAnimatable = selected === -1 ? null : allPages[selected];
    let pageIndex = selected + 1;
    if (pageIndex >= pageContainerCount) pageIndex = 0;

    const isPluginpage = options.url.includes('configurationpage');
    const newViewInfo = normalizeNewView(options, isPluginpage);
    let view = newViewInfo.elem;
    const currentPage = allPages[pageIndex];

    if (currentPage) triggerDestroy(currentPage);
    view.classList.add('mainAnimatedPage');

    const mainAnimatedPages = getMainAnimatedPages();
    if (!mainAnimatedPages) {
        logger.warn('[viewContainer] Main animated pages element is not present', {
            component: 'ViewContainer'
        });
        return;
    }

    if (currentPage) {
        if (newViewInfo.hasScript && (window as any).$) {
            mainAnimatedPages.removeChild(currentPage);
            view = (window as any).$(view).appendTo(mainAnimatedPages)[0];
        } else {
            mainAnimatedPages.replaceChild(view, currentPage);
        }
    } else if (newViewInfo.hasScript && (window as any).$) {
        view = (window as any).$(view).appendTo(mainAnimatedPages)[0];
    } else {
        mainAnimatedPages.appendChild(view);
    }

    if (options.type) view.setAttribute('data-type', options.type);
    if (options.fullscreen) view.setAttribute('data-properties', 'fullscreen');

    allPages[pageIndex] = view;

    return setControllerClass(view, options)
        .then(() => new Promise((resolve) => setTimeout(resolve, 0)))
        .then(() => {
            onBeforeChange?.(view, false, options);
            for (let i = 0; i < allPages.length; i++) {
                if (pageIndex !== i && selected !== i) allPages[i]?.classList.add('hide');
            }
            selectedPageIndex = pageIndex;
            currentUrls[pageIndex] = options.url;

            if (!options.cancel && previousAnimatable) {
                for (let i = 0; i < allPages.length; i++) {
                    if (pageIndex !== i) allPages[i]?.classList.add('hide');
                }
            }

            if ((window as any).$) {
                (window as any).$.mobile = (window as any).$.mobile || {};
                (window as any).$.mobile.activePage = view;
            }
            return view;
        });
}

export function tryRestoreView(options: ViewOptions): Promise<HTMLElement> {
    const index = currentUrls.indexOf(options.url);
    if (index === -1) return Promise.reject();

    const animatable = allPages[index];
    if (!animatable) return Promise.reject();
    if (options.cancel) return Promise.reject();

    const selected = selectedPageIndex;
    const previousAnimatable = selected === -1 ? null : allPages[selected];

    return setControllerClass(animatable, options).then(() => {
        onBeforeChange?.(animatable, true, options);
        for (let i = 0; i < allPages.length; i++) {
            if (index !== i && selected !== i) allPages[i]?.classList.add('hide');
        }
        animatable.classList.remove('hide');
        selectedPageIndex = index;

        if (!options.cancel && previousAnimatable) {
            for (let i = 0; i < allPages.length; i++) {
                if (index !== i) allPages[i]?.classList.add('hide');
            }
        }

        if ((window as any).$) {
            (window as any).$.mobile = (window as any).$.mobile || {};
            (window as any).$.mobile.activePage = animatable;
        }
        return animatable;
    });
}

export function reset(): void {
    logger.debug('[viewContainer] Resetting view cache', { component: 'ViewContainer' });
    allPages = [];
    currentUrls = [];
    const mainAnimatedPages = getMainAnimatedPages();
    if (mainAnimatedPages) mainAnimatedPages.innerHTML = '';
    selectedPageIndex = -1;
}

export function setOnBeforeChange(
    fn: (view: HTMLElement, isRestored: boolean, options: ViewOptions) => void
): void {
    onBeforeChange = fn;
}

const viewContainer = { loadView, tryRestoreView, reset, setOnBeforeChange };
export default viewContainer;
if (typeof document !== 'undefined') getMainAnimatedPages()?.classList.remove('hide');
