
/**
 * Module for display media info.
 * @module components/itemMediaInfo/itemMediaInfo
 */

import escapeHtml from 'escape-html';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import toast from '../toast/toast';
import { copy } from '../../scripts/clipboard';
import dom from '../../scripts/dom';
import globalize from '../../scripts/globalize';
import itemHelper from '../itemHelper';
import loading from '../loading/loading';
import '../../elements/emby-select/emby-select';
import '../listview/listview.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import '../../styles/flexstyles.scss';
import ServerConnections from '../ServerConnections';
import template from './itemMediaInfo.template.html';
import type { BaseItemDto, MediaSourceInfo, UserDto, MediaStream } from '@jellyfin/sdk/lib/generated-client';

// Do not add extra spaces between tags - they will be copied into the result
const copyButtonHtml = layoutManager.tv ? '' :
    `<button is="paper-icon-button-light" class="btnCopy" title="${globalize.translate('Copy')}" aria-label="${globalize.translate('Copy')}"
        ><span class="material-icons content_copy" aria-hidden="true"></span></button>`;
const attributeDelimiterHtml = layoutManager.tv ? '' : '<span class="hide">: </span>';

function setMediaInfo(user: UserDto, page: HTMLDivElement, item: BaseItemDto) {
    if (item.MediaSources) {
        let html = item.MediaSources.map(version => {
            return getMediaSourceHtml(user, item, version);
        }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
        if (item.MediaSources.length > 1) {
            html = `<br/>${html}`;
        }
        const mediaInfoContent = page.querySelector('#mediaInfoContent');
        if (mediaInfoContent) {
            mediaInfoContent.innerHTML = html;

            for (const btn of mediaInfoContent.querySelectorAll<HTMLButtonElement>('.btnCopy')) {
                btn.addEventListener('click', () => {
                    const infoBlock = dom.parentWithClass(btn, 'mediaInfoStream') || dom.parentWithClass(btn, 'mediaInfoSource') || mediaInfoContent;
                    if (infoBlock.textContent) {
                        copy(infoBlock.textContent).then(() => {
                            toast(globalize.translate('Copied'));
                        }).catch(() => {
                            console.error('Could not copy text');
                            toast(globalize.translate('CopyFailed'));
                        });
                    }
                });
            }
        }
    }
}

function getMediaSourceHtml(user: UserDto, item: BaseItemDto, version: MediaSourceInfo) {
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
    if (version.Path && user?.Policy?.IsAdministrator) {
        html += `${createAttribute(globalize.translate('MediaInfoPath'), version.Path, true)}<br/>`;
    }
    if (version.Size) {
        const size = `${(version.Size / (1024 * 1024)).toFixed(0)} MB`;
        html += `${createAttribute(globalize.translate('MediaInfoSize'), size)}<br/>`;
    }
    if (version.MediaStreams) {
        version.MediaStreams.sort(itemHelper.sortTracks);
        for (const stream of version.MediaStreams) {
            html += getMediaStreamHtml(version, stream);
        }
    }
    html += '</div>';
    return html;
}

function getMediaStreamHtml(version: MediaSourceInfo, stream: MediaStream) {
    let html = '';
    if (stream.Type === 'Data') return html;

    html += '<div class="mediaInfoStream">';
    html += getMediaStreamHeaderHtml(stream.Type);
    html += getMediaStreamAttributesHtml(version, stream);
    html += '</div>';
    return html;
}

function getMediaStreamHeaderHtml(streamType: Exclude<MediaStream['Type'], 'Data'>) {
    if (!streamType) return '';

    let translateString: string;
    switch (streamType) {
        case 'Audio':
        case 'Subtitle':
        case 'Video':
        case 'Lyric':
            translateString = streamType;
            break;
        case 'EmbeddedImage':
            translateString = 'Image';
            break;
    }

    const displayType = globalize.translate(translateString);
    return `\n<h2 class="mediaInfoStreamType">${displayType}${copyButtonHtml}</h2>\n`;
}

function getMediaStreamAttributesHtml(version: MediaSourceInfo, stream: MediaStream) {
    const attributes: string[] = [];
    if (stream.DisplayTitle) {
        attributes.push(createAttribute(globalize.translate('MediaInfoTitle'), stream.DisplayTitle));
    }
    if (stream.Language && stream.Type !== 'Video') {
        attributes.push(createAttribute(globalize.translate('MediaInfoLanguage'), stream.Language));
    }
    getCodecAttributesHtml(attributes, stream);
    if (stream.IsAVC != null) {
        attributes.push(createAttribute('AVC', getBooleanString(stream.IsAVC)));
    }
    if (stream.Profile) {
        attributes.push(createAttribute(globalize.translate('MediaInfoProfile'), stream.Profile));
    }
    if (stream.Level && stream.Level > 0) {
        attributes.push(createAttribute(globalize.translate('MediaInfoLevel'), stream.Level));
    }
    getDimensionsAttributesHtml(attributes, stream);
    getVideoAttributesHtml(attributes, stream);
    getChannelAttributesHtml(attributes, stream);
    if (stream.BitRate) {
        attributes.push(createAttribute(globalize.translate('MediaInfoBitrate'), `${Math.trunc(stream.BitRate / 1000)} kbps`));
    }
    if (stream.SampleRate) {
        attributes.push(createAttribute(globalize.translate('MediaInfoSampleRate'), `${stream.SampleRate} Hz`));
    }
    if (stream.BitDepth) {
        attributes.push(createAttribute(globalize.translate('MediaInfoBitDepth'), `${stream.BitDepth} bit`));
    }
    getVideoRangeAttributesHtml(attributes, stream);
    getDolbyVisionAttributesHtml(attributes, stream);
    getColorAttributesHtml(attributes, stream);
    if (stream.PixelFormat) {
        attributes.push(createAttribute(globalize.translate('MediaInfoPixelFormat'), stream.PixelFormat));
    }
    if (stream.RefFrames) {
        attributes.push(createAttribute(globalize.translate('MediaInfoRefFrames'), stream.RefFrames));
    }
    if (stream.NalLengthSize) {
        attributes.push(createAttribute('NAL', stream.NalLengthSize));
    }
    getSubtitleAndAudioAttributesHtml(attributes, stream);
    if (stream.Type === 'Video' && version.Timestamp) {
        attributes.push(createAttribute(globalize.translate('MediaInfoTimestamp'), version.Timestamp));
    }
    return attributes.join('<br/>');
}

function getCodecAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.Codec) {
        attributes.push(createAttribute(globalize.translate('MediaInfoCodec'), stream.Codec.toUpperCase()));
    }
    if (stream.CodecTag) {
        attributes.push(createAttribute(globalize.translate('MediaInfoCodecTag'), stream.CodecTag));
    }
}

function getDimensionsAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.Width || stream.Height) {
        attributes.push(createAttribute(globalize.translate('MediaInfoResolution'), `${stream.Width}x${stream.Height}`));
    }
    if (stream.AspectRatio && stream.Codec !== 'mjpeg') {
        attributes.push(createAttribute(globalize.translate('MediaInfoAspectRatio'), stream.AspectRatio));
    }
}

function getVideoAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.Type === 'Video') {
        if (stream.IsAnamorphic != null) {
            attributes.push(createAttribute(globalize.translate('MediaInfoAnamorphic'), getBooleanString(stream.IsAnamorphic)));
        }
        attributes.push(createAttribute(globalize.translate('MediaInfoInterlaced'), getBooleanString(stream.IsInterlaced)));

        const framerate = stream.AverageFrameRate || stream.RealFrameRate;
        if (framerate) {
            attributes.push(createAttribute(globalize.translate('MediaInfoFramerate'), framerate));
        }
    }
}

function getChannelAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.ChannelLayout) {
        attributes.push(createAttribute(globalize.translate('MediaInfoLayout'), stream.ChannelLayout));
    }
    if (stream.Channels) {
        attributes.push(createAttribute(globalize.translate('MediaInfoChannels'), `${stream.Channels} ch`));
    }
}

function getVideoRangeAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.Type !== 'Video') return;

    if (stream.VideoRange) {
        attributes.push(createAttribute(globalize.translate('MediaInfoVideoRange'), stream.VideoRange));
    }
    if (stream.VideoRangeType) {
        attributes.push(createAttribute(globalize.translate('MediaInfoVideoRangeType'), stream.VideoRangeType));
    }
}

function getColorAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.ColorSpace) {
        attributes.push(createAttribute(globalize.translate('MediaInfoColorSpace'), stream.ColorSpace));
    }
    if (stream.ColorTransfer) {
        attributes.push(createAttribute(globalize.translate('MediaInfoColorTransfer'), stream.ColorTransfer));
    }
    if (stream.ColorPrimaries) {
        attributes.push(createAttribute(globalize.translate('MediaInfoColorPrimaries'), stream.ColorPrimaries));
    }
}

function getDolbyVisionAttributesHtml(attributes: string[], stream: MediaStream) {
    if (!stream.VideoDoViTitle) return;

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

function getSubtitleAndAudioAttributesHtml(attributes: string[], stream: MediaStream) {
    if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
        attributes.push(createAttribute(globalize.translate('MediaInfoDefault'), getBooleanString(stream.IsDefault)));
        attributes.push(createAttribute(globalize.translate('MediaInfoForced'), getBooleanString(stream.IsForced)));
        attributes.push(createAttribute(globalize.translate('MediaInfoExternal'), getBooleanString(stream.IsExternal)));
    }
}

function getBooleanString(value?: boolean) {
    return globalize.translate(value ? 'Yes' : 'No');
}

// File Paths should be always ltr. The isLtr parameter allows this.
function createAttribute(label: string, value: string | number, isLtr?: boolean) {
    return `<span class="mediaInfoLabel">${label}</span>${attributeDelimiterHtml}<span class="mediaInfoAttribute" ${isLtr && 'dir="ltr"'}>${escapeHtml(value.toString())}</span>\n`;
}

function loadMediaInfo(itemId: string, serverId: string) {
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
        void dialogHelper.open(dlg);
        dlg.querySelector('.btnCancel')?.addEventListener('click', () => {
            dialogHelper.close(dlg);
        });
        void apiClient.getCurrentUser().then(user => {
            setMediaInfo(user, dlg, item);
        });
        loading.hide();
    });
}

export function show(itemId: string, serverId: string) {
    loading.show();
    return loadMediaInfo(itemId, serverId);
}

export default {
    show: show
};
