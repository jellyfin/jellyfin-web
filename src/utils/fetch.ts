/**
 * Options for requests made by {@link getFetchPromise} and {@link ajax}.
 */
export type AjaxRequest = {
    /** The URL to request. */
    url: string;
    /** The HTTP request method. */
    type: string;
    /** A raw request body or values to encode as form data. */
    data?: Record<string, string | number | boolean> | string;
    /** Values to encode and append to the request URL. */
    query?: Record<string, string | number | boolean>;
    /** The media type of the request body. */
    contentType?: string;
    /** The expected response format. */
    dataType?: 'json' | 'text';
    /** Additional request headers. */
    headers?: Record<string, string>;
    /** The time in milliseconds before the returned promise is rejected. */
    timeout?: number;
};

/**
 * Sends an HTTP request using same-origin credentials.
 *
 * Object data and query values are URL encoded. When a timeout is specified,
 * only the returned promise is rejected; the underlying fetch is not aborted.
 *
 * @param request The request options.
 * @returns The fetch response.
 */
export function getFetchPromise(request: AjaxRequest): Promise<Response> {
    const headers = request.headers || {};

    if (request.dataType === 'json') {
        headers.accept = 'application/json';
    }

    const fetchRequest: RequestInit = {
        headers: headers,
        method: request.type,
        credentials: 'same-origin'
    };

    let contentType = request.contentType;

    if (request.data) {
        if (typeof request.data === 'string') {
            fetchRequest.body = request.data;
        } else {
            fetchRequest.body = paramsToString(request.data);

            contentType = contentType || 'application/x-www-form-urlencoded; charset=UTF-8';
        }
    }

    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    let url = request.url;

    if (request.query) {
        const paramString = paramsToString(request.query);
        if (paramString) {
            url += `?${paramString}`;
        }
    }

    if (!request.timeout) {
        return fetch(url, fetchRequest);
    }

    return fetchWithTimeout(url, fetchRequest, request.timeout);
}

/**
 * Sends a fetch request and rejects if it does not settle within the timeout.
 *
 * @param url The URL to request.
 * @param options The fetch options.
 * @param timeoutMs The timeout in milliseconds.
 * @returns The fetch response.
 */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    console.debug(`fetchWithTimeout: timeoutMs: ${timeoutMs}, url: ${url}`);

    return new Promise(function (resolve, reject) {
        const timeout = setTimeout(reject, timeoutMs);

        options = options || {};
        options.credentials = 'same-origin';

        fetch(url, options).then(function (response) {
            clearTimeout(timeout);

            console.debug(`fetchWithTimeout: succeeded connecting to url: ${url}`);

            resolve(response);
        }, function (error) {
            clearTimeout(timeout);

            console.debug(`fetchWithTimeout: timed out connecting to url: ${url}`);

            reject(error);
        });
    });
}

/**
 * Serializes non-empty values as a URL-encoded parameter string.
 *
 * @param params The values to serialize.
 * @returns The encoded parameter string.
 */
function paramsToString(params: Record<string, string | number | boolean>): string {
    return Object.entries(params)

        .filter(([, v]) => {
            // Keep the runtime guard for callers that provide nullish values despite the type.
            const value: unknown = v;
            return value !== null && value !== undefined && value !== '';
        })
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

/**
 * Sends an HTTP request and decodes successful JSON or text responses.
 *
 * Responses with a status below 400 are decoded according to the requested
 * data type, Accept header, or response Content-Type. Other successful
 * responses are returned unchanged, while HTTP errors reject with the response.
 *
 * @param request The request options.
 * @returns The decoded response body or the original response.
 */
export function ajax(request: AjaxRequest) {
    if (!request) {
        throw new Error('Request cannot be null');
    }

    request.headers = request.headers || {};

    console.debug(`requesting url: ${request.url}`);

    return getFetchPromise(request).then(function (response) {
        console.debug(`response status: ${response.status}, url: ${request.url}`);
        if (response.status < 400) {
            if (request.dataType === 'json' || request.headers?.accept === 'application/json') {
                return response.json();
            } else if (request.dataType === 'text' || (response.headers.get('Content-Type') || '').toLowerCase().startsWith('text/')) {
                return response.text();
            } else {
                return response;
            }
        } else {
            return Promise.reject(response);
        }
    }, function (err) {
        console.error(`request failed to url: ${request.url}`);
        throw err;
    });
}
