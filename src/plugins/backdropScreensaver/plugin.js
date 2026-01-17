
import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from 'scripts/settings/userSettings';
import { PluginType } from 'types/plugin';

class BackdropScreensaver {
    constructor() {
        this.name = 'BackdropScreensaver';
        this.type = PluginType.Screensaver;
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
            ImageTypeLimit: 10,
            StartIndex: 0,
            Limit: 200
        };

        const apiClient = ServerConnections.currentApiClient();
        apiClient.getItems(apiClient.getCurrentUserId(), query).then((result) => {
            if (result.Items.length) {
                import('../../components/slideshow/slideshow').then(({ default: Slideshow }) => {
                    const newSlideShow = new Slideshow({
                        showTitle: true,
                        cover: true,
                        items: result.Items,
                        autoplay: {
                            delay: userSettings.backdropScreensaverInterval() * 1000
                        }
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

export default BackdropScreensaver;
