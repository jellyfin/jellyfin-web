import $ from 'jquery';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';

import { ConfigurationKey } from '@/constants/configurationKey';
import loading from '../loading/loading';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from '../../utils/dashboard';
import Events from '../../utils/events.ts';

import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/emby-button';
import '../../styles/flexstyles.scss';
import './style.scss';

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
    async function reload() {
        loading.show();

        const api = ServerConnections.getApi();
        const { data: config } = await getSystemApi(api).getNamedConfiguration({ key: ConfigurationKey.LiveTv });

        const info = config.ListingProviders.filter(function (i) {
            return i.Id === providerId;
        })[0] || {};
        listingsId = info.ListingsId;
        page.querySelector('#selectListing').value = info.ListingsId || '';
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
    }

    async function setCountry(info) {
        const api = ServerConnections.getApi();

        try {
            const { data: result } = await getLiveTvApi(api).getSchedulesDirectCountries();

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
            page.querySelector('.txtZipCode').dispatchEvent(new Event('change'));
        } catch {
            Dashboard.alert({
                message: globalize.translate('ErrorGettingTvLineups')
            });
        }

        loading.hide();
    }

    async function submitLoginForm() {
        loading.show();

        const api = ServerConnections.getApi();
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

        try {
            const { data: result } = await getLiveTvApi(api).addListingProvider({ listingsProviderInfo: info });

            Dashboard.processServerConfigurationUpdateResult();
            providerId = result.Id;
            reload();
        } catch {
            Dashboard.alert({
                message: globalize.translate('ErrorSavingTvProvider')
            });
        }
    }

    async function submitListingsForm() {
        const selectedListingsId = page.querySelector('#selectListing').value;

        if (!selectedListingsId) {
            Dashboard.alert({
                message: globalize.translate('ErrorPleaseSelectLineup')
            });
            return;
        }

        loading.show();

        const api = ServerConnections.getApi();
        const { data: config } = await getSystemApi(api).getNamedConfiguration({ key: ConfigurationKey.LiveTv });

        const id = providerId;
        const info = config.ListingProviders.filter(function (i) {
            return i.Id === id;
        })[0];
        info.ZipCode = page.querySelector('.txtZipCode').value;
        info.Country = page.querySelector('#selectCountry').value;
        info.ListingsId = selectedListingsId;
        info.EnableAllTuners = page.querySelector('.chkAllTuners').checked;
        info.EnabledTuners = info.EnableAllTuners ? [] : $('.chkTuner', page).get().filter(function (i) {
            return i.checked;
        }).map(function (i) {
            return i.getAttribute('data-id');
        });

        try {
            await getLiveTvApi(api).addListingProvider({
                validateListings: true,
                listingsProviderInfo: info
            });

            loading.hide();

            if (options.showConfirmation) {
                Dashboard.processServerConfigurationUpdateResult();
            }

            Events.trigger(self, 'submitted');
        } catch {
            loading.hide();
            Dashboard.alert({
                message: globalize.translate('ErrorAddingListingsToSchedulesDirect')
            });
        }
    }

    async function refreshListings(value) {
        if (!value) {
            page.querySelector('#selectListing').innerHTML = '';
            return;
        }

        loading.show();

        const api = ServerConnections.getApi();
        try {
            const { data: result } = await getLiveTvApi(api).getLineups({
                id: providerId,
                location: value,
                country: page.querySelector('#selectCountry').value
            });

            page.querySelector('#selectListing').innerHTML = result.map(function (o) {
                return '<option value="' + o.Id + '">' + o.Name + '</option>';
            }).join('');

            if (listingsId) {
                page.querySelector('#selectListing').value = listingsId;
            }
        } catch {
            Dashboard.alert({
                message: globalize.translate('ErrorGettingTvLineups')
            });
            refreshListings('');
        }

        loading.hide();
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

        page.querySelector('.formLogin').addEventListener('submit', function (e) {
            e.preventDefault();
            submitLoginForm();
        });

        page.querySelector('.formListings').addEventListener('submit', function (e) {
            e.preventDefault();
            submitListingsForm();
        });

        page.querySelector('.txtZipCode').addEventListener('change', function () {
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
