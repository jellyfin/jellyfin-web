import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-select/emby-select';
import Dashboard from 'utils/dashboard';
import alert from 'components/alert';

const CONFIG_REFERENCE = {
    LocalNetworkSubnets: '#txtLanNetworks',
    RemoteIPFilter: '#txtExternalAddressFilter',
    KnownProxies: '#txtKnownProxies',
    LocalNetworkAddresses: '#txtLocalAddress',
    PublishedServerUriBySubnet: '#txtPublishedServer'
};

function onSubmit(event) {
    const form = event.target;
    const localAddress = form.querySelector('#txtLocalAddress').value;
    confirmSelections(localAddress, () => {
        const validationAlert = getValidationAlert(form);

        if (validationAlert) {
            showAlertText(validationAlert);
            return;
        }

        validateHttps(form)
            .then(() => updateNetworkConfig(form))
            .catch(() => {
                loading.hide();
                showAlertText('Unable to save settings');
            });
    });
}

function updateNetworkConfig(form) {
    loading.show();
    ApiClient.getNamedConfiguration('network').then((config) => {
        // Array inputs
        config.LocalNetworkSubnets = getInputValues(form, CONFIG_REFERENCE.LocalNetworkSubnets);
        config.RemoteIPFilter = getInputValues(form, CONFIG_REFERENCE.RemoteIPFilter);
        config.KnownProxies = getInputValues(form, CONFIG_REFERENCE.KnownProxies);
        config.LocalNetworkAddresses = getInputValues(form, CONFIG_REFERENCE.LocalNetworkAddresses);
        config.PublishedServerUriBySubnet = getInputValues(form, CONFIG_REFERENCE.PublishedServerUriBySubnet);

        // String inputs
        config.IsRemoteIPFilterBlacklist = form.querySelector('#selectExternalAddressFilterMode').value === 'blacklist';
        config.PublicHttpPort = form.querySelector('#txtPublicHttpPort').value;
        config.PublicHttpsPort = form.querySelector('#txtPublicHttpsPort').value;
        config.InternalHttpPort = form.querySelector('#txtPortNumber').value;
        config.InternalHttpsPort = form.querySelector('#txtHttpsPort').value;
        config.BaseUrl = form.querySelector('#txtBaseUrl').value;
        config.CertificatePath = form.querySelector('#txtCertificatePath').value || null;
        config.CertificatePassword = form.querySelector('#txtCertPassword').value || null;

        // Boolean inputs
        config.EnableHttps = form.querySelector('#chkEnableHttps').checked;
        config.RequireHttps = form.querySelector('#chkRequireHttps').checked;
        config.EnableRemoteAccess = form.querySelector('#chkRemoteAccess').checked;
        config.AutoDiscovery = form.querySelector('#chkAutodiscovery').checked;
        config.EnableIPv6 = form.querySelector('#chkEnableIP6').checked;
        config.EnableIPv4 = form.querySelector('#chkEnableIP4').checked;

        ApiClient.updateNamedConfiguration('network', config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
    });
}

function getInputValues(form, selector) {
    const element = form.querySelector(selector);
    const value = element?.value;

    if (!value) {
        return [];
    }

    return value.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function triggerChange(select) {
    const evt = new Event('change', { bubbles: false, cancelable: true });
    select.dispatchEvent(evt);
}

function getValidationAlert(form) {
    if (form.querySelector('#txtPublicHttpPort').value === form.querySelector('#txtPublicHttpsPort').value) {
        return 'The public http and https ports must be different.';
    }

    if (form.querySelector('#txtPortNumber').value === form.querySelector('#txtHttpsPort').value) {
        return 'The http and https ports must be different.';
    }

    if (!form.querySelector('#chkEnableIP6').checked && !form.querySelector('#chkEnableIP4').checked) {
        return 'Either IPv4 or IPv6 need to be checked.';
    }

    return null;
}

function validateHttps(form) {
    const certPath = form.querySelector('#txtCertificatePath').value || null;
    const httpsEnabled = form.querySelector('#chkEnableHttps').checked;

    if (httpsEnabled && !certPath) {
        return showAlertText({
            title: globalize.translate('TitleHostingSettings'),
            text: globalize.translate('HttpsRequiresCert')
        }).then(Promise.reject);
    }

    return Promise.resolve();
}

function showAlertText(options) {
    return new Promise(function (resolve, reject) {
        alert(options).then(resolve, reject);
    });
}

function confirmSelections(localAddress, callback) {
    if (localAddress) {
        showAlertText({
            title: globalize.translate('TitleHostingSettings'),
            text: globalize.translate('SettingsWarning')
        }).then(callback);
    } else {
        callback();
    }
}

function loadPage(page, config) {
    page.querySelector('#txtPortNumber').value = config.InternalHttpPort;
    page.querySelector('#txtPublicHttpPort').value = config.PublicHttpPort;
    page.querySelector('#txtPublicHttpsPort').value = config.PublicHttpsPort;
    page.querySelector('#txtLocalAddress').value = (config.LocalNetworkAddresses || []).join(', ');
    page.querySelector('#txtLanNetworks').value = (config.LocalNetworkSubnets || []).join(', ');
    page.querySelector('#txtKnownProxies').value = (config.KnownProxies || []).join(', ');
    page.querySelector('#txtExternalAddressFilter').value = (config.RemoteIPFilter || []).join(', ');
    page.querySelector('#selectExternalAddressFilterMode').value = config.IsRemoteIPFilterBlacklist ? 'blacklist' : 'whitelist';
    page.querySelector('#chkRemoteAccess').checked = config.EnableRemoteAccess == null || config.EnableRemoteAccess;
    page.querySelector('#txtHttpsPort').value = config.InternalHttpsPort;
    page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
    page.querySelector('#chkRequireHttps').checked = config.RequireHttps;
    page.querySelector('#txtBaseUrl').value = config.BaseUrl || '';
    const txtCertificatePath = page.querySelector('#txtCertificatePath');
    txtCertificatePath.value = config.CertificatePath || '';
    page.querySelector('#txtCertPassword').value = config.CertificatePassword || '';
    triggerChange(page.querySelector('#chkRemoteAccess'));
    page.querySelector('#chkAutodiscovery').checked = config.AutoDiscovery;
    page.querySelector('#chkEnableIP6').checked = config.EnableIPv6;
    page.querySelector('#chkEnableIP4').checked = config.EnableIPv4;
    page.querySelector('#txtPublishedServer').value = (config.PublishedServerUriBySubnet || []).join(', ');
    loading.hide();
}

export default function (view) {
    view.querySelector('#chkRemoteAccess').addEventListener('change', function () {
        if (this.checked) {
            view.querySelector('.fldExternalAddressFilter').classList.remove('hide');
            view.querySelector('.fldExternalAddressFilterMode').classList.remove('hide');
            view.querySelector('.fldPublicHttpPort').classList.remove('hide');
            view.querySelector('.fldPublicHttpsPort').classList.remove('hide');
        } else {
            view.querySelector('.fldExternalAddressFilter').classList.add('hide');
            view.querySelector('.fldExternalAddressFilterMode').classList.add('hide');
            view.querySelector('.fldPublicHttpPort').classList.add('hide');
            view.querySelector('.fldPublicHttpsPort').classList.add('hide');
        }
    });
    view.querySelector('#btnSelectCertPath').addEventListener('click', function () {
        import('components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
            const picker = new DirectoryBrowser();
            picker.show({
                includeFiles: true,
                includeDirectories: true,
                callback: function (path) {
                    if (path) {
                        view.querySelector('#txtCertificatePath').value = path;
                    }

                    picker.close();
                },
                header: globalize.translate('HeaderSelectCertificatePath')
            });
        });
    });
    view.querySelector('.dashboardHostingForm').addEventListener('submit', (event) => {
        event.preventDefault();
        onSubmit(event);
    });
    view.addEventListener('viewshow', function () {
        loading.show();
        ApiClient.getNamedConfiguration('network').then(function (config) {
            loadPage(view, config);
        });
    });
}

