import dialogHelper from '../dialogHelper/dialogHelper';
import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import layoutManager from '../layoutManager';
import scrollHelper from '../../scripts/scrollHelper';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-radio/emby-radio';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import template from './guide-settings.template.html';

function saveCategories(context, options) {
    const categories = [];

    const chkCategorys = context.querySelectorAll('.chkCategory');
    for (const chkCategory of chkCategorys) {
        const type = chkCategory.getAttribute('data-type');

        if (chkCategory.checked) {
            categories.push(type);
        }
    }

    if (categories.length >= 4) {
        categories.push('series');
    }

    // differentiate between none and all
    categories.push('all');
    options.categories = categories;
}

function loadCategories(context, options) {
    const selectedCategories = options.categories || [];

    const chkCategorys = context.querySelectorAll('.chkCategory');
    for (const chkCategory of chkCategorys) {
        const type = chkCategory.getAttribute('data-type');

        chkCategory.checked = !selectedCategories.length || selectedCategories.indexOf(type) !== -1;
    }
}

function save(context) {
    const chkIndicators = context.querySelectorAll('.chkIndicator');

    for (const chkIndicator of chkIndicators) {
        const type = chkIndicator.getAttribute('data-type');
        userSettings.set('guide-indicator-' + type, chkIndicator.checked);
    }

    userSettings.set('guide-colorcodedbackgrounds', context.querySelector('.chkColorCodedBackgrounds').checked);
    userSettings.set('livetv-favoritechannelsattop', context.querySelector('.chkFavoriteChannelsAtTop').checked);

    const sortBys = context.querySelectorAll('.chkSortOrder');
    for (const sortBy of sortBys) {
        if (sortBy.checked) {
            userSettings.set('livetv-channelorder', sortBy.value);
            break;
        }
    }
}

function load(context) {
    const chkIndicators = context.querySelectorAll('.chkIndicator');

    for (const chkIndicator of chkIndicators) {
        const type = chkIndicator.getAttribute('data-type');

        if (chkIndicator.getAttribute('data-default') === 'true') {
            chkIndicator.checked = userSettings.get('guide-indicator-' + type) !== 'false';
        } else {
            chkIndicator.checked = userSettings.get('guide-indicator-' + type) === 'true';
        }
    }

    context.querySelector('.chkColorCodedBackgrounds').checked = userSettings.get('guide-colorcodedbackgrounds') === 'true';
    context.querySelector('.chkFavoriteChannelsAtTop').checked = userSettings.get('livetv-favoritechannelsattop') !== 'false';

    const sortByValue = userSettings.get('livetv-channelorder') || 'Number';

    const sortBys = context.querySelectorAll('.chkSortOrder');
    for (const sortBy of sortBys) {
        sortBy.checked = sortBy.value === sortByValue;
    }
}

function showEditor(options) {
    return new Promise(function (resolve, reject) {
        let settingsChanged = false;

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

        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        dlg.addEventListener('change', function () {
            settingsChanged = true;
        });

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                scrollHelper.centerFocus.off(dlg.querySelector('.formDialogContent'), false);
            }

            save(dlg);
            saveCategories(dlg, options);

            if (settingsChanged) {
                resolve();
            } else {
                reject();
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        }

        load(dlg);
        loadCategories(dlg, options);
        dialogHelper.open(dlg);
    });
}

export default {
    show: showEditor
};
