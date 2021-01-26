import 'jquery';
import globalize from '../../../scripts/globalize';
import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import '../../../components/listview/listview.scss';
import '../../../elements/emby-button/emby-button';
import confirm from '../../../components/confirm/confirm';

/* eslint-disable indent */

    function loadProfiles(page) {
        loading.show();
        ApiClient.getJSON(ApiClient.getUrl('Dlna/ProfileInfos')).then(function (result) {
            renderUserProfiles(page, result);
            renderSystemProfiles(page, result);
            loading.hide();
        });
    }

    function renderUserProfiles(page, profiles) {
        renderProfiles(page, page.querySelector('.customProfiles'), profiles.filter(function (p) {
            return p.Type == 'User';
        }));
    }

    function renderSystemProfiles(page, profiles) {
        renderProfiles(page, page.querySelector('.systemProfiles'), profiles.filter(function (p) {
            return p.Type == 'System';
        }));
    }

    function renderProfiles(page, element, profiles) {
        let html = '';

        if (profiles.length) {
            html += '<div class="paperList">';
        }

        for (let i = 0, length = profiles.length; i < length; i++) {
            const profile = profiles[i];
            html += '<div class="listItem listItem-border">';
            html += '<span class="listItemIcon material-icons live_tv"></span>';
            html += '<div class="listItemBody two-line">';
            html += "<a is='emby-linkbutton' style='padding:0;margin:0;' data-ripple='false' class='clearLink' href='#!/dlnaprofile.html?id=" + profile.Id + "'>";
            html += '<div>' + profile.Name + '</div>';
            html += '</a>';
            html += '</div>';

            if (profile.Type == 'User') {
                html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile" data-profileid="' + profile.Id + '" title="' + globalize.translate('Delete') + '"><span class="material-icons delete"></span></button>';
            }

            html += '</div>';
        }

        if (profiles.length) {
            html += '</div>';
        }

        element.innerHTML = html;
        $('.btnDeleteProfile', element).on('click', function () {
            const id = this.getAttribute('data-profileid');
            deleteProfile(page, id);
        });
    }

    function deleteProfile(page, id) {
        confirm(globalize.translate('MessageConfirmProfileDeletion'), globalize.translate('HeaderConfirmProfileDeletion')).then(function () {
            loading.show();
            ApiClient.ajax({
                type: 'DELETE',
                url: ApiClient.getUrl('Dlna/Profiles/' + id)
            }).then(function () {
                loading.hide();
                loadProfiles(page);
            });
        });
    }

    function getTabs() {
        return [{
            href: '#!/dlnasettings.html',
            name: globalize.translate('Settings')
        }, {
            href: '#!/dlnaprofiles.html',
            name: globalize.translate('TabProfiles')
        }];
    }

    $(document).on('pageshow', '#dlnaProfilesPage', function () {
        libraryMenu.setTabs('dlna', 1, getTabs);
        loadProfiles(this);
    });

/* eslint-enable indent */
