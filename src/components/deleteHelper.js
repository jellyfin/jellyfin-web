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

    var item = options.item;
    var itemId = item.Id;
    var parentId = item.SeasonId || item.SeriesId || item.ParentId;
    var serverId = item.ServerId;

    var msg = globalize.translate('ConfirmDeleteItem');
    var title = globalize.translate('HeaderDeleteItem');
    var apiClient = connectionManager.getApiClient(item.ServerId);

    return confirm({

        title: title,
        text: msg,
        confirmText: globalize.translate('Delete'),
        primary: 'delete'

    }).then(function () {

        return apiClient.deleteItem(itemId).then(function () {

            if (options.navigate) {
                if (parentId) {
                    appRouter.showItem(parentId, serverId);
                } else {
                    appRouter.goHome();
                }
            }
        }, function (err) {

            var result = function () {
                return Promise.reject(err);
            };

            return alertText(globalize.translate('ErrorDeletingItem')).then(result, result);
        });
    });
}

export default {
    deleteItem: deleteItem
};
