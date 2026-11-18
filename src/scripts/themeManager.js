import Events from 'utils/events';
import { EventType } from 'constants/eventType';

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
    return new Promise(function (resolve) {
        if (currentThemeId && currentThemeId === id) {
            resolve();
            return;
        }

        getThemeStylesheetInfo(id).then(function (info) {
            if (currentThemeId && currentThemeId === info.id) {
                resolve();
                return;
            }

            currentThemeId = info.id;

            // set the theme attribute for mui
            document.documentElement.setAttribute('data-theme', info.id);

            // set the meta theme color
            document.getElementById('themeColor').content = info.color;

            Events.trigger(document, EventType.THEME_CHANGE, [ info.id ]);
        });
    });
}

export default {
    getThemes,
    setTheme
};
