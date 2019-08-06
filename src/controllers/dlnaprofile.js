define(["jQuery", "loading", "fnchecked", "emby-select", "emby-button", "emby-input", "emby-checkbox", "listViewStyle", "emby-button"], function ($, loading) {
    "use strict";

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
        var id = getParameterByName("id");
        var url = id ? "Dlna/Profiles/" + id : "Dlna/Profiles/Default";
        return ApiClient.getJSON(ApiClient.getUrl(url));
    }

    function renderProfile(page, profile, users) {
        $("#txtName", page).val(profile.Name);
        $(".chkMediaType", page).each(function () {
            this.checked = -1 != (profile.SupportedMediaTypes || "").split(",").indexOf(this.getAttribute("data-value"));
        });
        $("#chkEnableAlbumArtInDidl", page).checked(profile.EnableAlbumArtInDidl);
        $("#chkEnableSingleImageLimit", page).checked(profile.EnableSingleAlbumArtLimit);
        renderXmlDocumentAttributes(page, profile.XmlRootAttributes || []);
        var idInfo = profile.Identification || {};
        renderIdentificationHeaders(page, idInfo.Headers || []);
        renderSubtitleProfiles(page, profile.SubtitleProfiles || []);
        $("#txtInfoFriendlyName", page).val(profile.FriendlyName || "");
        $("#txtInfoModelName", page).val(profile.ModelName || "");
        $("#txtInfoModelNumber", page).val(profile.ModelNumber || "");
        $("#txtInfoModelDescription", page).val(profile.ModelDescription || "");
        $("#txtInfoModelUrl", page).val(profile.ModelUrl || "");
        $("#txtInfoManufacturer", page).val(profile.Manufacturer || "");
        $("#txtInfoManufacturerUrl", page).val(profile.ManufacturerUrl || "");
        $("#txtInfoSerialNumber", page).val(profile.SerialNumber || "");
        $("#txtIdFriendlyName", page).val(idInfo.FriendlyName || "");
        $("#txtIdModelName", page).val(idInfo.ModelName || "");
        $("#txtIdModelNumber", page).val(idInfo.ModelNumber || "");
        $("#txtIdModelDescription", page).val(idInfo.ModelDescription || "");
        $("#txtIdModelUrl", page).val(idInfo.ModelUrl || "");
        $("#txtIdManufacturer", page).val(idInfo.Manufacturer || "");
        $("#txtIdManufacturerUrl", page).val(idInfo.ManufacturerUrl || "");
        $("#txtIdSerialNumber", page).val(idInfo.SerialNumber || "");
        $("#txtIdDeviceDescription", page).val(idInfo.DeviceDescription || "");
        $("#txtAlbumArtPn", page).val(profile.AlbumArtPn || "");
        $("#txtAlbumArtMaxWidth", page).val(profile.MaxAlbumArtWidth || "");
        $("#txtAlbumArtMaxHeight", page).val(profile.MaxAlbumArtHeight || "");
        $("#txtIconMaxWidth", page).val(profile.MaxIconWidth || "");
        $("#txtIconMaxHeight", page).val(profile.MaxIconHeight || "");
        $("#chkIgnoreTranscodeByteRangeRequests", page).checked(profile.IgnoreTranscodeByteRangeRequests);
        $("#txtMaxAllowedBitrate", page).val(profile.MaxStreamingBitrate || "");
        $("#txtMusicStreamingTranscodingBitrate", page).val(profile.MusicStreamingTranscodingBitrate || "");
        $("#chkRequiresPlainFolders", page).checked(profile.RequiresPlainFolders);
        $("#chkRequiresPlainVideoItems", page).checked(profile.RequiresPlainVideoItems);
        $("#txtProtocolInfo", page).val(profile.ProtocolInfo || "");
        $("#txtXDlnaCap", page).val(profile.XDlnaCap || "");
        $("#txtXDlnaDoc", page).val(profile.XDlnaDoc || "");
        $("#txtSonyAggregationFlags", page).val(profile.SonyAggregationFlags || "");
        profile.DirectPlayProfiles = profile.DirectPlayProfiles || [];
        profile.TranscodingProfiles = profile.TranscodingProfiles || [];
        profile.ContainerProfiles = profile.ContainerProfiles || [];
        profile.CodecProfiles = profile.CodecProfiles || [];
        profile.ResponseProfiles = profile.ResponseProfiles || [];
        var usersHtml = "<option></option>" + users.map(function (u__w) {
            return '<option value="' + u__w.Id + '">' + u__w.Name + "</option>";
        }).join("");
        $("#selectUser", page).html(usersHtml).val(profile.UserId || "");
        renderSubProfiles(page, profile);
    }

    function renderIdentificationHeaders(page, headers) {
        var index = 0;
        var html = '<div class="paperList">' + headers.map(function (h__e) {
            var li = '<div class="listItem">';
            li += '<i class="md-icon listItemIcon">info</i>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + h__e.Name + ": " + (h__e.Value || "") + "</h3>";
            li += '<div class="listItemBodyText secondary">' + (h__e.Match || "") + "</div>";
            li += "</div>";
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteIdentificationHeader listItemButton" data-index="' + index + '"><i class="md-icon">delete</i></button>';
            li += "</div>";
            index++;
            return li;
        }).join("") + "</div>";
        var elem = $(".httpHeaderIdentificationList", page).html(html).trigger("create");
        $(".btnDeleteIdentificationHeader", elem).on("click", function () {
            var itemIndex = parseInt(this.getAttribute("data-index"));
            currentProfile.Identification.Headers.splice(itemIndex, 1);
            renderIdentificationHeaders(page, currentProfile.Identification.Headers);
        });
    }

    function openPopup(elem) {
        elem.classList.remove("hide");
    }

    function closePopup(elem) {
        elem.classList.add("hide");
    }

    function editIdentificationHeader(page, header) {
        isSubProfileNew = null == header;
        header = header || {};
        currentSubProfile = header;
        var popup = $("#identificationHeaderPopup", page);
        $("#txtIdentificationHeaderName", popup).val(header.Name || "");
        $("#txtIdentificationHeaderValue", popup).val(header.Value || "");
        $("#selectMatchType", popup).val(header.Match || "Equals");
        openPopup(popup[0]);
    }

    function saveIdentificationHeader(page) {
        currentSubProfile.Name = $("#txtIdentificationHeaderName", page).val();
        currentSubProfile.Value = $("#txtIdentificationHeaderValue", page).val();
        currentSubProfile.Match = $("#selectMatchType", page).val();

        if (isSubProfileNew) {
            currentProfile.Identification = currentProfile.Identification || {};
            currentProfile.Identification.Headers = currentProfile.Identification.Headers || [];
            currentProfile.Identification.Headers.push(currentSubProfile);
        }

        renderIdentificationHeaders(page, currentProfile.Identification.Headers);
        currentSubProfile = null;
        closePopup($("#identificationHeaderPopup", page)[0]);
    }

    function renderXmlDocumentAttributes(page, attribute) {
        var html = '<div class="paperList">' + attribute.map(function (h__r) {
            var li = '<div class="listItem">';
            li += '<i class="md-icon listItemIcon">info</i>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + h__r.Name + " = " + (h__r.Value || "") + "</h3>";
            li += "</div>";
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteXmlAttribute listItemButton" data-index="0"><i class="md-icon">delete</i></button>';
            return li += "</div>";
        }).join("") + "</div>";
        var elem = $(".xmlDocumentAttributeList", page).html(html).trigger("create");
        $(".btnDeleteXmlAttribute", elem).on("click", function () {
            var itemIndex = parseInt(this.getAttribute("data-index"));
            currentProfile.XmlRootAttributes.splice(itemIndex, 1);
            renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        });
    }

    function editXmlDocumentAttribute(page, attribute) {
        isSubProfileNew = null == attribute;
        attribute = attribute || {};
        currentSubProfile = attribute;
        var popup = $("#xmlAttributePopup", page);
        $("#txtXmlAttributeName", popup).val(attribute.Name || "");
        $("#txtXmlAttributeValue", popup).val(attribute.Value || "");
        openPopup(popup[0]);
    }

    function saveXmlDocumentAttribute(page) {
        currentSubProfile.Name = $("#txtXmlAttributeName", page).val();
        currentSubProfile.Value = $("#txtXmlAttributeValue", page).val();

        if (isSubProfileNew) {
            currentProfile.XmlRootAttributes.push(currentSubProfile);
        }

        renderXmlDocumentAttributes(page, currentProfile.XmlRootAttributes);
        currentSubProfile = null;
        closePopup($("#xmlAttributePopup", page)[0]);
    }

    function renderSubtitleProfiles(page, profiles) {
        var index = 0;
        var html = '<div class="paperList">' + profiles.map(function (h__t) {
            var li = '<div class="listItem lnkEditSubProfile" data-index="' + index + '">';
            li += '<i class="md-icon listItemIcon">info</i>';
            li += '<div class="listItemBody">';
            li += '<h3 class="listItemBodyText">' + (h__t.Format || "") + "</h3>";
            li += "</div>";
            li += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-index="' + index + '"><i class="md-icon">delete</i></button>';
            li += "</div>";
            index++;
            return li;
        }).join("") + "</div>";
        var elem = $(".subtitleProfileList", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var itemIndex = parseInt(this.getAttribute("data-index"));
            currentProfile.SubtitleProfiles.splice(itemIndex, 1);
            renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var itemIndex = parseInt(this.getAttribute("data-index"));
            editSubtitleProfile(page, currentProfile.SubtitleProfiles[itemIndex]);
        });
    }

    function editSubtitleProfile(page, profile) {
        isSubProfileNew = null == profile;
        profile = profile || {};
        currentSubProfile = profile;
        var popup = $("#subtitleProfilePopup", page);
        $("#txtSubtitleProfileFormat", popup).val(profile.Format || "");
        $("#selectSubtitleProfileMethod", popup).val(profile.Method || "");
        $("#selectSubtitleProfileDidlMode", popup).val(profile.DidlMode || "");
        openPopup(popup[0]);
    }

    function saveSubtitleProfile(page) {
        currentSubProfile.Format = $("#txtSubtitleProfileFormat", page).val();
        currentSubProfile.Method = $("#selectSubtitleProfileMethod", page).val();
        currentSubProfile.DidlMode = $("#selectSubtitleProfileDidlMode", page).val();

        if (isSubProfileNew) {
            currentProfile.SubtitleProfiles.push(currentSubProfile);
        }

        renderSubtitleProfiles(page, currentProfile.SubtitleProfiles);
        currentSubProfile = null;
        closePopup($("#subtitleProfilePopup", page)[0]);
    }

    function renderSubProfiles(page, profile) {
        renderDirectPlayProfiles(page, profile.DirectPlayProfiles);
        renderTranscodingProfiles(page, profile.TranscodingProfiles);
        renderContainerProfiles(page, profile.ContainerProfiles);
        renderCodecProfiles(page, profile.CodecProfiles);
        renderResponseProfiles(page, profile.ResponseProfiles);
    }

    function saveDirectPlayProfile(page) {
        currentSubProfile.Type = $("#selectDirectPlayProfileType", page).val();
        currentSubProfile.Container = $("#txtDirectPlayContainer", page).val();
        currentSubProfile.AudioCodec = $("#txtDirectPlayAudioCodec", page).val();
        currentSubProfile.VideoCodec = $("#txtDirectPlayVideoCodec", page).val();

        if (isSubProfileNew) {
            currentProfile.DirectPlayProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($("#popupEditDirectPlayProfile", page)[0]);
    }

    function renderDirectPlayProfiles(page, profiles) {
        var html = "";
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i__y = 0, length = profiles.length; i__y < length; i__y++) {
            var profile = profiles[i__y];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + "</li>";
                currentType = profile.Type;
            }

            html += "<div>";
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i__y + '">';
            html += "<p>" + Globalize.translate("ValueContainer").replace("{0}", profile.Container || allText) + "</p>";

            if ("Video" == profile.Type) {
                html += "<p>" + Globalize.translate("ValueVideoCodec").replace("{0}", profile.VideoCodec || allText) + "</p>";
                html += "<p>" + Globalize.translate("ValueAudioCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
            } else {
                if ("Audio" == profile.Type) {
                    html += "<p>" + Globalize.translate("ValueCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
                }
            }

            html += "</a>";
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i__y + '"><i class="md-icon">delete</i></button>';
            html += "</div>";
        }

        html += "</ul>";
        var elem = $(".directPlayProfiles", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var index = this.getAttribute("data-profileindex");
            deleteDirectPlayProfile(page, index);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var index = parseInt(this.getAttribute("data-profileindex"));
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
        var popup = $("#popupEditDirectPlayProfile", page);
        $("#selectDirectPlayProfileType", popup).val(directPlayProfile.Type || "Video").trigger("change");
        $("#txtDirectPlayContainer", popup).val(directPlayProfile.Container || "");
        $("#txtDirectPlayAudioCodec", popup).val(directPlayProfile.AudioCodec || "");
        $("#txtDirectPlayVideoCodec", popup).val(directPlayProfile.VideoCodec || "");
        openPopup(popup[0]);
    }

    function renderTranscodingProfiles(page, profiles) {
        var html = "";
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i__u = 0, length = profiles.length; i__u < length; i__u++) {
            var profile = profiles[i__u];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + "</li>";
                currentType = profile.Type;
            }

            html += "<div>";
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i__u + '">';
            html += "<p>Protocol: " + (profile.Protocol || "Http") + "</p>";
            html += "<p>" + Globalize.translate("ValueContainer").replace("{0}", profile.Container || allText) + "</p>";

            if ("Video" == profile.Type) {
                html += "<p>" + Globalize.translate("ValueVideoCodec").replace("{0}", profile.VideoCodec || allText) + "</p>";
                html += "<p>" + Globalize.translate("ValueAudioCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
            } else {
                if ("Audio" == profile.Type) {
                    html += "<p>" + Globalize.translate("ValueCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
                }
            }

            html += "</a>";
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i__u + '"><i class="md-icon">delete</i></button>';
            html += "</div>";
        }

        html += "</ul>";
        var elem = $(".transcodingProfiles", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var index = this.getAttribute("data-profileindex");
            deleteTranscodingProfile(page, index);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var index = parseInt(this.getAttribute("data-profileindex"));
            editTranscodingProfile(page, currentProfile.TranscodingProfiles[index]);
        });
    }

    function editTranscodingProfile(page, transcodingProfile) {
        isSubProfileNew = null == transcodingProfile;
        transcodingProfile = transcodingProfile || {};
        currentSubProfile = transcodingProfile;
        var popup = $("#transcodingProfilePopup", page);
        $("#selectTranscodingProfileType", popup).val(transcodingProfile.Type || "Video").trigger("change");
        $("#txtTranscodingContainer", popup).val(transcodingProfile.Container || "");
        $("#txtTranscodingAudioCodec", popup).val(transcodingProfile.AudioCodec || "");
        $("#txtTranscodingVideoCodec", popup).val(transcodingProfile.VideoCodec || "");
        $("#selectTranscodingProtocol", popup).val(transcodingProfile.Protocol || "Http");
        $("#chkEnableMpegtsM2TsMode", popup).checked(transcodingProfile.EnableMpegtsM2TsMode || false);
        $("#chkEstimateContentLength", popup).checked(transcodingProfile.EstimateContentLength || false);
        $("#chkReportByteRangeRequests", popup).checked("Bytes" == transcodingProfile.TranscodeSeekInfo);
        $(".radioTabButton:first", popup).trigger("click");
        openPopup(popup[0]);
    }

    function deleteTranscodingProfile(page, index) {
        currentProfile.TranscodingProfiles.splice(index, 1);
        renderTranscodingProfiles(page, currentProfile.TranscodingProfiles);
    }

    function saveTranscodingProfile(page) {
        currentSubProfile.Type = $("#selectTranscodingProfileType", page).val();
        currentSubProfile.Container = $("#txtTranscodingContainer", page).val();
        currentSubProfile.AudioCodec = $("#txtTranscodingAudioCodec", page).val();
        currentSubProfile.VideoCodec = $("#txtTranscodingVideoCodec", page).val();
        currentSubProfile.Protocol = $("#selectTranscodingProtocol", page).val();
        currentSubProfile.Context = "Streaming";
        currentSubProfile.EnableMpegtsM2TsMode = $("#chkEnableMpegtsM2TsMode", page).checked();
        currentSubProfile.EstimateContentLength = $("#chkEstimateContentLength", page).checked();
        currentSubProfile.TranscodeSeekInfo = $("#chkReportByteRangeRequests", page).checked() ? "Bytes" : "Auto";

        if (isSubProfileNew) {
            currentProfile.TranscodingProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($("#transcodingProfilePopup", page)[0]);
    }

    function renderContainerProfiles(page, profiles) {
        var html = "";
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i__i = 0, length = profiles.length; i__i < length; i__i++) {
            var profile = profiles[i__i];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + "</li>";
                currentType = profile.Type;
            }

            html += "<div>";
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i__i + '">';
            html += "<p>" + Globalize.translate("ValueContainer").replace("{0}", profile.Container || allText) + "</p>";

            if (profile.Conditions && profile.Conditions.length) {
                html += "<p>";
                html += Globalize.translate("ValueConditions").replace("{0}", profile.Conditions.map(function (c__o) {
                    return c__o.Property;
                }).join(", "));
                html += "</p>";
            }

            html += "</a>";
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i__i + '"><i class="md-icon">delete</i></button>';
            html += "</div>";
        }

        html += "</ul>";
        var elem = $(".containerProfiles", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var index = this.getAttribute("data-profileindex");
            deleteContainerProfile(page, index);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var index = parseInt(this.getAttribute("data-profileindex"));
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
        var popup = $("#containerProfilePopup", page);
        $("#selectContainerProfileType", popup).val(containerProfile.Type || "Video").trigger("change");
        $("#txtContainerProfileContainer", popup).val(containerProfile.Container || "");
        $(".radioTabButton:first", popup).trigger("click");
        openPopup(popup[0]);
    }

    function saveContainerProfile(page) {
        currentSubProfile.Type = $("#selectContainerProfileType", page).val();
        currentSubProfile.Container = $("#txtContainerProfileContainer", page).val();

        if (isSubProfileNew) {
            currentProfile.ContainerProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($("#containerProfilePopup", page)[0]);
    }

    function renderCodecProfiles(page, profiles) {
        var html = "";
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i__p = 0, length = profiles.length; i__p < length; i__p++) {
            var profile = profiles[i__p];
            var type = profile.Type.replace("VideoAudio", "Video Audio");

            if (type !== currentType) {
                html += '<li data-role="list-divider">' + type + "</li>";
                currentType = type;
            }

            html += "<div>";
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i__p + '">';
            html += "<p>" + Globalize.translate("ValueCodec").replace("{0}", profile.Codec || allText) + "</p>";

            if (profile.Conditions && profile.Conditions.length) {
                html += "<p>";
                html += Globalize.translate("ValueConditions").replace("{0}", profile.Conditions.map(function (c__a) {
                    return c__a.Property;
                }).join(", "));
                html += "</p>";
            }

            html += "</a>";
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i__p + '"><i class="md-icon">delete</i></button>';
            html += "</div>";
        }

        html += "</ul>";
        var elem = $(".codecProfiles", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var index = this.getAttribute("data-profileindex");
            deleteCodecProfile(page, index);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var index = parseInt(this.getAttribute("data-profileindex"));
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
        var popup = $("#codecProfilePopup", page);
        $("#selectCodecProfileType", popup).val(codecProfile.Type || "Video").trigger("change");
        $("#txtCodecProfileCodec", popup).val(codecProfile.Codec || "");
        $(".radioTabButton:first", popup).trigger("click");
        openPopup(popup[0]);
    }

    function saveCodecProfile(page) {
        currentSubProfile.Type = $("#selectCodecProfileType", page).val();
        currentSubProfile.Codec = $("#txtCodecProfileCodec", page).val();

        if (isSubProfileNew) {
            currentProfile.CodecProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($("#codecProfilePopup", page)[0]);
    }

    function renderResponseProfiles(page, profiles) {
        var html = "";
        html += '<ul data-role="listview" data-inset="true" data-split-icon="delete">';
        var currentType;

        for (var i__s = 0, length = profiles.length; i__s < length; i__s++) {
            var profile = profiles[i__s];

            if (profile.Type !== currentType) {
                html += '<li data-role="list-divider">' + profile.Type + "</li>";
                currentType = profile.Type;
            }

            html += "<div>";
            html += '<a is="emby-linkbutton" href="#" class="lnkEditSubProfile" data-profileindex="' + i__s + '">';
            html += "<p>" + Globalize.translate("ValueContainer").replace("{0}", profile.Container || allText) + "</p>";

            if ("Video" == profile.Type) {
                html += "<p>" + Globalize.translate("ValueVideoCodec").replace("{0}", profile.VideoCodec || allText) + "</p>";
                html += "<p>" + Globalize.translate("ValueAudioCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
            } else {
                if ("Audio" == profile.Type) {
                    html += "<p>" + Globalize.translate("ValueCodec").replace("{0}", profile.AudioCodec || allText) + "</p>";
                }
            }

            if (profile.Conditions && profile.Conditions.length) {
                html += "<p>";
                html += Globalize.translate("ValueConditions").replace("{0}", profile.Conditions.map(function (c__d) {
                    return c__d.Property;
                }).join(", "));
                html += "</p>";
            }

            html += "</a>";
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteProfile listItemButton" data-profileindex="' + i__s + '"><i class="md-icon">delete</i></button>';
            html += "</div>";
        }

        html += "</ul>";
        var elem = $(".mediaProfiles", page).html(html).trigger("create");
        $(".btnDeleteProfile", elem).on("click", function () {
            var index = this.getAttribute("data-profileindex");
            deleteResponseProfile(page, index);
        });
        $(".lnkEditSubProfile", elem).on("click", function () {
            var index = parseInt(this.getAttribute("data-profileindex"));
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
        var popup = $("#responseProfilePopup", page);
        $("#selectResponseProfileType", popup).val(responseProfile.Type || "Video").trigger("change");
        $("#txtResponseProfileContainer", popup).val(responseProfile.Container || "");
        $("#txtResponseProfileAudioCodec", popup).val(responseProfile.AudioCodec || "");
        $("#txtResponseProfileVideoCodec", popup).val(responseProfile.VideoCodec || "");
        $(".radioTabButton:first", popup).trigger("click");
        openPopup(popup[0]);
    }

    function saveResponseProfile(page) {
        currentSubProfile.Type = $("#selectResponseProfileType", page).val();
        currentSubProfile.Container = $("#txtResponseProfileContainer", page).val();
        currentSubProfile.AudioCodec = $("#txtResponseProfileAudioCodec", page).val();
        currentSubProfile.VideoCodec = $("#txtResponseProfileVideoCodec", page).val();

        if (isSubProfileNew) {
            currentProfile.ResponseProfiles.push(currentSubProfile);
        }

        renderSubProfiles(page, currentProfile);
        currentSubProfile = null;
        closePopup($("#responseProfilePopup", page)[0]);
    }

    function saveProfile(page, profile) {
        updateProfile(page, profile);
        var id = getParameterByName("id");

        if (id) {
            ApiClient.ajax({
                type: "POST",
                url: ApiClient.getUrl("Dlna/Profiles/" + id),
                data: JSON.stringify(profile),
                contentType: "application/json"
            }).then(function () {
                require(["toast"], function (toast) {
                    toast("Settings saved.");
                });
            }, Dashboard.processErrorResponse);
        } else {
            ApiClient.ajax({
                type: "POST",
                url: ApiClient.getUrl("Dlna/Profiles"),
                data: JSON.stringify(profile),
                contentType: "application/json"
            }).then(function () {
                Dashboard.navigate("dlnaprofiles.html");
            }, Dashboard.processErrorResponse);
        }

        loading.hide();
    }

    function updateProfile(page, profile) {
        profile.Name = $("#txtName", page).val();
        profile.EnableAlbumArtInDidl = $("#chkEnableAlbumArtInDidl", page).checked();
        profile.EnableSingleAlbumArtLimit = $("#chkEnableSingleImageLimit", page).checked();
        profile.SupportedMediaTypes = $(".chkMediaType:checked", page).get().map(function (c__f) {
            return c__f.getAttribute("data-value");
        }).join(",");
        profile.Identification = profile.Identification || {};
        profile.FriendlyName = $("#txtInfoFriendlyName", page).val();
        profile.ModelName = $("#txtInfoModelName", page).val();
        profile.ModelNumber = $("#txtInfoModelNumber", page).val();
        profile.ModelDescription = $("#txtInfoModelDescription", page).val();
        profile.ModelUrl = $("#txtInfoModelUrl", page).val();
        profile.Manufacturer = $("#txtInfoManufacturer", page).val();
        profile.ManufacturerUrl = $("#txtInfoManufacturerUrl", page).val();
        profile.SerialNumber = $("#txtInfoSerialNumber", page).val();
        profile.Identification.FriendlyName = $("#txtIdFriendlyName", page).val();
        profile.Identification.ModelName = $("#txtIdModelName", page).val();
        profile.Identification.ModelNumber = $("#txtIdModelNumber", page).val();
        profile.Identification.ModelDescription = $("#txtIdModelDescription", page).val();
        profile.Identification.ModelUrl = $("#txtIdModelUrl", page).val();
        profile.Identification.Manufacturer = $("#txtIdManufacturer", page).val();
        profile.Identification.ManufacturerUrl = $("#txtIdManufacturerUrl", page).val();
        profile.Identification.SerialNumber = $("#txtIdSerialNumber", page).val();
        profile.Identification.DeviceDescription = $("#txtIdDeviceDescription", page).val();
        profile.AlbumArtPn = $("#txtAlbumArtPn", page).val();
        profile.MaxAlbumArtWidth = $("#txtAlbumArtMaxWidth", page).val();
        profile.MaxAlbumArtHeight = $("#txtAlbumArtMaxHeight", page).val();
        profile.MaxIconWidth = $("#txtIconMaxWidth", page).val();
        profile.MaxIconHeight = $("#txtIconMaxHeight", page).val();
        profile.RequiresPlainFolders = $("#chkRequiresPlainFolders", page).checked();
        profile.RequiresPlainVideoItems = $("#chkRequiresPlainVideoItems", page).checked();
        profile.IgnoreTranscodeByteRangeRequests = $("#chkIgnoreTranscodeByteRangeRequests", page).checked();
        profile.MaxStreamingBitrate = $("#txtMaxAllowedBitrate", page).val();
        profile.MusicStreamingTranscodingBitrate = $("#txtMusicStreamingTranscodingBitrate", page).val();
        profile.ProtocolInfo = $("#txtProtocolInfo", page).val();
        profile.XDlnaCap = $("#txtXDlnaCap", page).val();
        profile.XDlnaDoc = $("#txtXDlnaDoc", page).val();
        profile.SonyAggregationFlags = $("#txtSonyAggregationFlags", page).val();
        profile.UserId = $("#selectUser", page).val();
    }

    var currentProfile;
    var currentSubProfile;
    var isSubProfileNew;
    var allText = Globalize.translate("LabelAll");

    $(document).on("pageinit", "#dlnaProfilePage", function () {
        var page = this;
        $(".radioTabButton", page).on("click", function () {
            $(this).siblings().removeClass("ui-btn-active");
            $(this).addClass("ui-btn-active");
            var value = "A" == this.tagName ? this.getAttribute("data-value") : this.value;
            var elem = $("." + value, page);
            elem.siblings(".tabContent").hide();
            elem.show();
        });
        $("#selectDirectPlayProfileType", page).on("change", function () {
            if ("Video" == this.value) {
                $("#fldDirectPlayVideoCodec", page).show();
            } else {
                $("#fldDirectPlayVideoCodec", page).hide();
            }

            if ("Photo" == this.value) {
                $("#fldDirectPlayAudioCodec", page).hide();
            } else {
                $("#fldDirectPlayAudioCodec", page).show();
            }
        });
        $("#selectTranscodingProfileType", page).on("change", function () {
            if ("Video" == this.value) {
                $("#fldTranscodingVideoCodec", page).show();
                $("#fldTranscodingProtocol", page).show();
                $("#fldEnableMpegtsM2TsMode", page).show();
            } else {
                $("#fldTranscodingVideoCodec", page).hide();
                $("#fldTranscodingProtocol", page).hide();
                $("#fldEnableMpegtsM2TsMode", page).hide();
            }

            if ("Photo" == this.value) {
                $("#fldTranscodingAudioCodec", page).hide();
                $("#fldEstimateContentLength", page).hide();
                $("#fldReportByteRangeRequests", page).hide();
            } else {
                $("#fldTranscodingAudioCodec", page).show();
                $("#fldEstimateContentLength", page).show();
                $("#fldReportByteRangeRequests", page).show();
            }
        });
        $("#selectResponseProfileType", page).on("change", function () {
            if ("Video" == this.value) {
                $("#fldResponseProfileVideoCodec", page).show();
            } else {
                $("#fldResponseProfileVideoCodec", page).hide();
            }

            if ("Photo" == this.value) {
                $("#fldResponseProfileAudioCodec", page).hide();
            } else {
                $("#fldResponseProfileAudioCodec", page).show();
            }
        });
        $(".btnAddDirectPlayProfile", page).on("click", function () {
            editDirectPlayProfile(page);
        });
        $(".btnAddTranscodingProfile", page).on("click", function () {
            editTranscodingProfile(page);
        });
        $(".btnAddContainerProfile", page).on("click", function () {
            editContainerProfile(page);
        });
        $(".btnAddCodecProfile", page).on("click", function () {
            editCodecProfile(page);
        });
        $(".btnAddResponseProfile", page).on("click", function () {
            editResponseProfile(page);
        });
        $(".btnAddIdentificationHttpHeader", page).on("click", function () {
            editIdentificationHeader(page);
        });
        $(".btnAddXmlDocumentAttribute", page).on("click", function () {
            editXmlDocumentAttribute(page);
        });
        $(".btnAddSubtitleProfile", page).on("click", function () {
            editSubtitleProfile(page);
        });
        $(".dlnaProfileForm").off("submit", DlnaProfilePage.onSubmit).on("submit", DlnaProfilePage.onSubmit);
        $(".editDirectPlayProfileForm").off("submit", DlnaProfilePage.onDirectPlayFormSubmit).on("submit", DlnaProfilePage.onDirectPlayFormSubmit);
        $(".transcodingProfileForm").off("submit", DlnaProfilePage.onTranscodingProfileFormSubmit).on("submit", DlnaProfilePage.onTranscodingProfileFormSubmit);
        $(".containerProfileForm").off("submit", DlnaProfilePage.onContainerProfileFormSubmit).on("submit", DlnaProfilePage.onContainerProfileFormSubmit);
        $(".codecProfileForm").off("submit", DlnaProfilePage.onCodecProfileFormSubmit).on("submit", DlnaProfilePage.onCodecProfileFormSubmit);
        $(".editResponseProfileForm").off("submit", DlnaProfilePage.onResponseProfileFormSubmit).on("submit", DlnaProfilePage.onResponseProfileFormSubmit);
        $(".identificationHeaderForm").off("submit", DlnaProfilePage.onIdentificationHeaderFormSubmit).on("submit", DlnaProfilePage.onIdentificationHeaderFormSubmit);
        $(".xmlAttributeForm").off("submit", DlnaProfilePage.onXmlAttributeFormSubmit).on("submit", DlnaProfilePage.onXmlAttributeFormSubmit);
        $(".subtitleProfileForm").off("submit", DlnaProfilePage.onSubtitleProfileFormSubmit).on("submit", DlnaProfilePage.onSubtitleProfileFormSubmit);
    }).on("pageshow", "#dlnaProfilePage", function () {
        var page = this;
        $("#radioInfo", page).trigger("click");
        loadProfile(page);
    });
    window.DlnaProfilePage = {
        onSubmit: function () {
            loading.show();
            saveProfile($(this).parents(".page"), currentProfile);
            return false;
        },
        onDirectPlayFormSubmit: function () {
            saveDirectPlayProfile($(this).parents(".page"));
            return false;
        },
        onTranscodingProfileFormSubmit: function () {
            saveTranscodingProfile($(this).parents(".page"));
            return false;
        },
        onContainerProfileFormSubmit: function () {
            saveContainerProfile($(this).parents(".page"));
            return false;
        },
        onCodecProfileFormSubmit: function () {
            saveCodecProfile($(this).parents(".page"));
            return false;
        },
        onResponseProfileFormSubmit: function () {
            saveResponseProfile($(this).parents(".page"));
            return false;
        },
        onIdentificationHeaderFormSubmit: function () {
            saveIdentificationHeader($(this).parents(".page"));
            return false;
        },
        onXmlAttributeFormSubmit: function () {
            saveXmlDocumentAttribute($(this).parents(".page"));
            return false;
        },
        onSubtitleProfileFormSubmit: function () {
            saveSubtitleProfile($(this).parents(".page"));
            return false;
        }
    };
});
