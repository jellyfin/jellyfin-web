import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { toLoggableError } from './loggableError';

const TYPED_TEXT = 'correct horse';
const SECRET = 'quick-connect-secret';

describe('toLoggableError', () => {
    it('only keeps the safe fields of request errors', () => {
        const config = {
            url: `/QuickConnect/Connect?secret=${SECRET}`,
            data: JSON.stringify({ Username: 'alice', Pw: TYPED_TEXT }),
            headers: new AxiosHeaders({ Authorization: 'MediaBrowser Token="token"' })
        } as InternalAxiosRequestConfig;
        const error = new AxiosError(
            'Request failed with status code 500',
            AxiosError.ERR_BAD_RESPONSE,
            config,
            { url: config.url },
            { status: 500, data: { secret: SECRET }, config } as AxiosResponse
        );

        const loggable = toLoggableError(error);

        expect(loggable).toEqual({
            name: 'AxiosError',
            message: 'Request failed with status code 500',
            code: AxiosError.ERR_BAD_RESPONSE,
            status: 500
        });
        expect(loggable).not.toHaveProperty('config');
        expect(loggable).not.toHaveProperty('request');
        expect(loggable).not.toHaveProperty('data');
        expect(loggable).not.toHaveProperty('response');
        const serialized = JSON.stringify(loggable);
        expect(serialized).not.toContain(TYPED_TEXT);
        expect(serialized).not.toContain(SECRET);
        expect(serialized).not.toContain('token');
    });

    it('keeps the name and message of plain errors', () => {
        expect(toLoggableError(new TypeError('Cannot read properties of undefined'))).toEqual({
            name: 'TypeError',
            message: 'Cannot read properties of undefined'
        });
    });

    it.each([
        [ 'a string', 'Network Error', { message: 'Network Error' } ],
        [ 'undefined', undefined, {} ],
        [ 'null', null, {} ],
        [ 'an object with non-string fields', { message: { data: TYPED_TEXT }, response: { status: '500' } }, {} ]
    ])('handles %s', (_, error, expected) => {
        expect(toLoggableError(error)).toEqual(expected);
    });
});
