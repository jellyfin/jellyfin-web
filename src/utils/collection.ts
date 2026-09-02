/**
 * Sets whether items in a collection are hidden from the main library.
 */
export function setHideItemsFromLibrary(
    apiClient: {
        getUrl: (name: string, params?: Record<string, string | boolean | number>) => string;
        ajax: (request: { type: string; url: string }) => Promise<unknown>;
    },
    collectionId: string,
    hide: boolean
): Promise<unknown> {
    return apiClient.ajax({
        type: 'POST',
        url: `${apiClient.getUrl(`Collections/${collectionId}/HideItemsFromLibrary`)}?hide=${hide}`
    });
}
