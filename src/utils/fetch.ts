import { logger } from './logger';

export interface AjaxOptions {
    url: string;
    type?: string;
    headers?: Record<string, string>;
    dataType?: 'json' | 'text' | 'blob';
    contentType?: string;
    data?: any;
    query?: Record<string, string | number | boolean>;
    timeout?: number;
}

export function getFetchPromise(request: AjaxOptions): Promise<Response> {
    const headers = request.headers || {};

    if (request.dataType === 'json') {
        headers.accept = 'application/json';
    }

    const fetchRequest: RequestInit = {
        headers: headers,
        method: request.type || 'GET',
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
            url += (url.includes('?') ? '&' : '?') + paramString;
        }
    }

    if (!request.timeout) {
        return fetch(url, fetchRequest);
    }

    return fetchWithTimeout(url, fetchRequest, request.timeout);
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    logger.debug(`fetchWithTimeout: timeoutMs: ${timeoutMs}, url: ${url}`, { component: 'Fetch' });

    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const requestOptions = {
            ...options,
            signal: controller.signal
        };

        fetch(url, requestOptions).then(
            (response) => {
                clearTimeout(timeout);
                logger.debug(`fetchWithTimeout: succeeded connecting to url: ${url}`, {
                    component: 'Fetch'
                });
                resolve(response);
            },
            (error) => {
                clearTimeout(timeout);
                logger.debug(`fetchWithTimeout: failed connecting to url: ${url}`, {
                    component: 'Fetch'
                });
                reject(error);
            }
        );
    });
}

/**
 * Converts parameters to query string.
 */
function paramsToString(params: Record<string, any>): string {
    return Object.entries(params)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

export function ajax(request: AjaxOptions): Promise<any> {
    if (!request) {
        throw new Error('Request cannot be null');
    }

    request.headers = request.headers || {};
    logger.debug(`requesting url: ${request.url}`, { component: 'Fetch' });

    return getFetchPromise(request).then(
        (response) => {
            logger.debug(`response status: ${response.status}, url: ${request.url}`, {
                component: 'Fetch'
            });

            if (response.status < 400) {
                if (
                    request.dataType === 'json' ||
                    request.headers?.accept === 'application/json' ||
                    (response.headers.get('Content-Type') || '')
                        .toLowerCase()
                        .includes('application/json')
                ) {
                    return response.json();
                } else if (
                    request.dataType === 'text' ||
                    (response.headers.get('Content-Type') || '').toLowerCase().startsWith('text/')
                ) {
                    return response.text();
                } else if (request.dataType === 'blob') {
                    return response.blob();
                } else {
                    return response;
                }
            } else {
                return Promise.reject(response);
            }
        },
        (err) => {
            logger.error(`request failed to url: ${request.url}`, { component: 'Fetch' }, err);
            throw err;
        }
    );
}

const fetchHelper = {
    getFetchPromise,
    ajax
};

export default fetchHelper;
