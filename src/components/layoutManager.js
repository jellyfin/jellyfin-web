import { LayoutMode } from 'constants/layoutMode';

import { appHost } from './apphost';
import browser from '../scripts/browser';
import appSettings from '../scripts/settings/appSettings';
import Events from '../utils/events.ts';

function setLayout(instance, layout, selectedLayout) {
    if (layout === selectedLayout) {
        instance[layout] = true;
        document.documentElement.classList.add('layout-' + layout);
    } else {
        instance[layout] = false;
        document.documentElement.classList.remove('layout-' + layout);
    }
}

export const SETTING_KEY = 'layout';

class LayoutManager {
    tv = false;
    mobile = false;
    desktop = false;
    experimental = false;

    setLayout(layout = '', save = true) {
        const layoutValue = (!layout || layout === LayoutMode.Auto) ? '' : layout;

        if (!layoutValue) {
            this.autoLayout();
        } else {
            setLayout(this, LayoutMode.Mobile, layoutValue);
            setLayout(this, LayoutMode.Tv, layoutValue);
            setLayout(this, LayoutMode.Desktop, layoutValue);
        }

        console.debug('[LayoutManager] using layout mode', layoutValue);
        this.experimental = layoutValue === LayoutMode.Experimental;
        if (this.experimental) {
            const legacyLayoutMode = browser.mobile ? LayoutMode.Mobile : LayoutMode.Desktop;
            console.debug('[LayoutManager] using legacy layout mode', legacyLayoutMode);
            setLayout(this, legacyLayoutMode, legacyLayoutMode);
        }

        if (save) appSettings.set(SETTING_KEY, layoutValue);

        Events.trigger(this, 'modechange');
    }

    getSavedLayout() {
        return appSettings.get(SETTING_KEY);
    }

    autoLayout() {
        // Take a guess at initial layout. The consuming app can override.
        // NOTE: The fallback to TV mode seems like an outdated choice. TVs should be detected properly or override the
        // default layout.
        this.setLayout(browser.tv ? LayoutMode.Tv : this.defaultLayout || LayoutMode.Tv, false);
    }

    init() {
        const saved = this.getSavedLayout();
        if (saved) {
            this.setLayout(saved, false);
        } else {
            this.autoLayout();
        }
    }
}

const layoutManager = new LayoutManager();

if (appHost && typeof appHost.getDefaultLayout === 'function') {
    layoutManager.defaultLayout = appHost.getDefaultLayout();
} else {
    layoutManager.defaultLayout = LayoutMode.Experimental;
}

layoutManager.init();

export default layoutManager;
