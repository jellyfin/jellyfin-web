import connectionManager from 'connectionManager';

export function getlogoImageUrl(item, options) {

    const apiClient = connectionManager.getApiClient(item.ServerId);

    options = options || {};
    options.type = options.type || "Logo";

    if (!options.maxWidth && !options.width && !options.maxHeight && !options.height) {
        options.quality = 100;
    }

    if (item.ImageTags && item.ImageTags.Logo) {

        options.tag = item.ImageTags.Logo;
        return apiClient.getScaledImageUrl(item.Id, options);
    }

    if (item.ParentLogoImageTag) {
        options.tag = item.ParentLogoImageTag;
        return apiClient.getScaledImageUrl(item.ParentLogoItemId, options);
    }

    return null;
}

export function getbackdropImageUrl(item, options) {

    const apiClient = connectionManager.getApiClient(item.ServerId);

    options = options || {};
    options.type = options.type || "Backdrop";

    // If not resizing, get the original image
    if (!options.maxWidth && !options.width && !options.maxHeight && !options.height) {
        options.quality = 100;
    }

    if (item.BackdropImageTags && item.BackdropImageTags.length) {

        options.tag = item.BackdropImageTags[0];
        return apiClient.getScaledImageUrl(item.Id, options);
    }

    return null;
}

export default {
    getlogoImageUrl: getlogoImageUrl,
    getbackdropImageUrl: getbackdropImageUrl
};

