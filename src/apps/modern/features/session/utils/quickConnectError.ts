import { isAxiosError } from 'axios';

/** Why a quick connect request failed, as far as the error can tell. */
export type QuickConnectFailure =
    /** The server could not be reached or failed to handle the request. The failure may be temporary */
    | 'unreachable'
    /** Quick connect is disabled on the server */
    | 'disabled'
    /** The server no longer knows the request, because the code expired or the server was restarted */
    | 'expired'
    /** The request failed for another reason, such as a malformed response */
    | 'failed';

const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

/**
 * Classifies the error of a quick connect request. The server answers 401 when quick connect is disabled and
 * 404 when the secret is unknown. A request error without a response (network error, timeout) or with a server
 * error is treated as unreachable, since the next request may succeed.
 */
export const getQuickConnectFailure = (error: unknown): QuickConnectFailure => {
    if (!isAxiosError(error)) return 'failed';

    const status = error.response?.status;
    if (
        status === undefined
        || status >= HTTP_SERVER_ERROR
        || status === HTTP_REQUEST_TIMEOUT
        || status === HTTP_TOO_MANY_REQUESTS
    ) {
        return 'unreachable';
    }
    if (status === HTTP_UNAUTHORIZED) return 'disabled';
    if (status === HTTP_NOT_FOUND) return 'expired';
    return 'failed';
};

/** Whether the request failed for a reason that may be temporary, so it is worth retrying. */
export const isTransientQuickConnectError = (error: unknown) => getQuickConnectFailure(error) === 'unreachable';
