
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

class LayoutManager {
    tv = false;
    mobile = false;
    desktop = false;
    experimental = false;

    setLayout(layout, save) {
        if (!layout || layout === 'auto') {
            this.autoLayout();

            if (save !== false) {
                appSettings.set('layout', '');
            }
        } else {
            setLayout(this, 'mobile', layout);
            setLayout(this, 'tv', layout);
            setLayout(this, 'desktop', layout);

            this.experimental = layout === 'experimental';
            if (this.experimental) {
                const legacyLayoutMode = browser.mobile ? 'mobile' : this.defaultLayout || 'desktop';
                setLayout(this, legacyLayoutMode, legacyLayoutMode);
            }

            if (save !== false) {
                appSettings.set('layout', layout);
            }
        }

        Events.trigger(this, 'modechange');
    }

    getSavedLayout() {
        return appSettings.get('layout');
    }

    autoLayout() {
        // Take a guess at initial layout. The consuming app can override
        if (browser.mobile) {
            this.setLayout('mobile', false);
        } else if (browser.tv || browser.xboxOne || browser.ps4) {
            this.setLayout('tv', false);
        } else {
            this.setLayout(this.defaultLayout || 'tv', false);
        }
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

if (appHost.getDefaultLayout) {
    layoutManager.defaultLayout = appHost.getDefaultLayout();
}

layoutManager.init();

export default layoutManager;
