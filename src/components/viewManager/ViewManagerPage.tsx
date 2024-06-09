import { FunctionComponent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import globalize from '../../scripts/globalize';
import type { RestoreViewFailResponse } from '../../types/viewManager';
import viewManager from './viewManager';

export interface ViewManagerPageProps {
    controller: string
    view: string
    type?: string
    isFullscreen?: boolean
    isNowPlayingBarEnabled?: boolean
    isThemeMediaSupported?: boolean
    transition?: string
}

/**
 * Page component that renders legacy views via the ViewManager.
 * NOTE: Any new pages should use the generic Page component instead.
 */
const ViewManagerPage: FunctionComponent<ViewManagerPageProps> = ({
    controller,
    view,
    type,
    isFullscreen = false,
    isNowPlayingBarEnabled = true,
    isThemeMediaSupported = false,
    transition
}) => {
    const location = useLocation();

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

            viewManager.tryRestoreView(viewOptions)
                .catch(async (result?: RestoreViewFailResponse) => {
                    if (!result?.cancelled) {
                        const [ controllerFactory, viewHtml ] = await Promise.all([
                            import(/* webpackChunkName: "[request]" */ `../../controllers/${controller}`),
                            import(/* webpackChunkName: "[request]" */ `../../controllers/${view}`)
                                .then(html => globalize.translateHtml(html))
                        ]);

                        viewManager.loadView({
                            ...viewOptions,
                            controllerFactory,
                            view: viewHtml
                        });
                    }
                });
        };

        loadPage();
    },
    // location.state is NOT included as a dependency here since dialogs will update state while the current view stays the same
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
