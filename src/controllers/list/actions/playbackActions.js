import { playbackManager } from '../../components/playback/playbackmanager';

export function play(currentItem) {
    if (currentItem && !self.hasFilters) {
        const values = self.getSortValues();
        playbackManager.play({
            items: [currentItem],
            queryOptions: {
                SortBy: values.sortBy,
                SortOrder: values.sortOrder
            },
            autoplay: true
        });
    } else {
        getItems(self, self.params, currentItem, null, 0, 300).then((result) => {
            playbackManager.play({
                items: result.Items,
                autoplay: true
            });
        });
    }
}

export function queue(currentItem) {
    if (currentItem && !self.hasFilters) {
        playbackManager.queue({
            items: [currentItem]
        });
    } else {
        getItems(self, self.params, currentItem, null, 0, 300).then((result) => {
            playbackManager.queue({
                items: result.Items
            });
        });
    }
}

export function shuffle(currentItem) {
    if (currentItem && !self.hasFilters) {
        playbackManager.shuffle(currentItem);
    } else {
        getItems(self, self.params, currentItem, 'Random', 0, 300).then((result) => {
            playbackManager.play({
                items: result.Items,
                autoplay: true
            });
        });
    }
}
