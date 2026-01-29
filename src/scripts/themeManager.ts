import { EventType } from '../constants/eventType';
import Events from '../utils/events';
import { getThemes as getConfiguredThemes, getDefaultTheme } from './settings/webSettings';

let currentThemeId: string | undefined;

export interface ThemeInfo {
    id: string;
    name: string;
    color?: string;
    [key: string]: any;
}

export function getThemes(): Promise<ThemeInfo[]> {
    return getConfiguredThemes();
}

function getThemeStylesheetInfo(id?: string): Promise<ThemeInfo> {
    return getThemes().then((themes) => {
        let theme: ThemeInfo | undefined;
        if (id) theme = themes.find((t) => t.id === id);
        if (!theme) theme = getDefaultTheme();
        return theme!;
    });
}

export function setTheme(id: string): Promise<void> {
    return new Promise((resolve) => {
        if (currentThemeId === id) {
            resolve();
            return;
        }

        getThemeStylesheetInfo(id).then((info) => {
            if (currentThemeId === info.id) {
                resolve();
                return;
            }

            currentThemeId = info.id;
            document.documentElement.setAttribute('data-theme', info.id);
            const metaThemeColor = document.getElementById('themeColor') as HTMLMetaElement;
            if (metaThemeColor) metaThemeColor.content = info.color ?? '';

            Events.trigger(document, EventType.THEME_CHANGE, [info.id]);
            resolve();
        });
    });
}

const themeManager = { getThemes, setTheme };
export default themeManager;
