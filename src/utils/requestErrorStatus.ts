import { isAxiosError } from 'axios';

/**
 * Reads the HTTP status code from an axios request error. The Jellyfin SDK makes
 * its calls through axios, so this covers any SDK request failure. Returns
 * undefined when there is no HTTP response, such as a network error.
 */
export const getRequestErrorStatus = (error: unknown): number | undefined => {
    if (isAxiosError(error)) return error.response?.status;
    return undefined;
};
