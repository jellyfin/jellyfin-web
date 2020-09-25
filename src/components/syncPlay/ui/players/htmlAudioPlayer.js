/**
 * Module that manages the HtmlAudioPlayer for SyncPlay.
 * @module components/syncPlay/players/htmlAudioPlayer
 */

import SyncPlayHtmlVideoPlayer from './htmlVideoPlayer';

/**
 * Class that manages the HtmlAudioPlayer for SyncPlay.
 */
class SyncPlayHtmlAudioPlayer extends SyncPlayHtmlVideoPlayer {
    static type = 'htmlaudioplayer';

    constructor(player, syncPlayManager) {
        super(player, syncPlayManager);
    }
}

export default SyncPlayHtmlAudioPlayer;
