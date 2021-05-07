import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import globalize from '../../../../scripts/globalize';
import template from './identificationHeaderEditor.template.html';
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

export function show(header) {
    return new Promise(function (resolve, reject) {
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

        dlg.querySelector('#txtIdentificationHeaderName', dlg).value = header.Name || '';
        dlg.querySelector('#txtIdentificationHeaderValue', dlg).value = header.Value || '';
        dlg.querySelector('#selectMatchType', dlg).value = header.Match || 'Equals';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(header);
            } else {
                reject();
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            header.Name = dlg.querySelector('#txtIdentificationHeaderName', dlg).value;
            header.Value = dlg.querySelector('#txtIdentificationHeaderValue', dlg).value;
            header.Match = dlg.querySelector('#selectMatchType', dlg).value;

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });
    });
}

export default {
    show: show
};

