import { ConnectionManager } from 'jellyfin-apiclient';

export default class PhotoPlayer {
    constructor() {
        this.name = 'Photo Player';
        this.type = 'mediaplayer';
        this.id = 'photoplayer';
        this.priority = 1;
    }

    play(options) {
        return new Promise(function (resolve, reject) {
            import('../../components/slideshow/slideshow').then(({default: Slideshow}) => {
                var index = options.startIndex || 0;

                var apiClient = ConnectionManager.currentApiClient();
                apiClient.getCurrentUser().then(function(result) {
                    var newSlideShow = new Slideshow({
                        showTitle: false,
                        cover: false,
                        items: options.items,
                        startIndex: index,
                        interval: 11000,
                        interactive: true,
                        user: result
                    });

                    newSlideShow.show();
                    resolve();
                });
            });
        });
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'photo';
    }
}
