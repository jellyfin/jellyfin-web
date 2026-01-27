import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from '../../scripts/settings/userSettings';
import { PluginType } from '../../types/plugin';

class BackdropScreensaver {
    name: string = 'BackdropScreensaver';
    type: any = PluginType.Screensaver;
    id: string = 'backdropscreensaver';
    supportsAnonymous: boolean = false;
    private currentSlideshow: any = null;

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
        if (!apiClient) return;
        apiClient.getItems(apiClient.getCurrentUserId(), query).then((result: any) => {
            if (result.Items?.length) {
                import('../../components/slideshow/slideshow')
                    .then(({ default: Slideshow }: any) => {
                        const newSlideShow = new Slideshow({
                            showTitle: true,
                            cover: true,
                            items: result.Items,
                            autoplay: {
                                delay: (userSettings as any).backdropScreensaverInterval() * 1000
                            }
                        });

                        newSlideShow.show();
                        this.currentSlideshow = newSlideShow;
                    })
                    .catch(console.error);
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

export { BackdropScreensaver };
export default BackdropScreensaver;
