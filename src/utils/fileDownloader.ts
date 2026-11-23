import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getSubtitleApi } from '@jellyfin/sdk/lib/utils/api/subtitle-api';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getItems } from 'lib/jellyfin-apiclient/utils/getItems';

import multiDownload from 'scripts/multiDownload';
import shell from 'scripts/shell';

async function downloadSubtitles(downloadItem: NativeShellDownloadItem) {
    const { itemId, serverId } = downloadItem;
    if (!itemId || !serverId) {
        throw new Error('Missing item or server id for subtitle download');
    }

    const api = ServerConnections.getApi(serverId);
    if (!api) {
        throw new Error(`No Api instance available for server ${serverId}`);
    }

    // List entries do not always include media sources or subtitle streams.
    const { Items } = await getItems(api, {
        ids: [itemId],
        fields: [ItemFields.MediaSources, ItemFields.Path]
    });
    const item = Items?.[0];
    // The download endpoint serves item.Path, not necessarily the first media source.
    const source = item?.Path ?
        item.MediaSources?.find(candidate => candidate.Path === item.Path) :
        undefined;
    const mediaSourceId = source?.Id;
    if (!mediaSourceId) {
        throw new Error(`No matching media source for item ${itemId}`);
    }

    const subtitles = source?.MediaStreams?.filter(stream =>
        stream.Type === MediaStreamType.Subtitle
        && stream.IsExternal
        && stream.Path?.toLowerCase().endsWith('.srt')
    ) || [];

    for (const stream of subtitles) {
        if (stream.Index === undefined || !stream.Path) {
            throw new Error(`Missing subtitle index or path for item ${itemId}`);
        }

        try {
            const { data } = await getSubtitleApi(api).getSubtitle({
                routeItemId: itemId,
                routeMediaSourceId: mediaSourceId,
                routeIndex: stream.Index,
                routeFormat: 'srt'
            }, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            try {
                await multiDownload([{
                    url,
                    filename: stream.Path.replace(/^.*[\\/]/, '').replace(/"/g, '')
                }]);
            } finally {
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('[fileDownloader] Failed to download subtitle', stream.Index, 'for item', itemId, error);
        }
    }
}

export async function download(items: NativeShellDownloadItem[]) {
    if (shell.downloadFiles(items)) return;

    await multiDownload(items.map(item => item.url));
    for (const item of items) {
        if (item.item?.MediaType === MediaType.Video) {
            await downloadSubtitles(item).catch(error => {
                console.error('[fileDownloader] Failed to download subtitles for item', item.itemId, error);
            });
        }
    }
}
