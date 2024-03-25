
import globalize from './globalize';
import alert from '../components/alert';
import confirm from '../components/confirm/confirm';
import ServerConnections from '../components/ServerConnections';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

function onItemDeletionError (err) {
    console.log(err);
    const rejectionResult = function () {
        return Promise.reject(err);
    };
    return alert(globalize.translate('ErrorDeletingItem')).then(rejectionResult, rejectionResult);
}

function onLyricDeletionError (err) {
    const rejectionResult = function () {
        return Promise.reject(err);
    };
    return alert(globalize.translate('ErrorDeletingLyrics')).then(rejectionResult, rejectionResult);
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

export function deleteItem (item) {
    return confirm(getDeletionConfirmContent(item)).then(() => {
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        return apiClient.deleteItem(item.Id).catch(onItemDeletionError);
    });
}

export function deleteLyrics (item) {
    return confirm({
        title: globalize.translate('HeaderDeleteLyrics'),
        text: globalize.translate('ConfirmDeleteLyrics'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(() => {
        const apiClient = ServerConnections.getApiClient(item.ServerId);
        return apiClient.ajax({
            url: apiClient.getUrl('Audio/' + item.Id + '/Lyrics'),
            type: 'DELETE'
        }).catch(onLyricDeletionError);
    });
}

export default {
    deleteItem,
    deleteLyrics
};
