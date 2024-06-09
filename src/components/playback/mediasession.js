import { playbackManager } from '../playback/playbackmanager';
import nowPlayingHelper from '../playback/nowplayinghelper';
import Events from '../../utils/events.ts';
import ServerConnections from '../ServerConnections';
import shell from '../../scripts/shell';

// Reports media playback to the device for lock screen control

let currentPlayer;

function seriesImageUrl(item, options = {}) {
    options.type = options.type || 'Primary';

    if (item.Type !== 'Episode') {
        return null;
    } else if (options.type === 'Primary' && item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;

        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
    } else if (options.type === 'Thumb') {
        if (item.SeriesThumbImageTag) {
            options.tag = item.SeriesThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
        } else if (item.ParentThumbImageTag) {
            options.tag = item.ParentThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options);
        }
    }

    return null;
}

function imageUrl(item, options = {}) {
    options.type = options.type || 'Primary';

    if (item.ImageTags?.[options.type]) {
        options.tag = item.ImageTags[options.type];

        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.Id, options);
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;

        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
    }

    return null;
}

function getImageUrl(item, imageOptions = {}) {
    const url = seriesImageUrl(item, imageOptions) || imageUrl(item, imageOptions);

    if (url) {
        const height = imageOptions.height || imageOptions.maxHeight;

        return {
            src: url,
            sizes: height + 'x' + height
        };
    } else {
        return null;
    }
}

function getImageUrls(item, imageSizes = [96, 128, 192, 256, 384, 512]) {
    const list = [];

    imageSizes.forEach((size) => {
        const url = getImageUrl(item, { height: size });
        if (url !== null) {
            list.push(url);
        }
    });

    return list;
}

function updatePlayerState(player, state, eventName) {
    // Don't go crazy reporting position changes
    if (eventName === 'timeupdate') {
        // Only report if this item hasn't been reported yet, or if there's an actual playback change.
        // Don't report on simple time updates
        return;
    }

    const item = state.NowPlayingItem;

    if (!item) {
        hideMediaControls();
        return;
    }

    if (eventName === 'init') { // transform "init" event into "timeupdate" to restraint update rate
        eventName = 'timeupdate';
    }

    const isVideo = item.MediaType === 'Video';
    const isLocalPlayer = player.isLocalPlayer || false;

    // Local players do their own notifications
    if (isLocalPlayer && isVideo) {
        return;
    }

    const playState = state.PlayState || {};
    const parts = nowPlayingHelper.getNowPlayingNames(item);
    const artist = parts[parts.length - 1].text;
    const title = parts.length === 1 ? '' : parts[0].text;

    const album = item.Album || '';
    const itemId = item.Id;

    // Convert to ms
    const duration = parseInt(item.RunTimeTicks ? (item.RunTimeTicks / 10000) : 0, 10);
    const currentTime = parseInt(playState.PositionTicks ? (playState.PositionTicks / 10000) : 0, 10);

    const isPaused = playState.IsPaused || false;
    const canSeek = playState.CanSeek || false;

    if ('mediaSession' in navigator) {
        /* eslint-disable-next-line compat/compat */
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: getImageUrls(item)
        });
    } else {
        const itemImageUrl = seriesImageUrl(item, { maxHeight: 3000 }) || imageUrl(item, { maxHeight: 3000 });
        shell.updateMediaSession({
            action: eventName,
            isLocalPlayer: isLocalPlayer,
            itemId: itemId,
            title: title,
            artist: artist,
            album: album,
            duration: duration,
            position: currentTime,
            imageUrl: itemImageUrl,
            canSeek: canSeek,
            isPaused: isPaused
        });
    }
}

function onGeneralEvent(e) {
    const state = playbackManager.getPlayerState(this);

    updatePlayerState(this, state, e.type);
}

function onStateChanged(e, state) {
    updatePlayerState(this, state, 'statechange');
}

function onPlaybackStart(e, state) {
    updatePlayerState(this, state, e.type);
}

function onPlaybackStopped() {
    hideMediaControls();
}

function releaseCurrentPlayer() {
    if (currentPlayer) {
        Events.off(currentPlayer, 'playbackstart', onPlaybackStart);
        Events.off(currentPlayer, 'playbackstop', onPlaybackStopped);
        Events.off(currentPlayer, 'unpause', onGeneralEvent);
        Events.off(currentPlayer, 'pause', onGeneralEvent);
        Events.off(currentPlayer, 'statechange', onStateChanged);
        Events.off(currentPlayer, 'timeupdate', onGeneralEvent);

        currentPlayer = null;

        hideMediaControls();
    }
}

function hideMediaControls() {
    if ('mediaSession' in navigator) {
        /* eslint-disable-next-line compat/compat */
        navigator.mediaSession.metadata = null;
    } else {
        shell.hideMediaSession();
    }
}

function bindToPlayer(player) {
    releaseCurrentPlayer();

    if (!player) {
        return;
    }

    currentPlayer = player;

    const state = playbackManager.getPlayerState(player);
    updatePlayerState(player, state, 'init');

    Events.on(currentPlayer, 'playbackstart', onPlaybackStart);
    Events.on(currentPlayer, 'playbackstop', onPlaybackStopped);
    Events.on(currentPlayer, 'unpause', onGeneralEvent);
    Events.on(currentPlayer, 'pause', onGeneralEvent);
    Events.on(currentPlayer, 'statechange', onStateChanged);
    Events.on(currentPlayer, 'timeupdate', onGeneralEvent);
}

function execute(name) {
    playbackManager[name](currentPlayer);
}

if ('mediaSession' in navigator) {
    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('previoustrack', function () {
        execute('previousTrack');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('nexttrack', function () {
        execute('nextTrack');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('play', function () {
        execute('unpause');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('pause', function () {
        execute('pause');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('seekbackward', function () {
        execute('rewind');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('seekforward', function () {
        execute('fastForward');
    });

    /* eslint-disable-next-line compat/compat */
    navigator.mediaSession.setActionHandler('seekto', function (object) {
        const item = playbackManager.getPlayerState(currentPlayer).NowPlayingItem;
        // Convert to ms
        const duration = parseInt(item.RunTimeTicks ? (item.RunTimeTicks / 10000) : 0, 10);
        const wantedTime = object.seekTime * 1000;
        playbackManager.seekPercent(wantedTime / duration * 100, currentPlayer);
    });
}

Events.on(playbackManager, 'playerchange', function () {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());

