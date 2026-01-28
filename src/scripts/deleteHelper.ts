import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import alert from '../components/alert';
import confirm from '../components/confirm/confirm';
import { appRouter } from '../components/router/appRouter';
import globalize from '../lib/globalize';
import { ServerConnections } from '../lib/jellyfin-apiclient';

export interface DeleteOptions {
    item: any;
    navigate?: boolean;
}

function getDeletionConfirmContent(item: any) {
    if (item.Type === BaseItemKind.Series) {
        const totalEpisodes = item.RecursiveItemCount;
        return {
            title: globalize.translate('HeaderDeleteSeries'),
            text: globalize.translate('ConfirmDeleteSeries', totalEpisodes),
            confirmText: globalize.translate('DeleteEntireSeries', totalEpisodes),
            primary: 'delete'
        };
    }

    return {
        title: globalize.translate('HeaderDeleteItem'),
        text: globalize.translate('ConfirmDeleteItem'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    };
}

export function deleteItem(options: DeleteOptions): Promise<void> {
    const { item } = options;
    const parentId = item.SeasonId || item.SeriesId || item.ParentId;
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    if (!apiClient) {
        return Promise.reject(new Error('No ApiClient available for deletion'));
    }

    return confirm(getDeletionConfirmContent(item)).then(() => {
        return apiClient.deleteItem(item.Id).then(
            () => {
                if (options.navigate) {
                    if (parentId) {
                        appRouter.showItem(parentId, item.ServerId);
                    } else {
                        appRouter.goHome();
                    }
                }
            },
            (err: any) => {
                alert(globalize.translate('ErrorDeletingItem'));
                throw err;
            }
        );
    });
}

export function deleteLyrics(item: any): Promise<void> {
    return confirm({
        title: globalize.translate('HeaderDeleteLyrics'),
        text: globalize.translate('ConfirmDeleteLyrics'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(() => {
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        if (!apiClient) {
            return Promise.reject(new Error('No ApiClient available for deletion'));
        }
        return apiClient
            .ajax({
                url: apiClient.getUrl('Audio/' + item.Id + '/Lyrics'),
                type: 'DELETE'
            })
            .catch((err: any) => {
                alert(globalize.translate('ErrorDeletingLyrics'));
                throw err;
            });
    });
}

const deleteHelper = { deleteItem, deleteLyrics };
export default deleteHelper;
