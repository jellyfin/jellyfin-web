import imageLoader from 'components/images/imageLoader';
import { getItemBackdropImageUrl } from 'utils/jellyfin-apiclient/backdropImage';
import * as userSettings from 'scripts/settings/userSettings';

export function renderHeaderBackdrop(page, item, apiClient) {
    // Details banner is disabled in user settings
    if (!userSettings.detailsBanner()) {
        return false;
    }

    // Disable item backdrop for books and people because they only have primary images
    if (item.Type === 'Person' || item.Type === 'Book') {
        return false;
    }

    let hasbackdrop = false;
    const itemBackdropElement = page.querySelector('#itemBackdrop');

    const imgUrl = getItemBackdropImageUrl(apiClient, item, { maxWidth: window.innerWidth }, false);

    if (imgUrl) {
        imageLoader.lazyImage(itemBackdropElement, imgUrl);
        hasbackdrop = true;
    } else {
        itemBackdropElement.style.backgroundImage = '';
    }

    return hasbackdrop;
}
