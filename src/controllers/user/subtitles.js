<<<<<<< HEAD
import subtitleSettings from 'subtitleSettings';
import {UserSettings, currentSettings as userSettings} from 'userSettings';
import autoFocuser from 'autoFocuser';
=======
import SubtitleSettings from 'subtitleSettings';
import * as userSettings from 'userSettings';
import autoFocuser from 'autoFocuser';

/* eslint-disable indent */
>>>>>>> upstream/master

export class SubtitleController {
    constructor(view, params) {
        this.userId = params.userId || ApiClient.getCurrentUserId();
        this.currentSettings = this.userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();
        this.hasChanges = false;
        this.subtitleSettingsInstance = null;
        this.view = view;

<<<<<<< HEAD
        view.addEventListener('viewshow', this.viewShow.bind(this));
        view.addEventListener('change', this.change.bind(this));
        view.addEventListener('viewbeforehide', this.viewBeforeHide.bind(this));
        view.addEventListener('viewdestroy', this.viewDestroy.bind(this));
    }

    viewShow() {
        window.addEventListener('beforeunload', this.beforeUnload.bind(this));

        if (this.subtitleSettingsInstance) {
            this.subtitleSettingsInstance.loadData();
        } else {
            this.subtitleSettingsInstance = new subtitleSettings({
                serverId: ApiClient.serverId(),
                userId: this.userId,
                element: this.view.querySelector('.settingsContainer'),
                userSettings: this.currentSettings,
                enableSaveButton: false,
                enableSaveConfirmation: false,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    }

    viewDestroy() {
        if (this.subtitleSettingsInstance) {
            this.subtitleSettingsInstance.destroy();
            this.subtitleSettingsInstance = null;
        }
    }

    viewBeforeHide() {
        this.hasChanges = false;

        if (this.subtitleSettingsInstance) {
            this.subtitleSettingsInstance.submit();
        }
    }

    change() {
        this.hasChanges = true;
    }

    beforeUnload(e) {
        if (this.hasChanges) {
            e.returnValue = 'You currently have unsaved changes. Are you sure you wish to leave?';
=======
    export default function (view, params) {
        function onBeforeUnload(e) {
            if (hasChanges) {
                e.returnValue = 'You currently have unsaved changes. Are you sure you wish to leave?';
            }
>>>>>>> upstream/master
        }
    }
}

<<<<<<< HEAD
export default SubtitleController;
=======
        let subtitleSettingsInstance;
        let hasChanges;
        const userId = params.userId || ApiClient.getCurrentUserId();
        const currentSettings = userId === ApiClient.getCurrentUserId() ? userSettings : new UserSettings();
        view.addEventListener('viewshow', function () {
            window.addEventListener('beforeunload', onBeforeUnload);

            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.loadData();
            } else {
                subtitleSettingsInstance = new SubtitleSettings({
                    serverId: ApiClient.serverId(),
                    userId: userId,
                    element: view.querySelector('.settingsContainer'),
                    userSettings: currentSettings,
                    enableSaveButton: true,
                    enableSaveConfirmation: true,
                    autoFocus: autoFocuser.isEnabled()
                });
            }
        });

        view.addEventListener('change', function () {
            hasChanges = true;
        });

        view.addEventListener('viewdestroy', function () {
            if (subtitleSettingsInstance) {
                subtitleSettingsInstance.destroy();
                subtitleSettingsInstance = null;
            }
        });
    }

/* eslint-enable indent */
>>>>>>> upstream/master
