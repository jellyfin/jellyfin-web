import { getDefaultTheme, getThemes as getConfiguredThemes } from './settings/webSettings';

let currentThemeId;

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

        return theme;
    });
}

function setTheme(id) {
    return new Promise((resolve) => {
        if (currentThemeId && currentThemeId === id) {
            resolve();
            return;
        }

        getThemeStylesheetInfo(id).then((info) => {
            if (currentThemeId && currentThemeId === info.id) {
                resolve();
                return;
            }

            currentThemeId = info.id;

            // set the theme attribute for mui
            document.documentElement.setAttribute('data-theme', info.id);

            // set the meta theme color
            document.getElementById('themeColor').content = info.color;
        });
    });
}

export default {
    getThemes,
    setTheme
};
