import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

import { playbackManager } from './playbackmanager';

interface PlaybackInfo {
    item: BaseItemDto;
    context?: string;
}

function mirrorItem(info: PlaybackInfo, player?: unknown) {
    const { item } = info;

    playbackManager.displayContent({
        ItemName: item.Name,
        ItemId: item.Id,
        ItemType: item.Type,
        Context: info.context
    }, player);
}

function mirrorIfEnabled(info: PlaybackInfo) {
    if (info && playbackManager.enableDisplayMirroring()) {
        const playerInfo = playbackManager.getPlayerInfo();

        if (playerInfo && !playerInfo.isLocalPlayer && playerInfo.supportedCommands.indexOf('DisplayContent') !== -1) {
            mirrorItem(info, playbackManager.getCurrentPlayer());
        }
    }
}

document.addEventListener('viewshow', e => {
    const state = e.detail.state || {};
    const { item } = state;

    if (item?.ServerId) {
        mirrorIfEnabled({ item });
    }
});
