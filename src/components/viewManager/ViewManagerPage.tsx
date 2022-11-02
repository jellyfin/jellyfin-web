import React, { FunctionComponent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import globalize from '../../scripts/globalize';
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
        const loadPage = async () => {
            const [ controllerFactory, viewHtml ] = await Promise.all([
                import(/* webpackChunkName: "[request]" */ `../../controllers/${controller}`),
                import(/* webpackChunkName: "[request]" */ `../../controllers/${view}`)
                    .then(html => globalize.translateHtml(html))
            ]);

            const viewOptions = {
                url: location.pathname + location.search,
                controllerFactory,
                view: viewHtml,
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
                .catch((result?: any) => {
                    if (!result || !result.cancelled) {
                        viewManager.loadView(viewOptions);
                    }
                });
        };

        loadPage();
    }, [
        controller,
        view,
        type,
        isFullscreen,
        isNowPlayingBarEnabled,
        isThemeMediaSupported,
        transition,
        location.pathname,
        location.search,
        location.state
    ]);

    return <></>;
};

export default ViewManagerPage;
