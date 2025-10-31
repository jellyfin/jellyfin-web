
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { backdropScreensaverInterval } from 'scripts/settings/userSettings';
import { PluginType } from 'types/plugin.ts';

export default class BackdropScreensaver {
    name: string;
    type: PluginType;
    id: string;
    supportsAnonymous: boolean;
    currentSlideshow: any = null;
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
        apiClient?.getItems(apiClient.getCurrentUserId(), query).then((result) => {
            if (result.Items?.length) {
                import('../../components/slideshow/slideshow').then(({ default: Slideshow }) => {
                    const newSlideShow = new Slideshow({
                        showTitle: true,
                        cover: true,
                        items: result.Items,
                        autoplay: {
                            delay: backdropScreensaverInterval() * 1000
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
