import * as userSettings from '@/scripts/settings/userSettings';
import loading from '@/components/loading/loading';
import focusManager from '@/components/focusManager';
import homeSections from '@/components/homesections/homesections';
import { ServerConnections } from '@/lib/jellyfin-apiclient';

import '@/elements/emby-itemscontainer/emby-itemscontainer';

class HomeTab {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();
        this.sectionsContainer = view.querySelector('.sections');
        view.querySelector('.sections').addEventListener('settingschange', onHomeScreenSettingsChanged.bind(this));
    }
    onResume(options) {
        if (this.sectionsRendered) {
            const sectionsContainer = this.sectionsContainer;

            if (sectionsContainer) {
                return homeSections.resume(sectionsContainer, options);
            }

            return Promise.resolve();
        }

        loading.show();
        const view = this.view;
        const apiClient = this.apiClient;
        this.destroyHomeSections();
        this.sectionsRendered = true;
        return apiClient.getCurrentUser()
            .then(user => homeSections.loadSections(view.querySelector('.sections'), apiClient, user, userSettings))
            .then(() => {
                if (options.autoFocus) {
                    focusManager.autoFocus(view);
                }
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                loading.hide();
            });
    }
    onPause() {
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.pause(sectionsContainer);
        }
    }
    destroy() {
        this.view = null;
        this.params = null;
        this.apiClient = null;
        this.destroyHomeSections();
        this.sectionsContainer = null;
    }
    destroyHomeSections() {
        const sectionsContainer = this.sectionsContainer;

        if (sectionsContainer) {
            homeSections.destroySections(sectionsContainer);
        }
    }
}

function onHomeScreenSettingsChanged() {
    this.sectionsRendered = false;

    if (!this.paused) {
        this.onResume({
            refresh: true
        });
    }
}

export default HomeTab;
