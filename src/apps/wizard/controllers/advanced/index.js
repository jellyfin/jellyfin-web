import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, parsePort } from 'apps/wizard/controllers/wizardSteps';
import { validatePort } from 'apps/wizard/controllers/wizardPortValidation';

import 'elements/emby-input/emby-input';
import 'elements/emby-select/emby-select';
import 'elements/emby-button/emby-button';

function updateHardwareAccelerationWarning(page) {
    const enabled = page.querySelector('#selectHardwareAcceleration').value !== 'none';
    page.querySelector('.hardwareAccelerationWarning').classList.toggle('hide', !enabled);
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
        const httpPort = parsePort(page.querySelector('#txtPortNumber').value);
        if (!Number.isNaN(httpPort)) {
            networkConfig.InternalHttpPort = httpPort;
        }
        return apiClient.updateNamedConfiguration('network', networkConfig);
    });

    Promise.all([encodingPromise, networkPromise]).then(function () {
        loading.hide();
        goToNextWizardStep('advanced');
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
        // Remember the HTTPS port (set on the previous step) so we can reject a port collision here.
        page.dataset.httpsPort = networkConfig.InternalHttpsPort || '';
        page.querySelector('#txtFFmpegPath').value = encodingConfig.EncoderAppPath || '';
        page.querySelector('#selectHardwareAcceleration').value = encodingConfig.HardwareAccelerationType || 'none';
        updateHardwareAccelerationWarning(page);
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Advanced] failed to load settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function onSubmit(e) {
    e.preventDefault();
    const page = this;
    // The HTTPS port is set on the previous step; both servers can't share a port.
    validatePort(page.querySelector('#txtPortNumber').value, page.dataset.httpsPort).then(function (valid) {
        if (valid) save(page);
    });
}

export default function (view) {
    view.querySelector('.wizardAdvancedForm').addEventListener('submit', onSubmit);
    view.querySelector('#selectHardwareAcceleration').addEventListener('change', function () {
        updateHardwareAccelerationWarning(view);
    });
    initWizardStep(view, 'advanced', {
        onShow() { reload(this); }
    });
}
