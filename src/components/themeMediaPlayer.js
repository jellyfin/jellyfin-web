import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';

import { getItemQuery } from 'hooks/useItem';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import { ItemKind } from 'types/base/models/item-kind';
import Events from 'utils/events.ts';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';

import { playbackManager } from './playback/playbackmanager';

let currentOwnerId;
let currentThemeIds = [];

function playThemeMedia(items, ownerId) {
    const currentThemeItems = items.filter(function (i) {
        return enabled(i.MediaType);
    });

    if (currentThemeItems.length) {
        // Stop if a theme song from another ownerId
        // Leave it alone if anything else (e.g user playing a movie)
        if (!currentOwnerId && playbackManager.isPlaying()) {
            return;
        }

        currentThemeIds = currentThemeItems.map(function (i) {
            return i.Id;
        });

        currentThemeItems.forEach((i) => {
            i.playOptions = {
                fullscreen: false,
                enableRemotePlayers: false
            };
        });

        playbackManager.play({
            items: currentThemeItems,
            aspectRatio: 'cover',
            fullscreen: false,
            enableRemotePlayers: false
        }).then(function () {
            currentOwnerId = ownerId;
        });
    } else {
        stopIfPlaying();
    }
}

function stopIfPlaying() {
    if (currentOwnerId) {
        playbackManager.stop();
    }

    currentOwnerId = null;
}

function enabled(mediaType) {
    if (mediaType === MediaType.Video) {
        return userSettings.enableThemeVideos();
    }

    return userSettings.enableThemeSongs();
}

const excludeTypes = [
    ItemKind.CollectionFolder,
    ItemKind.UserView,
    ItemKind.Person,
    ItemKind.Program,
    ItemKind.TvChannel,
    ItemKind.Channel,
    ItemKind.SeriesTimer
];

async function loadThemeMedia(serverId, itemId) {
    const apiClient = ServerConnections.getApiClient(serverId);
    const api = toApi(apiClient);
    const userId = apiClient.getCurrentUserId();

    try {
        const item = await queryClient.fetchQuery(getItemQuery(
            api,
            itemId,
            userId
        ));

        if (item.CollectionType) {
            stopIfPlaying();
            return;
        }

        if (excludeTypes.includes(item.Type)) {
            stopIfPlaying();
            return;
        }

        const { data: themeMedia } = await getLibraryApi(api).getThemeMedia({
            userId,
            itemId: item.Id,
            inheritFromParent: true,
            sortBy: [ItemSortBy.Random]
        });

        const result = userSettings.enableThemeVideos() && themeMedia.ThemeVideosResult?.Items?.length ? themeMedia.ThemeVideosResult : themeMedia.ThemeSongsResult;

        if (result.OwnerId !== currentOwnerId) {
            playThemeMedia(result.Items, result.OwnerId);
        }
    } catch (err) {
        console.error('[ThemeMediaPlayer] failed to load theme media', err);
    }
}

document.addEventListener('viewshow', e => {
    const { serverId, id } = e.detail?.params || {};
    if (serverId && id) {
        void loadThemeMedia(serverId, id);
        return;
    }

    const viewOptions = e.detail.options || {};

    if (viewOptions.supportsThemeMedia) {
        // Do nothing here, allow it to keep playing
    } else {
        playThemeMedia([], null);
    }
}, true);

Events.on(playbackManager, 'playbackstart', (_e, player) => {
    const item = playbackManager.currentItem(player);
    // User played something manually
    if (currentThemeIds.indexOf(item.Id) === -1) {
        currentOwnerId = null;
    }
});
