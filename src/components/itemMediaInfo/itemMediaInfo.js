define(["dialogHelper", "require", "layoutManager", "globalize", "userSettings", "connectionManager", "loading", "focusManager", "dom", "apphost", "emby-select", "listViewStyle", "paper-icon-button-light", "css!./../formdialog", "material-icons", "emby-button", "flexStyles"], function (dialogHelper, require, layoutManager, globalize, userSettings, connectionManager, loading, focusManager, dom, appHost) {
    "use strict";

    function setMediaInfo(user, page, item) {
        var html = item.MediaSources.map(function (version) {
            return getMediaSourceHtml(user, item, version);
        }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
        if (item.MediaSources.length > 1) {
            html = "<br/>" + html;
        }
        var mediaInfoContent = page.querySelector("#mediaInfoContent");
        mediaInfoContent.innerHTML = html;
    }

    function getMediaSourceHtml(user, item, version) {
        var html = "";
        if (version.Name) {
            html += '<div><h2 class="mediaInfoStreamType">' + version.Name + "</h2></div>";
        }
        if (version.Container) {
            html += createAttribute(globalize.translate("MediaInfoContainer"), version.Container) + "<br/>";
        }
        if (version.Formats && version.Formats.length) {
            html += createAttribute(globalize.translate("MediaInfoFormat"), version.Formats.join(",")) + "<br/>";
        }
        if (version.Path && user && user.Policy.IsAdministrator) {
            html += createAttribute(globalize.translate("MediaInfoPath"), version.Path) + "<br/>";
        }
        if (version.Size) {
            var size = (version.Size / (1024 * 1024)).toFixed(0) + " MB";
            html += createAttribute(globalize.translate("MediaInfoSize"), size) + "<br/>";
        }
        for (var i = 0, length = version.MediaStreams.length; i < length; i++) {
            var stream = version.MediaStreams[i];
            if (stream.Type === "Data") {
                continue;
            }
            html += '<div class="mediaInfoStream">';
            var displayType = globalize.translate("MediaInfoStreamType" + stream.Type);
            html += '<h2 class="mediaInfoStreamType">' + displayType + "</h2>";
            var attributes = [];
            if (stream.DisplayTitle) {
                attributes.push(createAttribute("Title", stream.DisplayTitle));
            }
            if (stream.Language && stream.Type !== "Video") {
                attributes.push(createAttribute(globalize.translate("MediaInfoLanguage"), stream.Language));
            }
            if (stream.Codec) {
                attributes.push(createAttribute(globalize.translate("MediaInfoCodec"), stream.Codec.toUpperCase()));
            }
            if (stream.CodecTag) {
                attributes.push(createAttribute(globalize.translate("MediaInfoCodecTag"), stream.CodecTag));
            }
            if (stream.IsAVC != null) {
                attributes.push(createAttribute("AVC", (stream.IsAVC ? "Yes" : "No")));
            }
            if (stream.Profile) {
                attributes.push(createAttribute(globalize.translate("MediaInfoProfile"), stream.Profile));
            }
            if (stream.Level) {
                attributes.push(createAttribute(globalize.translate("MediaInfoLevel"), stream.Level));
            }
            if (stream.Width || stream.Height) {
                attributes.push(createAttribute(globalize.translate("MediaInfoResolution"), stream.Width + "x" + stream.Height));
            }
            if (stream.AspectRatio && stream.Codec !== "mjpeg") {
                attributes.push(createAttribute(globalize.translate("MediaInfoAspectRatio"), stream.AspectRatio));
            }
            if (stream.Type === "Video") {
                if (stream.IsAnamorphic != null) {
                    attributes.push(createAttribute(globalize.translate("MediaInfoAnamorphic"), (stream.IsAnamorphic ? "Yes" : "No")));
                }
                attributes.push(createAttribute(globalize.translate("MediaInfoInterlaced"), (stream.IsInterlaced ? "Yes" : "No")));
            }
            if (stream.AverageFrameRate || stream.RealFrameRate) {
                attributes.push(createAttribute(globalize.translate("MediaInfoFramerate"), (stream.AverageFrameRate || stream.RealFrameRate)));
            }
            if (stream.ChannelLayout) {
                attributes.push(createAttribute(globalize.translate("MediaInfoLayout"), stream.ChannelLayout));
            }
            if (stream.Channels) {
                attributes.push(createAttribute(globalize.translate("MediaInfoChannels"), stream.Channels + " ch"));
            }
            if (stream.BitRate && stream.Codec !== "mjpeg") {
                attributes.push(createAttribute(globalize.translate("MediaInfoBitrate"), (parseInt(stream.BitRate / 1000)) + " kbps"));
            }
            if (stream.SampleRate) {
                attributes.push(createAttribute(globalize.translate("MediaInfoSampleRate"), stream.SampleRate + " Hz"));
            }
            if (stream.BitDepth) {
                attributes.push(createAttribute(globalize.translate("MediaInfoBitDepth"), stream.BitDepth + " bit"));
            }
            if (stream.PixelFormat) {
                attributes.push(createAttribute(globalize.translate("MediaInfoPixelFormat"), stream.PixelFormat));
            }
            if (stream.RefFrames) {
                attributes.push(createAttribute(globalize.translate("MediaInfoRefFrames"), stream.RefFrames));
            }
            if (stream.NalLengthSize) {
                attributes.push(createAttribute("NAL", stream.NalLengthSize));
            }
            if (stream.Type !== "Video") {
                attributes.push(createAttribute(globalize.translate("MediaInfoDefault"), (stream.IsDefault ? "Yes" : "No")));
            }
            if (stream.Type === "Subtitle") {
                attributes.push(createAttribute(globalize.translate("MediaInfoForced"), (stream.IsForced ? "Yes" : "No")));
                attributes.push(createAttribute(globalize.translate("MediaInfoExternal"), (stream.IsExternal ? "Yes" : "No")));
            }
            if (stream.Type === "Video" && version.Timestamp) {
                attributes.push(createAttribute(globalize.translate("MediaInfoTimestamp"), version.Timestamp));
            }
            html += attributes.join("<br/>");
            html += "</div>";
        }
        return html;
    }

    function createAttribute(label, value) {
        return '<span class="mediaInfoLabel">' + label + '</span><span class="mediaInfoAttribute">' + value + "</span>"
    }

    function showMediaInfoMore(itemId, serverId, template) {
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
            var dialogOptions = {
                size: "small",
                removeOnClose: true,
                scrollY: false
            };
            if (layoutManager.tv) {
                dialogOptions.size = "fullscreen";
            }
            var dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add("formDialog");
            var html = "";
            html += globalize.translateDocument(template, "core");
            dlg.innerHTML = html;
            if (layoutManager.tv) {
                dlg.querySelector(".formDialogContent");
            }
            dialogHelper.open(dlg);
            dlg.querySelector(".btnCancel").addEventListener("click", function (e) {
                dialogHelper.close(dlg);
            });
            apiClient.getCurrentUser().then(function (user) {
                setMediaInfo(user, dlg, item);
            });
            loading.hide();
        });
    }

    function showMediaInfo(itemId, serverId) {
        loading.show();
        return new Promise(function (resolve, reject) {
            require(["text!./itemMediaInfo.template.html"], function (template) {
                showMediaInfoMore(itemId, serverId, template).then(resolve, reject);
            });
        });
    }

    return {
        show: showMediaInfo
    };
});
