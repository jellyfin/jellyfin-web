import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ajax, type AjaxRequest, getFetchPromise } from './fetch';

const createResponse = ({
    status = 200,
    contentType = null,
    json = {},
    text = ''
}: {
    status?: number
    contentType?: string | null
    json?: unknown
    text?: string
} = {}) => ({
    status,
    headers: {
        get: vi.fn().mockReturnValue(contentType)
    },
    json: vi.fn().mockResolvedValue(json),
    text: vi.fn().mockResolvedValue(text)
}) as unknown as Response;

describe('Utils: fetch', () => {
    let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

    beforeEach(() => {
        fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'debug').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('Method: getFetchPromise', () => {
        it('should send the request with same-origin credentials', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await expect(getFetchPromise({
                url: '/Items',
                type: 'GET'
            })).resolves.toBe(response);

            expect(fetchMock).toHaveBeenCalledOnce();
            expect(fetchMock).toHaveBeenCalledWith('/Items', {
                headers: {},
                method: 'GET',
                credentials: 'same-origin'
            });
        });

        it('should preserve custom headers and request JSON responses', async () => {
            const response = createResponse();
            const headers = {
                accept: 'text/plain',
                Authorization: 'MediaBrowser token'
            };
            fetchMock.mockResolvedValue(response);

            await getFetchPromise({
                url: '/Users/Me',
                type: 'GET',
                dataType: 'json',
                headers
            });

            expect(fetchMock).toHaveBeenCalledWith('/Users/Me', expect.objectContaining({
                headers: {
                    accept: 'application/json',
                    Authorization: 'MediaBrowser token'
                }
            }));
        });

        it('should serialize form data and omit empty values', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await getFetchPromise({
                url: '/Search',
                type: 'POST',
                data: {
                    'search term': 'rock & roll',
                    zero: 0,
                    enabled: false,
                    empty: '',
                    // @ts-expect-error -- Legacy code that uses null value in form data.
                    nil: null,
                    // @ts-expect-error -- Legacy code that uses undefined value in form data.
                    missing: undefined
                }
            });

            expect(fetchMock).toHaveBeenCalledWith('/Search', {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                method: 'POST',
                credentials: 'same-origin',
                body: 'search%20term=rock%20%26%20roll&zero=0&enabled=false'
            });
        });

        it('should preserve string bodies and an explicit content type', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await getFetchPromise({
                url: '/Items',
                type: 'POST',
                data: '{"Name":"Test"}',
                contentType: 'application/json'
            });

            expect(fetchMock).toHaveBeenCalledWith('/Items', {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                credentials: 'same-origin',
                body: '{"Name":"Test"}'
            });
        });

        it('should append an encoded query and omit empty query values', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await getFetchPromise({
                url: '/Items',
                type: 'GET',
                query: {
                    userId: 'a/b',
                    startIndex: 0,
                    recursive: false,
                    searchTerm: '',
                    // @ts-expect-error -- Legacy code that uses null value in query.
                    parentId: null
                }
            });

            expect(fetchMock).toHaveBeenCalledWith(
                '/Items?userId=a%2Fb&startIndex=0&recursive=false',
                expect.any(Object)
            );
        });

        it('should not append a query marker when all query values are empty', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await getFetchPromise({
                url: '/Items',
                type: 'GET',
                // @ts-expect-error -- Legacy code that uses empty query values.
                query: { searchTerm: '', parentId: null }
            });

            expect(fetchMock).toHaveBeenCalledWith('/Items', expect.any(Object));
        });

        it('should resolve before the timeout and clear its timer', async () => {
            vi.useFakeTimers();
            const response = createResponse();
            let resolveFetch: ((value: Response) => void) | undefined;
            fetchMock.mockReturnValue(new Promise(resolve => {
                resolveFetch = resolve;
            }));

            const request = getFetchPromise({
                url: '/System/Info',
                type: 'GET',
                timeout: 500
            });

            expect(vi.getTimerCount()).toBe(1);
            resolveFetch?.(response);

            await expect(request).resolves.toBe(response);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('should preserve a fetch rejection and clear its timeout', async () => {
            vi.useFakeTimers();
            const error = new TypeError('Network error');
            fetchMock.mockRejectedValue(error);

            const request = getFetchPromise({
                url: '/System/Info',
                type: 'GET',
                timeout: 500
            });

            await expect(request).rejects.toBe(error);
            expect(vi.getTimerCount()).toBe(0);
        });

        it('should reject when the timeout elapses', async () => {
            vi.useFakeTimers();
            fetchMock.mockReturnValue(new Promise(() => undefined));

            const request = getFetchPromise({
                url: '/System/Info',
                type: 'GET',
                timeout: 500
            });
            const settled = request.then(
                () => 'resolved',
                () => 'rejected'
            );

            await vi.advanceTimersByTimeAsync(500);

            await expect(settled).resolves.toBe('rejected');
        });
    });

    describe('Method: ajax', () => {
        it('should throw when the request is missing', () => {
            // @ts-expect-error -- Modern code should not pass null, but legacy code might.
            expect(() => ajax(null)).toThrowError('Request cannot be null');
        });

        it('should parse a requested JSON response', async () => {
            const data = { Id: 'item-id', Name: 'Test Item' };
            const response = createResponse({ json: data });
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Items/item-id',
                type: 'GET',
                dataType: 'json'
            })).resolves.toEqual(data);

            expect(response.json).toHaveBeenCalledOnce();
            expect(response.text).not.toHaveBeenCalled();
        });

        it('should parse JSON when requested by an Accept header', async () => {
            const data = { Items: [] };
            const response = createResponse({ json: data });
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Items',
                type: 'GET',
                headers: { accept: 'application/json' }
            })).resolves.toEqual(data);

            expect(response.json).toHaveBeenCalledOnce();
        });

        it.each([
            [
                'an explicit text data type',
                { dataType: 'text' } satisfies Partial<AjaxRequest>,
                'application/octet-stream'
            ],
            [
                'a case-insensitive text content type',
                {} satisfies Partial<AjaxRequest>,
                'Text/Plain; Charset=UTF-8'
            ]
        ])('should parse text for %s', async (
            _description,
            requestProperties,
            contentType
        ) => {
            const response = createResponse({
                contentType,
                text: 'server response'
            });
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Branding/Css',
                type: 'GET',
                ...requestProperties
            })).resolves.toBe('server response');

            expect(response.text).toHaveBeenCalledOnce();
            expect(response.json).not.toHaveBeenCalled();
        });

        it('should return non-text responses without consuming the body', async () => {
            const response = createResponse();
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Videos/item/stream',
                type: 'GET'
            })).resolves.toBe(response);

            expect(response.json).not.toHaveBeenCalled();
            expect(response.text).not.toHaveBeenCalled();
        });

        it('should reject with the response for an HTTP error', async () => {
            const response = createResponse({ status: 400 });
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Items/missing',
                type: 'GET',
                dataType: 'json'
            })).rejects.toBe(response);

            expect(response.json).not.toHaveBeenCalled();
            expect(response.text).not.toHaveBeenCalled();
        });

        it('should preserve a network error', async () => {
            const error = new TypeError('Failed to fetch');
            fetchMock.mockRejectedValue(error);

            await expect(ajax({
                url: '/System/Info',
                type: 'GET'
            })).rejects.toBe(error);

            expect(console.error).toHaveBeenCalledWith(
                'request failed to url: /System/Info'
            );
        });

        it('should preserve response parsing errors', async () => {
            const error = new SyntaxError('Invalid JSON');
            const response = createResponse();
            vi.mocked(response.json).mockRejectedValue(error);
            fetchMock.mockResolvedValue(response);

            await expect(ajax({
                url: '/Items',
                type: 'GET',
                dataType: 'json'
            })).rejects.toBe(error);
        });
    });
});
