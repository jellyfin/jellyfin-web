import escapeHtml from 'escape-html';
import dom from '../../utils/dom';
import focusManager from '../focusManager';
import dialogHelper from '../dialogHelper/dialogHelper';
import inputManager from '../../scripts/inputManager';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from '../../scripts/settings/userSettings';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-select/emby-select';
import 'material-design-icons-iconfont';
import '../formdialog.scss';
import '../../styles/flexstyles.scss';
import template from './filtermenu.template.html';

function onSubmit(e) {
    e.preventDefault();
    return false;
}
function renderOptions(context, selector, cssClass, items, isCheckedFn) {
    const elem = context.querySelector(selector);

    if (items.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }

    let html = '';

    html += items.map(function (filter) {
        let itemHtml = '';

        const checkedHtml = isCheckedFn(filter) ? ' checked' : '';
        itemHtml += '<label>';
        itemHtml += '<input is="emby-checkbox" type="checkbox"' + checkedHtml + ' data-filter="' + filter.Id + '" class="' + cssClass + '"/>';
        itemHtml += '<span>' + escapeHtml(filter.Name) + '</span>';
        itemHtml += '</label>';

        return itemHtml;
    }).join('');

    elem.querySelector('.filterOptions').innerHTML = html;
}

function renderDynamicFilters(context, result, options) {
    renderOptions(context, '.genreFilters', 'chkGenreFilter', result.Genres, function (i) {
        // Switching from | to ,
        const delimeter = (options.settings.GenreIds || '').indexOf('|') === -1 ? ',' : '|';
        return (delimeter + (options.settings.GenreIds || '') + delimeter).indexOf(delimeter + i.Id + delimeter) !== -1;
    });
}

