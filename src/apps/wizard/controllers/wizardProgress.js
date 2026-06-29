import escapeHtml from 'escape-html';

import globalize from 'lib/globalize';
import { getWizardStepNumber, TOTAL_WIZARD_STEPS, goToPreviousWizardStep } from 'apps/wizard/controllers/wizardSteps';

export function renderWizardProgress(view, stepId) {
    const container = view.querySelector('.wizardProgress');
    if (!container) return;

    const step = getWizardStepNumber(stepId);
    if (!step) return;

    const percent = (step / TOTAL_WIZARD_STEPS) * 100;
    const label = escapeHtml(globalize.translate('LabelWizardStep', step, TOTAL_WIZARD_STEPS));
    container.innerHTML = `<span class="wizardProgressLabel">${step} / ${TOTAL_WIZARD_STEPS}</span>`
        + `<div class="wizardProgressTrack" role="progressbar" aria-valuenow="${step}" aria-valuemin="1" aria-valuemax="${TOTAL_WIZARD_STEPS}" aria-label="${label}">`
        + `<div class="wizardProgressFill" style="width:${percent}%;"></div></div>`;
}

// Handles the per-step boilerplate: progress bar, prev button, header class.
export function initWizardStep(view, stepId, { onShow } = {}) {
    renderWizardProgress(view, stepId);

    const prevBtn = view.querySelector('.btnWizardPrev');
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            goToPreviousWizardStep(stepId);
        });
    }

    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        if (onShow) onShow.call(this);
    });

    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}

export default renderWizardProgress;
