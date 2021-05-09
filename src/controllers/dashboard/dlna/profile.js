import dom from '../../../scripts/dom';
import Dashboard from '../../../scripts/clientUtils';
import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import toast from '../../../components/toast/toast';
import '../../../elements/emby-select/emby-select';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-input/emby-input';
import '../../../elements/emby-checkbox/emby-checkbox';
import '../../../components/listview/listview.scss';

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
    page.querySelector('#txtName').value = profile.Name;
    for (const checkbox of page.querySelectorAll('.chkMediaType')) {
        checkbox.checked = (profile.SupportedMediaTypes || '').split(',').indexOf(checkbox.getAttribute('data-value')) != -1;
    }
    page.querySelector('#chkEnableAlbumArtInDidl').checked = profile.EnableAlbumArtInDidl;
    page.querySelector('#chkEnableSingleImageLimit').checked = profile.EnableSingleAlbumArtLimit;
    renderXmlDocumentAttributes(page, profile.XmlRootAttributes || []);
    const idInfo = profile.Identification || {};
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
    const usersHtml = '<option></option>' + users.map(function (u) {
        return '<option value="' + u.Id + '">' + u.Name + '</option>';
    }).join('');
    const elem = page.querySelector('#selectUser');
    elem.innerHTML = usersHtml;
    elem.value = profile.UserId || '';
    renderSubProfiles(page, profile);
}

function renderIdentificationHeaders(page, headers) {
    let index = 0;
    const html = '<div class="paperList">' + headers.map(function (h) {
        let li = '<div class="listItem">';
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

    const elem = page.querySelector('.httpHeaderIdentificationList');
    elem.innerHTML = html;

    function onDeleteIdentificationHeaderClick() {
        const itemIndex = parseInt(this.getAttribute('data-index'));
        currentProfile.Identification.Headers.splice(itemIndex, 1);
        renderIdentificationHeaders(page, currentProfile.Identification.Headers);
    }

    const btnDeleteIdentificationHeader = elem.querySelectorAll('.btnDeleteIdentificationHeader');
    for (let i = 0, length = btnDeleteIdentificationHeader.length; i < length; i++) {
        btnDeleteIdentificationHeader[i].addEventListener('click', onDeleteIdentificationHeaderClick);
    }
}

function editIdentificationHeader(page, header, index) {
    import('./profileEditor/identificationHeaderEditor').then((identificationHeaderEditor) => {
        identificationHeaderEditor.show(header).then(function (updatedHeaders) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.Identification = currentProfile.Identification || {};
                currentProfile.Identification.Headers = currentProfile.Identification.Headers || [];
                currentProfile.Identification.Headers.push(updatedHeaders);
            }

            renderIdentificationHeaders(page, currentProfile.Identification.Headers);
        });
    });
}

function renderXmlDocumentAttributes(page, attribute) {
    const html = '<div class="paperList">' + attribute.map(function (h) {
        let li = '<div class="listItem">';
        li += '<span class="material-icons listItemIcon info"></span>';
        li += '<div class="listItemBody">';
        li += '<h3 class="listItemBodyText">' + h.Name + ' = ' + (h.Value || '') + '</h3>';
        li += '</div>';
        li += '<button type="button" is="paper-icon-button-light" class="btnDeleteXmlAttribute listItemButton" data-index="0"><span class="material-icons delete"></span></button>';
        return li += '</div>';
    }).join('') + '</div>';

    const elem = page.querySelector('.xmlDocumentAttributeList');
    elem.innerHTML = html;

    function onDeleteXmlAttributeClick() {
        const itemIndex = parseInt(this.getAttribute('data-index'));
        currentProfile.XmlRootAttributes.splice(itemIndex, 1);
        renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
    }

    const btnDeleteXmlAttribute = elem.querySelectorAll('.btnDeleteXmlAttribute');
    for (let i = 0, length = btnDeleteXmlAttribute.length; i < length; i++) {
        btnDeleteXmlAttribute[i].addEventListener('click', onDeleteXmlAttributeClick);
    }
}