function setBasicFilter(context, key, elem) {
    let value = elem.checked;
    value = value || null;
    userSettings.setFilter(key, value);
}
function moveCheckboxFocus(elem, offset) {
    const parent = dom.parentWithClass(elem, 'checkboxList-verticalwrap');
    const elems = focusManager.getFocusableElements(parent);

    let index = -1;
    for (let i = 0, length = elems.length; i < length; i++) {
        if (elems[i] === elem) {
            index = i;
            break;
        }
    }

    index += offset;

    index = Math.min(elems.length - 1, index);
    index = Math.max(0, index);

    const newElem = elems[index];
    if (newElem) {
        focusManager.focus(newElem);
    }
}
function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}
function onInputCommand(e) {
    switch (e.detail.command) {
        case 'left':
            moveCheckboxFocus(e.target, -1);
            e.preventDefault();
            break;
        case 'right':
            moveCheckboxFocus(e.target, 1);
            e.preventDefault();
            break;
        default:
            break;
    }
}
function saveValues(context, settings, settingsKey) {
    context.querySelectorAll('.simpleFilter').forEach(elem => {
        if (elem.tagName === 'INPUT') {
            setBasicFilter(context, settingsKey + '-filter-' + elem.getAttribute('data-settingname'), elem);
        } else {
            setBasicFilter(context, settingsKey + '-filter-' + elem.getAttribute('data-settingname'), elem.querySelector('input'));
        }
    });

    // Video type
    const videoTypes = [];
    context.querySelectorAll('.chkVideoTypeFilter').forEach(elem => {
        if (elem.checked) {
            videoTypes.push(elem.getAttribute('data-filter'));
        }
    });

    userSettings.setFilter(settingsKey + '-filter-VideoTypes', videoTypes.join(','));

    // Series status
    const seriesStatuses = [];
    context.querySelectorAll('.chkSeriesStatus').forEach(elem => {
        if (elem.checked) {
            seriesStatuses.push(elem.getAttribute('data-filter'));
        }
    });

    userSettings.setFilter(`${settingsKey}-filter-SeriesStatus`, seriesStatuses.join(','));

    // Genres
    const genres = [];
    context.querySelectorAll('.chkGenreFilter').forEach(elem => {
        if (elem.checked) {
            genres.push(elem.getAttribute('data-filter'));
        }
    });

    userSettings.setFilter(settingsKey + '-filter-GenreIds', genres.join(','));
}
function bindCheckboxInput(context, on) {
    const elems = context.querySelectorAll('.checkboxList-verticalwrap');
    for (let i = 0, length = elems.length; i < length; i++) {
        if (on) {
            inputManager.on(elems[i], onInputCommand);
        } else {
            inputManager.off(elems[i], onInputCommand);
        }
    }
}
function initEditor(context, settings) {
    context.querySelector('form').addEventListener('submit', onSubmit);

    let elems = context.querySelectorAll('.simpleFilter');
    let i;
    let length;

    for (i = 0, length = elems.length; i < length; i++) {
        if (elems[i].tagName === 'INPUT') {
            elems[i].checked = settings[elems[i].getAttribute('data-settingname')] || false;
        } else {
            elems[i].querySelector('input').checked = settings[elems[i].getAttribute('data-settingname')] || false;
        }
    }

    const videoTypes = settings.VideoTypes ? settings.VideoTypes.split(',') : [];
    elems = context.querySelectorAll('.chkVideoTypeFilter');

    for (i = 0, length = elems.length; i < length; i++) {
        elems[i].checked = videoTypes.indexOf(elems[i].getAttribute('data-filter')) !== -1;
    }

    const seriesStatuses = settings.SeriesStatus ? settings.SeriesStatus.split(',') : [];
    elems = context.querySelectorAll('.chkSeriesStatus');

    for (i = 0, length = elems.length; i < length; i++) {
        elems[i].checked = seriesStatuses.indexOf(elems[i].getAttribute('data-filter')) !== -1;
    }

    if (context.querySelector('.basicFilterSection .viewSetting:not(.hide)')) {
        context.querySelector('.basicFilterSection').classList.remove('hide');
    } else {
        context.querySelector('.basicFilterSection').classList.add('hide');
    }

    if (context.querySelector('.featureSection .viewSetting:not(.hide)')) {
        context.querySelector('.featureSection').classList.remove('hide');
    } else {
        context.querySelector('.featureSection').classList.add('hide');
    }
}
function loadDynamicFilters(context, options) {
    const apiClient = ServerConnections.getApiClient(options.serverId);

    const filterMenuOptions = Object.assign(options.filterMenuOptions, {

        UserId: apiClient.getCurrentUserId(),
        ParentId: options.parentId,
        IncludeItemTypes: options.itemTypes.join(',')
    });

    apiClient.getFilters(filterMenuOptions).then((result) => {
        renderDynamicFilters(context, result, options);
    });
}
class FilterMenu {
    show(options) {
        return new Promise( (resolve) => {
            const dialogOptions = {
                removeOnClose: true,
                scrollY: false
            };
            if (layoutManager.tv) {
                dialogOptions.size = 'fullscreen';
            } else {
                dialogOptions.size = 'small';
            }

            const dlg = dialogHelper.createDialog(dialogOptions);

            dlg.classList.add('formDialog');

            let html = '';

            html += '<div class="formDialogHeader">';
            html += `<button is="paper-icon-button-light" class="btnCancel hide-mouse-idle-tv" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
            html += '<h3 class="formDialogHeaderTitle">${Filters}</h3>';

            html += '</div>';

            html += template;

            dlg.innerHTML = globalize.translateHtml(html, 'core');

            const settingElements = dlg.querySelectorAll('.viewSetting');
            for (let i = 0, length = settingElements.length; i < length; i++) {
                if (options.visibleSettings.indexOf(settingElements[i].getAttribute('data-settingname')) === -1) {
                    settingElements[i].classList.add('hide');
                } else {
                    settingElements[i].classList.remove('hide');
                }
            }

            initEditor(dlg, options.settings);
            loadDynamicFilters(dlg, options);

            bindCheckboxInput(dlg, true);
            dlg.querySelector('.btnCancel').addEventListener('click', function () {
                dialogHelper.close(dlg);
            });

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            let submitted;

            dlg.querySelector('form').addEventListener('change', function () {
                submitted = true;
            }, true);

            dialogHelper.open(dlg).then( function() {
                bindCheckboxInput(dlg, false);

                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (submitted) {
                    saveValues(dlg, options.settings, options.settingsKey);
                    return resolve();
                }
                return resolve();
            });
        });
    }
}

export default FilterMenu;
