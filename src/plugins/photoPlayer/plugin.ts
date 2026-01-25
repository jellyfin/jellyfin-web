import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from '../../scripts/settings/userSettings';
import { PluginType } from '../../types/plugin';

export default class PhotoPlayer {
    name: string = 'Photo Player';
    type: any = PluginType.MediaPlayer;
    id: string = 'photoplayer';
    isLocalPlayer: boolean = true;
    priority: number = 1;

    play(options: any): Promise<void> {
        return new Promise(resolve => {
            import('../../components/slideshow/slideshow').then(({ default: Slideshow }: any) => {
                const index = options.startIndex || 0;
                const apiClient = ServerConnections.currentApiClient();

                apiClient.getCurrentUser().then((result: any) => {
                    const newSlideShow = new Slideshow({
                        showTitle: false,
                        cover: false,
                        items: options.items,
                        startIndex: index,
                        interval: 11000,
                        interactive: true,
                        autoplay: {
                            delay: (userSettings as any).slideshowInterval() * 1000
                        },
                        user: result
                    });

                    newSlideShow.show();
                    resolve();
                });
            });
        });
    }

    canPlayMediaType(mediaType: string): boolean {
        return (mediaType || '').toLowerCase() === 'photo';
    }
}
