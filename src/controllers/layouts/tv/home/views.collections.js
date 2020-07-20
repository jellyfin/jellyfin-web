import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';

function loadAll(element, apiClient, parentId) {
    const options = {
        ParentId: parentId,
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        SortBy: 'SortName'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(({Items}) => {
        const section = element.querySelector('.allSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'portrait',
            overlayText: true,
            rows: 2,
            scalable: false,
            coverImage: true,
            showTitle: true
        });
        return;
    });
}

export class CollectionsView {
    constructor(element, apiClient, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = isRefresh => {
            if (isRefresh) {
                return Promise.resolve();
            }
            return loadAll(element, apiClient, parentId);
        };
    }

    destroy() { }
}

export default CollectionsView;
