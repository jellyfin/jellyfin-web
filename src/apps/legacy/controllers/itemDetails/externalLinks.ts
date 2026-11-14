import type { ExternalUrl } from '@jellyfin/sdk/lib/generated-client/models/external-url';
import escapeHtml from 'escape-html';

import type { ItemDto } from 'types/base/models/item-dto';
import { getSafeExternalUrl } from 'utils/url';

/**
 * The item fields used to build the external links.
 */
export type ExternalLinksItem = Pick<ItemDto, 'Id'> & {
    ExternalUrls?: Array<ExternalUrl | null | undefined> | null;
};

/**
 * Builds the HTML for the external links of an item. Only http(s) URLs are rendered, and URLs are HTML escaped.
 * @param item The item to build the links for.
 * @returns One anchor HTML string per rendered link, in display order.
 */
export const getExternalLinksHtml = (item: ExternalLinksItem): string[] => {
    const links: string[] = [];

    if (item.ExternalUrls) {
        for (const url of item.ExternalUrls) {
            const externalUrl = getSafeExternalUrl(url?.Url);
            if (externalUrl) {
                links.push(`<a is="emby-linkbutton" class="button-link" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url?.Name)}</a>`);
            } else {
                console.warn('[renderLinks] Skipping invalid or unsafe external URL for item', item.Id, url?.Name);
            }
        }
    }

    return links;
};
