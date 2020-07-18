define(['jQuery', 'loading', 'globalize', 'emby-select', 'emby-button', 'emby-input', 'emby-checkbox', 'listViewStyle', 'emby-button'], function ($, loading, globalize) {
    'use strict';

    function loadProfile(page) {
        loading.show();
        var promise1 = getProfile();
        var promise2 = ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            currentProfile = responses[0];
            renderProfile(page, currentProfile, responses[1]);
            loading.hide();
        });
    }

    function getProfile() {
        var id = getParameterByName('id');
        var url = id ? 'Dlna/Profiles/' + id : 'Dlna/Profiles/Default';
        return ApiClient.getJSON(ApiClient.getUrl(url));
    }

    function renderProfile(page, profile, users) {
        page.querySelector('#txtName').value = profile.Name;
        for (const checkbox of page.querySelectorAll('.chkMediaType')) {
            checkbox.checked = -1 != (profile.SupportedMediaTypes || '').split(',').indexOf(checkbox.getAttribute('data-value'));
        }
        page.querySelector('#chkEnableAlbumArtInDidl').checked = profile.EnableAlbumArtInDidl;
        page.querySelector('#chkEnableSingleImageLimit').checked = profile.EnableSingleAlbumArtLimit;
        renderXmlDocumentAttributes(page, profile.XmlRootAttributes || []);
        var idInfo = profile.Identification || {};
        renderIdentificationHeaders(page, idInfo.Headers || []);
        renderSubtitleProfiles(page, profile.SubtitleProfiles || []);
        page.querySelector('#txtInfoFriendlyName').value = profile.FriendlyName || '';
        page.querySelector('#txtInfoModelName').value = profile.ModelName || '';
        page.querySelector('#txtInfoModelNumber').value = profile.ModelNumber || '';
        page.querySelector('#txtInfoModelDescription').value = profile.ModelDescription || '';
        page.querySelector('#txtInfoModelUrl').value = profile.ModelUrl || '';
        page.querySelector('#txtInfoManufacturer').value = profile.Manufacturer || '';
        page.querySelector('#txtInfoManufacturerUrl').value = profile.ManufacturerUrl || '';
        page.querySelector('#txtInfoSerialNumber').value = profile.SerialNumber || '';
        page.querySelector('#txtIdFriendlyName').value = idInfo.FriendlyName || '';
        page.querySelector('#txtIdModelName').value = idInfo.ModelName || '';
        page.querySelector('#txtIdModelNumber').value = idInfo.ModelNumber || '';
        page.querySelector('#txtIdModelDescription').value = idInfo.ModelDescription || '';
        page.querySelector('#txtIdModelUrl').value = idInfo.ModelUrl || '';
        page.querySelector('#txtIdManufacturer').value = idInfo.Manufacturer || '';
        page.querySelector('#txtIdManufacturerUrl').value = idInfo.ManufacturerUrl || '';
        page.querySelector('#txtIdSerialNumber').value = idInfo.SerialNumber || '';
        page.querySelector('#txtIdDeviceDescription').value = idInfo.DeviceDescription || '';
        page.querySelector('#txtAlbumArtPn').value = profile.AlbumArtPn || '';
        page.querySelector('#txtAlbumArtMaxWidth').value = profile.MaxAlbumArtWidth || '';
        page.querySelector('#txtAlbumArtMaxHeight').value = profile.MaxAlbumArtHeight || '';
        page.querySelector('#txtIconMaxWidth').value = profile.MaxIconWidth || '';
        page.querySelector('#txtIconMaxHeight').value = profile.MaxIconHeight || '';
        page.querySelector('#chkIgnoreTranscodeByteRangeRequests').checked = profile.IgnoreTranscodeByteRangeRequests;
        page.querySelector('#txtMaxAllowedBitrate').value = profile.MaxStreamingBitrate || '';
        page.querySelector('#txtMusicStreamingTranscodingBitrate').value = profile.MusicStreamingTranscodingBitrate || '';
        page.querySelector('#chkRequiresPlainFolders').checked = profile.RequiresPlainFolders;
        page.querySelector('#chkRequiresPlainVideoItems').checked = profile.RequiresPlainVideoItems;
        page.querySelector('#txtProtocolInfo').value = profile.ProtocolInfo || '';
        page.querySelector('#txtXDlnaCap').value = profile.XDlnaCap || '';
        page.querySelector('#txtXDlnaDoc').value = profile.XDlnaDoc || '';
        page.querySelector('#txtSonyAggregationFlags').value = profile.SonyAggregationFlags || '';
        profile.DirectPlayProfiles = profile.DirectPlayProfiles || [];
        profile.TranscodingProfiles = profile.TranscodingProfiles || [];
        profile.ContainerProfiles = profile.ContainerProfiles || [];
        profile.CodecProfiles = profile.CodecProfiles || [];
        profile.ResponseProfiles = profile.ResponseProfiles || [];
        var usersHtml = '<option></option>' + users.map(function (u) {
            return '<option value="' + u.Id + '">' + u.Name + '</option>';
        }).join('');
        page.querySelector('#selectUser').innerHtml = usersHtml;
        page.querySelector('#selectUser').value = profile.UserId || '';
        renderSubProfiles(page, profile);
    }

    function renderIdentificationHeaders(page, headers) {
        var index = 0;
        var html = '<div class="paperList">' + headers.map(function (h) {
            var li = '<div class="listItem">';
            li += '<span class="material-icons listItemIcon info"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + h.Name + ': ' + (h.Value || '') + '</h3>';
            li += '<div class="listItemBodyText secondary">' + (h.Match || '') + '</div>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteIdentificationHeader listItemButton" data-index="' + index + '"><span class="material-icons delete"></span></button>';
            li += '</div>';
            index++;
            return li;
        }).join('') + '</div>';
        var elem = page.querySelector('.httpHeaderIdentificationList');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteIdentificationHeader', elem).on('click', function () {
            var itemIndex = parseInt(this.getAttribute('data-index'));
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
        isSubProfileNew = null == header;
        header = header || {};
        currentSubProfile = header;
        var popup = $('#identificationHeaderPopup', page);
        popup.querySelector('#txtIdentificationHeaderName').value = header.Name || '';
        popup.querySelector('#txtIdentificationHeaderValue').value = header.Value || '';
        popup.querySelector('#selectMatchType').value = header.Match || 'Equals';
        openPopup(popup[0]);
    }

    function saveIdentificationHeader(page) {
        currentSubProfile.Name = page.querySelector('#txtIdentificationHeaderName').value;
        currentSubProfile.Value = page.querySelector('#txtIdentificationHeaderValue').value;
        currentSubProfile.Match = page.querySelector('#selectMatchType').value;

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
        var html = '<div class="paperList">' + attribute.map(function (h) {
            var li = '<div class="listItem">';
            li += '<span class="material-icons listItemIcon info"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + h.Name + ' = ' + (h.Value || '') + '</h3>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteXmlAttribute listItemButton" data-index="0"><span class="material-icons delete"></span></button>';
            return li += '</div>';
        }).join('') + '</div>';
        var elem = page.querySelector('.xmlDocumentAttributeList');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteXmlAttribute', elem).on('click', function () {
            var itemIndex = parseInt(this.getAttribute('data-index'));
            currentProfile.XmlRootAttributes.splice(itemIndex, 1);
            renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        });
    }

    function editXmlDocumentAttribute(page, attribute) {
        isSubProfileNew = null == attribute;
        attribute = attribute || {};
        currentSubProfile = attribute;
        var popup = $('#xmlAttributePopup', page);
        popup.querySelector('#txtXmlAttributeName').value = attribute.Name || '';
        popup.querySelector('#txtXmlAttributeValue').value = attribute.Value || '';
        openPopup(popup[0]);
    }

    function saveXmlDocumentAttribute(page) {
        currentSubProfile.Name = page.querySelector('#txtXmlAttributeName').value;
        currentSubProfile.Value = page.querySelector('#txtXmlAttributeValue').value;

        if (isSubProfileNew) {
            currentProfile.XmlRootAttributes.push(currentSubProfile);
        }

        renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        currentSubProfile = null;
        closePopup($('#xmlAttributePopup', page)[0]);
    }

    function renderSubtitleProfiles(page, profiles) {
        var index = 0;
        var html = '<div class="paperList">' + profiles.map(function (h) {
            var li = '<div class="listItem lnkEditSubProfile" data-index="' + index + '">';
            li += '<span class="material-icons listItemIcon info"></span>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + (h.Format || '') + '</h3>';
            li += '</div>';
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-index="' + index + '"><span class="material-icons delete"></span></button>';
            li += '</div>';
            index++;
            return li;
        }).join('') + '</div>';
        var elem = page.querySelector('.subtitleProfileList');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var itemIndex = parseInt(this.getAttribute('data-index'));
            currentProfile.SubtitleProfiles.splice(itemIndex, 1);
            renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var itemIndex = parseInt(this.getAttribute('data-index'));
            editSubtitleProfile(page, currentProfile.SubtitleProfiles[itemIndex]);
        });
    }

    function editSubtitleProfile(page, profile) {
        isSubProfileNew = null == profile;
        profile = profile || {};
        currentSubProfile = profile;
        var popup = $('#subtitleProfilePopup', page);
        popup.querySelector('#txtSubtitleProfileFormat').value = profile.Format || '';
        popup.querySelector('#selectSubtitleProfileMethod').value = profile.Method || '';
        popup.querySelector('#selectSubtitleProfileDidlMode').value = profile.DidlMode || '';
        openPopup(popup[0]);
    }

    function saveSubtitleProfile(page) {
        currentSubProfile.Format = page.querySelector('#txtSubtitleProfileFormat').value;
        currentSubProfile.Method = page.querySelector('#selectSubtitleProfileMethod').value;
        currentSubProfile.DidlMode = page.querySelector('#selectSubtitleProfileDidlMode').value;

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
        currentSubProfile.Type = page.querySelector('#selectDirectPlayProfileType').value;
        currentSubProfile.Container = page.querySelector('#txtDirectPlayContainer').value;
        currentSubProfile.AudioCodec = page.querySelector('#txtDirectPlayAudioCodec').value;
        currentSubProfile.VideoCodec = page.querySelector('#txtDirectPlayVideoCodec').value;

        if (isSubProfileNew) {
            currentProfile.DirectPlayProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#popupEditDirectPlayProfile', page)[0]);
    }

    function renderDirectPlayProfiles(page, profiles) {
        var html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i = 0, length = profiles.length; i < length; i++) {
            var profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if ('Video' == profile.Type) {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if ('Audio' == profile.Type) {
                    html += '<p>' + globalize.translate('ValueCodec', profile.AudioCodec || allText) + '</p>';
                }
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        var elem = page.querySelector('.directPlayProfiles');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var index = this.getAttribute('data-profileindex');
            deleteDirectPlayProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var index = parseInt(this.getAttribute('data-profileindex'));
            editDirectPlayProfile(page, currentProfile.DirectPlayProfiles[index]);
        });
    }

    function deleteDirectPlayProfile(page, index) {
        currentProfile.DirectPlayProfiles.splice(index, 1);
        renderDirectPlayProfiles(page, currentProfile.DirectPlayProfiles);
    }

    function editDirectPlayProfile(page, directPlayProfile) {
        isSubProfileNew = null == directPlayProfile;
        directPlayProfile = directPlayProfile || {};
        currentSubProfile = directPlayProfile;
        var popup = $('#popupEditDirectPlayProfile', page);
        popup.querySelector('#selectDirectPlayProfileType').value = directPlayProfile.Type || 'Video';
        popup.querySelector('#selectDirectPlayProfileType').trigger('change');
        popup.querySelector('#txtDirectPlayContainer').value = directPlayProfile.Container || '';
        popup.querySelector('#txtDirectPlayAudioCodec').value = directPlayProfile.AudioCodec || '';
        popup.querySelector('#txtDirectPlayVideoCodec').value = directPlayProfile.VideoCodec || '';
        openPopup(popup[0]);
    }

    function renderTranscodingProfiles(page, profiles) {
        var html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i = 0, length = profiles.length; i < length; i++) {
            var profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>Protocol: ' + (profile.Protocol || 'Http') + '</p>';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if ('Video' == profile.Type) {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if ('Audio' == profile.Type) {
                    html += '<p>' + globalize.translate('ValueCodec', profile.AudioCodec || allText) + '</p>';
                }
            }

            html += '</a>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        var elem = page.querySelector('.transcodingProfiles');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var index = this.getAttribute('data-profileindex');
            deleteTranscodingProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var index = parseInt(this.getAttribute('data-profileindex'));
            editTranscodingProfile(page, currentProfile.TranscodingProfiles[index]);
        });
    }

    function editTranscodingProfile(page, transcodingProfile) {
        isSubProfileNew = null == transcodingProfile;
        transcodingProfile = transcodingProfile || {};
        currentSubProfile = transcodingProfile;
        var popup = $('#transcodingProfilePopup', page);
        popup.querySelector('#selectTranscodingProfileType').value = transcodingProfile.Type || 'Video';
        popup.querySelector('#selectTranscodingProfileType').trigger('change');
        popup.querySelector('#txtTranscodingContainer').value = transcodingProfile.Container || '';
        popup.querySelector('#txtTranscodingAudioCodec').value = transcodingProfile.AudioCodec || '';
        popup.querySelector('#txtTranscodingVideoCodec').value = transcodingProfile.VideoCodec || '';
        popup.querySelector('#selectTranscodingProtocol').value = transcodingProfile.Protocol || 'Http';
        popup.querySelector('#chkEnableMpegtsM2TsMode').checked = transcodingProfile.EnableMpegtsM2TsMode || false;
        popup.querySelector('#chkEstimateContentLength').checked = transcodingProfile.EstimateContentLength || false;
        popup.querySelector('#chkReportByteRangeRequests').checked = transcodingProfile.TranscodeSeekInfo === 'Bytes';
        popup.querySelector('.radioTabButton').dispatchEvent(new Event('click'));
        openPopup(popup[0]);
    }

    function deleteTranscodingProfile(page, index) {
        currentProfile.TranscodingProfiles.splice(index, 1);
        renderTranscodingProfiles(page, currentProfile.TranscodingProfiles);
    }

    function saveTranscodingProfile(page) {
        currentSubProfile.Type = page.querySelector('#selectTranscodingProfileType').value;
        currentSubProfile.Container = page.querySelector('#txtTranscodingContainer').value;
        currentSubProfile.AudioCodec = page.querySelector('#txtTranscodingAudioCodec').value;
        currentSubProfile.VideoCodec = page.querySelector('#txtTranscodingVideoCodec').value;
        currentSubProfile.Protocol = page.querySelector('#selectTranscodingProtocol').value;
        currentSubProfile.Context = 'Streaming';
        currentSubProfile.EnableMpegtsM2TsMode = $('#chkEnableMpegtsM2TsMode', page).matches(':checked');
        currentSubProfile.EstimateContentLength = $('#chkEstimateContentLength', page).matches(':checked');
        currentSubProfile.TranscodeSeekInfo = $('#chkReportByteRangeRequests', page).matches(':checked') ? 'Bytes' : 'Auto';

        if (isSubProfileNew) {
            currentProfile.TranscodingProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#transcodingProfilePopup', page)[0]);
    }

    function renderContainerProfiles(page, profiles) {
        var html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i = 0, length = profiles.length; i < length; i++) {
            var profile = profiles[i];

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
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        var elem = page.querySelector('.containerProfiles');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var index = this.getAttribute('data-profileindex');
            deleteContainerProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var index = parseInt(this.getAttribute('data-profileindex'));
            editContainerProfile(page, currentProfile.ContainerProfiles[index]);
        });
    }

    function deleteContainerProfile(page, index) {
        currentProfile.ContainerProfiles.splice(index, 1);
        renderContainerProfiles(page, currentProfile.ContainerProfiles);
    }

    function editContainerProfile(page, containerProfile) {
        isSubProfileNew = null == containerProfile;
        containerProfile = containerProfile || {};
        currentSubProfile = containerProfile;
        var popup = $('#containerProfilePopup', page);
        popup.querySelector('#selectContainerProfileType').value = containerProfile.Type || 'Video';
        popup.querySelector('#selectContainerProfileType').trigger('change');
        popup.querySelector('#txtContainerProfileContainer').value = containerProfile.Container || '';
        popup.querySelector('.radioTabButton:first').trigger('click');
        openPopup(popup[0]);
    }

    function saveContainerProfile(page) {
        currentSubProfile.Type = page.querySelector('#selectContainerProfileType').value;
        currentSubProfile.Container = page.querySelector('#txtContainerProfileContainer').value;

        if (isSubProfileNew) {
            currentProfile.ContainerProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#containerProfilePopup', page)[0]);
    }

    function renderCodecProfiles(page, profiles) {
        var html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i = 0, length = profiles.length; i < length; i++) {
            var profile = profiles[i];
            var type = profile.Type.replace('VideoAudio', 'Video Audio');

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
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        var elem = page.querySelector('.codecProfiles');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var index = this.getAttribute('data-profileindex');
            deleteCodecProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var index = parseInt(this.getAttribute('data-profileindex'));
            editCodecProfile(page, currentProfile.CodecProfiles[index]);
        });
    }

    function deleteCodecProfile(page, index) {
        currentProfile.CodecProfiles.splice(index, 1);
        renderCodecProfiles(page, currentProfile.CodecProfiles);
    }

    function editCodecProfile(page, codecProfile) {
        isSubProfileNew = null == codecProfile;
        codecProfile = codecProfile || {};
        currentSubProfile = codecProfile;
        var popup = $('#codecProfilePopup', page);
        popup.querySelector('#selectCodecProfileType').value = codecProfile.Type || 'Video';
        popup.querySelector('#selectCodecProfileType').trigger('change');
        popup.querySelector('#txtCodecProfileCodec').value = codecProfile.Codec || '';
        popup.querySelector('.radioTabButton:first').trigger('click');
        openPopup(popup[0]);
    }

    function saveCodecProfile(page) {
        currentSubProfile.Type = page.querySelector('#selectCodecProfileType').value;
        currentSubProfile.Codec = page.querySelector('#txtCodecProfileCodec').value;

        if (isSubProfileNew) {
            currentProfile.CodecProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#codecProfilePopup', page)[0]);
    }

    function renderResponseProfiles(page, profiles) {
        var html = '';
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i = 0, length = profiles.length; i < length; i++) {
            var profile = profiles[i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + '</li>';
                currentType = profile.Type;
            }

            html += '<div>';
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i + '">';
            html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

            if ('Video' == profile.Type) {
                html += '<p>' + globalize.translate('ValueVideoCodec', profile.VideoCodec || allText) + '</p>';
                html += '<p>' + globalize.translate('ValueAudioCodec', profile.AudioCodec || allText) + '</p>';
            } else {
                if ('Audio' == profile.Type) {
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
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
            html += '</div>';
        }

        html += '</ul>';
        var elem = page.querySelector('.mediaProfiles');
        elem.innerHtml = html;
        elem.trigger('create');
        $('.btnDeleteProfile', elem).on('click', function () {
            var index = this.getAttribute('data-profileindex');
            deleteResponseProfile(page, index);
        });
        $('.lnkEditSubProfile', elem).on('click', function () {
            var index = parseInt(this.getAttribute('data-profileindex'));
            editResponseProfile(page, currentProfile.ResponseProfiles[index]);
        });
    }

    function deleteResponseProfile(page, index) {
        currentProfile.ResponseProfiles.splice(index, 1);
        renderResponseProfiles(page, currentProfile.ResponseProfiles);
    }

    function editResponseProfile(page, responseProfile) {
        isSubProfileNew = null == responseProfile;
        responseProfile = responseProfile || {};
        currentSubProfile = responseProfile;
        var popup = $('#responseProfilePopup', page);
        popup.querySelector('#selectResponseProfileType').value = responseProfile.Type || 'Video';
        popup.querySelector('#selectResponseProfileType').trigger('change');
        popup.querySelector('#txtResponseProfileContainer').value = responseProfile.Container || '';
        popup.querySelector('#txtResponseProfileAudioCodec').value = responseProfile.AudioCodec || '';
        popup.querySelector('#txtResponseProfileVideoCodec').value = responseProfile.VideoCodec || '';
        popup.querySelector('.radioTabButton:first').trigger('click');
        openPopup(popup[0]);
    }

    function saveResponseProfile(page) {
        currentSubProfile.Type = page.querySelector('#selectResponseProfileType').value;
        currentSubProfile.Container = page.querySelector('#txtResponseProfileContainer').value;
        currentSubProfile.AudioCodec = page.querySelector('#txtResponseProfileAudioCodec').value;
        currentSubProfile.VideoCodec = page.querySelector('#txtResponseProfileVideoCodec').value;

        if (isSubProfileNew) {
            currentProfile.ResponseProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($('#responseProfilePopup', page)[0]);
    }

    function saveProfile(page, profile) {
        updateProfile(page, profile);
        var id = getParameterByName('id');

        if (id) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Dlna/Profiles/' + id),
                data: JSON.stringify(profile),
                contentType: 'application/json'
            }).then(function () {
                require(['toast'], function (toast) {
                    toast('Settings saved.');
                });
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
        profile.Name = page.querySelector('#txtName').value;
        profile.EnableAlbumArtInDidl = page.querySelector('#chkEnableAlbumArtInDidl').matches(':checked');
        profile.EnableSingleAlbumArtLimit = page.querySelector('#chkEnableSingleImageLimit').matches(':checked');
        profile.SupportedMediaTypes = $('.chkMediaType:checked', page).get().map(function (c) {
            return c.getAttribute('data-value');
        }).join(',');
        profile.Identification = profile.Identification || {};
        profile.FriendlyName = page.querySelector('#txtInfoFriendlyName').value;
        profile.ModelName = page.querySelector('#txtInfoModelName').value;
        profile.ModelNumber = page.querySelector('#txtInfoModelNumber').value;
        profile.ModelDescription = page.querySelector('#txtInfoModelDescription').value;
        profile.ModelUrl = page.querySelector('#txtInfoModelUrl').value;
        profile.Manufacturer = page.querySelector('#txtInfoManufacturer').value;
        profile.ManufacturerUrl = page.querySelector('#txtInfoManufacturerUrl').value;
        profile.SerialNumber = page.querySelector('#txtInfoSerialNumber').value;
        profile.Identification.FriendlyName = page.querySelector('#txtIdFriendlyName').value;
        profile.Identification.ModelName = page.querySelector('#txtIdModelName').value;
        profile.Identification.ModelNumber = page.querySelector('#txtIdModelNumber').value;
        profile.Identification.ModelDescription = page.querySelector('#txtIdModelDescription').value;
        profile.Identification.ModelUrl = page.querySelector('#txtIdModelUrl').value;
        profile.Identification.Manufacturer = page.querySelector('#txtIdManufacturer').value;
        profile.Identification.ManufacturerUrl = page.querySelector('#txtIdManufacturerUrl').value;
        profile.Identification.SerialNumber = page.querySelector('#txtIdSerialNumber').value;
        profile.Identification.DeviceDescription = page.querySelector('#txtIdDeviceDescription').value;
        profile.AlbumArtPn = page.querySelector('#txtAlbumArtPn').value;
        profile.MaxAlbumArtWidth = page.querySelector('#txtAlbumArtMaxWidth').value;
        profile.MaxAlbumArtHeight = page.querySelector('#txtAlbumArtMaxHeight').value;
        profile.MaxIconWidth = page.querySelector('#txtIconMaxWidth').value;
        profile.MaxIconHeight = page.querySelector('#txtIconMaxHeight').value;
        profile.RequiresPlainFolders = page.querySelector('#chkRequiresPlainFolders').matches(':checked');
        profile.RequiresPlainVideoItems = page.querySelector('#chkRequiresPlainVideoItems').matches(':checked');
        profile.IgnoreTranscodeByteRangeRequests = page.querySelector('#chkIgnoreTranscodeByteRangeRequests').matches(':checked');
        profile.MaxStreamingBitrate = page.querySelector('#txtMaxAllowedBitrate').value;
        profile.MusicStreamingTranscodingBitrate = page.querySelector('#txtMusicStreamingTranscodingBitrate').value;
        profile.ProtocolInfo = page.querySelector('#txtProtocolInfo').value;
        profile.XDlnaCap = page.querySelector('#txtXDlnaCap').value;
        profile.XDlnaDoc = page.querySelector('#txtXDlnaDoc').value;
        profile.SonyAggregationFlags = page.querySelector('#txtSonyAggregationFlags').value;
        profile.UserId = page.querySelector('#selectUser').value;
    }

    var currentProfile;
    var currentSubProfile;
    var isSubProfileNew;
    var allText = globalize.translate('LabelAll');

    $(document).on('pageinit', '#dlnaProfilePage', function () {
        var page = this;
        $('.radioTabButton', page).on('click', function () {
            for (const sibling of this.parentNode.children) {
                if (sibling !== this) sibling.classList.remove('ui-btn-active');
            }
            this.classList.add('ui-btn-active');
            var value = 'A' == this.tagName ? this.getAttribute('data-value') : this.value;
            var elem = $('.' + value, page);
            elem.siblings('.tabContent').hide();
            elem.show();
        });
        $('#selectDirectPlayProfileType', page).on('change', function () {
            if ('Video' == this.value) {
                page.querySelector('#fldDirectPlayVideoCodec').classList.remove('hide');
            } else {
                page.querySelector('#fldDirectPlayVideoCodec').classList.add('hide');
            }

            if ('Photo' == this.value) {
                page.querySelector('#fldDirectPlayAudioCodec').classList.add('hide');
            } else {
                page.querySelector('#fldDirectPlayAudioCodec').classList.remove('hide');
            }
        });
        $('#selectTranscodingProfileType', page).on('change', function () {
            if ('Video' == this.value) {
                page.querySelector('#fldTranscodingVideoCodec').classList.remove('hide');
                page.querySelector('#fldTranscodingProtocol').classList.remove('hide');
                page.querySelector('#fldEnableMpegtsM2TsMode').classList.remove('hide');
            } else {
                page.querySelector('#fldTranscodingVideoCodec').classList.add('hide');
                page.querySelector('#fldTranscodingProtocol').classList.add('hide');
                page.querySelector('#fldEnableMpegtsM2TsMode').classList.add('hide');
            }

            if ('Photo' == this.value) {
                page.querySelector('#fldTranscodingAudioCodec').classList.add('hide');
                page.querySelector('#fldEstimateContentLength').classList.add('hide');
                page.querySelector('#fldReportByteRangeRequests').classList.add('hide');
            } else {
                page.querySelector('#fldTranscodingAudioCodec').classList.remove('hide');
                page.querySelector('#fldEstimateContentLength').classList.remove('hide');
                page.querySelector('#fldReportByteRangeRequests').classList.remove('hide');
            }
        });
        $('#selectResponseProfileType', page).on('change', function () {
            if ('Video' == this.value) {
                page.querySelector('#fldResponseProfileVideoCodec').classList.remove('hide');
            } else {
                page.querySelector('#fldResponseProfileVideoCodec').classList.add('hide');
            }

            if ('Photo' == this.value) {
                page.querySelector('#fldResponseProfileAudioCodec').classList.add('hide');
            } else {
                page.querySelector('#fldResponseProfileAudioCodec').classList.remove('hide');
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
        var page = this;
        page.querySelector('#radioInfo').dispatchEvent(new Event('click'));
        loadProfile(page);
    });
    window.DlnaProfilePage = {
        onSubmit: function () {
            loading.show();
            saveProfile(this.closest('.page'), currentProfile);
            return false;
        },
        onDirectPlayFormSubmit: function () {
            saveDirectPlayProfile(this.closest('.page'));
            return false;
        },
        onTranscodingProfileFormSubmit: function () {
            saveTranscodingProfile(this.closest('.page'));
            return false;
        },
        onContainerProfileFormSubmit: function () {
            saveContainerProfile(this.closest('.page'));
            return false;
        },
        onCodecProfileFormSubmit: function () {
            saveCodecProfile(this.closest('.page'));
            return false;
        },
        onResponseProfileFormSubmit: function () {
            saveResponseProfile(this.closest('.page'));
            return false;
        },
        onIdentificationHeaderFormSubmit: function () {
            saveIdentificationHeader(this.closest('.page'));
            return false;
        },
        onXmlAttributeFormSubmit: function () {
            saveXmlDocumentAttribute(this.closest('.page'));
            return false;
        },
        onSubtitleProfileFormSubmit: function () {
            saveSubtitleProfile(this.closest('.page'));
            return false;
        }
    };
});
