import escapeHtml from 'escape-html';

import globalize from 'lib/globalize';
import { getWizardStepNumber, TOTAL_WIZARD_STEPS } from 'apps/wizard/controllers/wizardSteps';

export function renderWizardProgress(view, stepId) {
    const container = view.querySelector('.wizardProgress');
    if (!container) {
        return;
    }

    const step = getWizardStepNumber(stepId);
    if (!step) {
        return;
    }

    const percent = (step / TOTAL_WIZARD_STEPS) * 100;
    const label = globalize.translate('LabelWizardStep', step, TOTAL_WIZARD_STEPS);
    container.innerHTML = '<span class="wizardProgressLabel">' + step + ' / ' + TOTAL_WIZARD_STEPS + '</span>'
        + '<div class="wizardProgressTrack" role="progressbar" aria-valuenow="' + step + '" aria-valuemin="1" aria-valuemax="' + TOTAL_WIZARD_STEPS + '" aria-label="' + escapeHtml(label) + '">'
        + '<div class="wizardProgressFill" style="width:' + percent + '%;"></div></div>';
}

export default renderWizardProgress;
