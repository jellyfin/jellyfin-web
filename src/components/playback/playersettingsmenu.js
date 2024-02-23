import actionsheet from '../actionSheet/actionSheet';
import { playbackManager } from '../playback/playbackmanager';
import globalize from '../../scripts/globalize';
import qualityoptions from '../qualityOptions';
import ServerConnections from '../ServerConnections';

function showQualityMenu(player, btn) {
    const videoStream = playbackManager.currentMediaSource(player).MediaStreams.filter(function (stream) {
        return stream.Type === 'Video';
    })[0];
    const videoWidth = videoStream ? videoStream.Width : null;
    const videoHeight = videoStream ? videoStream.Height : null;

    const options = qualityoptions.getVideoQualityOptions({
        currentMaxBitrate: playbackManager.getMaxStreamingBitrate(player),
        isAutomaticBitrateEnabled: playbackManager.enableAutomaticBitrateDetection(player),
        videoWidth: videoWidth,
        videoHeight: videoHeight,
        enableAuto: true
    });

    const menuItems = options.map(function (o) {
        const opt = {
            name: o.name,
            id: o.bitrate,
            asideText: o.secondaryText
        };

        if (o.selected) {
            opt.selected = true;
        }

        return opt;
    });

    const selectedId = options.filter(function (o) {
        return o.selected;
    });

    const selectedBitrate = selectedId.length ? selectedId[0].bitrate : null;

    return actionsheet.show({
        items: menuItems,
        positionTo: btn
    }).then(function (id) {
        const bitrate = parseInt(id, 10);
        if (bitrate !== selectedBitrate) {
            playbackManager.setMaxStreamingBitrate({
                enableAutomaticBitrateDetection: !bitrate,
                maxBitrate: bitrate
            }, player);
        }
    });
}

function showRepeatModeMenu(player, btn) {
    const menuItems = [];
    const currentValue = playbackManager.getRepeatMode(player);

    menuItems.push({
        name: globalize.translate('RepeatAll'),
        id: 'RepeatAll',
        selected: currentValue === 'RepeatAll'
    });

    menuItems.push({
        name: globalize.translate('RepeatOne'),
        id: 'RepeatOne',
        selected: currentValue === 'RepeatOne'
    });

    menuItems.push({
        name: globalize.translate('None'),
        id: 'RepeatNone',
        selected: currentValue === 'RepeatNone'
    });

    return actionsheet.show({
        items: menuItems,
        positionTo: btn
    }).then(function (mode) {
        if (mode) {
            playbackManager.setRepeatMode(mode, player);
        }
    });
}

function getQualitySecondaryText(player) {
    const state = playbackManager.getPlayerState(player);

    const videoStream = playbackManager.currentMediaSource(player).MediaStreams.filter(function (stream) {
        return stream.Type === 'Video';
    })[0];

    const videoWidth = videoStream ? videoStream.Width : null;
    const videoHeight = videoStream ? videoStream.Height : null;

    const options = qualityoptions.getVideoQualityOptions({
        currentMaxBitrate: playbackManager.getMaxStreamingBitrate(player),
        isAutomaticBitrateEnabled: playbackManager.enableAutomaticBitrateDetection(player),
        videoWidth: videoWidth,
        videoHeight: videoHeight,
        enableAuto: true
    });

    let selectedOption = options.filter(function (o) {
        return o.selected;
    });

    if (!selectedOption.length) {
        return null;
    }

    selectedOption = selectedOption[0];
    let text = selectedOption.name;

    if (selectedOption.autoText) {
        if (state.PlayState && state.PlayState.PlayMethod !== 'Transcode') {
            text += ' - Direct';
        } else {
            text += ' ' + selectedOption.autoText;
        }
    }

    return text;
}

function showAspectRatioMenu(player, btn) {
    // each has a name and id
    const currentId = playbackManager.getAspectRatio(player);
    const menuItems = playbackManager.getSupportedAspectRatios(player).map(function (i) {
        return {
            id: i.id,
            name: i.name,
            selected: i.id === currentId
        };
    });

    return actionsheet.show({
        items: menuItems,
        positionTo: btn
    }).then(function (id) {
        if (id) {
            playbackManager.setAspectRatio(id, player);
            return Promise.resolve();
        }

        return Promise.reject();
    });
}

