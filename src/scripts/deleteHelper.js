
import confirm from '../components/confirm/confirm';
import { appRouter } from '../components/router/appRouter';
import globalize from './globalize';
import ServerConnections from '../components/ServerConnections';
import alert from '../components/alert';

function alertText(options) {
    return alert(options);
}

function getDeleteText(item) {
    if (item.Type === 'Series') {
        const totalEpisodes = item.RecursiveItemCount;

        return {
            title: globalize.translate('HeaderDeleteSeries'),
            text: globalize.translate('ConfirmDeleteSeries', totalEpisodes),
            confirmText: globalize.translate('DeleteEntireSeries', totalEpisodes)
        };
    }

    return {
        title: globalize.translate('HeaderDeleteItem'),
        text: globalize.translate('ConfirmDeleteItem'),
        confirmText: globalize.translate('Delete')

    };
}

export function deleteItem(options) {
    const item = options.item;
    const parentId = item.SeasonId || item.SeriesId || item.ParentId;
    const { confirmText, text, title } = getDeleteText(item);

    const apiClient = ServerConnections.getApiClient(item.ServerId);

    return confirm({

        title,
        text,
        confirmText,
        primary: 'delete'

    }).then(function () {
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
