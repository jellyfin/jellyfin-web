import { playbackManager } from './playback/playbackmanager';
import * as userSettings from '../scripts/settings/userSettings';
import Events from '../utils/events.ts';
import ServerConnections from './ServerConnections';

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
    if (mediaType === 'Video') {
        return userSettings.enableThemeVideos();
    }

    return userSettings.enableThemeSongs();
}

const excludeTypes = ['CollectionFolder', 'UserView', 'Program', 'SeriesTimer', 'Person', 'TvChannel', 'Channel'];

function loadThemeMedia(item) {
    if (item.CollectionType) {
        stopIfPlaying();
        return;
    }

    if (excludeTypes.indexOf(item.Type) !== -1) {
        stopIfPlaying();
        return;
    }

    const apiClient = ServerConnections.getApiClient(item.ServerId);
    apiClient.getThemeMedia(apiClient.getCurrentUserId(), item.Id, true).then(function (themeMediaResult) {
        const result = userSettings.enableThemeVideos() && themeMediaResult.ThemeVideosResult.Items.length ? themeMediaResult.ThemeVideosResult : themeMediaResult.ThemeSongsResult;

        const ownerId = result.OwnerId;

        if (ownerId !== currentOwnerId) {
            playThemeMedia(result.Items, ownerId);
        }
    });
}

document.addEventListener('viewshow', function (e) {
    const state = e.detail.state || {};
    const item = state.item;

    if (item?.ServerId) {
        loadThemeMedia(item);
        return;
    }

    const viewOptions = e.detail.options || {};

    if (viewOptions.supportsThemeMedia) {
        // Do nothing here, allow it to keep playing
    } else {
        playThemeMedia([], null);
    }
}, true);

Events.on(playbackManager, 'playbackstart', function (e, player) {
    const item = playbackManager.currentItem(player);
    // User played something manually
    if (currentThemeIds.indexOf(item.Id) == -1) {
        currentOwnerId = null;
    }
});
