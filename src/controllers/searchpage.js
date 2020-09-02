import SearchFields from 'searchFields';
import SearchResults from 'searchResults';
import events from 'events';

export default function (view, params) {
    function onSearch(e, value) {
        self.searchResults.search(value);
    }

    const self = this;
    view.addEventListener('viewshow', function () {
        if (!self.searchFields) {
            self.searchFields = new SearchFields({
                element: view.querySelector('.searchFields')
            });
            self.searchResults = new SearchResults({
                element: view.querySelector('.searchResults'),
                serverId: params.serverId || ApiClient.serverId(),
                parentId: params.parentId,
                collectionType: params.collectionType
            });
            events.on(self.searchFields, 'search', onSearch);
        }
    });
    view.addEventListener('viewdestroy', function () {
        if (self.searchFields) {
            self.searchFields.destroy();
            self.searchFields = null;
        }

        if (self.searchResults) {
            self.searchResults.destroy();
            self.searchResults = null;
        }
    });
}
