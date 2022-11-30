import globalize from '../../../scripts/globalize';
import Dashboard from '../../../utils/dashboard';

/* eslint-disable indent */

    function processForgotPasswordResult(result) {
        if (result.Action == 'ContactAdmin') {
            Dashboard.alert({
                message: globalize.translate('MessageContactAdminToResetPassword'),
                title: globalize.translate('ButtonForgotPassword')
            });
            return;
        }

        if (result.Action == 'InNetworkRequired') {
            Dashboard.alert({
                message: globalize.translate('MessageForgotPasswordInNetworkRequired'),
                title: globalize.translate('ButtonForgotPassword')
            });
            return;
        }

        if (result.Action == 'PinCode') {
            let msg = globalize.translate('MessageForgotPasswordFileCreated');
            msg += '<br/>';
            msg += '<br/>';
            msg += 'Enter PIN here to finish Password Reset<br/>';
            msg += '<br/>';
            msg += result.PinFile;
            msg += '<br/>';
            Dashboard.alert({
                message: msg,
                title: globalize.translate('ButtonForgotPassword'),
                callback: function () {
                    Dashboard.navigate('forgotpasswordpin.html');
                }
            });
        }
    }

    export default function (view) {
        function onSubmit(e) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Users/ForgotPassword'),
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                    EnteredUsername: view.querySelector('#txtName').value
                })
            }).then(processForgotPasswordResult);
            e.preventDefault();
            return false;
        }

        view.querySelector('form').addEventListener('submit', onSubmit);
    }

/* eslint-enable indent */
