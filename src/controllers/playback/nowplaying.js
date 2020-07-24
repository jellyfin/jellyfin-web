import remotecontrolFactory from 'components/remotecontrol/remotecontrol';
import libraryMenu from 'libraryMenu';
import 'emby-button';

export default function (view, params) {
    const remoteControl = new remotecontrolFactory();
    remoteControl.init(view, view.querySelector('.remoteControlContent'));
    view.addEventListener('viewshow', function (e) {
        libraryMenu.setTransparentMenu(true);

        if (remoteControl) {
            remoteControl.onShow();
        }
    });
    view.addEventListener('viewbeforehide', function (e) {
        libraryMenu.setTransparentMenu(false);

        if (remoteControl) {
            remoteControl.destroy();
        }
    });
}
