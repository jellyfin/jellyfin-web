import browser from '../../../scripts/browser';
import alert from '../../../components/alert';
import globalize from '../../../lib/globalize';

class PlaybackPermissionManager {
    private checkPromise: Promise<void> | null = null;

    check(): Promise<void> {
        if (this.checkPromise) {
            return this.checkPromise;
        }

        if (browser.safari) {
            this.checkPromise = alert({
                title: globalize.translate('HeaderSyncPlayPlaybackPermission'),
                text: globalize.translate('MessageSyncPlayPlaybackPermissionSafari')
            });
            return this.checkPromise;
        }

        return Promise.resolve();
    }
}

const playbackPermissionManager = new PlaybackPermissionManager();
export default playbackPermissionManager;
