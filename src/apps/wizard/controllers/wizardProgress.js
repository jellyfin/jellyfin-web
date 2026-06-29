// Total number of pages in the setup wizard, defined in one place so the
// per-page markup only declares its own step and carries no magic numbers.
const TOTAL_STEPS = 8;

// Renders the "step / total" label and matching progress bar for a wizard page.
// Each page supplies its position via a `data-step` attribute on `.wizardProgress`.
export function renderWizardProgress(view) {
    const container = view.querySelector('.wizardProgress');
    if (!container) {
        return;
    }

    const step = parseInt(container.dataset.step, 10);
    if (Number.isNaN(step)) {
        return;
    }

    const percent = (step / TOTAL_STEPS) * 100;
    container.innerHTML = '<span class="wizardProgressLabel">' + step + ' / ' + TOTAL_STEPS + '</span>'
        + '<div class="wizardProgressTrack" role="progressbar" aria-valuenow="' + step + '" aria-valuemin="1" aria-valuemax="' + TOTAL_STEPS + '" aria-label="Step ' + step + ' of ' + TOTAL_STEPS + '">'
        + '<div class="wizardProgressFill" style="width:' + percent + '%;"></div></div>';
}

export default renderWizardProgress;
