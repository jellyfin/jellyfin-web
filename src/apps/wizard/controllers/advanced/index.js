import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';

import 'elements/emby-input/emby-input';
import 'elements/emby-select/emby-select';
import 'elements/emby-button/emby-button';

function validate(page) {
    const httpPort = parseInt(page.querySelector('#txtPortNumber').value, 10);
    if (!Number.isNaN(httpPort) && (httpPort < 1 || httpPort > 65535)) {
        toast(globalize.translate('MessageInvalidPortNumber'));
        return false;
    }
    return true;
}

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const path = page.querySelector('#txtFFmpegPath').value.trim();
    const hardwareAccelerationType = page.querySelector('#selectHardwareAcceleration').value;

    const encodingPromise = apiClient.getNamedConfiguration('encoding').then(function (config) {
        config.HardwareAccelerationType = hardwareAccelerationType;
        if (path) {
            config.EncoderAppPath = path;
        }
        return apiClient.updateNamedConfiguration('encoding', config);
    }).catch(function (err) {
        // A bad FFmpeg path is non-fatal; warn and continue.
        console.error('[Wizard > Advanced] failed to save encoding settings', err);
        toast(globalize.translate(path ? 'FFmpegSavePathNotFound' : 'ErrorDefault'));
    });

    const networkPromise = apiClient.getNamedConfiguration('network').then(function (networkConfig) {
        const httpPort = parseInt(page.querySelector('#txtPortNumber').value, 10);
        if (!Number.isNaN(httpPort)) {
            networkConfig.InternalHttpPort = httpPort;
        }
        return apiClient.updateNamedConfiguration('network', networkConfig);
    });

    Promise.all([encodingPromise, networkPromise]).then(function () {
        loading.hide();
        Dashboard.navigate('wizard/library');
    }).catch(function (err) {
        console.error('[Wizard > Advanced] failed to save settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getNamedConfiguration('network'),
        apiClient.getNamedConfiguration('encoding')
    ]).then(function ([networkConfig, encodingConfig]) {
        page.querySelector('#txtPortNumber').value = networkConfig.InternalHttpPort || '';
        page.querySelector('#txtFFmpegPath').value = encodingConfig.EncoderAppPath || '';
        page.querySelector('#selectHardwareAcceleration').value = encodingConfig.HardwareAccelerationType || 'none';
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Advanced] failed to load settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function onSubmit(e) {
    e.preventDefault();
    if (validate(this)) {
        save(this);
    }
    return false;
}

export default function (view) {
    view.querySelector('.wizardAdvancedForm').addEventListener('submit', onSubmit);
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        Dashboard.navigate('wizard/remoteaccess');
    });
    renderWizardProgress(view);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
