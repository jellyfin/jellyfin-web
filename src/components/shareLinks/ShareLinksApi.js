import { AUTHORIZATION_HEADER } from '@jellyfin/sdk/lib/constants';
import { getAuthorizationHeader } from '@jellyfin/sdk/lib/utils';

import { ServerConnections } from 'lib/jellyfin-apiclient';

/**
 * Error raised when the ShareLinks API returns a non-success response.
 * Carries the HTTP status and, when present, the server's
 * `X-ShareLink-Error` code (see ADR-001, decision 9).
 */
export class ShareLinkError extends Error {
    constructor(status, shareLinkErrorCode, message) {
        super(message);
        this.name = 'ShareLinkError';
        this.status = status;
        this.shareLinkErrorCode = shareLinkErrorCode;
    }
}

function getApiClient(serverId) {
    if (!serverId) {
        return ServerConnections.currentApiClient();
    }

    return ServerConnections.getApiClient(serverId);
}

function getAuthorizationHeaders(apiClient) {
    return {
        [AUTHORIZATION_HEADER]: getAuthorizationHeader(
            {
                name: ServerConnections.appName(),
                version: ServerConnections.appVersion()
            },
            {
                id: ServerConnections.deviceId(),
                name: ServerConnections.deviceName()
            },
            apiClient.accessToken()
        )
    };
}

/**
 * Converts the first character of a property name to lower case.
 * @param {string} name - Property name from the response body.
 * @returns {string} The same name starting with a lower-case character.
 */
function toCamelCase(name) {
    return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Normalises a server DTO to camelCase property names.
 *
 * The server negotiates PascalCase unless the request asks for the CamelCase
 * profile, so responses arrive as `{ "Url": ... }`. Reading `dto.url` on that
 * object yields undefined, which is how the share dialog came to put the
 * literal string "undefined" on the clipboard. Normalising here keeps every
 * caller in this module on one shape.
 * @param {*} value - Parsed response body.
 * @returns {*} The same value with camelCase property names.
 */
function normalizeKeys(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeKeys);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [toCamelCase(key), normalizeKeys(entry)])
        );
    }

    return value;
}

async function request(apiClient, url, options) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthorizationHeaders(apiClient),
            ...options.headers
        }
    });

    if (response.ok) {
        if (response.status === 204) {
            return undefined;
        }

        return response.json().then(normalizeKeys);
    }

    const shareLinkErrorCode = response.headers.get('X-ShareLink-Error');
    const errorBody = await response.text().catch(() => '');

    throw new ShareLinkError(response.status, shareLinkErrorCode, errorBody);
}

/**
 * Creates a scoped share link for an item.
 * @param {string} itemId - Id of the item to share.
 * @param {{ ExpiresAt?: string, DurationSeconds?: number }} body - Share-link
 * options; at least one of `ExpiresAt` (ISO-8601 UTC) or `DurationSeconds`
 * (60..7,776,000) is required.
 * @param {string} [serverId] - Server to target; defaults to the current server.
 * @returns {Promise<object>} The created {@link ShareLinkDto}.
 */
export async function createShareLink(itemId, body, serverId) {
    const apiClient = getApiClient(serverId);

    if (!apiClient) {
        throw new Error('No ApiClient available');
    }

    return request(apiClient, apiClient.getUrl(`Items/${itemId}/ShareLinks`), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

/**
 * Revokes (deletes) one of the current user's share links.
 * @param {string} linkId - Id of the share link to revoke.
 * @param {string} [serverId] - Server to target; defaults to the current server.
 * @returns {Promise<void>}
 */
export async function revokeShareLink(linkId, serverId) {
    const apiClient = getApiClient(serverId);

    if (!apiClient) {
        throw new Error('No ApiClient available');
    }

    return request(apiClient, apiClient.getUrl(`ShareLinks/${linkId}`), {
        method: 'DELETE'
    });
}
