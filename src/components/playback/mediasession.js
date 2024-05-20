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
    options.type = options.type || 'Primary' || 'Disc';

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

function updatePlayerState(player, state) {
    const item = state.NowPlayingItem;

    if (!item) {
        hideMediaControls();
        return;
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

    // Convert ticks (100ns units) to seconds
    const durationInSeconds = item.RunTimeTicks ? (item.RunTimeTicks / 10000000) : 0;
    let currentTimeInSeconds = playState.PositionTicks ? (playState.PositionTicks / 10000000) : 0;

    // If PositionTicks is not updating, get current time from player
    if (!currentTimeInSeconds && typeof player.currentTime === 'number') {
        currentTimeInSeconds = player.currentTime; // Already in seconds
    }

    const isPaused = typeof playState.IsPaused === 'boolean' ? playState.IsPaused : false;
    const canSeek = typeof playState.CanSeek === 'boolean' ? playState.CanSeek : false;
    const playbackRate = typeof playState.PlaybackRate === 'number' ? playState.PlaybackRate : 1;

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: getImageUrls(item),
            genre: item.Genres ? item.Genres.join(', ') : '',
            trackNumber: item.IndexNumber || 0,
            discNumber: item.ParentIndexNumber || 0
        });
        navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';

        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: durationInSeconds,
                playbackRate: playbackRate,
                position: currentTimeInSeconds
            });
        }
    } else {
        const itemImageUrl = seriesImageUrl(item, { maxHeight: 3000 }) || imageUrl(item, { maxHeight: 3000 });
        shell.updateMediaSession({
            isLocalPlayer: isLocalPlayer,
            itemId: itemId,
            title: title,
            artist: artist,
            album: album,
            duration: durationInSeconds * 1000, // Convert to milliseconds
            position: currentTimeInSeconds * 1000, // Convert to milliseconds
            imageUrl: itemImageUrl,
            canSeek: canSeek,
            isPaused: isPaused
        });
    }
}

function onGeneralEvent(e) {
    const state = playbackManager.getPlayerState(this);

    updatePlayerState(this, state);
}

function onStateChanged(e, state) {
    updatePlayerState(this, state);
}

function onPlaybackStart(e, state) {
    updatePlayerState(this, state);
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
        navigator.mediaSession.metadata = null;
        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState(null);
        }
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
    updatePlayerState(player, state);

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

function setMediaSessionActionHandler(action, handler) {
    try {
        // eslint-disable-next-line compat/compat
        navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
        console.warn(`MediaSession action "${action}" is not supported:`, error);
    }
}

if ('mediaSession' in navigator) {
    setMediaSessionActionHandler('play', function () {
        execute('unpause');
    });

    setMediaSessionActionHandler('pause', function () {
        execute('pause');
    });

    setMediaSessionActionHandler('previoustrack', function () {
        execute('previousTrack');
    });

    setMediaSessionActionHandler('nexttrack', function () {
        execute('nextTrack');
    });

    setMediaSessionActionHandler('seekbackward', function (details) {
        const seekOffset = (details.seekOffset || 10); // Already in seconds
        const state = playbackManager.getPlayerState(currentPlayer);
        const positionInSeconds = state.PlayState?.PositionTicks ? (state.PlayState.PositionTicks / 10000000) : 0;
        const newPosition = Math.max(positionInSeconds - seekOffset, 0);
        playbackManager.seek(newPosition * 1000, currentPlayer); // Convert to milliseconds
    });

    setMediaSessionActionHandler('seekforward', function (details) {
        const seekOffset = (details.seekOffset || 10); // Already in seconds
        const state = playbackManager.getPlayerState(currentPlayer);
        const durationInSeconds = state.NowPlayingItem.RunTimeTicks ? (state.NowPlayingItem.RunTimeTicks / 10000000) : 0;
        const positionInSeconds = state.PlayState?.PositionTicks ? (state.PlayState.PositionTicks / 10000000) : 0;
        const newPosition = Math.min(positionInSeconds + seekOffset, durationInSeconds);
        playbackManager.seek(newPosition * 1000, currentPlayer); // Convert to milliseconds
    });

    setMediaSessionActionHandler('seekto', function (details) {
        const position = details.seekTime; // Already in seconds
        const state = playbackManager.getPlayerState(currentPlayer);
        const durationInSeconds = state.NowPlayingItem.RunTimeTicks ? (state.NowPlayingItem.RunTimeTicks / 10000000) : 0;
        const newPosition = Math.min(position, durationInSeconds);
        playbackManager.seek(newPosition * 1000, currentPlayer); // Convert to milliseconds
    });

    setMediaSessionActionHandler('stop', function () {
        execute('stop');
    });
}

Events.on(playbackManager, 'playerchange', function () {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());
