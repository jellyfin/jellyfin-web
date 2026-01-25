import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';

export const QUERY_OPTIONS = {
    limit: 100,
    fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.CanDelete, ItemFields.MediaSourceCount],
    enableTotalRecordCount: false,
    imageTypeLimit: 1
};
