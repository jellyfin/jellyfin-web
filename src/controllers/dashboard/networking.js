import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-select/emby-select';
import Dashboard from '../../utils/dashboard';
import alert from '../../components/alert';

function onSubmit(e) {
    const form = this;
    const localAddress = form.querySelector('#txtLocalAddress').value;
    const enableUpnp = form.querySelector('#chkEnableUpnp').checked;
    confirmSelections(localAddress, enableUpnp, function () {
        const validationResult = getValidationAlert(form);

        if (validationResult) {
            showAlertText(validationResult);
            return;
        }

        validateHttps(form).then(function () {
            loading.show();
            ApiClient.getNamedConfiguration('network').then(function (config) {
                config.LocalNetworkSubnets = form.querySelector('#txtLanNetworks').value.split(',').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });
                config.RemoteIPFilter = form.querySelector('#txtExternalAddressFilter').value.split(',').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });
                config.KnownProxies = form.querySelector('#txtKnownProxies').value.split(',').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });
                config.LocalNetworkAddresses = form.querySelector('#txtLocalAddress').value.split(',').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });

                config.PublishedServerUriBySubnet = form.querySelector('#txtPublishedServer').value.split(',').map(function (s) {
                    return s.trim();
                }).filter(function (s) {
                    return s.length > 0;
                });

                config.IsRemoteIPFilterBlacklist = form.querySelector('#selectExternalAddressFilterMode').value === 'blacklist';
                config.PublicHttpPort = form.querySelector('#txtPublicHttpPort').value;
                config.PublicHttpsPort = form.querySelector('#txtPublicHttpsPort').value;
                config.InternalHttpPort = form.querySelector('#txtPortNumber').value;
                config.InternalHttpsPort = form.querySelector('#txtHttpsPort').value;
                config.EnableHttps = form.querySelector('#chkEnableHttps').checked;
                config.RequireHttps = form.querySelector('#chkRequireHttps').checked;
                config.EnableUPnP = enableUpnp;
                config.BaseUrl = form.querySelector('#txtBaseUrl').value;
                config.EnableRemoteAccess = form.querySelector('#chkRemoteAccess').checked;
                config.CertificatePath = form.querySelector('#txtCertificatePath').value || null;
                config.CertificatePassword = form.querySelector('#txtCertPassword').value || null;
                config.AutoDiscovery = form.querySelector('#chkAutodiscovery').checked;
                config.EnableIPv6 = form.querySelector('#chkEnableIP6').checked;
                config.EnableIPv4 = form.querySelector('#chkEnableIP4').checked;
                ApiClient.updateNamedConfiguration('network', config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
            });
        });
    });
    e.preventDefault();
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

function confirmSelections(localAddress, enableUpnp, callback) {
    if (localAddress || !enableUpnp) {
        showAlertText({
            title: globalize.translate('TitleHostingSettings'),
            text: globalize.translate('SettingsWarning')
        }).then(callback);
    } else {
        callback();
    }
}

export default function (view) {
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
        page.querySelector('#chkEnableUpnp').checked = config.EnableUPnP;
        triggerChange(page.querySelector('#chkRemoteAccess'));
        page.querySelector('#chkAutodiscovery').checked = config.AutoDiscovery;
        page.querySelector('#chkEnableIP6').checked = config.EnableIPv6;
        page.querySelector('#chkEnableIP4').checked = config.EnableIPv4;
        page.querySelector('#txtPublishedServer').value = (config.PublishedServerUriBySubnet || []).join(', ');
        loading.hide();
    }

    view.querySelector('#chkRemoteAccess').addEventListener('change', function () {
        if (this.checked) {
            view.querySelector('.fldExternalAddressFilter').classList.remove('hide');
            view.querySelector('.fldExternalAddressFilterMode').classList.remove('hide');
            view.querySelector('.fldPublicHttpPort').classList.remove('hide');
            view.querySelector('.fldPublicHttpsPort').classList.remove('hide');
            view.querySelector('.fldEnableUpnp').classList.remove('hide');
        } else {
            view.querySelector('.fldExternalAddressFilter').classList.add('hide');
            view.querySelector('.fldExternalAddressFilterMode').classList.add('hide');
            view.querySelector('.fldPublicHttpPort').classList.add('hide');
            view.querySelector('.fldPublicHttpsPort').classList.add('hide');
            view.querySelector('.fldEnableUpnp').classList.add('hide');
        }
    });
    view.querySelector('#btnSelectCertPath').addEventListener('click', function () {
        import('../../components/directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
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
    view.querySelector('.dashboardHostingForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        loading.show();
        ApiClient.getNamedConfiguration('network').then(function (config) {
            loadPage(view, config);
        });
    });
}

