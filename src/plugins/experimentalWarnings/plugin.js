import { getISOWeek } from 'date-fns';

import { PluginType } from 'constants/pluginType';

import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { appHost } from '../../components/apphost';
import alert from '../../components/alert';

function showMessage(text, userSettingsKey, appHostFeature) {
    if (appHost.supports(appHostFeature)) {
        return Promise.resolve();
    }

    const now = new Date();

    userSettingsKey += now.getFullYear() + '-w' + getISOWeek(now);

    if (userSettings.get(userSettingsKey, false) === '1') {
        return Promise.resolve();
    }

    userSettings.set(userSettingsKey, '1', false);
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
    constructor() {
        this.name = 'Experimental playback warnings';
        this.type = PluginType.PreplayIntercept;
        this.id = 'expirementalplaybackwarnings';
    }

    intercept(options) {
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
