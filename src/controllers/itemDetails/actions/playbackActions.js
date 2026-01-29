import { ItemAction } from 'constants/itemAction';

export function onPlayClick() {
    let actionElem = this;
    let action = actionElem.getAttribute('data-action');

    if (!action) {
        actionElem = actionElem.querySelector('[data-action]') || actionElem;
        action = actionElem.getAttribute('data-action');
    }

    playCurrentItem(actionElem, action);
}

export function onInstantMixClick(currentItem, playbackManager) {
    playbackManager.instantMix(currentItem);
}

export function onShuffleClick(currentItem, playbackManager) {
    playbackManager.shuffle(currentItem);
}

export function playTrailer(currentItem, playbackManager) {
    playbackManager.playTrailers(currentItem);
}

function playCurrentItem(button, mode, currentItem, playbackManager) {
    const item = currentItem;

    if (item.Type === 'Program') {
        import('lib/jellyfin-apiclient').then(({ ServerConnections }) => {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            apiClient
                .getLiveTvChannel(item.ChannelId, apiClient.getCurrentUserId())
                .then((channel) => {
                    playbackManager.play({
                        items: [channel]
                    });
                });
        });
        return;
    }

    const playOptions = getPlayOptions(button, item);
    playOptions.items = [item];
    playbackManager.play(playOptions);
}

function getPlayOptions(button, item) {
    const audioStreamIndex = button?.querySelector('.selectAudio')?.value || null;
    return {
        startPositionTicks: item.UserData?.PlaybackPositionTicks || 0,
        mediaSourceId: button?.querySelector('.selectSource')?.value,
        audioStreamIndex: audioStreamIndex,
        subtitleStreamIndex: button?.querySelector('.selectSubtitles')?.value
    };
}
