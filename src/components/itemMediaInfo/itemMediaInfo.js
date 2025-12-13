
/**
 * Module for display media info.
 * @module components/itemMediaInfo/itemMediaInfo
 */

import escapeHtml from 'escape-html';

import dialogHelper from '@/components/dialogHelper/dialogHelper';
import itemHelper from '@/components/itemHelper';
import layoutManager from '@/components/layoutManager';
import loading from '@/components/loading/loading';
import toast from '@/components/toast/toast';
import globalize from '@/lib/globalize';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import { copy } from '@/scripts/clipboard';
import dom from '@/utils/dom';
import { getReadableSize } from '@/utils/file';

import '@/components/formdialog.scss';
import '@/components/listview/listview.scss';
import '@/elements/emby-button/emby-button';
import '@/elements/emby-button/paper-icon-button-light';
import '@/elements/emby-select/emby-select';
import 'material-design-icons-iconfont';

import '@/styles/flexstyles.scss';

import template from './itemMediaInfo.template.html';

// Do not add extra spaces between tags - they will be copied into the result
const copyButtonHtml = layoutManager.tv ? '' :
    `<button is="paper-icon-button-light" class="btnCopy" title="${globalize.translate('Copy')}" aria-label="${globalize.translate('Copy')}"
        ><span class="material-icons content_copy" aria-hidden="true"></span></button>`;
const attributeDelimiterHtml = layoutManager.tv ? '' : '<span class="hide">: </span>';

