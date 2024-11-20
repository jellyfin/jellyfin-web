import 'jquery';
import loading from '../loading/loading';
import globalize from '../../lib/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import Dashboard from '../../utils/dashboard';
import Events from '../../utils/events.ts';
import dom from 'scripts/dom';

function getTunerName(providerId) {
    switch (providerId.toLowerCase()) {
        case 'm3u':
            return 'M3U Playlist';
        case 'hdhomerun':
            return 'HDHomerun';
        case 'satip':
            return 'DVB';
        default:
            return 'Unknown';
    }
}

function refreshTunerDevices(page, providerInfo, devices) {
    let html = '';

    for (let i = 0, length = devices.length; i < length; i++) {
        const device = devices[i];
        html += '<div class="listItem">';
        const enabledTuners = providerInfo.EnabledTuners || [];
        const isChecked = providerInfo.EnableAllTuners || enabledTuners.indexOf(device.Id) !== -1;
        const checkedAttribute = isChecked ? ' checked' : '';
        html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkTuner" data-id="' + device.Id + '" ' + checkedAttribute + '><span></span></label>';
        html += '<div class="listItemBody two-line">';
        html += '<div class="listItemBodyText">';
        html += device.FriendlyName || getTunerName(device.Type);
        html += '</div>';
        html += '<div class="listItemBodyText secondary">';
        html += device.Url;
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }

    page.querySelector('.tunerList').innerHTML = html;
}

function onSelectPathClick(e) {
    const page = dom.parentWithClass(e.target, 'xmltvForm');

    import('../directorybrowser/directorybrowser').then(({ default: DirectoryBrowser }) => {
        const picker = new DirectoryBrowser();
        picker.show({
            includeFiles: true,
            callback: function (path) {
                if (path) {
                    const txtPath = page.querySelector('.txtPath');
                    txtPath.value = path;
                    txtPath.focus();
                }
                picker.close();
            }
        });
    });
}

export default function (page, providerId, options) {
    function getListingProvider(config, id) {
        if (config && id) {
            const result = config.ListingProviders.filter(function (provider) {
                return provider.Id === id;
            })[0];

            if (result) {
                return Promise.resolve(result);
            }

            return getListingProvider();
        }

        return ApiClient.getJSON(ApiClient.getUrl('LiveTv/ListingProviders/Default'));
    }

    function reload() {
        loading.show();
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            getListingProvider(config, providerId).then(function (info) {
                page.querySelector('.txtPath').value = info.Path || '';
                page.querySelector('.txtKids').value = (info.KidsCategories || []).join('|');
                page.querySelector('.txtNews').value = (info.NewsCategories || []).join('|');
                page.querySelector('.txtSports').value = (info.SportsCategories || []).join('|');
                page.querySelector('.txtMovies').value = (info.MovieCategories || []).join('|');
                page.querySelector('.txtMoviePrefix').value = info.MoviePrefix || '';
                page.querySelector('.txtUserAgent').value = info.UserAgent || '';
                page.querySelector('.chkAllTuners').checked = info.EnableAllTuners;

                if (page.querySelector('.chkAllTuners').checked) {
                    page.querySelector('.selectTunersSection').classList.add('hide');
                } else {
                    page.querySelector('.selectTunersSection').classList.remove('hide');
                }

                refreshTunerDevices(page, info, config.TunerHosts);
                loading.hide();
            });
        });
    }

    function getCategories(txtInput) {
        const value = txtInput.value;

        if (value) {
            return value.split('|');
        }

        return [];
    }

    function submitListingsForm() {
        loading.show();
        const id = providerId;
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            const info = config.ListingProviders.filter(function (provider) {
                return provider.Id === id;
            })[0] || {};
            info.Type = 'xmltv';
            info.Path = page.querySelector('.txtPath').value;
            info.MoviePrefix = page.querySelector('.txtMoviePrefix').value || null;
            info.UserAgent = page.querySelector('.txtUserAgent').value || null;
            info.MovieCategories = getCategories(page.querySelector('.txtMovies'));
            info.KidsCategories = getCategories(page.querySelector('.txtKids'));
            info.NewsCategories = getCategories(page.querySelector('.txtNews'));
            info.SportsCategories = getCategories(page.querySelector('.txtSports'));
            info.EnableAllTuners = page.querySelector('.chkAllTuners').checked;
            info.EnabledTuners = info.EnableAllTuners ? [] : $('.chkTuner', page).get().filter(function (tuner) {
                return tuner.checked;
            }).map(function (tuner) {
                return tuner.getAttribute('data-id');
            });
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('LiveTv/ListingProviders', {
                    ValidateListings: true
                }),
                data: JSON.stringify(info),
                contentType: 'application/json'
            }).then(function () {
                loading.hide();

                if (options.showConfirmation !== false) {
                    Dashboard.processServerConfigurationUpdateResult();
                }

                Events.trigger(self, 'submitted');
            }, function () {
                loading.hide();
                Dashboard.alert({
                    message: globalize.translate('ErrorAddingXmlTvFile')
                });
            });
        });
    }

    const self = this;

    self.submit = function () {
        page.querySelector('.btnSubmitListings').click();
    };

    self.init = function () {
        options = options || {};

        // Only hide the buttons if explicitly set to false; default to showing if undefined or null
        // FIXME: rename this option to clarify logic
        const hideCancelButton = options.showCancelButton === false;
        page.querySelector('.btnCancel').classList.toggle('hide', hideCancelButton);

        const hideSubmitButton = options.showSubmitButton === false;
        page.querySelector('.btnSubmitListings').classList.toggle('hide', hideSubmitButton);

        $('form', page).on('submit', function () {
            submitListingsForm();
            return false;
        });
        page.querySelector('#btnSelectPath').addEventListener('click', onSelectPathClick);
        page.querySelector('.chkAllTuners').addEventListener('change', function (evt) {
            if (evt.target.checked) {
                page.querySelector('.selectTunersSection').classList.add('hide');
            } else {
                page.querySelector('.selectTunersSection').classList.remove('hide');
            }
        });
        reload();
    };
}
