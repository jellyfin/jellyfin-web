import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import globalize from '../../../../scripts/globalize';
import template from './directPlayProfileEditor.template.html';
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

export function show(directPlayProfile) {
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

        dlg.querySelector('#selectDirectPlayProfileType', dlg).value = directPlayProfile.Type || 'Video';
        dlg.querySelector('#txtDirectPlayContainer', dlg).value = directPlayProfile.Container || '';
        dlg.querySelector('#txtDirectPlayAudioCodec', dlg).value = directPlayProfile.AudioCodec || '';
        dlg.querySelector('#txtDirectPlayVideoCodec', dlg).value = directPlayProfile.VideoCodec || '';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(directPlayProfile);
            } else {
                reject();
            }
        });

        dlg.querySelector('#selectDirectPlayProfileType').addEventListener('change', function () {
            if (this.value == 'Video') {
                dlg.querySelector('#fldDirectPlayVideoCodec').classList.remove('hide');
            } else {
                dlg.querySelector('#fldDirectPlayVideoCodec').classList.add('hide');
            }

            if (this.value == 'Photo') {
                dlg.querySelector('#fldDirectPlayAudioCodec').classList.add('hide');
            } else {
                dlg.querySelector('#fldDirectPlayAudioCodec').classList.remove('hide');
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            directPlayProfile.Type = dlg.querySelector('#selectDirectPlayProfileType', dlg).value;
            directPlayProfile.Container = dlg.querySelector('#txtDirectPlayContainer', dlg).value;
            directPlayProfile.AudioCodec = dlg.querySelector('#txtDirectPlayAudioCodec', dlg).value;
            directPlayProfile.VideoCodec = dlg.querySelector('#txtDirectPlayVideoCodec', dlg).value;

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });

        dlg.querySelector('#selectDirectPlayProfileType').dispatchEvent(new CustomEvent('change', {
            bubbles: true
        }));
    });
}

export default {
    show: show
};

