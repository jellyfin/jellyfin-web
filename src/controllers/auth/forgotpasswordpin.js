define(['globalize'], function (globalize) {
    'use strict';

    function processForgotPasswordResult(result) {
        if (result.Success) {
            return void Dashboard.alert({
                message: globalize.translate('MessagePasswordResetForUsers'),
                title: globalize.translate('HeaderPasswordReset'),
                callback: function () {
                    window.location.href = 'index.html';
                }
            });
        }

        Dashboard.alert({
            message: globalize.translate('MessageInvalidForgotPasswordPin'),
            title: globalize.translate('HeaderPasswordReset')
        });
    }

    return function (view, params) {
        function onSubmit(e) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Users/ForgotPassword/Code'),
                dataType: 'json',
                data: {
                    Code: view.querySelector('#txtPin').value,
                    Password: view.querySelector('#txtPassword').value
                }
            }).then(processForgotPasswordResult);
            e.preventDefault();
            return false;
        }

        view.querySelector('form').addEventListener('submit', onSubmit);
    };
});