function editXmlDocumentAttribute(page, attribute, index) {
    import('./profileEditor/xmlAttributeEditor').then((xmlAttributeEditor) => {
        xmlAttributeEditor.show(attribute).then(function (updatedAttribute) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.XmlRootAttributes.push(updatedAttribute);
            }

            renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        });
    });
}

function renderSubtitleProfiles(page, profiles) {
    let index = 0;

    const html = '<div class="paperList">' + profiles.map(function (h) {
        let li = '<div class="listItem">';

        li += '<div class="lnkEditSubtitleProfile" style="display:flex;flex: auto" data-index="' + index + '">';

        li += '<span class="material-icons listItemIcon info"></span>';

        li += '<div class="listItemBody">';
        li += '<h3 class="listItemBodyText">' + (h.Format || '') + '</h3>';
        li += '</div>';

        li += '</div>';

        li += '<button type="button" is="paper-icon-button-light" class="btnDeleteSubtitleProfile listItemButton" data-index="' + index + '"><span class="material-icons delete"></span></button>';

        li += '</div>';

        index++;

        return li;
    }).join('') + '</div>';

    const elem = page.querySelector('.subtitleProfileList');
    elem.innerHTML = html;

    function onDeleteSubtitleProfileClick() {
        const itemIndex = parseInt(this.getAttribute('data-index'));
        currentProfile.SubtitleProfiles.splice(itemIndex, 1);
        renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
    }

    const btnDeleteSubtitleProfile = elem.querySelectorAll('.btnDeleteSubtitleProfile');
    for (let i = 0, length = btnDeleteSubtitleProfile.length; i < length; i++) {
        btnDeleteSubtitleProfile[i].addEventListener('click', onDeleteSubtitleProfileClick);
    }

    function onEditSubtitleProfileClick() {
        const itemIndex = parseInt(this.getAttribute('data-index'));
        editSubtitleProfile(page, currentProfile.SubtitleProfiles[itemIndex]);
    }

    const lnkEditSubtitleProfile = elem.querySelectorAll('.lnkEditSubtitleProfile');
    for (let i = 0, length = lnkEditSubtitleProfile.length; i < length; i++) {
        lnkEditSubtitleProfile[i].addEventListener('click', onEditSubtitleProfileClick);
    }
}

function editSubtitleProfile(page, profile, index) {
    import('./profileEditor/subtitleProfileEditor').then((subtitleProfileEditor) => {
        subtitleProfileEditor.show(profile).then(function (updatedSubtitleProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.SubtitleProfiles.push(updatedSubtitleProfiles);
            }

            renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        });
    });
}

function renderSubProfiles(page, profile) {
    renderDirectPlayProfiles(page, profile.DirectPlayProfiles);
    renderTranscodingProfiles(page, profile.TranscodingProfiles);
    renderContainerProfiles(page, profile.ContainerProfiles);
    renderCodecProfiles(page, profile.CodecProfiles);
    renderResponseProfiles(page, profile.ResponseProfiles);
}

function renderDirectPlayProfiles(page, profiles) {
    let html = '';
    let currentType;
    const elem = page.querySelector('#directPlayProfiles');

    for (const [index, profile] of profiles.entries()) {
        if (profile.Type !== currentType) {
            html += '<div>' + profile.Type + '</div>';
            currentType = profile.Type;
        }

        html += '<div>';
        html += '<a is="emby-linkbutton" href="#" class="editDirectPlayProfiles" data-profileindex="' + index + '">';
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
        html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + index + '"><span class="material-icons delete"></span></button>';
        html += '</div>';
    }

    elem.innerHTML = html;
}

function editDirectPlayProfile(page, directPlayProfile, index) {
    import('./profileEditor/directPlayProfileEditor').then((directPlayProfileEditor) => {
        directPlayProfileEditor.show(directPlayProfile).then(function (updatedDirectPlayProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.DirectPlayProfiles.push(updatedDirectPlayProfiles);
            }

            renderDirectPlayProfiles(page, currentProfile.DirectPlayProfiles);
        });
    });
}

