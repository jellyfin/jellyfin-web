import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import globalize from '../../../../scripts/globalize';
import template from './responseProfileEditor.template.html';
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

export function show(responseProfile) {
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

        dlg.querySelector('#selectResponseProfileType', dlg).value = responseProfile.Type || 'Video';
        dlg.querySelector('#txtResponseProfileContainer', dlg).value = responseProfile.Container || '';
        dlg.querySelector('#txtResponseProfileAudioCodec', dlg).value = responseProfile.AudioCodec || '';
        dlg.querySelector('#txtResponseProfileVideoCodec', dlg).value = responseProfile.VideoCodec || '';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(responseProfile);
            } else {
                reject();
            }
        });

        dlg.querySelector('#selectResponseProfileType').addEventListener('change', function () {
            if (this.value == 'Video') {
                dlg.querySelector('#fldResponseProfileVideoCodec').classList.remove('hide');
            } else {
                dlg.querySelector('#fldResponseProfileVideoCodec').classList.add('hide');
            }

            if (this.value == 'Photo') {
                dlg.querySelector('#fldResponseProfileAudioCodec').classList.add('hide');
            } else {
                dlg.querySelector('#fldResponseProfileAudioCodec').classList.remove('hide');
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            responseProfile.Type = dlg.querySelector('#selectResponseProfileType', dlg).value;
            responseProfile.Container = dlg.querySelector('#txtResponseProfileContainer', dlg).value;
            responseProfile.AudioCodec = dlg.querySelector('#txtResponseProfileAudioCodec', dlg).value;
            responseProfile.VideoCodec = dlg.querySelector('#txtResponseProfileVideoCodec', dlg).value;

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });

        dlg.querySelector('#selectResponseProfileType').dispatchEvent(new CustomEvent('change', {
            bubbles: true
        }));
    });
}

export default {
    show: show
};

