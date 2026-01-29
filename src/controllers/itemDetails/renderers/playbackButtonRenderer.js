import globalize from 'lib/globalize';
import itemHelper from '../../../components/itemHelper';
import { playbackManager } from '../../../components/playback/playbackmanager';
import datetime from '../../../scripts/datetime';
import { getSelectedMediaSource } from '../utils/trackHelpers';
import { hideAll } from '../utils/viewHelpers';

export function reloadPlayButtons(page, item) {
    let canPlay = false;

    if (item.Type == 'Program') {
        const now = new Date();

        if (
            now >= datetime.parseISO8601Date(item.StartDate, true) &&
            now < datetime.parseISO8601Date(item.EndDate, true)
        ) {
            hideAll(page, 'btnPlay', true);
            canPlay = true;
        } else {
            hideAll(page, 'btnPlay');
        }

        hideAll(page, 'btnReplay');
        hideAll(page, 'btnInstantMix');
        hideAll(page, 'btnShuffle');
    } else if (playbackManager.canPlay(item)) {
        hideAll(page, 'btnPlay', true);
        const enableInstantMix =
            ['Audio', 'MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(item.Type) !== -1;
        hideAll(page, 'btnInstantMix', enableInstantMix);
        const enableShuffle =
            item.IsFolder || ['MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(item.Type) !== -1;
        hideAll(page, 'btnShuffle', enableShuffle);
        canPlay = true;

        const isResumable = item.UserData && item.UserData.PlaybackPositionTicks > 0;
        hideAll(page, 'btnReplay', isResumable);

        for (const btnPlay of page.querySelectorAll('.btnPlay')) {
            if (isResumable) {
                btnPlay.title = globalize.translate('ButtonResume');
            } else {
                btnPlay.title = globalize.translate('Play');
            }
        }
    } else {
        hideAll(page, 'btnPlay');
        hideAll(page, 'btnReplay');
        hideAll(page, 'btnInstantMix');
        hideAll(page, 'btnShuffle');
    }

    return canPlay;
}

export function setTrailerButtonVisibility(page, item) {
    if (
        (item.LocalTrailerCount || item.RemoteTrailers?.length) &&
        playbackManager.getSupportedCommands().indexOf('PlayTrailers') !== -1
    ) {
        hideAll(page, 'btnPlayTrailer', true);
    } else {
        hideAll(page, 'btnPlayTrailer');
    }
}
