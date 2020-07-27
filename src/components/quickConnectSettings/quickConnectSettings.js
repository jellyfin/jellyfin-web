import globalize from 'globalize';
import toast from 'toast';

export class QuickConnectSettings {
    constructor() { }

    authorize(code) {
        let url = ApiClient.getUrl('/QuickConnect/Authorize');
        ApiClient.ajax({
            type: 'POST',
            url: url,
            data: {
                'Code': code
            }
        }, true).then(() => {
            require(['toast'], function (toast) {
                toast(globalize.translate('QuickConnectAuthorizeSuccess'));
            });
        }).catch(() => {
            require(['toast'], function (toast) {
                toast(globalize.translate('QuickConnectAuthorizeFail'));
            });
        });

        // prevent bubbling
        return false;
    }

    activate() {
        let url = ApiClient.getUrl('/QuickConnect/Activate');
        return ApiClient.ajax({
            type: 'POST',
            url: url,
            contentType: 'application/json',
            dataType: 'json'
        }).then((json) => {
            let message = json.Error;

            if (message && message !== '') {
                console.error('Error activating quick connect. Error: ', json.Error);

                Dashboard.alert({
                    title: 'Unable to activate quick connect',
                    message: message
                });

                return false;
            }

            toast(globalize.translate('QuickConnectActivationSuccessful'));

            return true;
        }).catch((e) => {
            console.error('Error activating quick connect. Error:', e);
            throw e;
        });
    }

    submit() {
        return false;
    }
}

export default QuickConnectSettings;
