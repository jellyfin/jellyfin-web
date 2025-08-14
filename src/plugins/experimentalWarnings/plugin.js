import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import { appHost } from '../../components/apphost';
import alert from '../../components/alert';
import { PluginType } from '../../types/plugin.ts';

// TODO: Replace with date-fns
// https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
function getWeek(date) {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function showMessage(text, userSettingsKey, appHostFeature) {
    if (appHost.supports(appHostFeature)) {
        return Promise.resolve();
    }

    const now = new Date();

    // TODO: Use date-fns
    userSettingsKey += now.getFullYear() + '-w' + getWeek(now);

    if (userSettings.get(userSettingsKey, false) === '1') {
        return Promise.resolve();
    }

    userSettings.set(userSettingsKey, '1', false);
    return alert(text);
}

function showBlurayMessage() {
    return showMessage(
        globalize.translate('UnsupportedPlayback'),
        'blurayexpirementalinfo',
        'nativeblurayplayback'
    );
}

function showDvdMessage() {
    return showMessage(
        globalize.translate('UnsupportedPlayback'),
        'dvdexpirementalinfo',
        'nativedvdplayback'
    );
}

function showIsoMessage() {
    return showMessage(
        globalize.translate('UnsupportedPlayback'),
        'isoexpirementalinfo',
        'nativeisoplayback'
    );
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
