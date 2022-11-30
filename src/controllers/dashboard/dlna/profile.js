import escapeHtml from 'escape-html';
import 'jquery';
import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import '../../../elements/emby-select/emby-select';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-input/emby-input';
import '../../../elements/emby-checkbox/emby-checkbox';
import '../../../components/listview/listview.scss';
import Dashboard from '../../../utils/dashboard';
import toast from '../../../components/toast/toast';
import { getParameterByName } from '../../../utils/url.ts';

/* eslint-disable indent */

    function loadProfile(page) {
        loading.show();
        const promise1 = getProfile();
        const promise2 = ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            currentProfile = responses[0];
            renderProfile(page, currentProfile, responses[1]);
            loading.hide();
        });
    }

    function getProfile() {
        const id = getParameterByName('id');
        const url = id ? 'Dlna/Profiles/' + id : 'Dlna/Profiles/Default';
        return ApiClient.getJSON(ApiClient.getUrl(url));
    }

    function renderProfile(page, profile, users) {
        $('#txtName', page).val(profile.Name);
        $('.chkMediaType', page).each(function () {
            this.checked = (profile.SupportedMediaTypes || '').split(',').indexOf(this.getAttribute('data-value')) != -1;
        });
        $('#chkEnableAlbumArtInDidl', page).prop('checked', profile.EnableAlbumArtInDidl);
        $('#chkEnableSingleImageLimit', page).prop('checked', profile.EnableSingleAlbumArtLimit);
        renderXmlDocumentAttributes(page, profile.XmlRootAttributes || []);
        const idInfo = profile.Identification || {};
        renderIdentificationHeaders(page, idInfo.Headers || []);
        renderSubtitleProfiles(page, profile.SubtitleProfiles || []);
        $('#txtInfoFriendlyName', page).val(profile.FriendlyName || '');
        $('#txtInfoModelName', page).val(profile.ModelName || '');
        $('#txtInfoModelNumber', page).val(profile.ModelNumber || '');
        $('#txtInfoModelDescription', page).val(profile.ModelDescription || '');
        $('#txtInfoModelUrl', page).val(profile.ModelUrl || '');
        $('#txtInfoManufacturer', page).val(profile.Manufacturer || '');
        $('#txtInfoManufacturerUrl', page).val(profile.ManufacturerUrl || '');
        $('#txtInfoSerialNumber', page).val(profile.SerialNumber || '');
        $('#txtIdFriendlyName', page).val(idInfo.FriendlyName || '');
        $('#txtIdModelName', page).val(idInfo.ModelName || '');
        $('#txtIdModelNumber', page).val(idInfo.ModelNumber || '');
        $('#txtIdModelDescription', page).val(idInfo.ModelDescription || '');
        $('#txtIdModelUrl', page).val(idInfo.ModelUrl || '');
        $('#txtIdManufacturer', page).val(idInfo.Manufacturer || '');
        $('#txtIdManufacturerUrl', page).val(idInfo.ManufacturerUrl || '');
        $('#txtIdSerialNumber', page).val(idInfo.SerialNumber || '');
        $('#txtIdDeviceDescription', page).val(idInfo.DeviceDescription || '');
        $('#txtAlbumArtPn', page).val(profile.AlbumArtPn || '');
        $('#txtAlbumArtMaxWidth', page).val(profile.MaxAlbumArtWidth || '');
        $('#txtAlbumArtMaxHeight', page).val(profile.MaxAlbumArtHeight || '');
        $('#txtIconMaxWidth', page).val(profile.MaxIconWidth || '');
        $('#txtIconMaxHeight', page).val(profile.MaxIconHeight || '');
        $('#chkIgnoreTranscodeByteRangeRequests', page).prop('checked', profile.IgnoreTranscodeByteRangeRequests);
        $('#txtMaxAllowedBitrate', page).val(profile.MaxStreamingBitrate || '');
        $('#txtMusicStreamingTranscodingBitrate', page).val(profile.MusicStreamingTranscodingBitrate || '');
        $('#chkRequiresPlainFolders', page).prop('checked', profile.RequiresPlainFolders);
        $('#chkRequiresPlainVideoItems', page).prop('checked', profile.RequiresPlainVideoItems);
        $('#txtProtocolInfo', page).val(profile.ProtocolInfo || '');
        $('#txtXDlnaCap', page).val(profile.XDlnaCap || '');
        $('#txtXDlnaDoc', page).val(profile.XDlnaDoc || '');
        $('#txtSonyAggregationFlags', page).val(profile.SonyAggregationFlags || '');
        profile.DirectPlayProfiles = profile.DirectPlayProfiles || [];
        profile.TranscodingProfiles = profile.TranscodingProfiles || [];
        profile.ContainerProfiles = profile.ContainerProfiles || [];
        profile.CodecProfiles = profile.CodecProfiles || [];
        profile.ResponseProfiles = profile.ResponseProfiles || [];
        const usersHtml = '<option></option>' + users.map(function (u) {
            return '<option value="' + u.Id + '">' + escapeHtml(u.Name) + '</option>';
        }).join('');
        $('#selectUser', page).html(usersHtml).val(profile.UserId || '');
        renderSubProfiles(page, profile);
    }

    function renderIdentificationHeaders(page, headers) {
        let index = 0;
        const html = '<div class="paperList">' + headers.map(function (h) {
            let li = '<div class="listItem">';
            li += '<span class="material-icons listItemIcon info" aria-hidden="true"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + escapeHtml(h.Name + ': ' + (h.Value || '')) + '</h3>';
            li += '<div class="listItemBodyText secondary">' + escapeHtml(h.Match || '') + '</div>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteIdentificationHeader listItemButton" data-index="' + index + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            li += '</div>';
            index++;
            return li;
        }).join('') + '</div>';
        const elem = $('.httpHeaderIdentificationList', page).html(html).trigger('create');
        $('.btnDeleteIdentificationHeader', elem).on('click', function () {
            const itemIndex = parseInt(this.getAttribute('data-index'));
            currentProfile.Identification.Headers.splice(itemIndex, 1);
            renderIdentificationHeaders(page, currentProfile.Identification.Headers);
        });
    }

    function openPopup(elem) {
        elem.classList.remove('hide');
    }

    function closePopup(elem) {
        elem.classList.add('hide');
    }

    function editIdentificationHeader(page, header) {
        isSubProfileNew = header == null;
        header = header || {};
        currentSubProfile = header;
        const popup = $('#identificationHeaderPopup', page);
        $('#txtIdentificationHeaderName', popup).val(header.Name || '');
        $('#txtIdentificationHeaderValue', popup).val(header.Value || '');
        $('#selectMatchType', popup).val(header.Match || 'Equals');
        openPopup(popup[0]);
    }

    function saveIdentificationHeader(page) {
        currentSubProfile.Name = $('#txtIdentificationHeaderName', page).val();
        currentSubProfile.Value = $('#txtIdentificationHeaderValue', page).val();
        currentSubProfile.Match = $('#selectMatchType', page).val();

        if (isSubProfileNew) {
            currentProfile.Identification = currentProfile.Identification || {};
            currentProfile.Identification.Headers = currentProfile.Identification.Headers || [];
            currentProfile.Identification.Headers.push(currentSubProfile);
        }

        renderIdentificationHeaders(page, currentProfile.Identification.Headers);
        currentSubProfile = null;
        closePopup($('#identificationHeaderPopup', page)[0]);
    }

    function renderXmlDocumentAttributes(page, attribute) {
        const html = '<div class="paperList">' + attribute.map(function (h) {
            let li = '<div class="listItem">';
            li += '<span class="material-icons listItemIcon info" aria-hidden="true"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + escapeHtml(h.Name + ' = ' + (h.Value || '')) + '</h3>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteXmlAttribute listItemButton" data-index="0"><span class="material-icons delete" aria-hidden="true"></span></button>';
            li += '</div>';
            return li;
        }).join('') + '</div>';
        const elem = $('.xmlDocumentAttributeList', page).html(html).trigger('create');
        $('.btnDeleteXmlAttribute', elem).on('click', function () {
            const itemIndex = parseInt(this.getAttribute('data-index'));
            currentProfile.XmlRootAttributes.splice(itemIndex, 1);
            renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        });
    }

    function editXmlDocumentAttribute(page, attribute) {
        isSubProfileNew = attribute == null;
        attribute = attribute || {};
        currentSubProfile = attribute;
        const popup = $('#xmlAttributePopup', page);
        $('#txtXmlAttributeName', popup).val(attribute.Name || '');
        $('#txtXmlAttributeValue', popup).val(attribute.Value || '');
        openPopup(popup[0]);
    }

    function saveXmlDocumentAttribute(page) {
        currentSubProfile.Name = $('#txtXmlAttributeName', page).val();
        currentSubProfile.Value = $('#txtXmlAttributeValue', page).val();

        if (isSubProfileNew) {
            currentProfile.XmlRootAttributes.push(currentSubProfile);
        }

        renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        currentSubProfile = null;
        closePopup($('#xmlAttributePopup', page)[0]);
    }

    function renderSubtitleProfiles(page, profiles) {
        let index = 0;
        const html = '<div class="paperList">' + profiles.map(function (h) {
            let li = '<div class="listItem lnkEditSubProfile" data-index="' + index + '">';
            li += '<span class="material-icons listItemIcon info" aria-hidden="true"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + escapeHtml(h.Format || '') + '</h3>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-index="' + index + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            li += '</div>';
            index++;
            return li;
        }).join('') + '</div>';
        const elem = $('.subtitleProfileList', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const itemIndex = parseInt(this.getAttribute('data-index'));
            currentProfile.SubtitleProfiles.splice(itemIndex, 1);
            renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const itemIndex = parseInt(this.getAttribute('data-index'));
            editSubtitleProfile(page, currentProfile.SubtitleProfiles[itemIndex]);
        });
    }

    function editSubtitleProfile(page, profile) {
        isSubProfileNew = profile == null;
        profile = profile || {};
        currentSubProfile = profile;
        const popup = $('#subtitleProfilePopup', page);
        $('#txtSubtitleProfileFormat', popup).val(profile.Format || '');
        $('#selectSubtitleProfileMethod', popup).val(profile.Method || '');
        $('#selectSubtitleProfileDidlMode', popup).val(profile.DidlMode || '');
        openPopup(popup[0]);
    }

    function saveSubtitleProfile(page) {
        currentSubProfile.Format = $('#txtSubtitleProfileFormat', page).val();
        currentSubProfile.Method = $('#selectSubtitleProfileMethod', page).val();
        currentSubProfile.DidlMode = $('#selectSubtitleProfileDidlMode', page).val();

        if (isSubProfileNew) {
            currentProfile.SubtitleProfiles.push(currentSubProfile);
        }

        renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        currentSubProfile = null;
        closePopup($('#subtitleProfilePopup', page)[0]);
    }

    function renderSubProfiles(page, profile) {
        renderDirectPlayProfiles(page, profile.DirectPlayProfiles);
        renderTranscodingProfiles(page, profile.TranscodingProfiles);
        renderContainerProfiles(page, profile.ContainerProfiles);
        renderCodecProfiles(page, profile.CodecProfiles);
        renderResponseProfiles(page, profile.ResponseProfiles);
    }

    function saveDirectPlayProfile(page) {
        currentSubProfile.Type = $('#selectDirectPlayProfileType', page).val();
        currentSubProfile.Container = $('#txtDirectPlayContainer', page).val();
        currentSubProfile.AudioCodec = $('#txtDirectPlayAudioCodec', page).val();
        currentSubProfile.VideoCodec = $('#txtDirectPlayVideoCodec', page).val();

        if (isSubProfileNew) {
            currentProfile.DirectPlayProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#popupEditDirectPlayProfile', page)[0]);
    }

    function renderDirectPlayProfiles(page, profiles) {
        let html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        let currentType;

        for (const [index, profile] of profiles.entries()) {
            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + index + '">';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if (profile.Type == 'Video') {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if (profile.Type == 'Audio') {
                    html += '<p>' + globalize.translate('ValueCodec', profile.AudioCodec || allText) + '</p>';
                }
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + index + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        const elem = $('.directPlayProfiles', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const index = this.getAttribute('data-profileindex');
            deleteDirectPlayProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const index = parseInt(this.getAttribute('data-profileindex'));
            editDirectPlayProfile(page, currentProfile.DirectPlayProfiles[index]);
        });
    }

    function deleteDirectPlayProfile(page, index) {
        currentProfile.DirectPlayProfiles.splice(index, 1);
        renderDirectPlayProfiles(page, currentProfile.DirectPlayProfiles);
    }

    function editDirectPlayProfile(page, directPlayProfile) {
        isSubProfileNew = directPlayProfile == null;
        directPlayProfile = directPlayProfile || {};
        currentSubProfile = directPlayProfile;
        const popup = $('#popupEditDirectPlayProfile', page);
        $('#selectDirectPlayProfileType', popup).val(directPlayProfile.Type || 'Video').trigger('change');
        $('#txtDirectPlayContainer', popup).val(directPlayProfile.Container || '');
        $('#txtDirectPlayAudioCodec', popup).val(directPlayProfile.AudioCodec || '');
        $('#txtDirectPlayVideoCodec', popup).val(directPlayProfile.VideoCodec || '');
        openPopup(popup[0]);
    }

    function renderTranscodingProfiles(page, profiles) {
        let html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        let currentType;

        for (let i = 0, length = profiles.length; i < length; i++) {
            const profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>Protocol: ' + (profile.Protocol || 'Http') + '</p>';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if (profile.Type == 'Video') {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if (profile.Type == 'Audio') {
                    html += '<p>' + globalize.translate('ValueCodec', profile.AudioCodec || allText) + '</p>';
                }
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        const elem = $('.transcodingProfiles', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const index = this.getAttribute('data-profileindex');
            deleteTranscodingProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const index = parseInt(this.getAttribute('data-profileindex'));
            editTranscodingProfile(page, currentProfile.TranscodingProfiles[index]);
        });
    }

    function editTranscodingProfile(page, transcodingProfile) {
        isSubProfileNew = transcodingProfile == null;
        transcodingProfile = transcodingProfile || {};
        currentSubProfile = transcodingProfile;
        const popup = $('#transcodingProfilePopup', page);
        $('#selectTranscodingProfileType', popup).val(transcodingProfile.Type || 'Video').trigger('change');
        $('#txtTranscodingContainer', popup).val(transcodingProfile.Container || '');
        $('#txtTranscodingAudioCodec', popup).val(transcodingProfile.AudioCodec || '');
        $('#txtTranscodingVideoCodec', popup).val(transcodingProfile.VideoCodec || '');
        $('#selectTranscodingProtocol', popup).val(transcodingProfile.Protocol || 'Http');
        $('#chkEnableMpegtsM2TsMode', popup).prop('checked', transcodingProfile.EnableMpegtsM2TsMode || false);
        $('#chkEstimateContentLength', popup).prop('checked', transcodingProfile.EstimateContentLength || false);
        $('#chkReportByteRangeRequests', popup).prop('checked', transcodingProfile.TranscodeSeekInfo == 'Bytes');
        $('.radioTabButton:first', popup).trigger('click');
        openPopup(popup[0]);
    }

    function deleteTranscodingProfile(page, index) {
        currentProfile.TranscodingProfiles.splice(index, 1);
        renderTranscodingProfiles(page, currentProfile.TranscodingProfiles);
    }

    function saveTranscodingProfile(page) {
        currentSubProfile.Type = $('#selectTranscodingProfileType', page).val();
        currentSubProfile.Container = $('#txtTranscodingContainer', page).val();
        currentSubProfile.AudioCodec = $('#txtTranscodingAudioCodec', page).val();
        currentSubProfile.VideoCodec = $('#txtTranscodingVideoCodec', page).val();
        currentSubProfile.Protocol = $('#selectTranscodingProtocol', page).val();
        currentSubProfile.Context = 'Streaming';
        currentSubProfile.EnableMpegtsM2TsMode = $('#chkEnableMpegtsM2TsMode', page).is(':checked');
        currentSubProfile.EstimateContentLength = $('#chkEstimateContentLength', page).is(':checked');
        currentSubProfile.TranscodeSeekInfo = $('#chkReportByteRangeRequests', page).is(':checked') ? 'Bytes' : 'Auto';

        if (isSubProfileNew) {
            currentProfile.TranscodingProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#transcodingProfilePopup', page)[0]);
    }

    function renderContainerProfiles(page, profiles) {
        let html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        let currentType;

        for (let i = 0, length = profiles.length; i < length; i++) {
            const profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if (profile.Conditions && profile.Conditions.length) {
                html += '<p>';
                html += globalize.translate('ValueConditions', profile.Conditions.map(function (c) {
                    return c.Property;
                }).join(', '));
                html += '</p>';
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        const elem = $('.containerProfiles', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const index = this.getAttribute('data-profileindex');
            deleteContainerProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const index = parseInt(this.getAttribute('data-profileindex'));
            editContainerProfile(page, currentProfile.ContainerProfiles[index]);
        });
    }

    function deleteContainerProfile(page, index) {
        currentProfile.ContainerProfiles.splice(index, 1);
        renderContainerProfiles(page, currentProfile.ContainerProfiles);
    }

    function editContainerProfile(page, containerProfile) {
        isSubProfileNew = containerProfile == null;
        containerProfile = containerProfile || {};
        currentSubProfile = containerProfile;
        const popup = $('#containerProfilePopup', page);
        $('#selectContainerProfileType', popup).val(containerProfile.Type || 'Video').trigger('change');
        $('#txtContainerProfileContainer', popup).val(containerProfile.Container || '');
        $('.radioTabButton:first', popup).trigger('click');
        openPopup(popup[0]);
    }

    function saveContainerProfile(page) {
        currentSubProfile.Type = $('#selectContainerProfileType', page).val();
        currentSubProfile.Container = $('#txtContainerProfileContainer', page).val();

        if (isSubProfileNew) {
            currentProfile.ContainerProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#containerProfilePopup', page)[0]);
    }

    function renderCodecProfiles(page, profiles) {
        let html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        let currentType;

        for (let i = 0, length = profiles.length; i < length; i++) {
            const profile = profiles[i];
            const type = profile.Type.replace('VideoAudio', 'Video Audio');

            if (type !== currentType) {
                html += '<li data-role="list-divider">' + type + '</li>';
                currentType = type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>' + globalize.translate('ValueCodec', profile.Codec || allText) + '</p>';

            if (profile.Conditions && profile.Conditions.length) {
                html += '<p>';
                html += globalize.translate('ValueConditions', profile.Conditions.map(function (c) {
                    return c.Property;
                }).join(', '));
                html += '</p>';
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        const elem = $('.codecProfiles', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const index = this.getAttribute('data-profileindex');
            deleteCodecProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const index = parseInt(this.getAttribute('data-profileindex'));
            editCodecProfile(page, currentProfile.CodecProfiles[index]);
        });
    }

    function deleteCodecProfile(page, index) {
        currentProfile.CodecProfiles.splice(index, 1);
        renderCodecProfiles(page, currentProfile.CodecProfiles);
    }

    function editCodecProfile(page, codecProfile) {
        isSubProfileNew = codecProfile == null;
        codecProfile = codecProfile || {};
        currentSubProfile = codecProfile;
        const popup = $('#codecProfilePopup', page);
        $('#selectCodecProfileType', popup).val(codecProfile.Type || 'Video').trigger('change');
        $('#txtCodecProfileCodec', popup).val(codecProfile.Codec || '');
        $('.radioTabButton:first', popup).trigger('click');
        openPopup(popup[0]);
    }

    function saveCodecProfile(page) {
        currentSubProfile.Type = $('#selectCodecProfileType', page).val();
        currentSubProfile.Codec = $('#txtCodecProfileCodec', page).val();

        if (isSubProfileNew) {
            currentProfile.CodecProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#codecProfilePopup', page)[0]);
    }

    function renderResponseProfiles(page, profiles) {
        let html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        let currentType;

        for (let i = 0, length = profiles.length; i < length; i++) {
            const profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if (profile.Type == 'Video') {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if (profile.Type == 'Audio') {
                    html += '<p>' + globalize.translate('ValueCodec', profile.AudioCodec || allText) + '</p>';
                }
            }

            if (profile.Conditions && profile.Conditions.length) {
                html += '<p>';
                html += globalize.translate('ValueConditions', profile.Conditions.map(function (c) {
                    return c.Property;
                }).join(', '));
                html += '</p>';
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete" aria-hidden="true"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        const elem = $('.mediaProfiles', page).html(html).trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            const index = this.getAttribute('data-profileindex');
            deleteResponseProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            const index = parseInt(this.getAttribute('data-profileindex'));
            editResponseProfile(page, currentProfile.ResponseProfiles[index]);
        });
    }

    function deleteResponseProfile(page, index) {
        currentProfile.ResponseProfiles.splice(index, 1);
        renderResponseProfiles(page, currentProfile.ResponseProfiles);
    }

    function editResponseProfile(page, responseProfile) {
        isSubProfileNew = responseProfile == null;
        responseProfile = responseProfile || {};
        currentSubProfile = responseProfile;
        const popup = $('#responseProfilePopup', page);
        $('#selectResponseProfileType', popup).val(responseProfile.Type || 'Video').trigger('change');
        $('#txtResponseProfileContainer', popup).val(responseProfile.Container || '');
        $('#txtResponseProfileAudioCodec', popup).val(responseProfile.AudioCodec || '');
        $('#txtResponseProfileVideoCodec', popup).val(responseProfile.VideoCodec || '');
        $('.radioTabButton:first', popup).trigger('click');
        openPopup(popup[0]);
    }

    function saveResponseProfile(page) {
        currentSubProfile.Type = $('#selectResponseProfileType', page).val();
        currentSubProfile.Container = $('#txtResponseProfileContainer', page).val();
        currentSubProfile.AudioCodec = $('#txtResponseProfileAudioCodec', page).val();
        currentSubProfile.VideoCodec = $('#txtResponseProfileVideoCodec', page).val();

        if (isSubProfileNew) {
            currentProfile.ResponseProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#responseProfilePopup', page)[0]);
    }

    function saveProfile(page, profile) {
        updateProfile(page, profile);
        const id = getParameterByName('id');

        if (id) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Dlna/Profiles/' + id),
                data: JSON.stringify(profile),
                contentType: 'application/json'
            }).then(function () {
                toast(globalize.translate('SettingsSaved'));
            }, Dashboard.processErrorResponse);
        } else {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Dlna/Profiles'),
                data: JSON.stringify(profile),
                contentType: 'application/json'
            }).then(function () {
                Dashboard.navigate('dlnaprofiles.html');
            }, Dashboard.processErrorResponse);
        }

        loading.hide();
    }

    function updateProfile(page, profile) {
        profile.Name = $('#txtName', page).val();
        profile.EnableAlbumArtInDidl = $('#chkEnableAlbumArtInDidl', page).is(':checked');
        profile.EnableSingleAlbumArtLimit = $('#chkEnableSingleImageLimit', page).is(':checked');
        profile.SupportedMediaTypes = $('.chkMediaType:checked', page).get().map(function (c) {
            return c.getAttribute('data-value');
        }).join(',');
        profile.Identification = profile.Identification || {};
        profile.FriendlyName = $('#txtInfoFriendlyName', page).val();
        profile.ModelName = $('#txtInfoModelName', page).val();
        profile.ModelNumber = $('#txtInfoModelNumber', page).val();
        profile.ModelDescription = $('#txtInfoModelDescription', page).val();
        profile.ModelUrl = $('#txtInfoModelUrl', page).val();
        profile.Manufacturer = $('#txtInfoManufacturer', page).val();
        profile.ManufacturerUrl = $('#txtInfoManufacturerUrl', page).val();
        profile.SerialNumber = $('#txtInfoSerialNumber', page).val();
        profile.Identification.FriendlyName = $('#txtIdFriendlyName', page).val();
        profile.Identification.ModelName = $('#txtIdModelName', page).val();
        profile.Identification.ModelNumber = $('#txtIdModelNumber', page).val();
        profile.Identification.ModelDescription = $('#txtIdModelDescription', page).val();
        profile.Identification.ModelUrl = $('#txtIdModelUrl', page).val();
        profile.Identification.Manufacturer = $('#txtIdManufacturer', page).val();
        profile.Identification.ManufacturerUrl = $('#txtIdManufacturerUrl', page).val();
        profile.Identification.SerialNumber = $('#txtIdSerialNumber', page).val();
        profile.Identification.DeviceDescription = $('#txtIdDeviceDescription', page).val();
        profile.AlbumArtPn = $('#txtAlbumArtPn', page).val();
        profile.MaxAlbumArtWidth = $('#txtAlbumArtMaxWidth', page).val();
        profile.MaxAlbumArtHeight = $('#txtAlbumArtMaxHeight', page).val();
        profile.MaxIconWidth = $('#txtIconMaxWidth', page).val();
        profile.MaxIconHeight = $('#txtIconMaxHeight', page).val();
        profile.RequiresPlainFolders = $('#chkRequiresPlainFolders', page).is(':checked');
        profile.RequiresPlainVideoItems = $('#chkRequiresPlainVideoItems', page).is(':checked');
        profile.IgnoreTranscodeByteRangeRequests = $('#chkIgnoreTranscodeByteRangeRequests', page).is(':checked');
        profile.MaxStreamingBitrate = $('#txtMaxAllowedBitrate', page).val();
        profile.MusicStreamingTranscodingBitrate = $('#txtMusicStreamingTranscodingBitrate', page).val();
        profile.ProtocolInfo = $('#txtProtocolInfo', page).val();
        profile.XDlnaCap = $('#txtXDlnaCap', page).val();
        profile.XDlnaDoc = $('#txtXDlnaDoc', page).val();
        profile.SonyAggregationFlags = $('#txtSonyAggregationFlags', page).val();
        profile.UserId = $('#selectUser', page).val();
    }

    let currentProfile;
    let currentSubProfile;
    let isSubProfileNew;
    const allText = globalize.translate('All');

    $(document).on('pageinit', '#dlnaProfilePage', function () {
        const page = this;
        $('.radioTabButton', page).on('click', function () {
            $(this).siblings().removeClass('ui-btn-active');
            $(this).addClass('ui-btn-active');
            const value = this.tagName == 'A' ? this.getAttribute('data-value') : this.value;
            const elem = $('.' + value, page);
            elem.siblings('.tabContent').hide();
            elem.show();
        });
        $('#selectDirectPlayProfileType', page).on('change', function () {
            if (this.value == 'Video') {
                $('#fldDirectPlayVideoCodec', page).show();
            } else {
                $('#fldDirectPlayVideoCodec', page).hide();
            }

            if (this.value == 'Photo') {
                $('#fldDirectPlayAudioCodec', page).hide();
            } else {
                $('#fldDirectPlayAudioCodec', page).show();
            }
        });
        $('#selectTranscodingProfileType', page).on('change', function () {
            if (this.value == 'Video') {
                $('#fldTranscodingVideoCodec', page).show();
                $('#fldTranscodingProtocol', page).show();
                $('#fldEnableMpegtsM2TsMode', page).show();
            } else {
                $('#fldTranscodingVideoCodec', page).hide();
                $('#fldTranscodingProtocol', page).hide();
                $('#fldEnableMpegtsM2TsMode', page).hide();
            }

            if (this.value == 'Photo') {
                $('#fldTranscodingAudioCodec', page).hide();
                $('#fldEstimateContentLength', page).hide();
                $('#fldReportByteRangeRequests', page).hide();
            } else {
                $('#fldTranscodingAudioCodec', page).show();
                $('#fldEstimateContentLength', page).show();
                $('#fldReportByteRangeRequests', page).show();
            }
        });
        $('#selectResponseProfileType', page).on('change', function () {
            if (this.value == 'Video') {
                $('#fldResponseProfileVideoCodec', page).show();
            } else {
                $('#fldResponseProfileVideoCodec', page).hide();
            }

            if (this.value == 'Photo') {
                $('#fldResponseProfileAudioCodec', page).hide();
            } else {
                $('#fldResponseProfileAudioCodec', page).show();
            }
        });
        $('.btnAddDirectPlayProfile', page).on('click', function () {
            editDirectPlayProfile(page);
        });
        $('.btnAddTranscodingProfile', page).on('click', function () {
            editTranscodingProfile(page);
        });
        $('.btnAddContainerProfile', page).on('click', function () {
            editContainerProfile(page);
        });
        $('.btnAddCodecProfile', page).on('click', function () {
            editCodecProfile(page);
        });
        $('.btnAddResponseProfile', page).on('click', function () {
            editResponseProfile(page);
        });
        $('.btnAddIdentificationHttpHeader', page).on('click', function () {
            editIdentificationHeader(page);
        });
        $('.btnAddXmlDocumentAttribute', page).on('click', function () {
            editXmlDocumentAttribute(page);
        });
        $('.btnAddSubtitleProfile', page).on('click', function () {
            editSubtitleProfile(page);
        });
        $('.dlnaProfileForm').off('submit', DlnaProfilePage.onSubmit).on('submit', DlnaProfilePage.onSubmit);
        $('.editDirectPlayProfileForm').off('submit', DlnaProfilePage.onDirectPlayFormSubmit).on('submit', DlnaProfilePage.onDirectPlayFormSubmit);
        $('.transcodingProfileForm').off('submit', DlnaProfilePage.onTranscodingProfileFormSubmit).on('submit', DlnaProfilePage.onTranscodingProfileFormSubmit);
        $('.containerProfileForm').off('submit', DlnaProfilePage.onContainerProfileFormSubmit).on('submit', DlnaProfilePage.onContainerProfileFormSubmit);
        $('.codecProfileForm').off('submit', DlnaProfilePage.onCodecProfileFormSubmit).on('submit', DlnaProfilePage.onCodecProfileFormSubmit);
        $('.editResponseProfileForm').off('submit', DlnaProfilePage.onResponseProfileFormSubmit).on('submit', DlnaProfilePage.onResponseProfileFormSubmit);
        $('.identificationHeaderForm').off('submit', DlnaProfilePage.onIdentificationHeaderFormSubmit).on('submit', DlnaProfilePage.onIdentificationHeaderFormSubmit);
        $('.xmlAttributeForm').off('submit', DlnaProfilePage.onXmlAttributeFormSubmit).on('submit', DlnaProfilePage.onXmlAttributeFormSubmit);
        $('.subtitleProfileForm').off('submit', DlnaProfilePage.onSubtitleProfileFormSubmit).on('submit', DlnaProfilePage.onSubtitleProfileFormSubmit);
    }).on('pageshow', '#dlnaProfilePage', function () {
        const page = this;
        $('#radioInfo', page).trigger('click');
        loadProfile(page);
    });
    window.DlnaProfilePage = {
        onSubmit: function () {
            loading.show();
            saveProfile($(this).parents('.page'), currentProfile);
            return false;
        },
        onDirectPlayFormSubmit: function () {
            saveDirectPlayProfile($(this).parents('.page'));
            return false;
        },
        onTranscodingProfileFormSubmit: function () {
            saveTranscodingProfile($(this).parents('.page'));
            return false;
        },
        onContainerProfileFormSubmit: function () {
            saveContainerProfile($(this).parents('.page'));
            return false;
        },
        onCodecProfileFormSubmit: function () {
            saveCodecProfile($(this).parents('.page'));
            return false;
        },
        onResponseProfileFormSubmit: function () {
            saveResponseProfile($(this).parents('.page'));
            return false;
        },
        onIdentificationHeaderFormSubmit: function () {
            saveIdentificationHeader($(this).parents('.page'));
            return false;
        },
        onXmlAttributeFormSubmit: function () {
            saveXmlDocumentAttribute($(this).parents('.page'));
            return false;
        },
        onSubtitleProfileFormSubmit: function () {
            saveSubtitleProfile($(this).parents('.page'));
            return false;
        }
    };

/* eslint-enable indent */
