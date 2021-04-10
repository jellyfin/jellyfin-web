import appSettings from '../../../scripts/settings/appSettings';
import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import '../../../elements/emby-button/emby-button';
import Dashboard from '../../../scripts/clientUtils';
import ServerConnections from '../../../components/ServerConnections';

/* eslint-disable indent */

    function handleConnectionResult(page, result) {
        loading.hide();
        switch (result.State) {
            case 'SignedIn': {
                const apiClient = result.ApiClient;
                Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                Dashboard.navigate('home.html');
                break;
            }
            case 'ServerSignIn':
                Dashboard.navigate('login.html?serverid=' + result.Servers[0].Id, false, 'none');
                break;
            case 'ServerSelection':
                Dashboard.navigate('selectserver.html', false, 'none');
                break;
            case 'ServerUpdateNeeded':
                Dashboard.alert({
                    message: globalize.translate('ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                });
                break;
            case 'Unavailable':
                Dashboard.alert({
                    message: globalize.translate('MessageUnableToConnectToServer'),
                    title: globalize.translate('HeaderConnectionFailure')
                });
        }
    }

    function submitServer(page) {
        loading.show();
        const host = page.querySelector('#txtServerHost').value;
        ServerConnections.connectToAddress(host, {
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then(function(result) {
            handleConnectionResult(page, result);
        }, function() {
            handleConnectionResult(page, {
                State: 'Unavailable'
            });
        });
    }

    export default function(view) {
        view.querySelector('.addServerForm').addEventListener('submit', onServerSubmit);
        view.querySelector('.btnCancel').addEventListener('click', goBack);

        import('../../../components/autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(view);
        });

        function onServerSubmit(e) {
            submitServer(view);
            e.preventDefault();
            return false;
        }

        function goBack() {
            import('../../../components/appRouter').then(({appRouter}) => {
                appRouter.back();
            });
        }
    }

/* eslint-enable indent */
