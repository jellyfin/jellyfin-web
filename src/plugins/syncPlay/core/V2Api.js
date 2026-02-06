/**
 * SyncPlay V2 API helpers.
 * Keeps all SyncPlay protocol writes on /SyncPlay/V2/* routes.
 */

/**
 * Gets a SyncPlay V2 URL.
 * @param {Object} apiClient The ApiClient.
 * @param {string} path The SyncPlay V2 path suffix.
 * @param {Object|undefined} query Query parameters.
 * @returns {string} Absolute URL.
 */
export function getSyncPlayV2Url(apiClient, path, query) {
    return apiClient.getUrl(`SyncPlay/V2/${path}`, query);
}

/**
 * Performs a SyncPlay V2 GET request and returns parsed JSON.
 * @param {Object} apiClient The ApiClient.
 * @param {string} path The SyncPlay V2 path suffix.
 * @param {Object|undefined} query Query parameters.
 * @returns {Promise<any>} Parsed response.
 */
export function getSyncPlayV2Json(apiClient, path, query) {
    return apiClient.getJSON(getSyncPlayV2Url(apiClient, path, query));
}

/**
 * Performs a SyncPlay V2 POST request.
 * @param {Object} apiClient The ApiClient.
 * @param {string} path The SyncPlay V2 path suffix.
 * @param {Object|undefined} payload Optional JSON payload.
 * @returns {Promise<any>} Request promise.
 */
export function postSyncPlayV2(apiClient, path, payload) {
    const request = {
        type: 'POST',
        url: getSyncPlayV2Url(apiClient, path)
    };

    if (payload !== undefined) {
        request.data = JSON.stringify(payload);
        request.contentType = 'application/json';
    }

    return apiClient.ajax(request, true);
}
