import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getRequestErrorStatus } from './requestErrorStatus';

const axiosErrorWithStatus = (status: number) => new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
        status,
        statusText: '',
        data: {},
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() }
    }
);

describe('getRequestErrorStatus', () => {
    it('returns the response status from an AxiosError', () => {
        expect(getRequestErrorStatus(axiosErrorWithStatus(401))).toBe(401);
    });

    it('returns undefined for an AxiosError with no response (network error)', () => {
        expect(getRequestErrorStatus(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined();
    });

    it('returns undefined for a programming error thrown in the queryFn (e.g. TypeError)', () => {
        expect(getRequestErrorStatus(new TypeError('Cannot read properties of undefined'))).toBeUndefined();
    });

    it('returns undefined for non-axios errors', () => {
        expect(getRequestErrorStatus(new Error('boom'))).toBeUndefined();
        expect(getRequestErrorStatus('nope')).toBeUndefined();
        expect(getRequestErrorStatus(null)).toBeUndefined();
    });
});
