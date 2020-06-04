import connectionManager from 'connectionManager';

export function getlogoImageUrl(item, options) {

    const apiClient = connectionManager.getApiClient(item.ServerId);

    options = options || {};
    options.type = options.type || 'Logo';

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

export function getbackdropImageUrl({ServerId, BackdropImageTags, Id}, options) {

    const apiClient = connectionManager.getApiClient(ServerId);

    options = options || {};
    options.type = options.type || 'Backdrop';

    // If not resizing, get the original image
    if (!options.maxWidth && !options.width && !options.maxHeight && !options.height) {
        options.quality = 100;
    }

    if (BackdropImageTags && BackdropImageTags.length) {

        options.tag = BackdropImageTags[0];
        return apiClient.getScaledImageUrl(Id, options);
    }

    return null;
}

export function getplaylists(options = {}) {
    options.parentId = null;
    delete options.parentId;
    options.recursive = true;
    return new Promise((resolve, reject) => {
        const apiClient = connectionManager.currentApiClient();
        options.IncludeItemTypes = 'Playlist';
        normalizeOptions(options);
        return apiClient.getJSON(apiClient.getUrl(`Users/${apiClient.getCurrentUserId()}/Items`, options)).then(resolve, reject);
    });
}

function normalizeOptions(options) {
    options.Fields = options.Fields ? `${options.Fields},PrimaryImageAspectRatio` : 'PrimaryImageAspectRatio';
    options.ImageTypeLimit = 1;
}

export default {
    getlogoImageUrl: getlogoImageUrl,
    getbackdropImageUrl: getbackdropImageUrl,
    getplaylists: getplaylists
};

