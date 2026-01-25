import { FunctionComponent, useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';

import globalize from 'lib/globalize';
import type { RestoreViewFailResponse } from 'types/viewManager';

import viewManager from './viewManager';
import { AppType } from 'constants/appType';
import { logger } from 'utils/logger';

export interface ViewManagerPageProps {
    appType?: AppType
    controller: string
    view: string
    type?: string
    isFullscreen?: boolean
    isNowPlayingBarEnabled?: boolean
    isThemeMediaSupported?: boolean
    transition?: string
}

interface ViewOptions {
    url: string
    type?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any
    autoFocus: boolean
    fullscreen?: boolean
    transition?: string
    options: {
        supportsThemeMedia?: boolean
        enableMediaControl?: boolean
    }
}

const legacyModules = import.meta.glob('../../**/{controllers,controllers}/**/*.{js,ts,html}');

const resolveModule = (path: string) => {
    const loader = legacyModules[`${path}.ts`] 
        || legacyModules[`${path}.js`] 
        || legacyModules[`${path}/index.ts`] 
        || legacyModules[`${path}/index.js`]
        || legacyModules[`${path}.html`]
        || legacyModules[path];

    if (!loader) {
        throw new Error(`Legacy module not found: ${path}`);
    }

    return loader();
};

const importController = (
    appType: AppType,
    controller: string,
    view: string
) => {
    let folder = '';
    switch (appType) {
        case AppType.Dashboard:
            folder = 'apps/dashboard/controllers';
            break;
        case AppType.Wizard:
            folder = 'apps/wizard/controllers';
            break;
        default:
            folder = 'controllers';
            break;
    }

    return Promise.all([
        resolveModule(`../../${folder}/${controller}`),
        resolveModule(`../../${folder}/${view}`)
            .then((html: any) => globalize.translateHtml(html as string))
    ]);
};

const loadView = async (
    appType: AppType,
    controller: string,
    view: string,
    viewOptions: ViewOptions
) => {
    const [ controllerFactory, viewHtml ] = await importController(appType, controller, view);

    viewManager.loadView({
        ...viewOptions,
        controllerFactory,
        view: viewHtml
    });
};

/**
 * Page component that renders legacy views via the ViewManager.
 * NOTE: Any new pages should use the generic Page component instead.
 */
const ViewManagerPage: FunctionComponent<ViewManagerPageProps> = ({
    appType = AppType.Stable,
    controller,
    view,
    type,
    isFullscreen = false,
    isNowPlayingBarEnabled = true,
    isThemeMediaSupported = false,
    transition
}) => {
    const location = useRouterState({ select: (state) => state.location });
    const historyAction = useRouterState({ select: (state) => state.historyAction });

    useEffect(() => {
        const loadPage = () => {
            const viewOptions = {
                url: location.pathname + location.search,
                type,
                state: location.state,
                autoFocus: false,
                fullscreen: isFullscreen,
                transition,
                options: {
                    supportsThemeMedia: isThemeMediaSupported,
                    enableMediaControl: isNowPlayingBarEnabled
                }
            };

            if (historyAction !== 'POP') {
                logger.debug('[ViewManagerPage] loading view', { component: 'ViewManagerPage', view });
                return loadView(appType, controller, view, viewOptions);
            }

            logger.debug('[ViewManagerPage] restoring view', { component: 'ViewManagerPage', view });
            return viewManager.tryRestoreView(viewOptions)
                .catch(async (result?: RestoreViewFailResponse) => {
                    if (!result?.cancelled) {
                        logger.debug('[ViewManagerPage] restore failed; loading view', { component: 'ViewManagerPage', view });
                        return loadView(appType, controller, view, viewOptions);
                    }
                });
        };

        loadPage();
    },
    // location.state and navigationType are NOT included as dependencies here since dialogs will update state while the current view stays the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        controller,
        view,
        type,
        isFullscreen,
        isNowPlayingBarEnabled,
        isThemeMediaSupported,
        transition,
        location.pathname,
        location.search
    ]);

    return null;
};

export default ViewManagerPage;
