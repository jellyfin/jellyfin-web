import loading from '../../components/loading/loading';
import globalize from '../../scripts/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-select/emby-select';
import Dashboard from '../../scripts/clientUtils';
import alert from '../../components/alert';

/* eslint-disable indent */

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
                    config.PublicPort = form.querySelector('#txtPublicPort').value;
                    config.PublicHttpsPort = form.querySelector('#txtPublicHttpsPort').value;
                    config.HttpServerPortNumber = form.querySelector('#txtPortNumber').value;
                    config.HttpsPortNumber = form.querySelector('#txtHttpsPort').value;
                    config.EnableHttps = form.querySelector('#chkEnableHttps').checked;
                    config.RequireHttps = form.querySelector('#chkRequireHttps').checked;
                    config.EnableUPnP = enableUpnp;
                    config.BaseUrl = form.querySelector('#txtBaseUrl').value;
                    config.EnableRemoteAccess = form.querySelector('#chkRemoteAccess').checked;
                    config.CertificatePath = form.querySelector('#txtCertificatePath').value || null;
                    config.CertificatePassword = form.querySelector('#txtCertPassword').value || null;
                    config.UPnPCreateHttpPortMap = form.querySelector('#chkCreateHttpPortMap').checked;
                    config.AutoDiscovery = form.querySelector('#chkAutodiscovery').checked;
                    config.AutoDiscoveryTracing = form.querySelector('#chkAutodiscoveryTracing').checked;
                    config.EnableIPV6 = form.querySelector('#chkEnableIP6').checked;
                    config.EnableIPV4 = form.querySelector('#chkEnableIP4').checked;
                    config.UPnPCreateHttpPortMap = form.querySelector('#chkCreateHttpPortMap').checked;
                    config.UDPPortRange = form.querySelector('#txtUDPPortRange').value || null;
                    config.HDHomerunPortRange = form.querySelector('#txtHDHomerunPortRange').checked || null;
                    config.EnableSSDPTracing = form.querySelector('#chkEnableSSDPTracing').checked;
                    config.SSDPTracingFilter = form.querySelector('#txtSSDPTracingFilter').value || null;
                    ApiClient.updateNamedConfiguration('network', config).then(Dashboard.processServerConfigurationUpdateResult, Dashboard.processErrorResponse);
                });
            });
        });
        e.preventDefault();
    }

    function triggerChange(select) {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
    }

    function getValidationAlert(form) {
        if (form.querySelector('#txtPublicPort').value === form.querySelector('#txtPublicHttpsPort').value) {
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
            page.querySelector('#txtPortNumber').value = config.HttpServerPortNumber;
            page.querySelector('#txtPublicPort').value = config.PublicPort;
            page.querySelector('#txtPublicHttpsPort').value = config.PublicHttpsPort;
            page.querySelector('#txtLocalAddress').value = (config.LocalNetworkAddresses || []).join(', ');
            page.querySelector('#txtLanNetworks').value = (config.LocalNetworkSubnets || []).join(', ');
            page.querySelector('#txtKnownProxies').value = (config.KnownProxies || []).join(', ');
            page.querySelector('#txtExternalAddressFilter').value = (config.RemoteIPFilter || []).join(', ');
            page.querySelector('#selectExternalAddressFilterMode').value = config.IsRemoteIPFilterBlacklist ? 'blacklist' : 'whitelist';
            page.querySelector('#chkRemoteAccess').checked = config.EnableRemoteAccess == null || config.EnableRemoteAccess;
            page.querySelector('#txtHttpsPort').value = config.HttpsPortNumber;
            page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
            page.querySelector('#chkRequireHttps').checked = config.RequireHttps;
            page.querySelector('#txtBaseUrl').value = config.BaseUrl || '';
            const txtCertificatePath = page.querySelector('#txtCertificatePath');
            txtCertificatePath.value = config.CertificatePath || '';
            page.querySelector('#txtCertPassword').value = config.CertificatePassword || '';
            page.querySelector('#chkEnableUpnp').checked = config.EnableUPnP;
            triggerChange(page.querySelector('#chkRemoteAccess'));
            page.querySelector('#chkCreateHttpPortMap').checked = config.UPnPCreateHttpPortMap;
            page.querySelector('#chkAutodiscovery').checked = config.AutoDiscovery;
            page.querySelector('#chkAutodiscoveryTracing').checked = config.AutoDiscoveryTracing;
            page.querySelector('#chkEnableIP6').checked = config.EnableIPV6;
            page.querySelector('#chkEnableIP4').checked = config.EnableIPV4;
            page.querySelector('#chkCreateHttpPortMap').checked = config.UPnPCreateHttpPortMap;
            page.querySelector('#txtUDPPortRange').value = config.UDPPortRange;
            page.querySelector('#txtHDHomerunPortRange').checked = config.HDHomerunPortRange;
            page.querySelector('#chkEnableSSDPTracing').checked = config.EnableSSDPTracing;
            page.querySelector('#txtSSDPTracingFilter').value = config.SSDPTracingFilter;
            page.querySelector('#txtPublishedServer').value = (config.PublishedServerUriBySubnet || []).join(', ');
            loading.hide();
        }

        view.querySelector('#chkRemoteAccess').addEventListener('change', function () {
            if (this.checked) {
                view.querySelector('.fldExternalAddressFilter').classList.remove('hide');
                view.querySelector('.fldExternalAddressFilterMode').classList.remove('hide');
                view.querySelector('.fldPublicPort').classList.remove('hide');
                view.querySelector('.fldPublicHttpsPort').classList.remove('hide');
                view.querySelector('.fldEnableUpnp').classList.remove('hide');
            } else {
                view.querySelector('.fldExternalAddressFilter').classList.add('hide');
                view.querySelector('.fldExternalAddressFilterMode').classList.add('hide');
                view.querySelector('.fldPublicPort').classList.add('hide');
                view.querySelector('.fldPublicHttpsPort').classList.add('hide');
                view.querySelector('.fldEnableUpnp').classList.add('hide');
            }
        });
        view.querySelector('#btnSelectCertPath').addEventListener('click', function () {
            import('../../components/directorybrowser/directorybrowser').then(({default: directoryBrowser}) => {
                const picker = new directoryBrowser();
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

/* eslint-enable indent */
