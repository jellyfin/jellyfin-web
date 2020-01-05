define(['components/remotecontrol/remotecontrol', 'libraryMenu', 'emby-button'], function (RemoteControlFactory, libraryMenu) {
    'use strict';

    return function (view, params) {
        var remoteControl = new RemoteControlFactory();
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
    };
});
