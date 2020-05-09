import subtitleSettings from 'subtitleSettings';
import * as userSettings from 'userSettings';
import autoFocuser from 'autoFocuser';

export class SubtitleController {
    constructor(view, params) {
        this.userId = params.userId || ApiClient.getCurrentUserId();
        this.currentSettings = this.userId === ApiClient.getCurrentUserId() ? userSettings : new userSettings();
        this.hasChanges = false;
        this.subtitleSettingsInstance = null;
        this.view = view;

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
        }
    }
}

export default SubtitleController;
