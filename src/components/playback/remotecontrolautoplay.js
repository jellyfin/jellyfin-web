import { playbackManager } from '@/components/playback/playbackmanager';
import Events from '@/utils/events.ts';

function transferPlayback(oldPlayer, newPlayer) {
    const state = playbackManager.getPlayerState(oldPlayer);
    const item = state.NowPlayingItem;

    if (!item) {
        return;
    }

    playbackManager.getPlaylist(oldPlayer).then(playlist => {
        const playlistIds = playlist.map(x => x.Id);
        const playState = state.PlayState || {};
        const resumePositionTicks = playState.PositionTicks || 0;
        const playlistIndex = playlistIds.indexOf(item.Id) || 0;

        playbackManager.stop(oldPlayer).then(() => {
            playbackManager.play({
                ids: playlistIds,
                serverId: item.ServerId,
                startPositionTicks: resumePositionTicks,
                startIndex: playlistIndex
            }, newPlayer);
        });
    });
}

Events.on(playbackManager, 'playerchange', (e, newPlayer, newTarget, oldPlayer) => {
    if (!oldPlayer || !newPlayer) {
        return;
    }

    if (!oldPlayer.isLocalPlayer) {
        console.debug('Skipping remote control autoplay because oldPlayer is not a local player');
        return;
    }

    if (newPlayer.isLocalPlayer) {
        console.debug('Skipping remote control autoplay because newPlayer is a local player');
        return;
    }

    transferPlayback(oldPlayer, newPlayer);
});
