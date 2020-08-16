import * as webSettings from './settings/webSettings';

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

function getThemes() {
    return webSettings.getThemes();
}

function getThemeStylesheetInfo(id) {
    return getThemes().then(themes => {
        var theme = themes.find(theme => {
            return id ? theme.id === id : theme.default;
        });

        if (!theme) {
            theme = {
                'name': 'Dark',
                'id': 'dark',
                'default': true
            };
        }

        return {
            stylesheetPath: 'themes/' + theme.id + '/theme.css',
            themeId: theme.id
        };
    });
}

function setTheme(id) {
    return new Promise(function (resolve, reject) {
        if (currentThemeId && currentThemeId === id) {
            resolve();
            return;
        }

        getThemeStylesheetInfo(id).then(function (info) {
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
                resolve();
            };

            link.setAttribute('href', linkUrl);
            document.head.appendChild(link);
            themeStyleElement = link;
            currentThemeId = info.themeId;
        });
    });
}

export default {
    getThemes: getThemes,
    setTheme: setTheme
};
