import browser from '../../../scripts/browser';
import alert from '../../../components/alert';
import globalize from '../../../lib/globalize';

class PlaybackPermissionManager {
    private checkPromise?: Promise<void>;

    check(): Promise<void> {
        if (this.checkPromise) {
            return this.checkPromise;
        }

        if (browser.safari) {
            this.checkPromise = alert({
                title: globalize.translate('HeaderSyncPlayPlaybackPermission'),
                text: globalize.translate('MessageSyncPlayPlaybackPermissionSafari')
            }).then(() => undefined);
            return this.checkPromise;
        }

        this.checkPromise = Promise.resolve();
        return this.checkPromise;
    }
}

const playbackPermissionManager = new PlaybackPermissionManager();
export default playbackPermissionManager;
