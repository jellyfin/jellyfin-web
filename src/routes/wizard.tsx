import { lazy } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route } from './__root';

const WizardStart = lazy(() => import('../apps/wizard/components/WizardStart'));
const WizardUser = lazy(() => import('../apps/wizard/components/WizardUser'));
const WizardLibrary = lazy(() => import('../apps/wizard/components/WizardLibrary'));
const WizardSettings = lazy(() => import('../apps/wizard/components/WizardSettings'));
const WizardRemote = lazy(() => import('../apps/wizard/components/WizardRemote'));
const WizardFinish = lazy(() => import('../apps/wizard/components/WizardFinish'));

export const wizardStartRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/start',
    component: WizardStart
});

export const wizardUserRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/user',
    component: WizardUser
});

export const wizardLibraryRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/library',
    component: WizardLibrary
});

export const wizardSettingsRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/settings',
    component: WizardSettings
});

export const wizardRemoteRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/remoteaccess',
    component: WizardRemote
});

export const wizardFinishRoute = createRoute({
    getParentRoute: () => Route,
    path: 'wizard/finish',
    component: WizardFinish
});
