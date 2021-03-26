/* eslint-disable indent */

/**
 * Module for display media info.
 * @module components/itemMediaInfo/itemMediaInfo
 */

import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import '../../elements/emby-select/emby-select';
import '../listview/listview.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import '../../assets/css/flexstyles.scss';
import ServerConnections from '../ServerConnections';
import template from './itemMediaInfo.template.html';

    function setMediaInfo(user, page, item) {
        let html = item.MediaSources.map(version => {
            return getMediaSourceHtml(user, item, version);
        }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
        if (item.MediaSources.length > 1) {
            html = `<br/>${html}`;
        }
        const mediaInfoContent = page.querySelector('#mediaInfoContent');
        mediaInfoContent.innerHTML = html;
    }

    function getMediaSourceHtml(user, item, version) {
        let html = '';
        if (version.Name) {
            html += `<div><h2 class="mediaInfoStreamType">${version.Name}</h2></div>`;
        }
        if (version.Container) {
            html += `${createAttribute(globalize.translate('MediaInfoContainer'), version.Container)}<br/>`;
        }
        if (version.Formats && version.Formats.length) {
            html += `${createAttribute(globalize.translate('MediaInfoFormat'), version.Formats.join(','))}<br/>`;
        }
        if (version.Path && user && user.Policy.IsAdministrator) {
            html += `${createAttribute(globalize.translate('MediaInfoPath'), version.Path)}<br/>`;
        }
        if (version.Size) {
            const size = `${(version.Size / (1024 * 1024)).toFixed(0)} MB`;
            html += `${createAttribute(globalize.translate('MediaInfoSize'), size)}<br/>`;
        }
        for (let i = 0, length = version.MediaStreams.length; i < length; i++) {
            const stream = version.MediaStreams[i];
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
                    translateString = stream.Type;
                    break;
                case 'EmbeddedImage':
                    translateString = 'Image';
                    break;
            }

            const displayType = globalize.translate(translateString);
            html += `<h2 class="mediaInfoStreamType">${displayType}</h2>`;
            const attributes = [];
            if (stream.DisplayTitle) {
                attributes.push(createAttribute('Title', stream.DisplayTitle));
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
            if (stream.Level) {
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
            if (stream.AverageFrameRate || stream.RealFrameRate) {
                attributes.push(createAttribute(globalize.translate('MediaInfoFramerate'), (stream.AverageFrameRate || stream.RealFrameRate)));
            }
            if (stream.ChannelLayout) {
                attributes.push(createAttribute(globalize.translate('MediaInfoLayout'), stream.ChannelLayout));
            }
            if (stream.Channels) {
                attributes.push(createAttribute(globalize.translate('MediaInfoChannels'), `${stream.Channels} ch`));
            }
            if (stream.BitRate && stream.Codec !== 'mjpeg') {
                attributes.push(createAttribute(globalize.translate('MediaInfoBitrate'), `${parseInt(stream.BitRate / 1000)} kbps`));
            }
            if (stream.SampleRate) {
                attributes.push(createAttribute(globalize.translate('MediaInfoSampleRate'), `${stream.SampleRate} Hz`));
            }
            if (stream.BitDepth) {
                attributes.push(createAttribute(globalize.translate('MediaInfoBitDepth'), `${stream.BitDepth} bit`));
            }
            if (stream.VideoRange) {
                attributes.push(createAttribute(globalize.translate('MediaInfoVideoRange'), stream.VideoRange));
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
            if (stream.NalLengthSize) {
                attributes.push(createAttribute('NAL', stream.NalLengthSize));
            }
            if (stream.Type !== 'Video') {
                attributes.push(createAttribute(globalize.translate('MediaInfoDefault'), (stream.IsDefault ? 'Yes' : 'No')));
            }
            if (stream.Type === 'Subtitle') {
                attributes.push(createAttribute(globalize.translate('MediaInfoForced'), (stream.IsForced ? 'Yes' : 'No')));
                attributes.push(createAttribute(globalize.translate('MediaInfoExternal'), (stream.IsExternal ? 'Yes' : 'No')));
            }
            if (stream.Type === 'Video' && version.Timestamp) {
                attributes.push(createAttribute(globalize.translate('MediaInfoTimestamp'), version.Timestamp));
            }
            html += attributes.join('<br/>');
            html += '</div>';
        }
        return html;
    }

    function createAttribute(label, value) {
        return `<span class="mediaInfoLabel">${label}</span><span class="mediaInfoAttribute">${value}</span>`;
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

/* eslint-enable indent */
export default {
    show: show
};
