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
 * Finds a suitable image from Live TV channels for the library card
 */
async function findLiveTvImage(apiClient: ReturnType<typeof ServerConnections.currentApiClient>, viewId: string | undefined) {
    if (!viewId || !apiClient) return null;

    const response = await apiClient.getLiveTvChannels({
        UserId: apiClient.getCurrentUserId(),
        EnableImageTypes: 'Primary',
        Fields: 'PrimaryImageAspectRatio',
        Limit: 20,
        StartIndex: Math.floor(Math.random() * 50) // eslint-disable-line sonarjs/pseudo-random -- Used only for UI variety, not security
    });

    if (!response.Items?.length) return null;

    // Try to find a program with backdrop first
    const channelWithBackdrop = response.Items.find((channel: BaseItemDto) =>
        channel.CurrentProgram?.ImageTags?.Primary
        || channel.CurrentProgram?.BackdropImageTags?.length
    );

    if (channelWithBackdrop?.CurrentProgram) {
        const program = channelWithBackdrop.CurrentProgram;

        if (program.ImageTags?.Primary) {
            return {
                ImageTags: { Primary: program.ImageTags.Primary },
                PrimaryImageAspectRatio: program.PrimaryImageAspectRatio,
                _sourceItemId: program.Id
            };
        }

        if (program.BackdropImageTags?.length) {
            return {
                BackdropImageTags: program.BackdropImageTags,
                PrimaryImageAspectRatio: program.PrimaryImageAspectRatio,
                _sourceItemId: program.Id
            };
        }
    }

    // Fallback to channel logo
    const channelWithImage = response.Items.find((channel: BaseItemDto) =>
        channel.ImageTags?.Primary
    );

    if (channelWithImage?.ImageTags?.Primary) {
        return {
            ImageTags: { Primary: channelWithImage.ImageTags.Primary },
            PrimaryImageAspectRatio: channelWithImage.PrimaryImageAspectRatio,
            _sourceItemId: channelWithImage.Id
        };
    }

    return null;
}

/**
 * Enriches Live TV library items with channel image data
 */
async function enrichLiveTvWithChannelImages(userViews: BaseItemDto[]): Promise<BaseItemDto[]> {
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient) return userViews;

    const enrichedViews = await Promise.all(
        userViews.map(async (view) => {
            const isLiveTvWithoutImages = view.CollectionType === 'livetv'
                && (!view.ImageTags || Object.keys(view.ImageTags).length === 0);

            if (!isLiveTvWithoutImages) return view;

            try {
                const imageData = await findLiveTvImage(apiClient, view.Id);
                if (imageData) {
                    return { ...view, ...imageData };
                }
            } catch (error) {
                console.error('Error fetching Live TV channel images:', error);
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
