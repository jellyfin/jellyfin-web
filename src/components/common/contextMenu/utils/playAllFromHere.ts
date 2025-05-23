import { playbackManager } from 'components/playback/playbackmanager';

import type { NullableString } from 'types/base/common/shared/types';
import type { ItemDto } from 'types/base/models/item-dto';

interface PlayAllFromHereOpts {
    itemId: string;
    items: ItemDto[];
    serverId: NullableString;
    queue?: boolean;
}

export function playAllFromHere(opts: PlayAllFromHereOpts) {
    const { itemId, items, serverId, queue } = opts;

    const ids = [];

    let foundCard = false;
    let startIndex;

    for (let i = 0, length = items.length; i < length; i++) {
        if (items[i].Id === itemId) {
            foundCard = true;
            startIndex = i;
        }
        if (foundCard || !queue) {
            ids.push(items[i].Id);
        }
    }

    if (!ids.length) {
        return Promise.resolve();
    }

    if (queue) {
        return playbackManager.queue({
            ids,
            serverId
        });
    } else {
        return playbackManager.play({
            ids,
            serverId,
            startIndex
        });
    }
}
