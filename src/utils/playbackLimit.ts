export const PLAYBACK_LIMIT_ERROR_CODE = 'MaxActiveVideoStreamsReached';

const playbackLimitHeader = 'x-jellyfin-error-code';

export class PlaybackLimitError extends Error {
    constructor() {
        super(PLAYBACK_LIMIT_ERROR_CODE);
        // The ES5 build's native Error constructor returns an object with its own prototype.
        Object.setPrototypeOf(this, PlaybackLimitError.prototype);
        this.name = 'PlaybackLimitError';
    }
}

interface HttpResponse {
    status?: number;
    code?: number;
    headers?: Headers | Record<string, unknown>;
    data?: unknown;
}

function hasPlaybackLimitCode(data: unknown): boolean {
    if (data instanceof ArrayBuffer && typeof TextDecoder !== 'undefined') {
        data = new TextDecoder().decode(data);
    }
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch {
            return false;
        }
    }

    if (!data || typeof data !== 'object') {
        return false;
    }

    const body = data as { ErrorCode?: unknown; errorCode?: unknown };
    return (body.ErrorCode ?? body.errorCode) === PLAYBACK_LIMIT_ERROR_CODE;
}

function getPlaybackLimitHeader(headers: HttpResponse['headers']): unknown {
    if (headers instanceof Headers) {
        return headers.get(playbackLimitHeader);
    }
    if (headers) {
        const key = Object.keys(headers).find(name => name.toLowerCase() === playbackLimitHeader);
        return key === undefined ? undefined : headers[key];
    }
    return undefined;
}

/** Checks a completed XHR response or materialized HTTP response without initiating any request. */
export function isPlaybackLimitResponse(response: unknown): boolean {
    if (response instanceof XMLHttpRequest) {
        return response.status === 403 && (
            response.getResponseHeader(playbackLimitHeader) === PLAYBACK_LIMIT_ERROR_CODE
            || hasPlaybackLimitCode(response.response)
        );
    }
    if (!response || typeof response !== 'object') {
        return false;
    }

    const { status, code, headers, data } = response as HttpResponse;
    return (status ?? code) === 403 && (
        getPlaybackLimitHeader(headers) === PLAYBACK_LIMIT_ERROR_CODE || hasPlaybackLimitCode(data)
    );
}

/** Recognizes a normalized rejection, Fetch response, Axios error or hls.js error event. */
export async function isPlaybackLimitError(error: unknown): Promise<boolean> {
    if (error instanceof PlaybackLimitError) {
        return true;
    }
    if (!error || typeof error !== 'object') {
        return false;
    }

    const { networkDetails, response } = error as { networkDetails?: unknown; response?: unknown };
    const candidates = [networkDetails, response, error];
    if (candidates.some(isPlaybackLimitResponse)) {
        return true;
    }

    const fetchResponse = candidates.find(value => value instanceof Response && value.status === 403) as Response | undefined;
    if (fetchResponse) {
        try {
            return hasPlaybackLimitCode(await fetchResponse.clone().json());
        } catch {
            // The body may be unavailable or belong to an ordinary Forbidden response.
            return false;
        }
    }

    return false;
}
