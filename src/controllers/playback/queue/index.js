import remotecontrolFactory from '../../../components/remotecontrol/remotecontrol';
import libraryMenu from '../../../scripts/libraryMenu';
import '../../../elements/emby-button/emby-button';

export default function (view) {
    const remoteControl = new remotecontrolFactory();
    remoteControl.init(view, view.querySelector('.remoteControlContent'));
    view.addEventListener('viewshow', function () {
        libraryMenu.setTransparentMenu(true);

        if (remoteControl) {
            remoteControl.onShow();
        }
    });
    view.addEventListener('viewbeforehide', function () {
        libraryMenu.setTransparentMenu(false);

        if (remoteControl) {
            remoteControl.destroy();
        }
    });
}
