import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, parsePort } from 'apps/wizard/controllers/wizardSteps';
import { validatePort } from 'apps/wizard/controllers/wizardPortValidation';
import { getWizardDraft } from 'apps/wizard/controllers/wizardDraft';

import 'elements/emby-input/emby-input';
import 'elements/emby-select/emby-select';
import 'elements/emby-button/emby-button';

function updateHardwareAccelerationWarning(page) {
    const enabled = page.querySelector('#selectHardwareAcceleration').value !== 'none';
    page.querySelector('.hardwareAccelerationWarning').classList.toggle('hide', !enabled);
}

function save(page) {
    const draft = getWizardDraft();
    const path = page.querySelector('#txtFFmpegPath').value.trim();

    draft.encoding.HardwareAccelerationType = page.querySelector('#selectHardwareAcceleration').value;
    if (path) {
        draft.encoding.EncoderAppPath = path;
    }

    const httpPort = parsePort(page.querySelector('#txtPortNumber').value);
    if (!Number.isNaN(httpPort)) {
        draft.network.InternalHttpPort = httpPort;
    }

    goToNextWizardStep('advanced');
}

function reload(page) {
    loading.show();
    const draft = getWizardDraft();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getNamedConfiguration('network'),
        apiClient.getNamedConfiguration('encoding')
    ]).then(function ([networkConfig, encodingConfig]) {
        page.querySelector('#txtPortNumber').value = draft.network.InternalHttpPort || networkConfig.InternalHttpPort || '';
        // Remember the HTTPS port (set on the previous step) so we can reject a port collision here.
        page.dataset.httpsPort = draft.network.InternalHttpsPort || networkConfig.InternalHttpsPort || '';
        page.querySelector('#txtFFmpegPath').value = (draft.encoding.EncoderAppPath ?? encodingConfig.EncoderAppPath) || '';
        page.querySelector('#selectHardwareAcceleration').value = draft.encoding.HardwareAccelerationType || encodingConfig.HardwareAccelerationType || 'none';
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
    const page = e.currentTarget;
    // The HTTPS port is set on the previous step; both servers can't share a port.
    validatePort(page.querySelector('#txtPortNumber').value, page.dataset.httpsPort).then(function (valid) {
        if (valid) save(page);
    });
}

export default function initAdvancedView(view) {
    view.querySelector('.wizardAdvancedForm').addEventListener('submit', onSubmit);
    view.querySelector('#selectHardwareAcceleration').addEventListener('change', function () {
        updateHardwareAccelerationWarning(view);
    });
    initWizardStep(view, 'advanced', {
        onShow() { reload(this); }
    });
}
