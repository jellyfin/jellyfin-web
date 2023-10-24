import remotecontrolFactory from '../../../components/remotecontrol/remotecontrol';
import libraryMenu from '../../../scripts/libraryMenu';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-button/paper-icon-button-light';
import '../../../elements/emby-collapse/emby-collapse';
import '../../../elements/emby-input/emby-input';
import '../../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../../elements/emby-slider/emby-slider';

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
