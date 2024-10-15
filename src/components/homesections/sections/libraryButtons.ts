import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import escapeHtml from 'escape-html';

import imageLoader from 'components/images/imageLoader';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import imageHelper from 'utils/image';

function getLibraryButtonsHtml(items: BaseItemDto[]) {
    let html = '';

    html += '<div class="verticalSection verticalSection-extrabottompadding">';
    html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';

    html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-multiselect="false">';

    // library card background images
    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];
        const icon = imageHelper.getLibraryIcon(item.CollectionType);
        html += '<a is="emby-linkbutton" href="' + appRouter.getRouteUrl(item) + '" class="raised homeLibraryButton"><span class="material-icons homeLibraryIcon ' + icon + '" aria-hidden="true"></span><span class="homeLibraryText">' + escapeHtml(item.Name) + '</span></a>';
    }

    html += '</div>';
    html += '</div>';

    return html;
}

export function loadLibraryButtons(elem: HTMLElement, userViews: BaseItemDto[]) {
    elem.classList.remove('verticalSection');
    const html = getLibraryButtonsHtml(userViews);

    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
}
