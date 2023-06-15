import 'jquery';
import loading from '../loading/loading';
import globalize from '../../scripts/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/emby-button';
import '../../styles/flexstyles.scss';
import './style.scss';
import Dashboard from '../../utils/dashboard';
import Events from '../../utils/events.ts';

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
        html += '<label class="checkboxContainer listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" data-id="' + device.Id + '" class="chkTuner" ' + checkedAttribute + '/><span></span></label>';
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

export default function (page, providerId, options) {
    function reload() {
        loading.show();
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            const info = config.ListingProviders.filter(function (i) {
                return i.Id === providerId;
            })[0] || {};
            listingsId = info.ListingsId;
            $('#selectListing', page).val(info.ListingsId || '');
            page.querySelector('.txtUser').value = info.Username || '';
            page.querySelector('.txtPass').value = '';
            page.querySelector('.txtZipCode').value = info.ZipCode || '';

            if (info.Username && info.Password) {
                page.querySelector('.listingsSection').classList.remove('hide');
            } else {
                page.querySelector('.listingsSection').classList.add('hide');
            }

            page.querySelector('.chkAllTuners').checked = info.EnableAllTuners;

            if (info.EnableAllTuners) {
                page.querySelector('.selectTunersSection').classList.add('hide');
            } else {
                page.querySelector('.selectTunersSection').classList.remove('hide');
            }

            setCountry(info);
            refreshTunerDevices(page, info, config.TunerHosts);
        });
    }

    function setCountry(info) {
        ApiClient.getJSON(ApiClient.getUrl('LiveTv/ListingProviders/SchedulesDirect/Countries')).then(function (result) {
            let i;
            let length;
            const countryList = [];

            for (const region in result) {
                const countries = result[region];

                if (countries.length && region !== 'ZZZ') {
                    for (i = 0, length = countries.length; i < length; i++) {
                        countryList.push({
                            name: countries[i].fullName,
                            value: countries[i].shortName
                        });
                    }
                }
            }

            countryList.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }

                if (a.name < b.name) {
                    return -1;
                }

                return 0;
            });
            $('#selectCountry', page).html(countryList.map(function (c) {
                return '<option value="' + c.value + '">' + c.name + '</option>';
            }).join('')).val(info.Country || '');
            $(page.querySelector('.txtZipCode')).trigger('change');
        }, function () { // ApiClient.getJSON() error handler
            Dashboard.alert({
                message: globalize.translate('ErrorGettingTvLineups')
            });
        });
        loading.hide();
    }

    function submitLoginForm() {
        loading.show();
        const info = {
            Type: 'SchedulesDirect',
            Username: page.querySelector('.txtUser').value,
            EnableAllTuners: true,
            Password: page.querySelector('.txtPass').value
        };
        const id = providerId;

        if (id) {
            info.Id = id;
        }

        ApiClient.ajax({
            type: 'POST',
            url: ApiClient.getUrl('LiveTv/ListingProviders', {
                ValidateLogin: true
            }),
            data: JSON.stringify(info),
            contentType: 'application/json',
            dataType: 'json'
        }).then(function (result) {
            Dashboard.processServerConfigurationUpdateResult();
            providerId = result.Id;
            reload();
        }, function () {
            Dashboard.alert({
                message: globalize.translate('ErrorSavingTvProvider')
            });
        });
    }

    function submitListingsForm() {
        const selectedListingsId = $('#selectListing', page).val();

        if (!selectedListingsId) {
            Dashboard.alert({
                message: globalize.translate('ErrorPleaseSelectLineup')
            });
            return;
        }

        loading.show();
        const id = providerId;
        ApiClient.getNamedConfiguration('livetv').then(function (config) {
            const info = config.ListingProviders.filter(function (i) {
                return i.Id === id;
            })[0];
            info.ZipCode = page.querySelector('.txtZipCode').value;
            info.Country = $('#selectCountry', page).val();
            info.ListingsId = selectedListingsId;
            info.EnableAllTuners = page.querySelector('.chkAllTuners').checked;
            info.EnabledTuners = info.EnableAllTuners ? [] : $('.chkTuner', page).get().filter(function (i) {
                return i.checked;
            }).map(function (i) {
                return i.getAttribute('data-id');
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

                if (options.showConfirmation) {
                    Dashboard.processServerConfigurationUpdateResult();
                }

                Events.trigger(self, 'submitted');
            }, function () {
                loading.hide();
                Dashboard.alert({
                    message: globalize.translate('ErrorAddingListingsToSchedulesDirect')
                });
            });
        });
    }

    function refreshListings(value) {
        if (!value) {
            $('#selectListing', page).html('');
            return;
        }

        loading.show();
        ApiClient.ajax({
            type: 'GET',
            url: ApiClient.getUrl('LiveTv/ListingProviders/Lineups', {
                Id: providerId,
                Location: value,
                Country: $('#selectCountry', page).val()
            }),
            dataType: 'json'
        }).then(function (result) {
            $('#selectListing', page).html(result.map(function (o) {
                return '<option value="' + o.Id + '">' + o.Name + '</option>';
            }));

            if (listingsId) {
                $('#selectListing', page).val(listingsId);
            }

            loading.hide();
        }, function () {
            Dashboard.alert({
                message: globalize.translate('ErrorGettingTvLineups')
            });
            refreshListings('');
            loading.hide();
        });
    }

    let listingsId;
    const self = this;

    self.submit = function () {
        page.querySelector('.btnSubmitListingsContainer').click();
    };

    self.init = function () {
        options = options || {};

        // Only hide the buttons if explicitly set to false; default to showing if undefined or null
        // FIXME: rename this option to clarify logic
        const hideCancelButton = options.showCancelButton === false;
        page.querySelector('.btnCancel').classList.toggle('hide', hideCancelButton);

        const hideSubmitButton = options.showSubmitButton === false;
        page.querySelector('.btnSubmitListings').classList.toggle('hide', hideSubmitButton);

        $('.formLogin', page).on('submit', function () {
            submitLoginForm();
            return false;
        });
        $('.formListings', page).on('submit', function () {
            submitListingsForm();
            return false;
        });
        $('.txtZipCode', page).on('change', function () {
            refreshListings(this.value);
        });
        page.querySelector('.chkAllTuners').addEventListener('change', function (e) {
            if (e.target.checked) {
                page.querySelector('.selectTunersSection').classList.add('hide');
            } else {
                page.querySelector('.selectTunersSection').classList.remove('hide');
            }
        });
        $('.createAccountHelp', page).html(globalize.translate('MessageCreateAccountAt', '<a is="emby-linkbutton" class="button-link" href="http://www.schedulesdirect.org" target="_blank">http://www.schedulesdirect.org</a>'));
        reload();
    };
}
