import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

function processForgotPasswordResult(result) {
    if (result.Success) {
        let msg = globalize.translate('MessagePasswordResetForUsers');
        msg += '<br/>';
        msg += '<br/>';
        msg += result.UsersReset.join('<br/>');
        Dashboard.alert({
            message: msg,
            title: globalize.translate('HeaderPasswordReset'),
            callback: function () {
                window.location.href = '';
            }
        });
        return;
    }

    Dashboard.alert({
        message: globalize.translate('MessageInvalidForgotPasswordPin'),
        title: globalize.translate('HeaderPasswordReset')
    });
}

export default function (view) {
    function onSubmit(e) {
        const api = ServerConnections.getApi();
        const Pin = view.querySelector('#txtPin').value;
        getAuthenticationApi(api).forgotPasswordPin({
            forgotPasswordPinDto: { Pin }
        }).then(processForgotPasswordResult);
        e.preventDefault();
        return false;
    }

    view.querySelector('form').addEventListener('submit', onSubmit);

    view.querySelector('#txtPin').focus();
}
