import appSettings from '../../../scripts/settings/appSettings';

const PREFIX = 'syncPlay';

export function getSetting(name: string): any {
    return appSettings.get(name, PREFIX);
}

export function setSetting(name: string, value: any): void {
    appSettings.set(name, value, PREFIX);
}