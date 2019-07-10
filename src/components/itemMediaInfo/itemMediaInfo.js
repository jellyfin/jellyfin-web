define(['dialogHelper', 'loading', 'connectionManager', 'require', 'globalize', 'scrollHelper', 'layoutManager', 'focusManager', 'browser', 'emby-input', 'emby-checkbox', 'paper-icon-button-light', 'css!./../formdialog', 'material-icons', 'cardStyle'], function (dialogHelper, loading, connectionManager, require, globalize, scrollHelper, layoutManager, focusManager, browser) {
    'use strict';

    var currentItem;
    //var currentItemType;
    var currentServerId;
    var currentResolve;
    var currentReject;
    var hasChanges = false;


    function getApiClient() {
        return connectionManager.getApiClient(currentServerId);
    }

    function setInitialCollapsibleState(page, item, apiClient, context, user) {
        item.MediaSources && item.MediaSources.length && (null == item.EnableMediaSourceDisplay ? "Channel" !== item.SourceType : item.EnableMediaSourceDisplay) ? renderMediaSources(page, user, item) : page.querySelector(".audioVideoMediaInfo").classList.add("hide")

    }

    function renderMediaSources(page, user, item) {
        var html = item.MediaSources.map(function(v) {
            return getMediaSourceHtml(user, item, v)
        }).join('<div style="border-top:1px solid #444;margin: 1em 0;"></div>');
        item.MediaSources.length > 1 && (html = "<br/>" + html), page.querySelector("#mediaInfoContent").innerHTML = html, html ? page.querySelector(".audioVideoMediaInfo").classList.remove("hide") : page.querySelector(".audioVideoMediaInfo").classList.add("hide")
    }

    function getMediaSourceHtml(user, item, version) {
        var html = "";
        version.Name && item.MediaSources.length > 1 && (html += '<div><span class="mediaInfoAttribute">' + version.Name + "</span></div><br/>");
        for (var i = 0, length = version.MediaStreams.length; i < length; i++) {
            var stream = version.MediaStreams[i];
            if ("Data" != stream.Type) {
                html += '<div class="mediaInfoStream">';
                html += '<h3 class="mediaInfoStreamType">';
                switch (stream.Type) {
                    case 'Audio':
                        html += globalize.translate("MediaInfoStreamTypeAudio");
                        break;
                    case 'Subtitle':
                        html += globalize.translate("MediaInfoStreamTypeSubtitle");
                        break;
                    case 'Video':
                        html += globalize.translate("MediaInfoStreamTypeVideo");
                        break;
                    case 'Data':
                        html += globalize.translate("MediaInfoStreamTypeData");
                        break;
                    case 'EmbeddedImage':
                        html += globalize.translate("MediaInfoStreamTypeEmbeddedImage");
                        break;
                }
                html += "</h3>";
                var attributes = [];
                stream.DisplayTitle && attributes.push(createAttribute("Title", stream.DisplayTitle)), stream.Language && "Video" != stream.Type && attributes.push(createAttribute(globalize.translate("MediaInfoLanguage"), stream.Language)), stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoCodec"), stream.Codec.toUpperCase())), stream.CodecTag && attributes.push(createAttribute(globalize.translate("MediaInfoCodecTag"), stream.CodecTag)), null != stream.IsAVC && attributes.push(createAttribute("AVC", stream.IsAVC ? "Yes" : "No")), stream.Profile && attributes.push(createAttribute(globalize.translate("MediaInfoProfile"), stream.Profile)), stream.Level && attributes.push(createAttribute(globalize.translate("MediaInfoLevel"), stream.Level)), (stream.Width || stream.Height) && attributes.push(createAttribute(globalize.translate("MediaInfoResolution"), stream.Width + "x" + stream.Height)), stream.AspectRatio && "mjpeg" != stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoAspectRatio"), stream.AspectRatio)), "Video" == stream.Type && (null != stream.IsAnamorphic && attributes.push(createAttribute(globalize.translate("MediaInfoAnamorphic"), stream.IsAnamorphic ? "Yes" : "No")), attributes.push(createAttribute(globalize.translate("MediaInfoInterlaced"), stream.IsInterlaced ? "Yes" : "No"))), (stream.AverageFrameRate || stream.RealFrameRate) && attributes.push(createAttribute(globalize.translate("MediaInfoFramerate"), stream.AverageFrameRate || stream.RealFrameRate)), stream.ChannelLayout && attributes.push(createAttribute(globalize.translate("MediaInfoLayout"), stream.ChannelLayout)), stream.Channels && attributes.push(createAttribute(globalize.translate("MediaInfoChannels"), stream.Channels + " ch")), stream.BitRate && "mjpeg" != stream.Codec && attributes.push(createAttribute(globalize.translate("MediaInfoBitrate"), parseInt(stream.BitRate / 1e3) + " kbps")), stream.SampleRate && attributes.push(createAttribute(globalize.translate("MediaInfoSampleRate"), stream.SampleRate + " Hz")), stream.VideoRange && "SDR" !== stream.VideoRange && attributes.push(createAttribute(globalize.translate("VideoRange"), stream.VideoRange)), stream.ColorPrimaries && attributes.push(createAttribute(globalize.translate("ColorPrimaries"), stream.ColorPrimaries)), stream.ColorSpace && attributes.push(createAttribute(globalize.translate("ColorSpace"), stream.ColorSpace)), stream.ColorTransfer && attributes.push(createAttribute(globalize.translate("ColorTransfer"), stream.ColorTransfer)), stream.BitDepth && attributes.push(createAttribute(globalize.translate("MediaInfoBitDepth"), stream.BitDepth + " bit")), stream.PixelFormat && attributes.push(createAttribute(globalize.translate("MediaInfoPixelFormat"), stream.PixelFormat)), stream.RefFrames && attributes.push(createAttribute(globalize.translate("MediaInfoRefFrames"), stream.RefFrames)), stream.NalLengthSize && attributes.push(createAttribute("NAL", stream.NalLengthSize)), "Video" != stream.Type && attributes.push(createAttribute(globalize.translate("MediaInfoDefault"), stream.IsDefault ? "Yes" : "No")), "Subtitle" == stream.Type && (attributes.push(createAttribute(globalize.translate("MediaInfoForced"), stream.IsForced ? "Yes" : "No")), attributes.push(createAttribute(globalize.translate("MediaInfoExternal"), stream.IsExternal ? "Yes" : "No"))), "Video" == stream.Type && version.Timestamp && attributes.push(createAttribute(globalize.translate("MediaInfoTimestamp"), version.Timestamp)), html += attributes.join("<br/>"), html += "</div>"
            }
        }
        if (version.Container && (html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoContainer") + '</span><span class="mediaInfoAttribute">' + version.Container + "</span></div>"), version.Formats && version.Formats.length, version.Path && "Http" != version.Protocol && user && user.Policy.IsAdministrator && (html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoPath") + '</span><span class="mediaInfoAttribute">' + version.Path + "</span></div>"), version.Size) {
            var size = (version.Size / 1048576).toFixed(0);
            html += '<div><span class="mediaInfoLabel">' + globalize.translate("MediaInfoSize") + '</span><span class="mediaInfoAttribute">' + size + " MB</span></div>"
        }
        return html

    }



    function createAttribute(label, value) {
        return '<span class="mediaInfoLabel">' + label + '</span><span class="mediaInfoAttribute">' + value + "</span>"
    }

    function showEditor(itemId) {

        loading.show();

        require(['text!./itemMediaInfo.template.html'], function (template) {

            var apiClient = getApiClient();

            apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {

                currentItem = item;
                //currentItemType = currentItem.Type;



                var dialogOptions = {
                    size: 'fullscreen-border',
                    removeOnClose: true,
                    scrollY: false
                };

                if (layoutManager.tv) {
                    dialogOptions.size = 'fullscreen';
                }

                var dlg = dialogHelper.createDialog(dialogOptions);

                dlg.classList.add('formDialog');

                var html = '';
                html += globalize.translateDocument(template, 'core');

                dlg.innerHTML = html;



                // Has to be assigned a z-index after the call to .open()
                dlg.addEventListener('close', onDialogClosed);

                if (layoutManager.tv) {
                    scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
                }

                dialogHelper.open(dlg);

                dlg.querySelector('.btnCancel').addEventListener('click', function (e) {

                    dialogHelper.close(dlg);
                });


                setInitialCollapsibleState(dlg, item);
                loading.hide();
            });
        });


    }

    function splitVersions(instance, page, apiClient, params) {
        require(["confirm"], function(confirm) {
            confirm("Are you sure you wish to split the media sources into separate items?", "Split Media Apart").then(function() {
                loading.show(), apiClient.ajax({
                    type: "DELETE",
                    url: apiClient.getUrl("Videos/" + params.id + "/AlternateSources")
                }).then(function() {
                    loading.hide(), reload(instance, page, params)
                })
            })
        })
    }

    function onDialogClosed() {

        loading.hide();
        if (hasChanges) {
            currentResolve();
        } else {
            currentReject();
        }
    }

    /*function itemDetailPage() {
        var self = this;
        self.renderMediaSources = renderMediaSources
    }*/

    return {
        show: function (itemId, serverId) {

            return new Promise(function (resolve, reject) {

                currentResolve = resolve;
                currentReject = reject;
                currentServerId = serverId;
                hasChanges = false;

                showEditor(itemId);
            });
        },
    };
});
