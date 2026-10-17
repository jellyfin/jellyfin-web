import { importModule } from '@uupaa/dynamic-import-polyfill';
import './viewManager/viewContainer.scss';
import Dashboard from '../utils/dashboard';

const getMainAnimatedPages = () => {
    return document.querySelector('.mainAnimatedPages');
};

function setControllerClass(view, options) {
    if (options.controllerFactory) {
        return Promise.resolve();
    }

    let controllerUrl = view.getAttribute('data-controller');

    if (controllerUrl) {
        if (controllerUrl.indexOf('__plugin/') === 0) {
            controllerUrl = controllerUrl.substring('__plugin/'.length);
        }

        controllerUrl = Dashboard.getPluginUrl(controllerUrl);
        const apiUrl = ApiClient.getUrl('/web/' + controllerUrl);
        return importModule(apiUrl).then((ControllerFactory) => {
            options.controllerFactory = ControllerFactory;
        });
    }

    return Promise.resolve();
}

export function loadView(options) {
    if (!options.cancel) {
        const selected = selectedPageIndex;
        const previousAnimatable = selected === -1 ? null : allPages[selected];
        let pageIndex = selected + 1;

        if (pageIndex >= pageContainerCount) {
            pageIndex = 0;
        }

        // Remove any previous cached page for the same URL to prevent
        // duplicate DOM elements (e.g. duplicate #indexPage ids)
        const mainAnimatedPagesContainer = getMainAnimatedPages();
        for (let i = 0; i < allPages.length; i++) {
            if (i !== pageIndex && currentUrls[i] === options.url && allPages[i]) {
                triggerDestroy(allPages[i]);
                mainAnimatedPagesContainer?.removeChild(allPages[i]);
                allPages[i] = null;
                currentUrls[i] = null;
            }
        }

        const isPluginpage = options.url.includes('configurationpage');
        const newViewInfo = normalizeNewView(options, isPluginpage);
        const newView = newViewInfo.elem;

        const currentPage = allPages[pageIndex];

        if (currentPage) {
            triggerDestroy(currentPage);
        }

        let view = newView;

        if (typeof view == 'string') {
            view = document.createElement('div');
            view.innerHTML = newView;
        }

        view.classList.add('mainAnimatedPage');

        const mainAnimatedPages = getMainAnimatedPages();

        if (!mainAnimatedPages) {
            console.warn('[viewContainer] main animated pages element is not present');
            return;
        }

        if (currentPage) {
            if (newViewInfo.hasScript && window.$) {
                mainAnimatedPages.removeChild(currentPage);
                view = $(view).appendTo(mainAnimatedPages)[0];
            } else {
                mainAnimatedPages.replaceChild(view, currentPage);
            }
        } else if (newViewInfo.hasScript && window.$) {
            view = $(view).appendTo(mainAnimatedPages)[0];
        } else {
            mainAnimatedPages.appendChild(view);
        }

        if (options.type) {
            view.setAttribute('data-type', options.type);
        }

        const properties = [];

        if (options.fullscreen) {
            properties.push('fullscreen');
        }

        if (properties.length) {
            view.setAttribute('data-properties', properties.join(','));
        }

        allPages[pageIndex] = view;

        return setControllerClass(view, options)
        // Timeout for polyfilled CustomElements (webOS 1.2)
            .then(() => new Promise((resolve) => setTimeout(resolve, 0)))
            .then(() => {
                if (onBeforeChange) {
                    onBeforeChange(view, false, options);
                }

                beforeAnimate(allPages, pageIndex, selected);
                selectedPageIndex = pageIndex;
                currentUrls[pageIndex] = options.url;

                if (!options.cancel && previousAnimatable) {
                    afterAnimate(allPages, pageIndex);
                }

                if (window.$) {
                    $.mobile = $.mobile || {};
                    $.mobile.activePage = view;
                }

                return view;
            });
    }
}

function parseHtml(html, hasScript) {
    if (hasScript) {
        html = html
            .replaceAll('\x3c!--<script', '<script')
            .replaceAll('</script>--\x3e', '</script>');
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.querySelector('div[data-role="page"]');
}

function normalizeNewView(options, isPluginpage) {
    const viewHtml = options.view;

    if (viewHtml.indexOf('data-role="page"') === -1) {
        return viewHtml;
    }

    let hasScript = viewHtml.indexOf('<script') !== -1;
    const elem = parseHtml(viewHtml, hasScript);

    if (hasScript) {
        hasScript = elem.querySelector('script') != null;
    }

    let hasjQuery = false;
    let hasjQuerySelect = false;
    let hasjQueryChecked = false;

    if (isPluginpage) {
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

function beforeAnimate(allPages, newPageIndex, oldPageIndex) {
    for (let index = 0, length = allPages.length; index < length; index++) {
        if (newPageIndex !== index && oldPageIndex !== index && allPages[index]) {
            allPages[index].classList.add('hide');
        }
    }
}

function afterAnimate(allPages, newPageIndex) {
    for (let index = 0, length = allPages.length; index < length; index++) {
        if (newPageIndex !== index && allPages[index]) {
            allPages[index].classList.add('hide');
        }
    }
}

export function setOnBeforeChange(fn) {
    onBeforeChange = fn;
}

export function tryRestoreView(options) {
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

                if (window.$) {
                    $.mobile = $.mobile || {};
                    $.mobile.activePage = view;
                }

                return view;
            });
        }
    }

    return Promise.reject();
}

function triggerDestroy(view) {
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

let onBeforeChange;
let allPages = [];
let currentUrls = [];
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
