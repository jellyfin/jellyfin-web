import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { safeAppHost } from '../../components/apphost';
import alert from '../../components/alert';
import { PluginType } from '../../types/plugin';
import { getWeek } from 'date-fns';

function showMessage(text: string, userSettingsKey: string, appHostFeature: string): Promise<void> {
    if (safeAppHost.supports(appHostFeature)) {
        return Promise.resolve();
    }

    const now = new Date();
    userSettingsKey += now.getFullYear() + '-w' + getWeek(now);

    if ((userSettings as any).get(userSettingsKey, false) === '1') {
        return Promise.resolve();
    }

    (userSettings as any).set(userSettingsKey, '1', false);
    return alert(text);
}

function showBlurayMessage() {
    return showMessage(globalize.translate('UnsupportedPlayback'), 'blurayexpirementalinfo', 'nativeblurayplayback');
}

function showDvdMessage() {
    return showMessage(globalize.translate('UnsupportedPlayback'), 'dvdexpirementalinfo', 'nativedvdplayback');
}

function showIsoMessage() {
    return showMessage(globalize.translate('UnsupportedPlayback'), 'isoexpirementalinfo', 'nativeisoplayback');
}

class ExpirementalPlaybackWarnings {
    name: string = 'Experimental playback warnings';
    type: any = PluginType.PreplayIntercept;
    id: string = 'expirementalplaybackwarnings';

    intercept(options: any): Promise<void> {
        const item = options.item;
        if (!item) {
            return Promise.resolve();
        }

        if (item.VideoType === 'Iso') {
            return showIsoMessage();
        }

        if (item.VideoType === 'BluRay') {
            return showBlurayMessage();
        }

        if (item.VideoType === 'Dvd') {
            return showDvdMessage();
        }

        return Promise.resolve();
    }
}

export default ExpirementalPlaybackWarnings;
