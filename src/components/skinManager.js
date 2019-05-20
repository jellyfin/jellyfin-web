define(['apphost', 'userSettings', 'browser', 'events', 'pluginManager', 'backdrop', 'globalize', 'require', 'appSettings'], function (appHost, userSettings, browser, events, pluginManager, backdrop, globalize, require, appSettings) {
    'use strict';

    var themeStyleElement;
    var currentThemeId;

    function unloadTheme() {
        var elem = themeStyleElement;
        if (elem) {
            elem.parentNode.removeChild(elem);
            themeStyleElement = null;
            currentThemeId = null;
        }
    }

    function loadUserSkin(options) {
        options = options || {};
        if (options.start) {
            Emby.Page.invokeShortcut(options.start);
        } else {
            Emby.Page.goHome();
        }
    };

    function getThemes() {
        return [{
            name: "Apple TV",
            id: "appletv"
        }, {
            name: "Blue Radiance",
            id: "blueradiance"
        }, {
            name: "Dark",
            id: "dark",
            isDefault: true,
            isDefaultServerDashboard: true
        }, {
            name: "Emby",
            id: "emby",
        }, {
            name: "Light",
            id: "light"
        }, {
            name: "Purple Haze",
            id: "purple-haze"
        }, {
            name: "Windows Media Center",
            id: "wmc"
        }];
    };

    var skinManager = {
        getThemes: getThemes,
        loadUserSkin: loadUserSkin
    };

    function getThemeStylesheetInfo(id, isDefaultProperty) {
        var themes = skinManager.getThemes();
        var defaultTheme;
        var selectedTheme;

        for (var i = 0, length = themes.length; i < length; i++) {

            var theme = themes[i];
            if (theme[isDefaultProperty]) {
                defaultTheme = theme;
            }
            if (id === theme.id) {
                selectedTheme = theme;
            }
        }

        selectedTheme = selectedTheme || defaultTheme;
        return {
            stylesheetPath: require.toUrl('components/themes/' + selectedTheme.id + '/theme.css'),
            themeId: selectedTheme.id
        };
    }

    var themeResources = {};
    var lastSound = 0;
    var currentSound;

    function loadThemeResources(id) {
        lastSound = 0;
        if (currentSound) {
            currentSound.stop();
            currentSound = null;
        }

        backdrop.clear();
    }

    function onThemeLoaded() {
        document.documentElement.classList.remove('preload');
        try {
            var color = getComputedStyle(document.querySelector('.skinHeader')).getPropertyValue("background-color");
            if (color) {
                appHost.setThemeColor(color);
            }
        } catch (err) {
            console.log('Error setting theme color: ' + err);
        }
    }

    skinManager.setTheme = function (id, context) {
        return new Promise(function (resolve, reject) {
            if (currentThemeId && currentThemeId === id) {
                resolve();
                return;
            }

            var isDefaultProperty = context === 'serverdashboard' ? 'isDefaultServerDashboard' : 'isDefault';
            var info = getThemeStylesheetInfo(id, isDefaultProperty);
            if (currentThemeId && currentThemeId === info.themeId) {
                resolve();
                return;
            }

            var linkUrl = info.stylesheetPath;
            unloadTheme();
            var link = document.createElement('link');

            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.onload = function () {
                onThemeLoaded();
                resolve();
            };

            link.setAttribute('href', linkUrl);
            document.head.appendChild(link);
            themeStyleElement = link;
            currentThemeId = info.themeId;
            loadThemeResources(info.themeId);

            onViewBeforeShow({});
        });
    };

    function onViewBeforeShow(e) {
        if (e.detail && e.detail.type === 'video-osd') {
            return;
        }

        if (themeResources.backdrop) {
            backdrop.setBackdrop(themeResources.backdrop);
        }

        if (!browser.mobile && userSettings.enableThemeSongs()) {
            if (lastSound === 0) {
                if (themeResources.themeSong) {
                    playSound(themeResources.themeSong);
                }
            } else if ((new Date().getTime() - lastSound) > 30000) {
                if (themeResources.effect) {
                    playSound(themeResources.effect);
                }
            }
        }
    }

    document.addEventListener('viewshow', onViewBeforeShow);

    function playSound(path, volume) {
        lastSound = new Date().getTime();
        require(['howler'], function (howler) {
            try {
                var sound = new Howl({
                    src: [path],
                    volume: volume || 0.1
                });
                sound.play();
                currentSound = sound;
            } catch (err) {
                console.log('Error playing sound: ' + err);
            }
        });
    }

    return skinManager;
});
