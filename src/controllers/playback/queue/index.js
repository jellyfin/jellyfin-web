import RemoteControl from '@/components/remotecontrol/remotecontrol';
import { playbackManager } from '@/components/playback/playbackmanager';
import libraryMenu from '@/scripts/libraryMenu';
import '@/elements/emby-button/emby-button';
import '@/elements/emby-button/paper-icon-button-light';
import '@/elements/emby-collapse/emby-collapse';
import '@/elements/emby-input/emby-input';
import '@/elements/emby-itemscontainer/emby-itemscontainer';
import '@/elements/emby-slider/emby-slider';

export default function (view) {
    const remoteControl = new RemoteControl();
    remoteControl.init(view, view.querySelector('.remoteControlContent'));

    let currentPlayer;

    function onKeyDown(e) {
        if (e.keyCode === 32 && e.target.tagName !== 'BUTTON') {
            playbackManager.playPause(currentPlayer);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;
        if (player) currentPlayer = null;
    }

    function bindToPlayer(player) {
        if (player !== currentPlayer) {
            releaseCurrentPlayer();
            currentPlayer = player;
        }
    }

    view.addEventListener('viewshow', function () {
        libraryMenu.setTransparentMenu(true);
        bindToPlayer(playbackManager.getCurrentPlayer());
        document.addEventListener('keydown', onKeyDown);

        if (remoteControl) {
            remoteControl.onShow();
        }
    });

    view.addEventListener('viewbeforehide', function () {
        libraryMenu.setTransparentMenu(false);
        document.removeEventListener('keydown', onKeyDown);
        releaseCurrentPlayer();

        if (remoteControl) {
            remoteControl.destroy();
        }
    });
}
