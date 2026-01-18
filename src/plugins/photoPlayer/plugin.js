import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from '../../scripts/settings/userSettings';
import { PluginType } from 'types/plugin';

export default class PhotoPlayer {
    constructor() {
        this.name = 'Photo Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'photoplayer';
        this.priority = 1;
    }

    play(options) {
        return new Promise((resolve) => {
            import('../../components/slideshow/slideshow').then(({ default: Slideshow }) => {
                const index = options.startIndex || 0;

                const apiClient = ServerConnections.currentApiClient();
                apiClient.getCurrentUser().then((result) => {
                    const newSlideShow = new Slideshow({
                        showTitle: false,
                        cover: false,
                        items: options.items,
                        startIndex: index,
                        interval: 11000,
                        interactive: true,
                        // playbackManager.shuffle has no options. So treat 'shuffle' as a 'play' action
                        autoplay: {
                            delay: userSettings.slideshowInterval() * 1000
                        },
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
