import globalize from '../../../scripts/globalize';
import toast from '../../../components/toast/toast';

export const authorize = (code) => {
    const url = ApiClient.getUrl('/QuickConnect/Authorize?Code=' + code);
    ApiClient.ajax({
        type: 'POST',
        url: url
    }, true).then(() => {
        toast(globalize.translate('QuickConnectAuthorizeSuccess'));
    }).catch(() => {
        toast(globalize.translate('QuickConnectAuthorizeFail'));
    });

    // prevent bubbling
    return false;
};