function renderTranscodingProfiles(page, profiles) {
    let html = '';
    let currentType;
    const elem = page.querySelector('#transcodingProfiles');

    for (let i = 0, length = profiles.length; i < length; i++) {
        const profile = profiles[i];

        if (profile.Type !== currentType) {
            html += '<li data-role="list-divider">' + profile.Type + '</li>';
            currentType = profile.Type;
        }

        html += '<div>';
        html += '<a is="emby-linkbutton" href="#" class="editTranscodingProfiles" data-profileindex="' + i + '">';
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
        html += '<button type="button" is="paper-icon-button-light" class="btnDeleteTranscodingProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
        html += '</div>';
    }

    elem.innerHTML = html;
}

function editTranscodingProfile(page, transcodingProfile, index) {
    import('./profileEditor/transcodingProfileEditor').then((transcodingProfileEditor) => {
        transcodingProfileEditor.show(transcodingProfile).then(function (updatedTranscodingProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.TranscodingProfiles.push(updatedTranscodingProfiles);
            }

            renderTranscodingProfiles(page, currentProfile.TranscodingProfiles);
        });
    });
}

function renderContainerProfiles(page, profiles) {
    let html = '';
    let currentType;
    const elem = page.querySelector('#containerProfiles');

    for (let i = 0, length = profiles.length; i < length; i++) {
        const profile = profiles[i];

        if (profile.Type !== currentType) {
            html += '<li data-role="list-divider">' + profile.Type + '</li>';
            currentType = profile.Type;
        }

        html += '<div>';
        html += '<a is="emby-linkbutton" href="#" class="lnkeditContainerProfile" data-profileindex="' + i + '">';
        html += '<p>' + globalize.translate('ValueContainer', profile.Container || allText) + '</p>';

        if (profile.Conditions && profile.Conditions.length) {
            html += '<p>';
            html += globalize.translate('ValueConditions', profile.Conditions.map(function (c) {
                return c.Property;
            }).join(', '));
            html += '</p>';
        }

        html += '</a>';
        html += '<button type="button" is="paper-icon-button-light" class="btnDeletecontainerProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
        html += '</div>';
    }

    elem.innerHTML = html;
}

function editContainerProfile(page, containerProfile, index) {
    import('./profileEditor/containerProfileEditor').then((containerProfileEditor) => {
        containerProfileEditor.show(containerProfile).then(function (updatedContainerProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.ContainerProfiles.push(updatedContainerProfiles);
            }

            renderContainerProfiles(page, currentProfile.ContainerProfiles);
        });
    });
}

function renderCodecProfiles(page, profiles) {
    let html = '';
    let currentType;
    const elem = page.querySelector('#codecProfiles');

    for (let i = 0, length = profiles.length; i < length; i++) {
        const profile = profiles[i];
        const type = profile.Type.replace('VideoAudio', 'Video Audio');

        if (type !== currentType) {
            html += '<li data-role="list-divider">' + type + '</li>';
            currentType = type;
        }

        html += '<div>';
        html += '<a is="emby-linkbutton" href="#" class="lnkEditCodecProfile" data-profileindex="' + i + '">';
        html += '<p>' + globalize.translate('ValueCodec', profile.Codec || allText) + '</p>';

        if (profile.Conditions && profile.Conditions.length) {
            html += '<p>';
            html += globalize.translate('ValueConditions', profile.Conditions.map(function (c) {
                return c.Property;
            }).join(', '));
            html += '</p>';
        }

        html += '</a>';
        html += '<button type="button" is="paper-icon-button-light" class="btnDeleteCodecProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
        html += '</div>';
    }

    elem.innerHTML = html;
}

