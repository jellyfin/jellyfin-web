import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

const CONFIG_KEY = 'encoding';

function navigateToNextPage() {
    Dashboard.navigate('wizard/remoteaccess');
}

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getNamedConfiguration(CONFIG_KEY).then(function (config) {
        config.EncoderAppPath = page.querySelector('#txtFFmpegPath').value;
        return apiClient.updateNamedConfiguration(CONFIG_KEY, config);
    }).then(function () {
        loading.hide();
        navigateToNextPage();
    }).catch(function (err) {
        // The server validates the supplied path and rejects invalid ones.
        console.error('[Wizard > FFmpeg] failed to save FFmpeg path', err);
        toast(globalize.translate('FFmpegSavePathNotFound'));
        loading.hide();
    });
}

function onSubmit(e) {
    save(this);
    e.preventDefault();
    return false;
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getNamedConfiguration(CONFIG_KEY).then(function (config) {
        page.querySelector('#txtFFmpegPath').value = config.EncoderAppPath || '';
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > FFmpeg] failed to load encoding configuration', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.wizardFFmpegForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
