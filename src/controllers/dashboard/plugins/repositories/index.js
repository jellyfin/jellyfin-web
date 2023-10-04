import loading from '../../../../components/loading/loading';
import libraryMenu from '../../../../scripts/libraryMenu';
import globalize from '../../../../scripts/globalize';
import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import confirm from '../../../../components/confirm/confirm';

import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../../elements/emby-select/emby-select';

import '../../../../components/formdialog.scss';
import '../../../../components/listview/listview.scss';

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
    }).catch(e => {
        console.error('error loading repositories', e);
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
    }).then(() => {
        reloadList(page);
    }).catch(e => {
        console.error('error saving repositories', e);
        loading.hide();
    });
}

function populateList(options) {
    const paperList = document.createElement('div');
    paperList.className = 'paperList';

    options.repositories.forEach(repo => {
        paperList.appendChild(getRepositoryElement(repo));
    });

    if (!options.repositories.length) {
        options.noneElement.classList.remove('hide');
    } else {
        options.noneElement.classList.add('hide');
    }

    options.listElement.innerHTML = '';
    options.listElement.appendChild(paperList);
    loading.hide();
}

function getRepositoryElement(repository) {
    const listItem = document.createElement('div');
    listItem.className = 'listItem listItem-border';

    const repoLink = document.createElement('a', 'emby-linkbutton');
    repoLink.classList.add('clearLink', 'listItemIconContainer');
    repoLink.style.margin = '0';
    repoLink.style.padding = '0';
    repoLink.rel = 'noopener noreferrer';
    repoLink.target = '_blank';
    repoLink.href = repository.Url;
    repoLink.innerHTML = '<span class="material-icons listItemIcon open_in_new" aria-hidden="true"></span>';
    listItem.appendChild(repoLink);

    const body = document.createElement('div');
    body.className = 'listItemBody two-line';

    const name = document.createElement('h3');
    name.className = 'listItemBodyText';
    name.innerText = repository.Name;
    body.appendChild(name);

    const url = document.createElement('div');
    url.className = 'listItemBodyText secondary';
    url.innerText = repository.Url;
    body.appendChild(url);

    listItem.appendChild(body);

    const button = document.createElement('button', 'paper-icon-button-light');
    button.type = 'button';
    button.classList.add('btnDelete');
    button.id = repository.Url;
    button.title = globalize.translate('Delete');
    button.innerHTML = '<span class="material-icons delete" aria-hidden="true"></span>';
    listItem.appendChild(button);

    return listItem;
}

function getTabs() {
    return [{
        href: '#/dashboard/plugins',
        name: globalize.translate('TabMyPlugins')
    }, {
        href: '#/dashboard/plugins/catalog',
        name: globalize.translate('TabCatalog')
    }, {
        href: '#/dashboard/plugins/repositories',
        name: globalize.translate('TabRepositories')
    }];
}

export default function(view) {
    view.addEventListener('viewshow', function () {
        libraryMenu.setTabs('plugins', 2, getTabs);
        reloadList(this);

        const save = this;
        $('#repositories', view).on('click', '.btnDelete', function() {
            const button = this;
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
        html += `<button type="button" is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
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
        html += `<button is="emby-button" type="submit" class="raised button-submit block"><span>${globalize.translate('Save')}</span></button>`;
        html += '</div>';
        html += '</form>';

        dialog.innerHTML = html;
        dialog.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(dialog);
        });

        dialog.querySelector('.newPluginForm').addEventListener('submit', e => {
            e.preventDefault();

            const repositoryUrl = dialog.querySelector('#txtRepositoryUrl').value.toLowerCase();

            const alertCallback = function () {
                repositories.push({
                    Name: dialog.querySelector('#txtRepositoryName').value,
                    Url: dialog.querySelector('#txtRepositoryUrl').value,
                    Enabled: true
                });
                saveList(view);
                dialogHelper.close(dialog);
            };

            // Check the repository URL for the official Jellyfin repository domain, or
            // present the warning for 3rd party plugins.
            if (!repositoryUrl.startsWith('https://repo.jellyfin.org/')) {
                let msg = globalize.translate('MessageRepositoryInstallDisclaimer');
                msg += '<br/>';
                msg += '<br/>';
                msg += globalize.translate('PleaseConfirmRepositoryInstallation');

                confirm(msg, globalize.translate('HeaderConfirmRepositoryInstallation')).then(function () {
                    alertCallback();
                }).catch(() => {
                    console.debug('repository not installed');
                    dialogHelper.close(dialog);
                });
            } else {
                alertCallback();
            }

            return false;
        });

        dialogHelper.open(dialog);
    });
}
