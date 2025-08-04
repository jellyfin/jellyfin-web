import { ServerConnections } from 'lib/jellyfin-apiclient';
import { PluginType } from 'types/plugin.ts';

export default class PhotoPlayer {
    constructor() {
        this.name = 'Photo Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'photoplayer';
        this.priority = 1;
    }

    play(options) {
        return new Promise(function (resolve) {
            import('../../components/slideshow/slideshow').then(
                ({ default: Slideshow }) => {
                    const index = options.startIndex || 0;

                    const apiClient = ServerConnections.currentApiClient();
                    apiClient.getCurrentUser().then(function (result) {
                        const newSlideShow = new Slideshow({
                            showTitle: false,
                            cover: false,
                            items: options.items,
                            startIndex: index,
                            interval: 11000,
                            interactive: true,
                            // playbackManager.shuffle has no options. So treat 'shuffle' as a 'play' action
                            autoplay: options.autoplay || options.shuffle,
                            user: result
                        });

                        newSlideShow.show();
                        resolve();
                    });
                }
            );
        });
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'photo';
    }
}
