import escapeHtml from 'escape-html';
import 'jquery';
import loading from '../../components/loading/loading';
import globalize from '../../lib/globalize';
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

const metadataKey = 'xbmcmetadata';
$(document).on('pageinit', '#metadataNfoPage', function () {
    $('.metadataNfoForm').off('submit', onSubmit).on('submit', onSubmit);
}).on('pageshow', '#metadataNfoPage', function () {
    loading.show();
    const page = this;
    const promise1 = ApiClient.getUsers();
    const promise2 = ApiClient.getNamedConfiguration(metadataKey);
    Promise.all([promise1, promise2]).then(function (responses) {
        loadPage(page, responses[1], responses[0]);
    });
});

