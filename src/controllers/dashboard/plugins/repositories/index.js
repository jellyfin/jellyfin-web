import loading from 'loading';
import libraryMenu from 'libraryMenu';
import globalize from 'globalize';
import dialogHelper from 'dialogHelper';
import 'emby-button';
import 'emby-checkbox';
import 'emby-select';
import 'formDialogStyle';
import 'listViewStyle';

let repositories = [];

function reloadList(page) {
    loading.show();
    ApiClient.getJSON(ApiClient.getUrl('Repositories')).then(list => {
        repositories = list;
        populateList({
            listElement: page.querySelector('#repositories'),
            noneElement: page.querySelector('#none'),
            repositories: repositories
        });
    }).catch(error => {
        console.error('error loading repositories');
        page.querySelector('#none').classList.remove('hide');
        loading.hide();
    });
}

function saveList(page) {
    loading.show();
    ApiClient.ajax({
        type: 'POST',
        url: ApiClient.getUrl('Repositories'),
        data: JSON.stringify(repositories),
        contentType: 'application/json'
    }).then(response => {
        reloadList(page);
    }).catch(error => {
        console.error('error saving repositories');
        loading.hide();
    });
}

function populateList(options) {
    var html = '';

    html += '<div class="paperList">';
    for (var i = 0; i < options.repositories.length; i++) {
        html += getRepositoryHtml(options.repositories[i]);
    }

    html += '</div>';
    if (!options.repositories.length) {
        options.noneElement.classList.remove('hide');
    }

    options.listElement.innerHTML = html;
    loading.hide();
}

function getRepositoryHtml(repository) {
    var html = '';

    html += '<div class="listItem listItem-border">';
    html += `<a is="emby-linkbutton" style="margin:0;padding:0" class="clearLink listItemIconContainer" href="${repository.Url}">`;
    html += '<span class="material-icons listItemIcon open_in_new"></span>';
    html += '</a>';
    html += '<div class="listItemBody two-line">';
    html += `<h3 class="listItemBodyText">${repository.Name}</h3>`;
    html += `<div class="listItemBodyText secondary">${repository.Url}</div>`;
    html += '</div>';
    html += `<button type="button" is="paper-icon-button-light" id="${repository.Url}" class="btnDelete" title="${globalize.translate('ButtonDelete')}"><span class="material-icons delete"></span></button>`;
    html += '</div>';

    return html;
}

function getTabs() {
    return [{
        href: 'installedplugins.html',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: 'availableplugins.html',
        name: globalize.translate('TabCatalog')
    }, {
        href: 'repositories.html',
        name: globalize.translate('TabRepositories')
    }];
}

export default function(view, params) {
    view.addEventListener('viewshow', function () {
        libraryMenu.setTabs('plugins', 2, getTabs);
        reloadList(this);

        var save = this;
        $('#repositories', view).on('click', '.btnDelete', function() {
            var button = this;
            repositories = repositories.filter(function (r) {
                return r.Url !== button.id;
            });

            saveList(save);
        });
    });

    view.querySelector('.btnNewRepository').addEventListener('click', () => {
        const dialog = dialogHelper.createDialog({
            scrollY: false,
            size: 'large',
            modal: false,
            removeOnClose: true
        });

        let html = '';

        html += '<div class="formDialogHeader">';
        html += '<button type="button" is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><span class="material-icons arrow_back"></span></button>';
        html += `<h3 class="formDialogHeaderTitle">${globalize.translate('HeaderNewRepository')}</h3>`;
        html += '</div>';
        html += '<form class="newPluginForm" style="margin:4em">';
        html += '<div class="inputContainer">';
        html += `<input is="emby-input" id="txtRepositoryName" label="${globalize.translate('LabelRepositoryName')}" type="text" required />`;
        html += `<div class="fieldDescription">${globalize.translate('LabelRepositoryNameHelp')}</div>`;
        html += '</div>';
        html += '<div class="inputContainer">';
        html += `<input is="emby-input" id="txtRepositoryUrl" label="${globalize.translate('LabelRepositoryUrl')}" type="url" required />`;
        html += `<div class="fieldDescription">${globalize.translate('LabelRepositoryUrlHelp')}</div>`;
        html += '</div>';
        html += `<button is="emby-button" type="submit" class="raised button-submit block"><span>${globalize.translate('ButtonSave')}</span></button>`;
        html += '</div>';
        html += '</form>';

        dialog.innerHTML = html;
        dialog.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(dialog);
        });

        dialog.querySelector('.newPluginForm').addEventListener('submit', () => {
            repositories.push({
                Name: dialog.querySelector('#txtRepositoryName').value,
                Url: dialog.querySelector('#txtRepositoryUrl').value,
                Enabled: true
            });

            saveList(view);
            dialogHelper.close(dialog);
            return false;
        });

        dialogHelper.open(dialog);
    });
}
