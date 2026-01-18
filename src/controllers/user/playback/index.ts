import PlaybackSettings from '../../../components/playbackSettings/playbackSettings';
import * as userSettings from '../../../scripts/settings/userSettings';
import autoFocuser from '../../../components/autoFocuser';
import '../../../components/listview/listview.scss';

// Shortcuts
const UserSettings = userSettings.UserSettings;

interface ViewParams {
    userId?: string;
}

interface ViewElement extends HTMLElement {
    addEventListener(type: string, listener: EventListener): void;
    querySelector(selector: string): Element | null;
}

export default function (view: ViewElement, params: ViewParams): void {
    let settingsInstance: PlaybackSettings | null = null;

    const userId = params.userId || (globalThis as any).ApiClient.getCurrentUserId();
    const currentSettings = userId === (globalThis as any).ApiClient.getCurrentUserId() ? userSettings : new UserSettings();

    view.addEventListener('viewshow', function () {
        if (settingsInstance) {
            settingsInstance.loadData();
        } else {
            settingsInstance = new PlaybackSettings({
                serverId: (globalThis as any).ApiClient.serverId(),
                userId,
                element: view.querySelector('.settingsContainer') as HTMLElement,
                userSettings: currentSettings,
                enableSaveButton: true,
                enableSaveConfirmation: true,
                autoFocus: autoFocuser.isEnabled()
            });
        }
    });

    view.addEventListener('viewdestroy', function () {
        if (settingsInstance) {
            settingsInstance.destroy();
            settingsInstance = null;
        }
    });
}
