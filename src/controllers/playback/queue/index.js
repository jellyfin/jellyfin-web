import remotecontrolFactory from 'components/remotecontrol/remotecontrol';
import libraryMenu from 'libraryMenu';
import layoutManager from 'layoutManager';
import * as userSettings from 'userSettings';
import 'emby-button';

export default function (view, params) {
    const remoteControl = new remotecontrolFactory();
    remoteControl.init(view, view.querySelector('.remoteControlContent'));
    view.addEventListener('viewbeforeshow', function (e) {
        document.body.classList.remove('stickyDrawer');
    });
    view.addEventListener('viewshow', function (e) {
        libraryMenu.setTransparentMenu(true);

        if (remoteControl) {
            remoteControl.onShow();
        }
    });
    view.addEventListener('viewbeforehide', function (e) {
        libraryMenu.setTransparentMenu(false);

        if (layoutManager.desktop && userSettings.enableStickyDrawer()) {
            document.body.classList.add('stickyDrawer');
        }

        if (remoteControl) {
            remoteControl.destroy();
        }
    });
}
