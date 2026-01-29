import type { SeriesTimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';
import globalizeLib from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import confirm from '../confirm/confirm';
import dialog, { DialogButton, ShowDialogOptions } from '../dialog/dialog';
import loading from '../loading/loading';
import toast from '../toast/toast';

type LiveTvItem = {
    IsSeries?: boolean | null;
};

type LiveTvTimerDefaults = SeriesTimerInfoDto;

function extractSeriesTimerId(
    seriesTimerId?: string | SeriesTimerInfoDto | null
): string | undefined {
    if (!seriesTimerId) {
        return undefined;
    }

    if (typeof seriesTimerId === 'string') {
        return seriesTimerId;
    }

    return seriesTimerId.Id || undefined;
}

function changeRecordingToSeries(
    apiClient: ApiClient,
    timerId: string,
    programId: string,
    confirmTimerCancellation = false
): Promise<void> {
    loading.show();

    return apiClient.getItem(apiClient.getCurrentUserId(), programId).then((item: LiveTvItem) => {
        if (item.IsSeries) {
            return apiClient
                .getNewLiveTvTimerDefaults({ programId })
                .then((timerDefaults: LiveTvTimerDefaults) => {
                    return apiClient.createLiveTvSeriesTimer(timerDefaults).then(() => {
                        loading.hide();
                        toast(globalizeLib.translate('SeriesRecordingScheduled'));
                    });
                });
        }

        if (confirmTimerCancellation) {
            return cancelTimerWithConfirmation(timerId, apiClient.serverId());
        }

        return cancelTimer(apiClient, timerId, true);
    });
}

function cancelTimerWithConfirmation(timerId: string, serverId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        confirm({
            text: globalizeLib.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalizeLib.translate('HeaderCancelRecording'),
            cancelText: globalizeLib.translate('HeaderKeepRecording')
        })
            .then(() => {
                loading.show();

                const apiClient = ServerConnections.getApiClient(serverId);
                cancelTimer(apiClient, timerId, true).then(resolve, reject);
            })
            .catch(reject);
    });
}

function cancelSeriesTimerWithConfirmation(timerId: string, serverId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        confirm({
            text: globalizeLib.translate('MessageConfirmRecordingCancellation'),
            primary: 'delete',
            confirmText: globalizeLib.translate('HeaderCancelSeries'),
            cancelText: globalizeLib.translate('HeaderKeepSeries')
        })
            .then(() => {
                loading.show();

                const apiClient = ServerConnections.getApiClient(serverId);
                apiClient.cancelLiveTvSeriesTimer(timerId).then(() => {
                    toast(globalizeLib.translate('SeriesCancelled'));

                    loading.hide();
                    resolve();
                }, reject);
            })
            .catch(reject);
    });
}

function cancelTimer(apiClient: ApiClient, timerId: string, hideLoading?: boolean): Promise<void> {
    loading.show();
    return apiClient.cancelLiveTvTimer(timerId).then(() => {
        if (hideLoading !== false) {
            loading.hide();
            toast(globalizeLib.translate('RecordingCancelled'));
        }
    });
}

function createRecording(
    apiClient: ApiClient,
    programId: string,
    isSeries?: boolean
): Promise<void> {
    loading.show();
    return apiClient.getNewLiveTvTimerDefaults({ programId }).then((item) => {
        const promise = isSeries
            ? apiClient.createLiveTvSeriesTimer(item)
            : apiClient.createLiveTvTimer(item);

        return promise.then(() => {
            loading.hide();
            toast(globalizeLib.translate('RecordingScheduled'));
        });
    });
}

function showMultiCancellationPrompt(
    serverId: string,
    programId: string,
    timerId: string,
    timerStatus: string,
    seriesTimerId: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const items: DialogButton[] = [];

        items.push({
            name: globalizeLib.translate('HeaderKeepRecording'),
            id: 'cancel',
            type: 'submit'
        });

        if (timerStatus === 'InProgress') {
            items.push({
                name: globalizeLib.translate('HeaderStopRecording'),
                id: 'canceltimer',
                type: 'cancel'
            });
        } else {
            items.push({
                name: globalizeLib.translate('HeaderCancelRecording'),
                id: 'canceltimer',
                type: 'cancel'
            });
        }

        items.push({
            name: globalizeLib.translate('HeaderCancelSeries'),
            id: 'cancelseriestimer',
            type: 'cancel'
        });

        const options: ShowDialogOptions = {
            text: globalizeLib.translate('MessageConfirmRecordingCancellation'),
            buttons: items
        };

        dialog.show(options).then((result) => {
            const apiClient = ServerConnections.getApiClient(serverId);

            if (result === 'canceltimer') {
                loading.show();

                cancelTimer(apiClient, timerId, true).then(resolve, reject);
            } else if (result === 'cancelseriestimer') {
                loading.show();

                apiClient.cancelLiveTvSeriesTimer(seriesTimerId).then(() => {
                    toast(globalizeLib.translate('SeriesCancelled'));
                    loading.hide();
                    resolve();
                }, reject);
            } else {
                resolve();
            }
        }, reject);
    });
}

function toggleRecording(
    serverId: string,
    programId?: string,
    timerId?: string,
    timerStatus?: string,
    seriesTimerId?: string | SeriesTimerInfoDto | null
): Promise<void> {
    if (!programId) {
        return Promise.reject(new Error('Program ID required'));
    }

    const apiClient = ServerConnections.getApiClient(serverId);
    const resolvedSeriesTimerId = extractSeriesTimerId(seriesTimerId);

    if (resolvedSeriesTimerId && timerId && timerStatus && timerStatus !== 'Cancelled') {
        return showMultiCancellationPrompt(
            serverId,
            programId,
            timerId,
            timerStatus,
            resolvedSeriesTimerId
        );
    }

    if (timerId && timerStatus && timerStatus !== 'Cancelled') {
        return changeRecordingToSeries(apiClient, timerId, programId, true);
    }

    return createRecording(apiClient, programId);
}

const recordingHelper = {
    cancelTimer,
    createRecording,
    changeRecordingToSeries,
    toggleRecording,
    cancelTimerWithConfirmation,
    cancelSeriesTimerWithConfirmation
};

export default recordingHelper;