function setMediaInfo(user, page, item) {
    let html = item.MediaSources.map(version => {
        return getMediaSourceHtml(user, item, version);
    }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
    if (item.MediaSources.length > 1) {
        html = `<br/>${html}`;
    }
    const mediaInfoContent = page.querySelector('#mediaInfoContent');
    mediaInfoContent.innerHTML = html;

    for (const btn of mediaInfoContent.querySelectorAll('.btnCopy')) {
        btn.addEventListener('click', () => {
            const infoBlock = dom.parentWithClass(btn, 'mediaInfoStream') || dom.parentWithClass(btn, 'mediaInfoSource') || mediaInfoContent;

            copy(infoBlock.textContent).then(() => {
                toast(globalize.translate('Copied'));
            }).catch(() => {
                console.error('Could not copy text');
                toast(globalize.translate('CopyFailed'));
            });
        });
    }
}

function getMediaSourceHtml(user, item, version) {
    let html = '<div class="mediaInfoSource">';
    if (version.Name) {
        html += `<div><h2 class="mediaInfoStreamType">${escapeHtml(version.Name)}${copyButtonHtml}</h2></div>\n`;
    }
    if (version.Container) {
        html += `${createAttribute(globalize.translate('MediaInfoContainer'), version.Container)}<br/>`;
    }
    if (version.Formats?.length) {
        html += `${createAttribute(globalize.translate('MediaInfoFormat'), version.Formats.join(','))}<br/>`;
    }
    if (version.Path && user?.Policy.IsAdministrator) {
        html += `${createAttribute(globalize.translate('MediaInfoPath'), version.Path, true)}<br/>`;
    }
    if (version.Size) {
        const size = getReadableSize(version.Size);
        html += `${createAttribute(globalize.translate('MediaInfoSize'), size)}<br/>`;
    }
    version.MediaStreams.sort(itemHelper.sortTracks);
    for (const stream of version.MediaStreams) {
        if (stream.Type === 'Data') {
            continue;
        }

        html += '<div class="mediaInfoStream">';
        let translateString;
        switch (stream.Type) {
            case 'Audio':
            case 'Data':
            case 'Subtitle':
            case 'Video':
            case 'Lyric':
                translateString = stream.Type;
                break;
            case 'EmbeddedImage':
                translateString = 'Image';
                break;
        }

        const displayType = globalize.translate(translateString);
        html += `\n<h2 class="mediaInfoStreamType">${displayType}${copyButtonHtml}</h2>\n`;
        const attributes = [];
        if (stream.DisplayTitle) {
            attributes.push(createAttribute(globalize.translate('MediaInfoTitle'), stream.DisplayTitle));
        }
        if (stream.Language && stream.Type !== 'Video') {
            attributes.push(createAttribute(globalize.translate('MediaInfoLanguage'), stream.Language));
        }
        if (stream.Codec) {
            attributes.push(createAttribute(globalize.translate('MediaInfoCodec'), stream.Codec.toUpperCase()));
        }
        if (stream.CodecTag) {
            attributes.push(createAttribute(globalize.translate('MediaInfoCodecTag'), stream.CodecTag));
        }
        if (stream.IsAVC != null) {
            attributes.push(createAttribute('AVC', (stream.IsAVC ? 'Yes' : 'No')));
        }
        if (stream.Profile) {
            attributes.push(createAttribute(globalize.translate('MediaInfoProfile'), stream.Profile));
        }
        if (stream.Level > 0) {
            attributes.push(createAttribute(globalize.translate('MediaInfoLevel'), stream.Level));
        }
        if (stream.Width || stream.Height) {
            attributes.push(createAttribute(globalize.translate('MediaInfoResolution'), `${stream.Width}x${stream.Height}`));
        }
        if (stream.AspectRatio && stream.Codec !== 'mjpeg') {
            attributes.push(createAttribute(globalize.translate('MediaInfoAspectRatio'), stream.AspectRatio));
        }
        if (stream.Type === 'Video') {
            if (stream.IsAnamorphic != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoAnamorphic'), (stream.IsAnamorphic ? 'Yes' : 'No')));
            }
            attributes.push(createAttribute(globalize.translate('MediaInfoInterlaced'), (stream.IsInterlaced ? 'Yes' : 'No')));
        }
        if (stream.ReferenceFrameRate && stream.Type === 'Video') {
            attributes.push(createAttribute(globalize.translate('MediaInfoFramerate'), stream.ReferenceFrameRate));
        }
        if (stream.ChannelLayout) {
            attributes.push(createAttribute(globalize.translate('MediaInfoLayout'), stream.ChannelLayout));
        }
        if (stream.Channels) {
            attributes.push(createAttribute(globalize.translate('MediaInfoChannels'), `${stream.Channels} ch`));
        }
        if (stream.BitRate) {
            attributes.push(createAttribute(globalize.translate('MediaInfoBitrate'), `${parseInt(stream.BitRate / 1000, 10)} kbps`));
        }
        if (stream.SampleRate) {
            attributes.push(createAttribute(globalize.translate('MediaInfoSampleRate'), `${stream.SampleRate} Hz`));
        }
        if (stream.BitDepth) {
            attributes.push(createAttribute(globalize.translate('MediaInfoBitDepth'), `${stream.BitDepth} bit`));
        }
        if (stream.VideoRange && stream.Type === 'Video') {
            attributes.push(createAttribute(globalize.translate('MediaInfoVideoRange'), stream.VideoRange));
        }
        if (stream.VideoRangeType && stream.Type === 'Video') {
            attributes.push(createAttribute(globalize.translate('MediaInfoVideoRangeType'), stream.VideoRangeType));
        }
        if (stream.VideoDoViTitle) {
            attributes.push(createAttribute(globalize.translate('MediaInfoDoViTitle'), stream.VideoDoViTitle));
            if (stream.DvVersionMajor != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoDvVersionMajor'), stream.DvVersionMajor));
            }
            if (stream.DvVersionMinor != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoDvVersionMinor'), stream.DvVersionMinor));
            }
            if (stream.DvProfile != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoDvProfile'), stream.DvProfile));
            }
            if (stream.DvLevel != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoDvLevel'), stream.DvLevel));
            }
            if (stream.RpuPresentFlag != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoRpuPresentFlag'), stream.RpuPresentFlag));
            }
            if (stream.ElPresentFlag != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoElPresentFlag'), stream.ElPresentFlag));
            }
            if (stream.BlPresentFlag != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoBlPresentFlag'), stream.BlPresentFlag));
            }
            if (stream.DvBlSignalCompatibilityId != null) {
                attributes.push(createAttribute(globalize.translate('MediaInfoDvBlSignalCompatibilityId'), stream.DvBlSignalCompatibilityId));
            }
        }
        if (stream.ColorSpace) {
            attributes.push(createAttribute(globalize.translate('MediaInfoColorSpace'), stream.ColorSpace));
        }
        if (stream.ColorTransfer) {
            attributes.push(createAttribute(globalize.translate('MediaInfoColorTransfer'), stream.ColorTransfer));
        }
        if (stream.ColorPrimaries) {
            attributes.push(createAttribute(globalize.translate('MediaInfoColorPrimaries'), stream.ColorPrimaries));
        }
        if (stream.PixelFormat) {
            attributes.push(createAttribute(globalize.translate('MediaInfoPixelFormat'), stream.PixelFormat));
        }
        if (stream.RefFrames) {
            attributes.push(createAttribute(globalize.translate('MediaInfoRefFrames'), stream.RefFrames));
        }
        if (stream.Rotation && stream.Type === 'Video') {
            attributes.push(createAttribute(globalize.translate('MediaInfoRotation'), stream.Rotation));
        }
        if (stream.NalLengthSize) {
            attributes.push(createAttribute('NAL', stream.NalLengthSize));
        }
        if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
            attributes.push(createAttribute(globalize.translate('MediaInfoDefault'), (stream.IsDefault ? 'Yes' : 'No')));
            attributes.push(createAttribute(globalize.translate('MediaInfoForced'), (stream.IsForced ? 'Yes' : 'No')));
            attributes.push(createAttribute(globalize.translate('MediaInfoExternal'), (stream.IsExternal ? 'Yes' : 'No')));
        }
        if (stream.Type === 'Video' && version.Timestamp) {
            attributes.push(createAttribute(globalize.translate('MediaInfoTimestamp'), version.Timestamp));
        }
        html += attributes.join('<br/>');
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// File Paths should be always ltr. The isLtr parameter allows this.
function createAttribute(label, value, isLtr) {
    return `<span class="mediaInfoLabel">${label}</span>${attributeDelimiterHtml}<span class="mediaInfoAttribute" ${isLtr && 'dir="ltr"'}>${escapeHtml(value)}</span>\n`;
}

function loadMediaInfo(itemId, serverId) {
    const apiClient = ServerConnections.getApiClient(serverId);
    return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(item => {
        const dialogOptions = {
            size: 'small',
            removeOnClose: true,
            scrollY: false
        };
        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        }
        const dlg = dialogHelper.createDialog(dialogOptions);
        dlg.classList.add('formDialog');
        let html = '';
        html += globalize.translateHtml(template, 'core');
        dlg.innerHTML = html;
        if (layoutManager.tv) {
            dlg.querySelector('.formDialogContent');
        }
        dialogHelper.open(dlg);
        dlg.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(dlg);
        });
        apiClient.getCurrentUser().then(user => {
            setMediaInfo(user, dlg, item);
        });
        loading.hide();
    });
}

export function show(itemId, serverId) {
    loading.show();
    return loadMediaInfo(itemId, serverId);
}

export default {
    show: show
};
