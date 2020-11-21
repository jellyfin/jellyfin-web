/* eslint-disable indent */
import ServerConnections from '../../components/ServerConnections';

class BackdropScreensaver {
    constructor() {
        this.name = 'Backdrop ScreenSaver';
        this.type = 'screensaver';
        this.id = 'backdropscreensaver';
        this.supportsAnonymous = false;
    }
        show() {
            const query = {
                ImageTypes: 'Backdrop',
                EnableImageTypes: 'Backdrop',
                IncludeItemTypes: 'Movie,Series,MusicArtist',
                SortBy: 'Random',
                Recursive: true,
                Fields: 'Taglines',
                ImageTypeLimit: 1,
                StartIndex: 0,
                Limit: 200
            };

            const apiClient = ServerConnections.currentApiClient();
            apiClient.getItems(apiClient.getCurrentUserId(), query).then((result) => {
                if (result.Items.length) {
                    import('../../components/slideshow/slideshow').then(({default: Slideshow}) => {
                        const newSlideShow = new Slideshow({
                            showTitle: true,
                            cover: true,
                            items: result.Items
                        });

                        newSlideShow.show();
                        this.currentSlideshow = newSlideShow;
                    }).catch(console.error);
                }
            });
        }

        hide() {
            if (this.currentSlideshow) {
                this.currentSlideshow.hide();
                this.currentSlideshow = null;
            }
            return Promise.resolve();
        }
    }
/* eslint-enable indent */

export default BackdropScreensaver;
