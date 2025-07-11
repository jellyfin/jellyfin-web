import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import loading from '../loading/loading';
import toast from '../toast/toast';
import confirm from '../confirm/confirm';
import dialog from '../dialog/dialog';

function changeRecordingToSeries(apiClient, timerId, programId, confirmTimerCancellation) {
    loading.show();

    return apiClient.getItem(apiClient.getCurrentUserId(), programId).then(function (item) {
        if (item.IsSeries) {
            // create series
            return apiClient.getNewLiveTvTimerDefaults({ programId: programId }).then(function (timerDefaults) {
                return apiClient.createLiveTvSeriesTimer(timerDefaults).then(function () {
                    loading.hide();
                    toast(globalize.translate('SeriesRecordingScheduled'));
                });
            });
        } else {
            // cancel
            if (confirmTimerCancellation) {
                return cancelTimerWithConfirmation(timerId, apiClient.serverId());
            }

            return cancelTimer(apiClient.serverId(), timerId, true);
        }
    });
}

function cancelTimerWithConfirmation(timerId, serverId) {
    return new Promise(function (resolve, reject) {
        confirm({

            text: globalize.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalize.translate('HeaderCancelRecording'),
            cancelText: globalize.translate('HeaderKeepRecording')

        }).then(function () {
            loading.show();

            const apiClient = ServerConnections.getApiClient(serverId);
            cancelTimer(apiClient, timerId, true).then(resolve, reject);
        }, reject);
    });
}

function cancelSeriesTimerWithConfirmation(timerId, serverId) {
    return new Promise(function (resolve, reject) {
        confirm({

            text: globalize.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalize.translate('HeaderCancelSeries'),
            cancelText: globalize.translate('HeaderKeepSeries')

        }).then(function () {
            loading.show();

            const apiClient = ServerConnections.getApiClient(serverId);
            apiClient.cancelLiveTvSeriesTimer(timerId).then(function () {
                toast(globalize.translate('SeriesCancelled'));

                loading.hide();
                resolve();
            }, reject);
        }, reject);
    });
}

function cancelTimer(apiClient, timerId, hideLoading) {
    loading.show();
    return apiClient.cancelLiveTvTimer(timerId).then(function () {
        if (hideLoading !== false) {
            loading.hide();
            toast(globalize.translate('RecordingCancelled'));
        }
    });
}

function createRecording(apiClient, programId, isSeries) {
    loading.show();
    return apiClient.getNewLiveTvTimerDefaults({ programId: programId }).then(function (item) {
        const promise = isSeries ?
            apiClient.createLiveTvSeriesTimer(item) :
            apiClient.createLiveTvTimer(item);

        return promise.then(function () {
            loading.hide();
            toast(globalize.translate('RecordingScheduled'));
        });
    });
}

function showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId) {
    return new Promise(function (resolve, reject) {
        const items = [];

        items.push({
            name: globalize.translate('HeaderKeepRecording'),
            id: 'cancel',
            type: 'submit'
        });

        if (timerStatus === 'InProgress') {
            items.push({
                name: globalize.translate('HeaderStopRecording'),
                id: 'canceltimer',
                type: 'cancel'
            });
        } else {
            items.push({
                name: globalize.translate('HeaderCancelRecording'),
                id: 'canceltimer',
                type: 'cancel'
            });
        }

        items.push({
            name: globalize.translate('HeaderCancelSeries'),
            id: 'cancelseriestimer',
            type: 'cancel'
        });

        dialog.show({
            text: globalize.translate('MessageConfirmRecordingCancellation'),
            buttons: items
        }).then(function (result) {
            const apiClient = ServerConnections.getApiClient(serverId);

            if (result === 'canceltimer') {
                loading.show();

                cancelTimer(apiClient, timerId, true).then(resolve, reject);
            } else if (result === 'cancelseriestimer') {
                loading.show();

                apiClient.cancelLiveTvSeriesTimer(seriesTimerId).then(function () {
                    toast(globalize.translate('SeriesCancelled'));
                    loading.hide();
                    resolve();
                }, reject);
            } else {
                resolve();
            }
        }, reject);
    });
}

function toggleRecording(serverId, programId, timerId, timerStatus, seriesTimerId) {
    const apiClient = ServerConnections.getApiClient(serverId);
    const hasTimer = timerId && timerStatus !== 'Cancelled';
    if (seriesTimerId && hasTimer) {
        // cancel
        return showMultiCancellationPrompt(serverId, programId, timerId, timerStatus, seriesTimerId);
    } else if (hasTimer && programId) {
        // change to series recording, if possible
        // otherwise cancel individual recording
        return changeRecordingToSeries(apiClient, timerId, programId, true);
    } else if (programId) {
        // schedule recording
        return createRecording(apiClient, programId);
    } else {
        return Promise.reject();
    }
}

export default {
    cancelTimer: cancelTimer,
    createRecording: createRecording,
    changeRecordingToSeries: changeRecordingToSeries,
    toggleRecording: toggleRecording,
    cancelTimerWithConfirmation: cancelTimerWithConfirmation,
    cancelSeriesTimerWithConfirmation: cancelSeriesTimerWithConfirmation
};
