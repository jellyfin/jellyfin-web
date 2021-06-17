import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import '../../../elements/emby-checkbox/emby-checkbox';
import Dashboard from '../../../scripts/clientUtils';
import toast from '../../../components/toast/toast';

/* eslint-disable indent */

    function loadMediaFolders(page, mediaFolders) {
        let html = '';
        html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderLibraries') + '</h3>';
        html += '<div class="checkboxList paperList" style="padding:.5em 1em;">';

        for (let i = 0; i < mediaFolders.length; i++) {
            const folder = mediaFolders[i];
            html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '"/><span>' + folder.Name + '</span></label>';
        }

        html += '</div>';

        const folderAccess = page.querySelector('.folderAccess');
        folderAccess.innerHTML = html;
        folderAccess.dispatchEvent(new CustomEvent('create'));

        page.querySelector('#chkEnableAllFolders').checked = false;
    }

    function loadChannels(page, channels) {
        let html = '';
        html += '<h3 class="checkboxListLabel">' + globalize.translate('Channels') + '</h3>';
        html += '<div class="checkboxList paperList" style="padding:.5em 1em;">';

        for (let i = 0; i < channels.length; i++) {
            const folder = channels[i];
            html += '<label><input type="checkbox" is="emby-checkbox" class="chkChannel" data-id="' + folder.Id + '"/><span>' + folder.Name + '</span></label>';
        }

        html += '</div>';

        const channelAccess = page.querySelector('.channelAccess');
        channelAccess.innerHTML = html;
        channelAccess.dispatchEvent(new CustomEvent('create'));

        if (channels.length) {
            page.querySelector('.channelAccessContainer').classList.remove('hide');
        } else {
            page.querySelector('.channelAccessContainer').classList.add('hide');
        }

        page.querySelector('#chkEnableAllChannels').checked = false;
    }

    function loadUser(page) {
        page.querySelector('#txtUsername').value = '';
        page.querySelector('#txtPassword').value = '';
        loading.show();
        const promiseFolders = ApiClient.getJSON(ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        }));
        const promiseChannels = ApiClient.getJSON(ApiClient.getUrl('Channels'));
        Promise.all([promiseFolders, promiseChannels]).then(function (responses) {
            loadMediaFolders(page, responses[0].Items);
            loadChannels(page, responses[1].Items);
            loading.hide();
        });
    }

    function saveUser(page) {
        const user = {};
        user.Name = page.querySelector('#txtUsername').value;
        user.Password = page.querySelector('#txtPassword').value;
        ApiClient.createUser(user).then(function (user) {
            user.Policy.EnableAllFolders = page.querySelector('#chkEnableAllChannels').checked;
            user.Policy.EnabledFolders = user.Policy.EnableAllFolders ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });

            user.Policy.EnabledChannels = page.querySelector('#chkEnableAllChannels').checked;

            user.Policy.EnabledChannels = user.Policy.EnabledChannels ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkChannel'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });

            ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                Dashboard.navigate('useredit.html?userId=' + user.Id);
            });
        }, function () {
            toast(globalize.translate('ErrorDefault'));
            loading.hide();
        });
    }

    function onSubmit(e) {
        const page = this.closest('#newUserPage');
        loading.show();
        saveUser(page);
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function loadData(page) {
        loadUser(page);
    }

    export default function (view) {
        view.querySelector('#chkEnableAllChannels').addEventListener('change', function () {
            if (this.checked) {
                view.querySelector('.channelAccessListContainer').classList.add('hide');
            } else {
                view.querySelector('.channelAccessListContainer').classList.remove('hide');
            }
        });

        view.querySelector('#chkEnableAllFolders').addEventListener('change', function () {
            if (this.checked) {
                view.querySelector('.folderAccessListContainer').classList.add('hide');
            } else {
                view.querySelector('.folderAccessListContainer').classList.remove('hide');
            }
        });

        view.querySelector('.newUserProfileForm').addEventListener('submit', onSubmit);

        view.addEventListener('viewshow', function () {
            loadData(this);
        });
    }

/* eslint-enable indent */