function showPlaybackRateMenu(player, btn) {
    // each has a name and id
    const currentId = playbackManager.getPlaybackRate(player);
    const menuItems = playbackManager.getSupportedPlaybackRates(player).map(i => ({
        id: i.id,
        name: i.name,
        selected: i.id === currentId
    }));

    return actionsheet.show({
        items: menuItems,
        positionTo: btn
    }).then(function (id) {
        if (id) {
            playbackManager.setPlaybackRate(id, player);
            return Promise.resolve();
        }

        return Promise.reject();
    });
}

function showWithUser(options, player, user) {
    const supportedCommands = playbackManager.getSupportedCommands(player);

    const menuItems = [];
    if (supportedCommands.indexOf('SetAspectRatio') !== -1) {
        const currentAspectRatioId = playbackManager.getAspectRatio(player);
        const currentAspectRatio = playbackManager.getSupportedAspectRatios(player).filter(function (i) {
            return i.id === currentAspectRatioId;
        })[0];

        menuItems.push({
            name: globalize.translate('AspectRatio'),
            id: 'aspectratio',
            asideText: currentAspectRatio ? currentAspectRatio.name : null
        });
    }

    if (supportedCommands.indexOf('PlaybackRate') !== -1) {
        const currentPlaybackRateId = playbackManager.getPlaybackRate(player);
        const currentPlaybackRate = playbackManager.getSupportedPlaybackRates(player).filter(i => i.id === currentPlaybackRateId)[0];

        menuItems.push({
            name: globalize.translate('PlaybackRate'),
            id: 'playbackrate',
            asideText: currentPlaybackRate ? currentPlaybackRate.name : null
        });
    }

    if (options.quality && supportedCommands.includes('SetMaxStreamingBitrate')
            && user?.Policy?.EnableVideoPlaybackTranscoding) {
        const secondaryQualityText = getQualitySecondaryText(player);

        menuItems.push({
            name: globalize.translate('Quality'),
            id: 'quality',
            asideText: secondaryQualityText
        });
    }

    const repeatMode = playbackManager.getRepeatMode(player);

    if (supportedCommands.indexOf('SetRepeatMode') !== -1 && playbackManager.currentMediaSource(player).RunTimeTicks) {
        menuItems.push({
            name: globalize.translate('RepeatMode'),
            id: 'repeatmode',
            asideText: repeatMode === 'RepeatNone' ? globalize.translate('None') : globalize.translate('' + repeatMode)
        });
    }

    if (options.suboffset) {
        menuItems.push({
            name: globalize.translate('SubtitleOffset'),
            id: 'suboffset',
            asideText: null
        });
    }

    if (options.stats) {
        menuItems.push({
            name: globalize.translate('PlaybackData'),
            id: 'stats',
            asideText: null
        });
    }

    return actionsheet.show({
        items: menuItems,
        positionTo: options.positionTo
    }).then(function (id) {
        return handleSelectedOption(id, options, player);
    });
}

export function show(options) {
    const player = options.player;
    const currentItem = playbackManager.currentItem(player);

    if (!currentItem?.ServerId) {
        return showWithUser(options, player, null);
    }

    const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
    return apiClient.getCurrentUser().then(function (user) {
        return showWithUser(options, player, user);
    });
}

function handleSelectedOption(id, options, player) {
    switch (id) {
        case 'quality':
            return showQualityMenu(player, options.positionTo);
        case 'aspectratio':
            return showAspectRatioMenu(player, options.positionTo);
        case 'playbackrate':
            return showPlaybackRateMenu(player, options.positionTo);
        case 'repeatmode':
            return showRepeatModeMenu(player, options.positionTo);
        case 'stats':
            if (options.onOption) {
                options.onOption('stats');
            }
            return Promise.resolve();
        case 'suboffset':
            if (options.onOption) {
                options.onOption('suboffset');
            }
            return Promise.resolve();
        default:
            break;
    }

    return Promise.reject();
}

export default {
    show: show
};
