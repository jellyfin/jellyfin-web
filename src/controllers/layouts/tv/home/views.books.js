import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';

function loadAll(element, apiClient, parentId) {
    const options = {
        ParentId: parentId,
        IncludeItemTypes: 'Book',
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        SortBy: 'SortName',
        Fields: 'PrimaryImageAspectRatio,ProductionYear,CommunityRating',
        ImageTypeLimit: 1
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

export class BooksView {
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

    destroy() {}
}

export default BooksView;
