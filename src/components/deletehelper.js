import connectionManager from 'connectionManager';
import confirm from 'confirm';
import appRouter from 'appRouter';
import globalize from 'globalize';

function alertText(options) {

    return new Promise(function (resolve, reject) {

        require(['alert'], function (alert) {
            alert(options).then(resolve, resolve);
        });
    });
}

export function deleteItem(options) {

    const item = options.item;
    const parentId = item.SeasonId || item.SeriesId || item.ParentId;

    let apiClient = connectionManager.getApiClient(item.ServerId);

    return confirm({

        title: globalize.translate('HeaderDeleteItem'),
        text: globalize.translate('ConfirmDeleteItem'),
        confirmText: globalize.translate('Delete'),
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

            let result = function () {
                return Promise.reject(err);
            };

            return alertText(globalize.translate('ErrorDeletingItem')).then(result, result);
        });
    });
}

export default {
    deleteItem: deleteItem
};
