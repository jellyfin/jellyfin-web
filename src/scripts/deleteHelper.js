
import confirm from '../components/confirm/confirm';
import { appRouter } from '../components/router/appRouter';
import globalize from './globalize';
import ServerConnections from '../components/ServerConnections';
import alert from '../components/alert';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

function alertText(options) {
    return alert(options);
}

function getDeletionConfirmContent(item) {
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

export function deleteItem(options) {
    const item = options.item;
    const parentId = item.SeasonId || item.SeriesId || item.ParentId;

    const apiClient = ServerConnections.getApiClient(item.ServerId);

    return confirm(getDeletionConfirmContent(item)).then(function () {
        return apiClient.deleteItem(item.Id).then(function () {
            if (options.navigate) {
                if (parentId) {
                    appRouter.showItem(parentId, item.ServerId);
                } else {
                    appRouter.goHome();
                }
            }
        }, function (err) {
            const result = function () {
                return Promise.reject(err);
            };

            return alertText(globalize.translate('ErrorDeletingItem')).then(result, result);
        });
    });
}

export default {
    deleteItem: deleteItem
};
