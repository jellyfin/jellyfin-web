define(["browser", "dom", "layoutManager", "css!components/viewManager/viewContainer"], function (browser, dom, layoutManager) {
    "use strict";

    function setControllerClass(view, options) {
        if (options.controllerFactory) {
            return Promise.resolve();
        }

        var controllerUrl = view.getAttribute("data-controller");

        if (controllerUrl) {
            if (0 === controllerUrl.indexOf("__plugin/")) {
                controllerUrl = controllerUrl.substring("__plugin/".length);
            }

            controllerUrl = Dashboard.getConfigurationResourceUrl(controllerUrl);
            return getRequirePromise([controllerUrl]).then(function (ControllerFactory) {
                options.controllerFactory = ControllerFactory;
            });
        }

        return Promise.resolve();
    }

    function getRequirePromise(deps) {
        return new Promise(function (resolve, reject) {
            require(deps, resolve);
        });
    }

    function loadView(options) {
        if (!options.cancel) {
            var selected = selectedPageIndex;
            var previousAnimatable = -1 === selected ? null : allPages[selected];
            var pageIndex = selected + 1;

            if (pageIndex >= pageContainerCount) {
                pageIndex = 0;
            }

            var isPluginpage = -1 !== options.url.toLowerCase().indexOf("/configurationpage");
            var newViewInfo = normalizeNewView(options, isPluginpage);
            var newView = newViewInfo.elem;
            var modulesToLoad = [];

            if (isPluginpage) {
                modulesToLoad.push("legacyDashboard");
            }

            if (newViewInfo.hasjQuerySelect) {
                modulesToLoad.push("legacySelectMenu");
            }

            if (newViewInfo.hasjQueryChecked) {
                modulesToLoad.push("fnchecked");
            }

            return new Promise(function (resolve) {
                require(modulesToLoad, function () {
                    var currentPage = allPages[pageIndex];

                    if (currentPage) {
                        triggerDestroy(currentPage);
                    }

                    var view = newView;

                    if ("string" == typeof view) {
                        view = document.createElement("div");
                        view.innerHTML = newView;
                    }

                    view.classList.add("mainAnimatedPage");

                    if (currentPage) {
                        if (newViewInfo.hasScript && window.$) {
                            view = $(view).appendTo(mainAnimatedPages)[0];
                            mainAnimatedPages.removeChild(currentPage);
                        } else {
                            mainAnimatedPages.replaceChild(view, currentPage);
                        }
                    } else {
                        if (newViewInfo.hasScript && window.$) {
                            view = $(view).appendTo(mainAnimatedPages)[0];
                        } else {
                            mainAnimatedPages.appendChild(view);
                        }
                    }

                    if (options.type) {
                        view.setAttribute("data-type", options.type);
                    }

                    var properties = [];

                    if (options.fullscreen) {
                        properties.push("fullscreen");
                    }

                    if (properties.length) {
                        view.setAttribute("data-properties", properties.join(","));
                    }

                    allPages[pageIndex] = view;
                    setControllerClass(view, options).then(function () {
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

                        resolve(view);
                    });
                });
            });
        }
    }

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    function parseHtml(html, hasScript) {
        if (hasScript) {
            html = replaceAll(html, "\x3c!--<script", "<script");
            html = replaceAll(html, "<\/script>--\x3e", "<\/script>");
        }

        var wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        return wrapper.querySelector('div[data-role="page"]');
    }

    function normalizeNewView(options, isPluginpage) {
        var viewHtml = options.view;

        if (-1 === viewHtml.indexOf('data-role="page"')) {
            return viewHtml;
        }

        var hasScript = -1 !== viewHtml.indexOf("<script");
        var elem = parseHtml(viewHtml, hasScript);

        if (hasScript) {
            hasScript = null != elem.querySelector("script");
        }

        var hasjQuery = false;
        var hasjQuerySelect = false;
        var hasjQueryChecked = false;

        if (isPluginpage) {
            hasjQuery = -1 != viewHtml.indexOf("jQuery") || -1 != viewHtml.indexOf("$(") || -1 != viewHtml.indexOf("$.");
            hasjQueryChecked = -1 != viewHtml.indexOf(".checked(");
            hasjQuerySelect = -1 != viewHtml.indexOf(".selectmenu(");
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
        for (var index = 0, length = allPages.length; index < length; index++) {
            if (newPageIndex !== index && oldPageIndex !== index) {
                allPages[index].classList.add("hide");
            }
        }
    }

    function afterAnimate(allPages, newPageIndex) {
        for (var index = 0, length = allPages.length; index < length; index++) {
            if (newPageIndex !== index) {
                allPages[index].classList.add("hide");
            }
        }
    }

    function setOnBeforeChange(fn) {
        onBeforeChange = fn;
    }

    function tryRestoreView(options) {
        var url = options.url;
        var index = currentUrls.indexOf(url);

        if (-1 !== index) {
            var animatable = allPages[index];
            var view = animatable;

            if (view) {
                if (options.cancel) {
                    return;
                }

                var selected = selectedPageIndex;
                var previousAnimatable = -1 === selected ? null : allPages[selected];
                return setControllerClass(view, options).then(function () {
                    if (onBeforeChange) {
                        onBeforeChange(view, true, options);
                    }

                    beforeAnimate(allPages, index, selected);
                    animatable.classList.remove("hide");
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
        view.dispatchEvent(new CustomEvent("viewdestroy", {}));
    }

    function reset() {
        allPages = [];
        currentUrls = [];
        mainAnimatedPages.innerHTML = "";
        selectedPageIndex = -1;
    }

    var onBeforeChange;
    var mainAnimatedPages = document.querySelector(".mainAnimatedPages");
    var allPages = [];
    var currentUrls = [];
    var pageContainerCount = 3;
    var selectedPageIndex = -1;
    reset();
    mainAnimatedPages.classList.remove("hide");
    return {
        loadView: loadView,
        tryRestoreView: tryRestoreView,
        reset: reset,
        setOnBeforeChange: setOnBeforeChange
    };
});
