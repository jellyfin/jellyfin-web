import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';

import type { ParentId } from 'types/library';

interface GetToolbarParentItemIdOptions {
    parentId: ParentId;
    collectionType?: CollectionType;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
}

export function getToolbarParentItemId({
    parentId,
    collectionType,
    isBtnPlayAllEnabled,
    isBtnQueueEnabled,
    isBtnShuffleEnabled
}: GetToolbarParentItemIdOptions): string | undefined {
    const needsParentItem = isBtnPlayAllEnabled || isBtnShuffleEnabled || isBtnQueueEnabled;

    if (!needsParentItem || !parentId) {
        return undefined;
    }

    // Live TV uses a synthetic route key as parentId, not a real library item id.
    if (collectionType === CollectionType.Livetv) {
        return undefined;
    }

    return parentId;
}
