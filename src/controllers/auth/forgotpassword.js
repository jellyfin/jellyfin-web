define(['globalize'], function (globalize) {
    'use strict';

    function processForgotPasswordResult(result) {
        if ('ContactAdmin' == result.Action) {
            return void Dashboard.alert({
                message: globalize.translate('MessageContactAdminToResetPassword'),
                title: globalize.translate('HeaderForgotPassword')
            });
        }

        if ('PinCode' == result.Action) {
            return void Dashboard.alert({
                message: globalize.translate('MessageForgotPasswordFileCreated'),
                title: globalize.translate('HeaderForgotPassword'),
                callback: function () {
                    Dashboard.navigate('forgotpasswordpin.html');
                }
            });
        }
    }

    return function (view, params) {
        function onSubmit(e) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Users/ForgotPassword'),
                dataType: 'json',
                data: {
                    Username: view.querySelector('#txtName').value
                }
            }).then(processForgotPasswordResult);
            e.preventDefault();
            return false;
        }

        view.querySelector('form').addEventListener('submit', onSubmit);
    };
});
