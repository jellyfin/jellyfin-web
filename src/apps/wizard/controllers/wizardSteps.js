import Dashboard from 'utils/dashboard';

// Reordering this list drives the progress indicator and Previous/Next navigation for every step.
const WIZARD_STEPS = [
    { id: 'start', route: 'wizard/start' },
    { id: 'user', route: 'wizard/user' },
    { id: 'users', route: 'wizard/users' },
    { id: 'remoteaccess', route: 'wizard/remoteaccess' },
    { id: 'advanced', route: 'wizard/advanced' },
    { id: 'metadata', route: 'wizard/metadata' },
    { id: 'library', route: 'wizard/library' },
    { id: 'summary', route: 'wizard/summary' }
];

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;

function indexOfStep(stepId) {
    return WIZARD_STEPS.findIndex(function (s) {
        return s.id === stepId;
    });
}

export function getWizardStepNumber(stepId) {
    const index = indexOfStep(stepId);
    return index === -1 ? null : index + 1;
}

function navigateToStep(step) {
    if (!step) {
        return;
    }
    Dashboard.navigate(step.route).catch(function (err) {
        console.error('[Wizard] failed to navigate to ' + step.route, err);
    });
}

export function goToNextWizardStep(stepId) {
    const index = indexOfStep(stepId);
    if (index !== -1 && index < WIZARD_STEPS.length - 1) {
        navigateToStep(WIZARD_STEPS[index + 1]);
    }
}

export function goToPreviousWizardStep(stepId) {
    const index = indexOfStep(stepId);
    if (index > 0) {
        navigateToStep(WIZARD_STEPS[index - 1]);
    }
}

export function parsePort(str) {
    return parseInt(str, 10);
}
