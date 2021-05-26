import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import globalize from '../../../../scripts/globalize';
import template from './subtitleProfileEditor.template.html';
import '../../../../elements/emby-button/paper-icon-button-light';
import '../../../../elements/emby-input/emby-input';
import '../../../../elements/emby-select/emby-select';
import '../../../../components/formdialog.scss';

function centerFocus(elem, horiz, on) {
    import('../../../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

export function show(profile) {
    return new Promise((resolve, reject) => {
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
        let submitted = false;

        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        dlg.querySelector('#txtSubtitleProfileFormat', dlg).value = profile.Format || '';
        dlg.querySelector('#selectSubtitleProfileMethod', dlg).value = profile.Method || '';
        dlg.querySelector('#selectSubtitleProfileDidlMode', dlg).value = profile.DidlMode || '';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(profile);
            } else {
                reject();
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            profile.Format = dlg.querySelector('#txtSubtitleProfileFormat', dlg).value;
            profile.Method = dlg.querySelector('#selectSubtitleProfileMethod', dlg).value;
            profile.DidlMode = dlg.querySelector('#selectSubtitleProfileDidlMode', dlg).value;

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });
    });
}

export default {
    show: show
};

