
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

        // Add a class to handle high-DPI displays with scaling
        this.handleHighDpiDisplays();

        Events.trigger(this, 'modechange');
    }

    getSavedLayout() {
        return appSettings.get('layout');
    }

    handleHighDpiDisplays() {
        // Check if we're on a high-DPI display with scaling
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Consider a display high-DPI if:
        // 1. It has a high physical resolution (width >= 1800 or height >= 1200), OR
        // 2. It has a device pixel ratio > 1 (indicating a high-DPI display), OR
        // 3. The window width is >= 1130px (the breakpoint for our header layout)
        const isHighDpiWithScaling = (window.screen.width >= 1800 || window.screen.height >= 1200)
                                    || (devicePixelRatio > 1)
                                    || (window.innerWidth >= 1130);

        // Only apply high-dpi-display class if we're not on a mobile device
        if (isHighDpiWithScaling && !browser.mobile) {
            document.documentElement.classList.add('high-dpi-display');
        } else {
            document.documentElement.classList.remove('high-dpi-display');
        }
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
