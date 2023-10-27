import { getClientLogApi } from '@jellyfin/sdk/lib/utils/api/client-log-api';

import ServerConnections from 'components/ServerConnections';
import { getSDK, toApi } from 'utils/jellyfin-apiclient/compat';

import { buildLogTemplate } from './template';

/** Firefox supports additional properties on the Error object */
interface NonstandardError extends Error {
    fileName?: string
    columnNumber?: number
    lineNumber?: number
}

interface OnUnhandledRejectionHandler {
    (this: WindowEventHandlers, ev: PromiseRejectionEvent): void
}

const initialTime = Date.now();

const reporter: OnErrorEventHandler = (
    event,
    source,
    lineno,
    colno,
    error
) => {
    const apiClient = window.ApiClient ?? ServerConnections.currentApiClient();

    if (!apiClient) {
        console.warn('[crash reporter] no api client; unable to report crash', {
            event,
            source,
            lineno,
            colno,
            error
        });
        return;
    }

    const jellyfin = getSDK(apiClient);

    const log = buildLogTemplate(jellyfin, {
        initialTime
    }, {
        event,
        source,
        lineno,
        colno,
        error
    });

    if (__WEBPACK_SERVE__) {
        console.error('[crash reporter] crash report not submitted in dev server', log);
        return;
    }

    console.debug('[crash reporter] submitting crash report', log);
    getClientLogApi(toApi(apiClient))
        .logFile({
            body: log
        })
        .catch(err => {
            console.error('[crash reporter] failed to submit crash log', err, log);
        });
};

const rejectionReporter: OnUnhandledRejectionHandler = (event) => {
    const error = event.reason as NonstandardError;
    const message = event.reason as string;
    reporter(error.message ?? message, error.fileName, error.lineNumber, error.columnNumber, error);
};

window.onerror = reporter;
window.onunhandledrejection = rejectionReporter;
