import HomescreenSettings from '../../../components/homeScreenSettings/homeScreenSettings';
import * as userSettings from '../../../scripts/settings/userSettings';
import autoFocuser from '../../../components/autoFocuser';
import '../../../components/listview/listview.scss';

/* eslint-disable indent */

    // Shortcuts
    const UserSettings = userSettings.UserSettings;

    export default function (view, params) {
        let userPluginSettingsInstance;

        const pageUrl = params.pageUrl;

        if (pageUrl) {
            let container = view.querySelector('.userPluginSettingsContainer');

            ApiClient.ajax({
                type: 'GET',
                url: pageUrl
            }).then(function(response) {
                console.log(response);
                
                const fragment = document.createRange().createContextualFragment(response);
                container.append(fragment);
            });
        }
    }

/* eslint-enable indent */
