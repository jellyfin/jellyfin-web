import React, { FunctionComponent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import ServerConnections from './ServerConnections';
import viewManager from './viewManager/viewManager';
import globalize from '../scripts/globalize';

interface ServerContentPageProps {
    view: string
}

/**
 * Page component that renders html content from a server request.
 * Uses the ViewManager to dynamically load and execute the page JS.
 */
const ServerContentPage: FunctionComponent<ServerContentPageProps> = ({ view }) => {
    const location = useLocation();

    useEffect(() => {
        const loadPage = () => {
            const viewOptions = {
                url: location.pathname + location.search,
                state: location.state,
                autoFocus: false,
                options: {
                    supportsThemeMedia: false,
                    enableMediaControl: true
                }
            };

            viewManager.tryRestoreView(viewOptions)
                .catch(async (result?: any) => {
                    if (!result || !result.cancelled) {
                        const apiClient = ServerConnections.currentApiClient();

                        // Fetch the view html from the server and translate it
                        const viewHtml = await apiClient.get(apiClient.getUrl(view + location.search))
                            .then((html: string) => globalize.translateHtml(html));

                        viewManager.loadView({
                            ...viewOptions,
                            view: viewHtml
                        });
                    }
                });
        };

        loadPage();
    }, [
        view,
        location.pathname,
        location.search
        // location.state is NOT included as a dependency here since dialogs will update state while the current view
        // stays the same
    ]);

    return <></>;
};

export default ServerContentPage;
