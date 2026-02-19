import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';
import appSettings from 'scripts/settings/appSettings';
import Dashboard from 'utils/dashboard';

import 'elements/emby-button/emby-button';

function handleConnectionResult(page, result) {
    loading.hide();
    switch (result.State) {
        case ConnectionState.SignedIn: {
            const apiClient = result.ApiClient;
            Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
            Dashboard.navigate('home');
            break;
        }
        case ConnectionState.ServerSignIn:
            if (result.SystemInfo.StartupWizardCompleted) {
                Dashboard.navigate('login?serverid=' + result.Servers[0].Id, false, 'none');
            } else {
                Dashboard.navigate('/wizard/start');
            }
            break;
        case ConnectionState.ServerSelection:
            Dashboard.navigate('selectserver', false, 'none');
            break;
        case ConnectionState.ServerUpdateNeeded:
            Dashboard.alert({
                message: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
            });
            break;
        case ConnectionState.Unavailable:
            Dashboard.alert({
                message: globalize.translate('MessageUnableToConnectToServer'),
                title: globalize.translate('HeaderConnectionFailure')
            });
    }
}

function submitServer(page) {
    loading.show();
    // eslint-disable-next-line sonarjs/slow-regex
    const host = page.querySelector('#txtServerHost').value.replace(/\/+$/, '');
    ServerConnections.connectToAddress(host, {
        enableAutoLogin: appSettings.enableAutoLogin()
    }).then(function(result) {
        handleConnectionResult(page, result);
    }, function() {
        handleConnectionResult(page, {
            State: ConnectionState.Unavailable
        });
    });
}

export default function(view) {
    view.querySelector('.addServerForm').addEventListener('submit', onServerSubmit);
    view.querySelector('.btnCancel').addEventListener('click', goBack);

    import('../../../components/autoFocuser').then(({ default: autoFocuser }) => {
        autoFocuser.autoFocus(view);
    });

    function onServerSubmit(e) {
        submitServer(view);
        e.preventDefault();
        return false;
    }

    function goBack() {
        import('../../../components/router/appRouter').then(({ appRouter }) => {
            appRouter.back();
        });
    }
}

