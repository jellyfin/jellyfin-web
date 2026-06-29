import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, goToPreviousWizardStep } from 'apps/wizard/controllers/wizardSteps';

import 'elements/emby-input/emby-input';
import 'elements/emby-select/emby-select';
import 'elements/emby-button/emby-button';

function validate(page) {
    const httpPort = parseInt(page.querySelector('#txtPortNumber').value, 10);
    if (!Number.isNaN(httpPort) && (httpPort < 1 || httpPort > 65535)) {
        toast(globalize.translate('MessageInvalidPortNumber'));
        return Promise.resolve(false);
    }

    // The HTTPS port is set on the previous step; both servers can't share a port.
    const httpsPort = parseInt(page.dataset.httpsPort, 10);
    if (!Number.isNaN(httpPort) && httpPort === httpsPort) {
        toast(globalize.translate('MessagePortConflict'));
        return Promise.resolve(false);
    }

    if (!Number.isNaN(httpPort) && httpPort < 1024) {
        return confirm({
            title: globalize.translate('HeaderPrivilegedPortWarning'),
            text: globalize.translate('MessagePrivilegedPortWarning'),
            primary: 'delete'
        }).then(function () {
            return true;
        }).catch(function () {
            return false;
        });
    }

    return Promise.resolve(true);
}

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
        const httpPort = parseInt(page.querySelector('#txtPortNumber').value, 10);
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
    validate(page).then(function (valid) {
        if (valid) {
            save(page);
        }
    });
    return false;
}

export default function (view) {
    view.querySelector('.wizardAdvancedForm').addEventListener('submit', onSubmit);
    view.querySelector('#selectHardwareAcceleration').addEventListener('change', function () {
        updateHardwareAccelerationWarning(view);
    });
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        goToPreviousWizardStep('advanced');
    });
    renderWizardProgress(view, 'advanced');
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
