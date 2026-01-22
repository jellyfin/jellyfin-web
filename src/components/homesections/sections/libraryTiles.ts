// ============================================================================
// LIVE TV CARD IMAGE MODIFICATION - CLIENT SIDE
// ============================================================================
// This modifies jellyfin-web to fetch channel logos for the Live TV card
// ============================================================================

// ============================================================================

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import globalize from 'lib/globalize';
import { getBackdropShape } from 'utils/card';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import type { SectionOptions } from './section';

/**
 * Enriches Live TV library items with channel image data
 */
async function enrichLiveTvWithChannelImages(userViews: BaseItemDto[]): Promise<BaseItemDto[]> {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient) return userViews;

    const enrichedViews = await Promise.all(
        userViews.map(async (view) => {
            // Check if this is a Live TV library without images
            if (view.CollectionType === 'livetv'
                && (!view.ImageTags || Object.keys(view.ImageTags).length === 0)) {
                try {
                    // Fetch random channels with images
                    // Use LiveTv/Channels endpoint instead of Items
                    const response = await apiClient.getLiveTvChannels({
                        UserId: apiClient.getCurrentUserId(),
                        EnableImageTypes: 'Primary',
                        Fields: 'PrimaryImageAspectRatio',
                        Limit: 20,
                        StartIndex: Math.floor(Math.random() * 50) // Random starting point for variety
                    });

                    if (response.Items && response.Items.length > 0) {
                        // Find first channel with a Primary image
                        const channelWithImage = response.Items.find(channel =>
                            channel.ImageTags && channel.ImageTags.Primary
                        );

                        if (channelWithImage && channelWithImage.ImageTags?.Primary) {
                            // Create a modified view with the channel's image
                            return {
                                ...view,
                                ImageTags: {
                                    Primary: channelWithImage.ImageTags.Primary
                                },
                                PrimaryImageAspectRatio: channelWithImage.PrimaryImageAspectRatio,
                                // Store the channel ID so we fetch the right image
                                _sourceItemId: channelWithImage.Id
                            };
                        }
                    }
                } catch (error) {
                    console.error('Error fetching Live TV channel images:', error);
                }
            }

            return view;
        })
    );

    return enrichedViews;
}

export async function loadLibraryTiles(
    elem: HTMLElement,
    userViews: BaseItemDto[],
    {
        enableOverflow
    }: SectionOptions
) {
    // Enrich Live TV libraries with channel images
    const enrichedViews = await enrichLiveTvWithChannelImages(userViews);

    let html = '';
    if (enrichedViews.length) {
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate('HeaderMyMedia') + '</h2>';
        if (enableOverflow) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right focuscontainer-x vertical-wrap">';
        }

        html += cardBuilder.getCardsHtml({
            items: enrichedViews,
            shape: getBackdropShape(enableOverflow),
            showTitle: true,
            centerText: true,
            overlayText: false,
            lazy: true,
            transition: false,
            allowBottomPadding: !enableOverflow
        });

        if (enableOverflow) {
            html += '</div>';
        }
        html += '</div>';
    }

    elem.innerHTML = html;
    imageLoader.lazyChildren(elem);
}
