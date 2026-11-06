import type Slideshow from 'components/slideshow/slideshow';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from 'scripts/settings/userSettings';
import { ScreensaverPlugin } from 'types/plugin';

class BackdropScreensaver extends ScreensaverPlugin {
    name = 'BackdropScreensaver';
    id = 'backdropscreensaver';
    supportsAnonymous = false;

    private currentSlideshow?: Slideshow | null;

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

        const apiClient = ServerConnections.currentApiClient()!;
        void apiClient.getItems(apiClient.getCurrentUserId(), query).then((result) => {
            if (result.Items!.length) {
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
