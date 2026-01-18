import { setBackdrops, clearBackdrop } from 'components/backdrop/backdrop';
import dom from 'utils/dom';
import layoutManager from 'components/layoutManager';
import * as userSettings from 'scripts/settings/userSettings';

export function renderBackdrop(page, item) {
    if (!layoutManager.mobile && dom.getWindowSize().innerWidth >= 1000) {
        const isBannerEnabled = !layoutManager.tv && userSettings.detailsBanner();
        // If backdrops are disabled, but the header banner is enabled, add a class to the page to disable the transparency
        page.classList.toggle('noBackdropTransparency', isBannerEnabled && !userSettings.enableBackdrops());

        setBackdrops([item], null, isBannerEnabled);
    } else {
        clearBackdrop();
    }
}
