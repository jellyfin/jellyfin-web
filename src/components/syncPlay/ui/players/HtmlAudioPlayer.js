/**
 * Module that manages the HtmlAudioPlayer for SyncPlay.
 * @module components/syncPlay/ui/players/HtmlAudioPlayer
 */

import HtmlVideoPlayer from './HtmlVideoPlayer';

/**
 * Class that manages the HtmlAudioPlayer for SyncPlay.
 */
class HtmlAudioPlayer extends HtmlVideoPlayer {
    static type = 'htmlaudioplayer';

    constructor(player, syncPlayManager) {
        super(player, syncPlayManager);
    }
}

export default HtmlAudioPlayer;
