import connectionManager from "connectionManager";
import cardBuilder from "cardBuilder";
import focusManager from "focusManager";

function playlists(options) {
    options = options || ({});
    options.parentId = null;
    delete options.parentId;
    options.recursive = true;
    return new Promise((resolve, reject) => {
        const apiClient = connectionManager.currentApiClient();
        options.IncludeItemTypes = "Playlist";
        normalizeOptions(options);
        return apiClient.getJSON(apiClient.getUrl("Users/" + apiClient.getCurrentUserId() + "/Items", options)).then(resolve, reject);
    });
}

function normalizeOptions(options) {
    options.Fields = options.Fields ? options.Fields + ",PrimaryImageAspectRatio" : "PrimaryImageAspectRatio";
    options.ImageTypeLimit = 1;
}

function loadAll(element, parentId) {
    const options = {
        ParentId: parentId,
        EnableImageTypes: "Primary,Backdrop,Thumb",
        SortBy: "SortName"
    };
    return playlists(options).then(result => {
        const section = element.querySelector(".allSection");
        if (!section) {
            return;
        }
        cardBuilder.buildCards(result.Items, {
            parentContainer: section,
            itemsContainer: section.querySelector(".itemsContainer"),
            shape: "auto",
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

export class view {
    constructor(element, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = isRefresh => {
            if (isRefresh) {
                return Promise.resolve();
            }
            return loadAll(element, parentId);
        };
        this.destroy = () => { };
    }
}

export default view;
