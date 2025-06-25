export function getFetchPromise(request: Request) {
    const headers = request.headers || {};

    if (request.dataType === 'json') {
        headers.accept = 'application/json';
    }

    const fetchRequest = {
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

function fetchWithTimeout(url: string, options: RequestInit | undefined, timeoutMs: number): Promise<Response> {
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

function paramsToString(params: Record<string, string | number | boolean>): string {
    return Object.entries(params)
         // eslint-disable-next-line sonarjs/different-types-comparison
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

export function ajax(request: Request) {
    if (!request) {
        throw new Error('Request cannot be null');
    }

    request.headers = request.headers || {};

    console.debug(`requesting url: ${request.url}`);

    return getFetchPromise(request).then(function (response) {
        console.debug(`response status: ${response.status}, url: ${request.url}`);
        if (response.status < 400) {
            if (request.dataType === 'json' || request.headers.accept === 'application/json') {
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