function editCodecProfile(page, codecProfile, index) {
    import('./profileEditor/codecProfileEditor').then((codecProfileEditor) => {
        codecProfileEditor.show(codecProfile).then(function (updatedCodecProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.CodecProfiles.push(updatedCodecProfiles);
            }

            renderCodecProfiles(page, currentProfile.CodecProfiles);
        });
    });
}

function renderResponseProfiles(page, profiles) {
    let html = '';
    let currentType;
    const elem = page.querySelector('#mediaProfiles');

    for (let i = 0, length = profiles.length; i < length; i++) {
        const profile = profiles[i];

        if (profile.Type !== currentType) {
            html += '<li data-role="list-divider">' + profile.Type + '</li>';
            currentType = profile.Type;
        }

        html += '<div>';
        html += '<a is="emby-linkbutton" href="#" class="lnkEditResponseProfile" data-profileindex="' + i + '">';
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
        html += '<button type="button" is="paper-icon-button-light" class="btnDeleteResponseProfile listItemButton" data-profileindex="' + i + '"><span class="material-icons delete"></span></button>';
        html += '</div>';
    }

    elem.innerHTML = html;
}

function editResponseProfile(page, responseProfile, index) {
    import('./profileEditor/responseProfileEditor').then((responseProfileEditor) => {
        responseProfileEditor.show(responseProfile).then(function (updatedResponseProfiles) {
            const isNew = index === -1;

            if (isNew) {
                currentProfile.ResponseProfiles.push(updatedResponseProfiles);
            }

            renderResponseProfiles(page, currentProfile.ResponseProfiles);
        });
    });
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
            toast('Settings saved.');
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
    profile.SupportedMediaTypes = Array.prototype.filter.call(page.querySelectorAll('.chkMediaType'), function(c) {
        return c.checked;
    }).map(function(c) {
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

let currentProfile;
const allText = globalize.translate('All');
function onSubmit(e) {
    loading.show();
    saveProfile(dom.parentWithClass(e.target, 'dlnaProfileForm'), currentProfile);
    e.preventDefault();
    return false;
}

export default function (view) {
    const page = view;

    const openTabs = ({ target }) => {
        const { dataset: { value = '' }} = target;
        view.querySelectorAll('.viewTabButton').forEach(t =>
            t.classList.remove('ui-btn-active')
        );
        target.classList.add('ui-btn-active');
        view.querySelectorAll('.viewTab').forEach(t =>
            t.classList.add('hide')
        );
        view.querySelector(`#${value}`).classList.remove('hide');
    };

    view.querySelectorAll('.viewTabButton').forEach(tab => {
        tab.addEventListener('click', openTabs);
    });

    view.querySelector('.btnAddIdentificationHttpHeader').addEventListener('click', function () {
        editIdentificationHeader(page, {}, -1);
    });
    view.querySelector('.btnAddXmlDocumentAttribute').addEventListener('click', function () {
        editXmlDocumentAttribute(page, {}, -1);
    });
    view.querySelector('.btnAddSubtitleProfile').addEventListener('click', function () {
        editSubtitleProfile(page, {}, -1);
    });

    view.querySelector('.btnAddDirectPlayProfile').addEventListener('click', function () {
        editDirectPlayProfile(page, {}, -1);
    });

    view.querySelector('#directPlayProfiles').addEventListener('click', function (e) {
        let index;
        const btnDeleteProfile = dom.parentWithClass(e.target, 'btnDeleteProfile');
        if (btnDeleteProfile) {
            index = parseInt(btnDeleteProfile.getAttribute('data-profileindex'));
            currentProfile.DirectPlayProfiles.splice(index, 1);
            renderDirectPlayProfiles(page, currentProfile.DirectPlayProfiles);
        }

        const editDirectPlayProfiles = dom.parentWithClass(e.target, 'editDirectPlayProfiles');
        if (editDirectPlayProfiles) {
            index = parseInt(editDirectPlayProfiles.getAttribute('data-profileindex'));
            editDirectPlayProfile(page, currentProfile.DirectPlayProfiles[index], index);
        }
    });

    view.querySelector('.btnAddTranscodingProfile').addEventListener('click', function () {
        editTranscodingProfile(page, {}, -1);
    });

    view.querySelector('#transcodingProfiles').addEventListener('click', function (e) {
        let index;
        const btnDeleteTranscodingProfile = dom.parentWithClass(e.target, 'btnDeleteTranscodingProfile');
        if (btnDeleteTranscodingProfile) {
            index = parseInt(btnDeleteTranscodingProfile.getAttribute('data-profileindex'));
            currentProfile.TranscodingProfiles.splice(index, 1);
            renderTranscodingProfiles(page, currentProfile.TranscodingProfiles);
        }

        const lnkeditTranscodingProfiles = dom.parentWithClass(e.target, 'editTranscodingProfiles');
        if (lnkeditTranscodingProfiles) {
            index = parseInt(lnkeditTranscodingProfiles.getAttribute('data-profileindex'));
            editTranscodingProfile(page, currentProfile.TranscodingProfiles[index], index);
        }
    });

    view.querySelector('.btnAddContainerProfile').addEventListener('click', function () {
        editContainerProfile(page, {}, -1);
    });

    view.querySelector('#containerProfiles').addEventListener('click', function (e) {
        let index;
        const btnDeletecontainerProfile = dom.parentWithClass(e.target, 'btnDeletecontainerProfile');
        if (btnDeletecontainerProfile) {
            index = parseInt(btnDeletecontainerProfile.getAttribute('data-profileindex'));
            currentProfile.ContainerProfiles.splice(index, 1);
            renderContainerProfiles(page, currentProfile.ContainerProfiles);
        }

        const lnkeditContainerProfile = dom.parentWithClass(e.target, 'lnkeditContainerProfile');
        if (lnkeditContainerProfile) {
            index = parseInt(lnkeditContainerProfile.getAttribute('data-profileindex'));
            editContainerProfile(page, currentProfile.ContainerProfiles[index], index);
        }
    });

    view.querySelector('.btnAddCodecProfile').addEventListener('click', function () {
        editCodecProfile(page, {}, -1);
    });

    view.querySelector('#codecProfiles').addEventListener('click', function (e) {
        let index;
        const btnDeleteCodecProfile = dom.parentWithClass(e.target, 'btnDeleteCodecProfile');
        if (btnDeleteCodecProfile) {
            index = parseInt(btnDeleteCodecProfile.getAttribute('data-profileindex'));
            currentProfile.CodecProfiles.splice(index, 1);
            renderCodecProfiles(page, currentProfile.CodecProfiles);
        }

        const lnkEditCodecProfile = dom.parentWithClass(e.target, 'lnkEditCodecProfile');
        if (lnkEditCodecProfile) {
            index = parseInt(lnkEditCodecProfile.getAttribute('data-profileindex'));
            editCodecProfile(page, currentProfile.CodecProfiles[index], index);
        }
    });

    view.querySelector('.btnAddResponseProfile').addEventListener('click', function () {
        editResponseProfile(page, {}, -1);
    });

    view.querySelector('#mediaProfiles').addEventListener('click', function (e) {
        let index;
        const btnDeleteResponseProfile = dom.parentWithClass(e.target, 'btnDeleteResponseProfile');
        if (btnDeleteResponseProfile) {
            index = parseInt(btnDeleteResponseProfile.getAttribute('data-profileindex'));
            currentProfile.ResponseProfiles.splice(index, 1);
            renderResponseProfiles(page, currentProfile.ResponseProfiles);
        }

        const lnkEditResponseProfile = dom.parentWithClass(e.target, 'lnkEditResponseProfile');
        if (lnkEditResponseProfile) {
            index = parseInt(lnkEditResponseProfile.getAttribute('data-profileindex'));
            editResponseProfile(page, currentProfile.ResponseProfiles[index], index);
        }
    });

    view.querySelector('.dlnaProfileForm').addEventListener('submit', onSubmit);

    view.addEventListener('viewshow', function () {
        loadProfile(page);
    });
}

