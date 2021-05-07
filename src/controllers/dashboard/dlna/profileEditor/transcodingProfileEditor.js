import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import globalize from '../../../../scripts/globalize';
import template from './transcodingProfileEditor.template.html';
import '../../../../elements/emby-toggle/emby-toggle';
import '../../../../elements/emby-checkbox/emby-checkbox';
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

export function show(transcodingProfile) {
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
        dlg.classList.add('dlg-libraryeditor');
        dlg.classList.add('formDialog');

        let html = '';
        let submitted = false;

        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        dlg.querySelector('#selectTranscodingProfileType', dlg).value = transcodingProfile.Type || 'Video';
        dlg.querySelector('#txtTranscodingContainer', dlg).value = transcodingProfile.Container || '';
        dlg.querySelector('#txtTranscodingAudioCodec', dlg).value = transcodingProfile.AudioCodec || '';
        dlg.querySelector('#txtTranscodingVideoCodec', dlg).value = transcodingProfile.VideoCodec || '';
        dlg.querySelector('#selectTranscodingProtocol', dlg).value = transcodingProfile.Protocol || 'Http';
        dlg.querySelector('#chkEnableMpegtsM2TsMode', dlg).checked = transcodingProfile.EnableMpegtsM2TsMode || false;
        dlg.querySelector('#chkEstimateContentLength', dlg).checked = transcodingProfile.EstimateContentLength || false;
        dlg.querySelector('#chkReportByteRangeRequests', dlg).checked = transcodingProfile.TranscodeSeekInfo === 'Bytes';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(transcodingProfile);
            } else {
                reject();
            }
        });

        dlg.querySelector('.chkAdvanced').addEventListener('change', function () {
            if (this.checked) {
                dlg.querySelector('.tabTranscodingBasics').classList.add('hide');
                dlg.querySelector('.tabTranscodingAdvanced').classList.remove('hide');
            } else {
                dlg.querySelector('.tabTranscodingBasics').classList.remove('hide');
                dlg.querySelector('.tabTranscodingAdvanced').classList.add('hide');
            }
        });

        dlg.querySelector('#selectTranscodingProfileType').addEventListener('change', function () {
            if (this.value == 'Video') {
                dlg.querySelector('#fldTranscodingVideoCodec').classList.remove('hide');
                dlg.querySelector('#fldTranscodingProtocol').classList.remove('hide');
                dlg.querySelector('#fldEnableMpegtsM2TsMode').classList.remove('hide');
            } else {
                dlg.querySelector('#fldTranscodingVideoCodec').classList.add('hide');
                dlg.querySelector('#fldTranscodingProtocol').classList.add('hide');
                dlg.querySelector('#fldEnableMpegtsM2TsMode').classList.add('hide');
            }

            if (this.value == 'Photo') {
                dlg.querySelector('#fldTranscodingAudioCodec').classList.add('hide');
                dlg.querySelector('#fldEstimateContentLength').classList.add('hide');
                dlg.querySelector('#fldReportByteRangeRequests').classList.add('hide');
            } else {
                dlg.querySelector('#fldTranscodingAudioCodec').classList.remove('hide');
                dlg.querySelector('#fldEstimateContentLength').classList.remove('hide');
                dlg.querySelector('#fldReportByteRangeRequests').classList.remove('hide');
            }
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            transcodingProfile.Type = dlg.querySelector('#selectTranscodingProfileType', dlg).value;
            transcodingProfile.Container = dlg.querySelector('#txtTranscodingContainer', dlg).value;
            transcodingProfile.AudioCodec = dlg.querySelector('#txtTranscodingAudioCodec', dlg).value;
            transcodingProfile.VideoCodec = dlg.querySelector('#txtTranscodingVideoCodec', dlg).value;
            transcodingProfile.Protocol = dlg.querySelector('#selectTranscodingProtocol', dlg).value;
            transcodingProfile.Context = 'Streaming';
            transcodingProfile.EnableMpegtsM2TsMode = dlg.querySelector('#chkEnableMpegtsM2TsMode', dlg).matches(':checked');
            transcodingProfile.EstimateContentLength = dlg.querySelector('#chkEstimateContentLength', dlg).matches(':checked');
            transcodingProfile.TranscodeSeekInfo = dlg.querySelector('#chkReportByteRangeRequests', dlg).matches(':checked') ? 'Bytes' : 'Auto';

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });

        dlg.querySelector('#selectTranscodingProfileType').dispatchEvent(new CustomEvent('change', {
            bubbles: true
        }));
    });
}

export default {
    show: show
};

