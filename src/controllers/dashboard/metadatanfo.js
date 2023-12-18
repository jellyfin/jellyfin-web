import escapeHtml from 'escape-html';
import 'jquery';
import loading from '../../components/loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import Dashboard from '../../utils/dashboard';
import alert from '../../components/alert';

function loadPage(page, config, users) {
    let html = '<option value="" selected="selected">' + globalize.translate('None') + '</option>';
    html += users.map(function (user) {
        return '<option value="' + user.Id + '">' + escapeHtml(user.Name) + '</option>';
    }).join('');
    $('#selectUser', page).html(html).val(config.UserId || '');
    $('#selectReleaseDateFormat', page).val(config.ReleaseDateFormat);
    page.querySelector('#chkSaveImagePaths').checked = config.SaveImagePathsInNfo;
    page.querySelector('#chkEnablePathSubstitution').checked = config.EnablePathSubstitution;
    page.querySelector('#chkEnableExtraThumbs').checked = config.EnableExtraThumbsDuplication;
    loading.hide();
}

function onSubmit() {
    loading.show();
    const form = this;
    ApiClient.getNamedConfiguration(metadataKey).then(function (config) {
        config.UserId = $('#selectUser', form).val() || null;
        config.ReleaseDateFormat = $('#selectReleaseDateFormat', form).val();
        config.SaveImagePathsInNfo = form.querySelector('#chkSaveImagePaths').checked;
        config.EnablePathSubstitution = form.querySelector('#chkEnablePathSubstitution').checked;
        config.EnableExtraThumbsDuplication = form.querySelector('#chkEnableExtraThumbs').checked;
        ApiClient.updateNamedConfiguration(metadataKey, config).then(function () {
            Dashboard.processServerConfigurationUpdateResult();
            showConfirmMessage();
        });
    });
    return false;
}

function showConfirmMessage() {
    const msg = [];
    msg.push(globalize.translate('MetadataSettingChangeHelp'));
    alert({
        text: msg.join('<br/><br/>')
    });
}

function getTabs() {
    return [{
        href: '#/dashboard/libraries',
        name: globalize.translate('HeaderLibraries')
    }, {
        href: '#/dashboard/libraries/display',
        name: globalize.translate('Display')
    }, {
        href: '#/dashboard/libraries/metadata',
        name: globalize.translate('Metadata')
    }, {
        href: '#/dashboard/libraries/nfo',
        name: globalize.translate('TabNfoSettings')
    }];
}

const metadataKey = 'xbmcmetadata';
$(document).on('pageinit', '#metadataNfoPage', function () {
    $('.metadataNfoForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#metadataNfoPage', function () {
    libraryMenu.setTabs('metadata', 3, getTabs);
    loading.show();
    const page = this;
    const promise1 = ApiClient.getUsers();
    const promise2 = ApiClient.getNamedConfiguration(metadataKey);
    Promise.all([promise1, promise2]).then(function (responses) {
        loadPage(page, responses[1], responses[0]);
    });
});

