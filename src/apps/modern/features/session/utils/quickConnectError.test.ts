import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { getQuickConnectFailure, isTransientQuickConnectError } from './quickConnectError';

const config = {} as InternalAxiosRequestConfig;

const httpError = (status: number) => new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { status, config } as AxiosResponse
);

const networkError = () => new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
const timeoutError = () => new AxiosError('timeout of 1000ms exceeded', AxiosError.ECONNABORTED, config);

describe('getQuickConnectFailure', () => {
    it.each([
        [ 'a network error', networkError() ],
        [ 'a timeout', timeoutError() ],
        [ 'a request timeout response', httpError(408) ],
        [ 'a rate limit response', httpError(429) ],
        [ 'a server error', httpError(500) ],
        [ 'a bad gateway', httpError(502) ],
        [ 'an unavailable server', httpError(503) ]
    ])('treats %s as unreachable', (_, error) => {
        expect(getQuickConnectFailure(error)).toBe('unreachable');
        expect(isTransientQuickConnectError(error)).toBe(true);
    });

    it('treats an unauthorized response as quick connect being disabled', () => {
        expect(getQuickConnectFailure(httpError(401))).toBe('disabled');
        expect(isTransientQuickConnectError(httpError(401))).toBe(false);
    });

    it('treats a not found response as an expired request', () => {
        expect(getQuickConnectFailure(httpError(404))).toBe('expired');
        expect(isTransientQuickConnectError(httpError(404))).toBe(false);
    });

    it.each([
        [ 'a bad request', httpError(400) ],
        [ 'a forbidden response', httpError(403) ],
        [ 'a plain error', new Error('Malformed quick connect response') ],
        [ 'a non-error value', 'oops' ],
        [ 'undefined', undefined ]
    ])('treats %s as a plain failure', (_, error) => {
        expect(getQuickConnectFailure(error)).toBe('failed');
        expect(isTransientQuickConnectError(error)).toBe(false);
    });
});
