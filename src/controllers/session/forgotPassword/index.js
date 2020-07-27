import globalize from 'globalize';

function processForgotPasswordResult(result) {
    if ('ContactAdmin' == result.Action) {
        return void Dashboard.alert({
            message: globalize.translate('MessageContactAdminToResetPassword'),
            title: globalize.translate('HeaderForgotPassword')
        });
    }

    if ('InNetworkRequired' == result.Action) {
        return void Dashboard.alert({
            message: globalize.translate('MessageForgotPasswordInNetworkRequired'),
            title: globalize.translate('HeaderForgotPassword')
        });
    }

    if ('PinCode' == result.Action) {
        let msg = globalize.translate('MessageForgotPasswordFileCreated');
        msg += '<br/>';
        msg += '<br/>';
        msg += 'Enter PIN here to finish Password Reset<br/>';
        msg += '<br/>';
        msg += result.PinFile;
        msg += '<br/>';
        return void Dashboard.alert({
            message: msg,
            title: globalize.translate('HeaderForgotPassword'),
            callback: function () {
                Dashboard.navigate('forgotpasswordpin.html');
            }
        });
    }
}

export default function (view, params) {
    function onSubmit(e) {
        ApiClient.ajax({
            type: 'POST',
            url: ApiClient.getUrl('Users/ForgotPassword'),
            dataType: 'json',
            data: {
                EnteredUsername: view.querySelector('#txtName').value
            }
        }).then(processForgotPasswordResult);
        e.preventDefault();
        return false;
    }

    view.querySelector('form').addEventListener('submit', onSubmit);
}
