import browser from 'browser';
import require from 'require';
import events from 'events';
import appHost from 'apphost';
import loading from 'loading';
import dom from 'dom';
import playbackManager from 'playbackManager';
import appRouter from 'appRouter';
import connectionManager from 'connectionManager';

export class PhotoPlayer {
    constructor() {
        this.name = 'Photo Player';
        this.type = 'mediaplayer';
        this.id = 'photoplayer';
        this.priority = 1;
    }

    play(options) {

        return new Promise(function (resolve, reject) {

            require(['slideshow'], function (slideshow) {

                var index = options.startIndex || 0;

                var apiClient = connectionManager.currentApiClient();

                apiClient.getCurrentUser().then(function(result) {

                    var newSlideShow = new slideshow({
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

export default PhotoPlayer;
