import { getDefaultTheme, getThemes as getConfiguredThemes } from './settings/webSettings';

let themeStyleElement = document.querySelector('#cssTheme');
let currentThemeId;

function unloadTheme() {
    const elem = themeStyleElement;
    if (elem) {
        elem.removeAttribute('href');
        currentThemeId = null;
    }
}

function getThemes() {
    return getConfiguredThemes();
}

function getThemeStylesheetInfo(id) {
    return getThemes().then(themes => {
        let theme;

        if (id) {
            theme = themes.find(currentTheme => {
                return currentTheme.id === id;
            });
        }

        if (!theme) {
            theme = getDefaultTheme();
        }

        return {
            stylesheetPath: 'themes/' + theme.id + '/theme.css',
            themeId: theme.id,
            color: theme.color
        };
    });
}

function setTheme(id) {
    return new Promise(function (resolve) {
        if (currentThemeId && currentThemeId === id) {
            resolve();
            return;
        }

        getThemeStylesheetInfo(id).then(function (info) {
            if (currentThemeId && currentThemeId === info.themeId) {
                resolve();
                return;
            }

            const linkUrl = info.stylesheetPath;
            unloadTheme();

            let link = themeStyleElement;

            if (!link) {
                // Inject the theme css as a dom element in body so it will take
                // precedence over other stylesheets
                link = document.createElement('link');
                link.id = 'cssTheme';
                link.setAttribute('rel', 'stylesheet');
                link.setAttribute('type', 'text/css');
                document.body.appendChild(link);
            }

            const onLoad = function (e) {
                e.target.removeEventListener('load', onLoad);
                resolve();
            };

            link.addEventListener('load', onLoad);

            link.setAttribute('href', linkUrl);
            themeStyleElement = link;
            currentThemeId = info.themeId;

            document.getElementById('themeColor').content = info.color;
        });
    });
}

export default {
    getThemes: getThemes,
    setTheme: setTheme
};
