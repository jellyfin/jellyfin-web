import { FunctionComponent, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useApi } from '@/hooks/useApi';
import viewManager from './viewManager/viewManager';
import globalize from 'lib/globalize';
import type { RestoreViewFailResponse } from 'types/viewManager';

interface ServerContentPageProps {
    view: string
}

/**
 * Page component that renders html content from a server request.
 * Uses the ViewManager to dynamically load and execute the page JS.
 */
const ServerContentPage: FunctionComponent<ServerContentPageProps> = ({ view }) => {
    const { api } = useApi();
    const location = useLocation();

    useEffect(() => {
        // Only load the view when the api is available
        if (!api) return;

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
                .catch(async (result?: RestoreViewFailResponse) => {
                    if (!result?.cancelled) {
                        // Fetch the view html from the server and translate it
                        const response = await api.axiosInstance.get<string>(api.getUri(view + location.search));
                        if (!response?.data) {
                            console.warn('[ServerContentPage] no view html returned for view', view + location.search);
                            return;
                        }
                        const viewHtml = globalize.translateHtml(response.data);

                        viewManager.loadView({
                            ...viewOptions,
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
        api,
        view,
        location.pathname,
        location.search
    ]);

    return null;
};

export default ServerContentPage;
