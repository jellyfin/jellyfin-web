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
        const apiClient = ServerConnections.currentApiClient();
        apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl('Users/ForgotPassword/Pin'),
            dataType: 'json',
            data: JSON.stringify({
                Pin: view.querySelector('#txtPin').value
            }),
            contentType: 'application/json'
        }).then(processForgotPasswordResult);
        e.preventDefault();
        return false;
    }

    view.querySelector('form').addEventListener('submit', onSubmit);

    view.querySelector('#txtPin').focus();
}
