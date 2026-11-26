import { describe, expect, it } from 'vitest';

import { isPlaybackLimitError, isPlaybackLimitResponse, PLAYBACK_LIMIT_ERROR_CODE, PlaybackLimitError } from './playbackLimit';

describe('video playback limit HTTP errors', () => {
    it('recognizes a normalized playback limit error', async () => {
        await expect(isPlaybackLimitError(new PlaybackLimitError())).resolves.toBe(true);
    });

    it('recognizes the header on an Axios error regardless of header casing', async () => {
        const error = { response: { status: 403, headers: { 'X-Jellyfin-Error-Code': PLAYBACK_LIMIT_ERROR_CODE } } };

        await expect(isPlaybackLimitError(error)).resolves.toBe(true);
    });

    it('recognizes the parsed body of an Axios error without the header', async () => {
        const error = { response: { status: 403, data: { ErrorCode: PLAYBACK_LIMIT_ERROR_CODE } } };

        await expect(isPlaybackLimitError(error)).resolves.toBe(true);
    });

    it('recognizes the header on a Fetch response without reading the body', async () => {
        const response = new Response('ignored', {
            status: 403,
            headers: { 'X-Jellyfin-Error-Code': PLAYBACK_LIMIT_ERROR_CODE }
        });

        await expect(isPlaybackLimitError(response)).resolves.toBe(true);
        expect(response.bodyUsed).toBe(false);
    });

    it('recognizes the body of a Fetch response without consuming the original body', async () => {
        const response = new Response(JSON.stringify({ errorCode: PLAYBACK_LIMIT_ERROR_CODE }), { status: 403 });

        await expect(isPlaybackLimitError(response)).resolves.toBe(true);
        expect(response.bodyUsed).toBe(false);
    });

    it('recognizes a binary XHR segment error body in hls.js network details', async () => {
        const xhr = new XMLHttpRequest();
        const data = JSON.stringify({ ErrorCode: PLAYBACK_LIMIT_ERROR_CODE });
        const bytes = Uint8Array.from(data, char => char.charCodeAt(0));
        Object.defineProperties(xhr, {
            status: { value: 403 },
            responseType: { value: 'arraybuffer' },
            response: { value: bytes.buffer }
        });

        expect(isPlaybackLimitResponse(xhr)).toBe(true);
        await expect(isPlaybackLimitError({ response: { code: 403 }, networkDetails: xhr })).resolves.toBe(true);
    });

    it('recognizes a Fetch response retained by hls.js', async () => {
        const response = new Response(JSON.stringify({ ErrorCode: PLAYBACK_LIMIT_ERROR_CODE }), { status: 403 });

        await expect(isPlaybackLimitError({ response: { code: 403 }, networkDetails: response })).resolves.toBe(true);
    });

    it.each([
        { status: 401, data: { ErrorCode: PLAYBACK_LIMIT_ERROR_CODE } },
        { status: 200, headers: { 'x-jellyfin-error-code': PLAYBACK_LIMIT_ERROR_CODE } },
        { status: 403, data: { ErrorCode: 'AccessDenied' } },
        { status: 403, data: PLAYBACK_LIMIT_ERROR_CODE },
        new Response('Forbidden', { status: 403 }),
        { name: 'NotSupportedError', message: PLAYBACK_LIMIT_ERROR_CODE }
    ])('ignores unrelated failures and opaque player errors %#', async error => {
        await expect(isPlaybackLimitError(error)).resolves.toBe(false);
    });
});
