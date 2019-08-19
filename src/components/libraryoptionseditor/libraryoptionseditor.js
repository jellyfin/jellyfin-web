define(["globalize", "dom", "emby-checkbox", "emby-select", "emby-input"], function(globalize, dom) {
    "use strict";

    function populateLanguages(parent) {
        return ApiClient.getCultures().then(function(languages) {
            populateLanguagesIntoSelect(parent.querySelector("#selectLanguage"), languages);
            populateLanguagesIntoList(parent.querySelector(".subtitleDownloadLanguages"), languages);
        });
    }

    function populateLanguagesIntoSelect(select, languages) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0; i < languages.length; i++) {
            var culture = languages[i];
            html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + "</option>";
        }
        select.innerHTML = html;
    }

    function populateLanguagesIntoList(element, languages) {
        var html = "";
        for (var i = 0; i < languages.length; i++) {
            var culture = languages[i];
            html += '<label><input type="checkbox" is="emby-checkbox" class="chkSubtitleLanguage" data-lang="' + culture.ThreeLetterISOLanguageName.toLowerCase() + '" /><span>' + culture.DisplayName + "</span></label>";
        }
        element.innerHTML = html;
    }

    function populateCountries(select) {
        return ApiClient.getCountries().then(function(allCountries) {
            var html = "";
            html += "<option value=''></option>";
            for (var i = 0; i < allCountries.length; i++) {
                var culture = allCountries[i];
                html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + "</option>";
            }
            select.innerHTML = html;
        })
    }

    function populateRefreshInterval(select) {
        var html = "";
        html += "<option value='0'>" + globalize.translate("Never") + "</option>";
        html += [30, 60, 90].map(function(val) {
            return "<option value='" + val + "'>" + globalize.translate("EveryNDays", val) + "</option>";
        }).join("");
        select.innerHTML = html;
    }

    function renderMetadataReaders(page, plugins) {
        var html = "";
        var elem = page.querySelector(".metadataReaders");

        if (plugins.length < 1) return elem.innerHTML = "", elem.classList.add("hide"), !1;
        html += '<h3 class="checkboxListLabel">' + globalize.translate("LabelMetadataReaders") + "</h3>";
        html += '<div class="checkboxList paperList checkboxList-paperList">';
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            html += '<div class="listItem localReaderOption sortableOption" data-pluginname="' + plugin.Name + '">';
            html += '<i class="listItemIcon md-icon">live_tv</i>';
            html += '<div class="listItemBody">';
            html += '<h3 class="listItemBodyText">';
            html += plugin.Name;
            html += "</h3>";
            html += "</div>";
            if (i > 0) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonUp") + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_up</i></button>';
            } else if (plugins.length > 1) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonDown") + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_down</i></button>';
            }
            html += "</div>";
        }
        html += "</div>";
        html += '<div class="fieldDescription">' + globalize.translate("LabelMetadataReadersHelp") + "</div>";
        if (plugins.length < 2) {
            elem.classList.add("hide");
        } else {
            elem.classList.remove("hide");
        }
        elem.innerHTML = html;
        return true;
    }

    function renderMetadataSavers(page, metadataSavers) {
        var html = "";
        var elem = page.querySelector(".metadataSavers");
        if (!metadataSavers.length) return elem.innerHTML = "", elem.classList.add("hide"), false;
        html += '<h3 class="checkboxListLabel">' + globalize.translate("LabelMetadataSavers") + "</h3>";
        html += '<div class="checkboxList paperList checkboxList-paperList">';
        for (var i = 0; i < metadataSavers.length; i++) {
            var plugin = metadataSavers[i];
            html += '<label><input type="checkbox" data-defaultenabled="' + plugin.DefaultEnabled + '" is="emby-checkbox" class="chkMetadataSaver" data-pluginname="' + plugin.Name + '" ' + false + "><span>" + plugin.Name + "</span></label>";
        }
        html += "</div>";
        html += '<div class="fieldDescription" style="margin-top:.25em;">' + globalize.translate("LabelMetadataSaversHelp") + "</div>";
        elem.innerHTML = html;
        elem.classList.remove("hide");
        return true;
    }

    function getMetadataFetchersForTypeHtml(availableTypeOptions, libraryOptionsForType) {
        var html = "";
        var plugins = availableTypeOptions.MetadataFetchers;

        plugins = getOrderedPlugins(plugins, libraryOptionsForType.MetadataFetcherOrder || []);
        if (!plugins.length) return html;

        html += '<div class="metadataFetcher" data-type="' + availableTypeOptions.Type + '">';
        html += '<h3 class="checkboxListLabel">' + globalize.translate("LabelTypeMetadataDownloaders", availableTypeOptions.Type) + "</h3>";
        html += '<div class="checkboxList paperList checkboxList-paperList">';
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            html += '<div class="listItem metadataFetcherItem sortableOption" data-pluginname="' + plugin.Name + '">';
            var isChecked = libraryOptionsForType.MetadataFetchers ? -1 !== libraryOptionsForType.MetadataFetchers.indexOf(plugin.Name) : plugin.DefaultEnabled;
            var checkedHtml = isChecked ? ' checked="checked"' : "";
            html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkMetadataFetcher" data-pluginname="' + plugin.Name + '" ' + checkedHtml + "><span></span></label>";
            html += '<div class="listItemBody">';
            html += '<h3 class="listItemBodyText">';
            html += plugin.Name;
            html += "</h3>";
            html += "</div>";
            i > 0 ? html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonUp") + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_up</i></button>' : plugins.length > 1 && (html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonDown") + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_down</i></button>'), html += "</div>"
        }
        html += "</div>";
        html += '<div class="fieldDescription">' + globalize.translate("LabelMetadataDownloadersHelp") + "</div>";
        html += "</div>";
        return html;
    }

    function getTypeOptions(allOptions, type) {
        var allTypeOptions = allOptions.TypeOptions || [];
        for (var i = 0; i < allTypeOptions.length; i++) {
            var typeOptions = allTypeOptions[i];
            if (typeOptions.Type === type) return typeOptions;
        }
        return null;
    }

    function renderMetadataFetchers(page, availableOptions, libraryOptions) {
        var html = "";
        var elem = page.querySelector(".metadataFetchers");
        for (var i = 0; i < availableOptions.TypeOptions.length; i++) {
            var availableTypeOptions = availableOptions.TypeOptions[i];
            html += getMetadataFetchersForTypeHtml(availableTypeOptions, getTypeOptions(libraryOptions, availableTypeOptions.Type) || {});
        }
        elem.innerHTML = html;
        if (html) {
            elem.classList.remove("hide");
            page.querySelector(".fldAutoRefreshInterval").classList.remove("hide");
            page.querySelector(".fldMetadataLanguage").classList.remove("hide");
            page.querySelector(".fldMetadataCountry").classList.remove("hide");
        } else {
            elem.classList.add("hide");
            page.querySelector(".fldAutoRefreshInterval").classList.add("hide");
            page.querySelector(".fldMetadataLanguage").classList.add("hide");
            page.querySelector(".fldMetadataCountry").classList.add("hide");
        }
        return true;
    }

    function renderSubtitleFetchers(page, availableOptions, libraryOptions) {
        var html = "";
        var elem = page.querySelector(".subtitleFetchers");

        var plugins = availableOptions.SubtitleFetchers;
        plugins = getOrderedPlugins(plugins, libraryOptions.SubtitleFetcherOrder || []);
        if (!plugins.length) return html;

        html += '<h3 class="checkboxListLabel">' + globalize.translate("LabelSubtitleDownloaders") + "</h3>";
        html += '<div class="checkboxList paperList checkboxList-paperList">';
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            html += '<div class="listItem subtitleFetcherItem sortableOption" data-pluginname="' + plugin.Name + '">';
            var isChecked = libraryOptions.DisabledSubtitleFetchers ? -1 === libraryOptions.DisabledSubtitleFetchers.indexOf(plugin.Name) : plugin.DefaultEnabled;
            var checkedHtml = isChecked ? ' checked="checked"' : "";
            html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkSubtitleFetcher" data-pluginname="' + plugin.Name + '" ' + checkedHtml + "><span></span></label>";
            html += '<div class="listItemBody">';
            html += '<h3 class="listItemBodyText">';
            html += plugin.Name;
            html += "</h3>";
            html += "</div>";
            if (i > 0) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonUp") + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_up</i></button>';
            } else if (plugins.length > 1) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonDown") + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_down</i></button>';
            }
            html += "</div>";
        }
        html += "</div>";
        html += '<div class="fieldDescription">' + globalize.translate("SubtitleDownloadersHelp") + "</div>";
        elem.innerHTML = html;
    }

    function getImageFetchersForTypeHtml(availableTypeOptions, libraryOptionsForType) {
        var html = "";
        var plugins = availableTypeOptions.ImageFetchers;

        plugins = getOrderedPlugins(plugins, libraryOptionsForType.ImageFetcherOrder || []);
        if (!plugins.length) return html;

        html += '<div class="imageFetcher" data-type="' + availableTypeOptions.Type + '">';
        html += '<div class="flex align-items-center" style="margin:1.5em 0 .5em;">';
        html += '<h3 class="checkboxListLabel" style="margin:0;">' + globalize.translate("HeaderTypeImageFetchers", availableTypeOptions.Type) + "</h3>";
        var supportedImageTypes = availableTypeOptions.SupportedImageTypes || [];
        if (supportedImageTypes.length > 1 || 1 === supportedImageTypes.length && "Primary" !== supportedImageTypes[0]) {
            html += '<button is="emby-button" class="raised btnImageOptionsForType" type="button" style="margin-left:1.5em;font-size:90%;"><span>' + globalize.translate("HeaderFetcherSettings") + "</span></button>";
        }
        html += "</div>";
        html += '<div class="checkboxList paperList checkboxList-paperList">';
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            html += '<div class="listItem imageFetcherItem sortableOption" data-pluginname="' + plugin.Name + '">';
            var isChecked = libraryOptionsForType.ImageFetchers ? -1 !== libraryOptionsForType.ImageFetchers.indexOf(plugin.Name) : plugin.DefaultEnabled;
            var checkedHtml = isChecked ? ' checked="checked"' : "";
            html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkImageFetcher" data-pluginname="' + plugin.Name + '" ' + checkedHtml + "><span></span></label>";
            html += '<div class="listItemBody">';
            html += '<h3 class="listItemBodyText">';
            html += plugin.Name;
            html += "</h3>";
            html += "</div>";
            if (i > 0) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonUp") + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_up</i></button>';
            } else if (plugins.length > 1) {
                html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonDown") + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + i + '"><i class="md-icon">keyboard_arrow_down</i></button>';
            }
            html += "</div>";
        }
        html += "</div>";
        html += '<div class="fieldDescription">' + globalize.translate("LabelImageFetchersHelp") + "</div>";
        html += "</div>";
        return html;
    }

    function renderImageFetchers(page, availableOptions, libraryOptions) {
        var html = "";
        var elem = page.querySelector(".imageFetchers");
        for (var i = 0; i < availableOptions.TypeOptions.length; i++) {
            var availableTypeOptions = availableOptions.TypeOptions[i];
            html += getImageFetchersForTypeHtml(availableTypeOptions, getTypeOptions(libraryOptions, availableTypeOptions.Type) || {});
        }
        elem.innerHTML = html;
        if (html) {
            elem.classList.remove("hide");
            page.querySelector(".chkDownloadImagesInAdvanceContainer").classList.remove("hide");
            page.querySelector(".chkSaveLocalContainer").classList.remove("hide");
        } else {
            elem.classList.add("hide");
            page.querySelector(".chkDownloadImagesInAdvanceContainer").classList.add("hide");
            page.querySelector(".chkSaveLocalContainer").classList.add("hide");
        }
        return true;
    }

    function populateMetadataSettings(parent, contentType, isNewLibrary) {
        var isNewLibrary = parent.classList.contains("newlibrary");
        return ApiClient.getJSON(ApiClient.getUrl("Libraries/AvailableOptions", {
            LibraryContentType: contentType,
            IsNewLibrary: isNewLibrary
        })).then(function(availableOptions) {
            currentAvailableOptions = availableOptions;
            parent.availableOptions = availableOptions;
            renderMetadataSavers(parent, availableOptions.MetadataSavers);
            renderMetadataReaders(parent, availableOptions.MetadataReaders);
            renderMetadataFetchers(parent, availableOptions, {});
            renderSubtitleFetchers(parent, availableOptions, {});
            renderImageFetchers(parent, availableOptions, {});
            availableOptions.SubtitleFetchers.length ? parent.querySelector(".subtitleDownloadSettings").classList.remove("hide") : parent.querySelector(".subtitleDownloadSettings").classList.add("hide")
        }).catch(function() {
            return Promise.resolve();
        })
    }

    function adjustSortableListElement(elem) {
        var btnSortable = elem.querySelector(".btnSortable");
        if (elem.previousSibling) {
            btnSortable.classList.add("btnSortableMoveUp");
            btnSortable.classList.remove("btnSortableMoveDown");
            btnSortable.querySelector("i").innerHTML = "keyboard_arrow_up";
        } else {
            btnSortable.classList.remove("btnSortableMoveUp");
            btnSortable.classList.add("btnSortableMoveDown");
            btnSortable.querySelector("i").innerHTML = "keyboard_arrow_down";
        }
    }

    function showImageOptionsForType(type) {
        require(["imageoptionseditor"], function(ImageOptionsEditor) {
            var typeOptions = getTypeOptions(currentLibraryOptions, type);
            typeOptions || (typeOptions = {
                Type: type
            }, currentLibraryOptions.TypeOptions.push(typeOptions));
            var availableOptions = getTypeOptions(currentAvailableOptions || {}, type);
            (new ImageOptionsEditor).show(type, typeOptions, availableOptions)
        })
    }

    function onImageFetchersContainerClick(e) {
        var btnImageOptionsForType = dom.parentWithClass(e.target, "btnImageOptionsForType");
        if (btnImageOptionsForType) {
            return void showImageOptionsForType(dom.parentWithClass(btnImageOptionsForType, "imageFetcher").getAttribute("data-type"));
        }
        onSortableContainerClick.call(this, e);
    }

    function onSortableContainerClick(e) {
        var btnSortable = dom.parentWithClass(e.target, "btnSortable");
        if (btnSortable) {
            var li = dom.parentWithClass(btnSortable, "sortableOption");
            var list = dom.parentWithClass(li, "paperList");
            if (btnSortable.classList.contains("btnSortableMoveDown")) {
                var next = li.nextSibling;
                next && (li.parentNode.removeChild(li), next.parentNode.insertBefore(li, next.nextSibling))
            } else {
                var prev = li.previousSibling;
                prev && (li.parentNode.removeChild(li), prev.parentNode.insertBefore(li, prev))
            }
            Array.prototype.forEach.call(list.querySelectorAll(".sortableOption"), adjustSortableListElement)
        }
    }

    function bindEvents(parent) {
        parent.querySelector(".metadataReaders").addEventListener("click", onSortableContainerClick);
        parent.querySelector(".subtitleFetchers").addEventListener("click", onSortableContainerClick);
        parent.querySelector(".metadataFetchers").addEventListener("click", onSortableContainerClick);
        parent.querySelector(".imageFetchers").addEventListener("click", onImageFetchersContainerClick);
    }

    function embed(parent, contentType, libraryOptions) {
        currentLibraryOptions = {
            TypeOptions: []
        };
        currentAvailableOptions = null;
        var isNewLibrary = null === libraryOptions;
        isNewLibrary && parent.classList.add("newlibrary");
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", "components/libraryoptionseditor/libraryoptionseditor.template.html", true);
            xhr.onload = function(e) {
                var template = this.response;
                parent.innerHTML = globalize.translateDocument(template);
                populateRefreshInterval(parent.querySelector("#selectAutoRefreshInterval"));
                var promises = [populateLanguages(parent), populateCountries(parent.querySelector("#selectCountry"))];
                Promise.all(promises).then(function() {
                    return setContentType(parent, contentType).then(function() {
                        libraryOptions && setLibraryOptions(parent, libraryOptions);
                        bindEvents(parent);
                        resolve();
                    });
                });
            };
            xhr.send();
        });
    }

    function setAdvancedVisible(parent, visible) {
        var elems = parent.querySelectorAll(".advanced");
        for (var i = 0; i < elems.length; i++) {
            visible ? elems[i].classList.remove("advancedHide") : elems[i].classList.add("advancedHide");
        }
    }

    function setContentType(parent, contentType) {
        if (contentType === "homevideos" || contentType === "photos") {
            parent.querySelector(".chkEnablePhotosContainer").classList.remove("hide");
        } else {
            parent.querySelector(".chkEnablePhotosContainer").classList.add("hide");
        }

        if (contentType !== "tvshows" && contentType !== "movies" && contentType !== "homevideos" && contentType !== "musicvideos" && contentType !== "mixed") {
            parent.querySelector(".chapterSettingsSection").classList.add("hide");
        } else {
            parent.querySelector(".chapterSettingsSection").classList.remove("hide");
        }

        if (contentType === "tvshows") {
            parent.querySelector(".chkImportMissingEpisodesContainer").classList.remove("hide");
            parent.querySelector(".chkAutomaticallyGroupSeriesContainer").classList.remove("hide");
            parent.querySelector(".fldSeasonZeroDisplayName").classList.remove("hide");
            parent.querySelector("#txtSeasonZeroName").setAttribute("required", "required");
        } else {
            parent.querySelector(".chkImportMissingEpisodesContainer").classList.add("hide");
            parent.querySelector(".chkAutomaticallyGroupSeriesContainer").classList.add("hide");
            parent.querySelector(".fldSeasonZeroDisplayName").classList.add("hide");
            parent.querySelector("#txtSeasonZeroName").removeAttribute("required");
        }

        if (contentType === "books" || contentType === "boxsets" || contentType === "playlists" || contentType === "music") {
            parent.querySelector(".chkEnableEmbeddedTitlesContainer").classList.add("hide");
        } else {
            parent.querySelector(".chkEnableEmbeddedTitlesContainer").classList.remove("hide");
        }

        return populateMetadataSettings(parent, contentType);
    }

    function setSubtitleFetchersIntoOptions(parent, options) {
        options.DisabledSubtitleFetchers = Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll(".chkSubtitleFetcher"), function(elem) {
            return !elem.checked
        }), function(elem) {
            return elem.getAttribute("data-pluginname")
        });

        options.SubtitleFetcherOrder = Array.prototype.map.call(parent.querySelectorAll(".subtitleFetcherItem"), function(elem) {
            return elem.getAttribute("data-pluginname")
        });
    }

    function setMetadataFetchersIntoOptions(parent, options) {
        var sections = parent.querySelectorAll(".metadataFetcher");
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var type = section.getAttribute("data-type");
            var typeOptions = getTypeOptions(options, type);
            if (!typeOptions) {
                typeOptions = {
                    Type: type
                };
                options.TypeOptions.push(typeOptions);
            }
            typeOptions.MetadataFetchers = Array.prototype.map.call(Array.prototype.filter.call(section.querySelectorAll(".chkMetadataFetcher"), function(elem) {
                return elem.checked;
            }), function(elem) {
                return elem.getAttribute("data-pluginname");
            });

            typeOptions.MetadataFetcherOrder = Array.prototype.map.call(section.querySelectorAll(".metadataFetcherItem"), function(elem) {
                return elem.getAttribute("data-pluginname");
            });
        }
    }

    function setImageFetchersIntoOptions(parent, options) {
        var sections = parent.querySelectorAll(".imageFetcher");
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var type = section.getAttribute("data-type");
            var typeOptions = getTypeOptions(options, type);
            if (!typeOptions) {
                typeOptions = {
                    Type: type
                };
                options.TypeOptions.push(typeOptions);
            }

            typeOptions.ImageFetchers = Array.prototype.map.call(Array.prototype.filter.call(section.querySelectorAll(".chkImageFetcher"), function(elem) {
                return elem.checked
            }), function(elem) {
                return elem.getAttribute("data-pluginname")
            });

            typeOptions.ImageFetcherOrder = Array.prototype.map.call(section.querySelectorAll(".imageFetcherItem"), function(elem) {
                return elem.getAttribute("data-pluginname")
            });
        }
    }

    function setImageOptionsIntoOptions(parent, options) {
        var originalTypeOptions = (currentLibraryOptions || {}).TypeOptions || [];
        for (var i = 0; i < originalTypeOptions.length; i++) {
            var originalTypeOption = originalTypeOptions[i];
            var typeOptions = getTypeOptions(options, originalTypeOption.Type);

            if (!typeOptions) {
                typeOptions = {
                    Type: type
                };
                options.TypeOptions.push(typeOptions);
            }
            originalTypeOption.ImageOptions && (typeOptions.ImageOptions = originalTypeOption.ImageOptions);
        }
    }

    function getLibraryOptions(parent) {
        var options = {
            EnableArchiveMediaFiles: false,
            EnablePhotos: parent.querySelector(".chkEnablePhotos").checked,
            EnableRealtimeMonitor: parent.querySelector(".chkEnableRealtimeMonitor").checked,
            ExtractChapterImagesDuringLibraryScan: parent.querySelector(".chkExtractChaptersDuringLibraryScan").checked,
            EnableChapterImageExtraction: parent.querySelector(".chkExtractChapterImages").checked,
            DownloadImagesInAdvance: parent.querySelector("#chkDownloadImagesInAdvance").checked,
            EnableInternetProviders: true,
            ImportMissingEpisodes: parent.querySelector("#chkImportMissingEpisodes").checked,
            SaveLocalMetadata: parent.querySelector("#chkSaveLocal").checked,
            EnableAutomaticSeriesGrouping: parent.querySelector(".chkAutomaticallyGroupSeries").checked,
            PreferredMetadataLanguage: parent.querySelector("#selectLanguage").value,
            MetadataCountryCode: parent.querySelector("#selectCountry").value,
            SeasonZeroDisplayName: parent.querySelector("#txtSeasonZeroName").value,
            AutomaticRefreshIntervalDays: parseInt(parent.querySelector("#selectAutoRefreshInterval").value),
            EnableEmbeddedTitles: parent.querySelector("#chkEnableEmbeddedTitles").checked,
            SkipSubtitlesIfEmbeddedSubtitlesPresent: parent.querySelector("#chkSkipIfGraphicalSubsPresent").checked,
            SkipSubtitlesIfAudioTrackMatches: parent.querySelector("#chkSkipIfAudioTrackPresent").checked,
            SaveSubtitlesWithMedia: parent.querySelector("#chkSaveSubtitlesLocally").checked,
            RequirePerfectSubtitleMatch: parent.querySelector("#chkRequirePerfectMatch").checked,
            MetadataSavers: Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll(".chkMetadataSaver"), function(elem) {
                return elem.checked
            }), function(elem) {
                return elem.getAttribute("data-pluginname")
            }),
            TypeOptions: []
        };

        options.LocalMetadataReaderOrder = Array.prototype.map.call(parent.querySelectorAll(".localReaderOption"), function(elem) {
            return elem.getAttribute("data-pluginname")
        });
        options.SubtitleDownloadLanguages = Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll(".chkSubtitleLanguage"), function(elem) {
            return elem.checked
        }), function(elem) {
            return elem.getAttribute("data-lang")
        });
        setSubtitleFetchersIntoOptions(parent, options);
        setMetadataFetchersIntoOptions(parent, options);
        setImageFetchersIntoOptions(parent, options);
        setImageOptionsIntoOptions(parent, options);

        return options;
    }

    function getOrderedPlugins(plugins, configuredOrder) {
        plugins = plugins.slice(0);
        plugins.sort(function(a, b) {
            return a = configuredOrder.indexOf(a.Name), b = configuredOrder.indexOf(b.Name), a < b ? -1 : a > b ? 1 : 0
        });
        return plugins;
    }

    function setLibraryOptions(parent, options) {
        currentLibraryOptions = options;
        currentAvailableOptions = parent.availableOptions;
        parent.querySelector("#selectLanguage").value = options.PreferredMetadataLanguage || "";
        parent.querySelector("#selectCountry").value = options.MetadataCountryCode || "";
        parent.querySelector("#selectAutoRefreshInterval").value = options.AutomaticRefreshIntervalDays || "0";
        parent.querySelector("#txtSeasonZeroName").value = options.SeasonZeroDisplayName || "Specials";
        parent.querySelector(".chkEnablePhotos").checked = options.EnablePhotos;
        parent.querySelector(".chkEnableRealtimeMonitor").checked = options.EnableRealtimeMonitor;
        parent.querySelector(".chkExtractChaptersDuringLibraryScan").checked = options.ExtractChapterImagesDuringLibraryScan;
        parent.querySelector(".chkExtractChapterImages").checked = options.EnableChapterImageExtraction;
        parent.querySelector("#chkDownloadImagesInAdvance").checked = options.DownloadImagesInAdvance;
        parent.querySelector("#chkSaveLocal").checked = options.SaveLocalMetadata;
        parent.querySelector("#chkImportMissingEpisodes").checked = options.ImportMissingEpisodes;
        parent.querySelector(".chkAutomaticallyGroupSeries").checked = options.EnableAutomaticSeriesGrouping;
        parent.querySelector("#chkEnableEmbeddedTitles").checked = options.EnableEmbeddedTitles;
        parent.querySelector("#chkSkipIfGraphicalSubsPresent").checked = options.SkipSubtitlesIfEmbeddedSubtitlesPresent;
        parent.querySelector("#chkSaveSubtitlesLocally").checked = options.SaveSubtitlesWithMedia;
        parent.querySelector("#chkSkipIfAudioTrackPresent").checked = options.SkipSubtitlesIfAudioTrackMatches;
        parent.querySelector("#chkRequirePerfectMatch").checked = options.RequirePerfectSubtitleMatch;
        Array.prototype.forEach.call(parent.querySelectorAll(".chkMetadataSaver"), function(elem) {
            elem.checked = options.MetadataSavers ? -1 !== options.MetadataSavers.indexOf(elem.getAttribute("data-pluginname")) : "true" === elem.getAttribute("data-defaultenabled")
        });
        Array.prototype.forEach.call(parent.querySelectorAll(".chkSubtitleLanguage"), function(elem) {
            elem.checked = !!options.SubtitleDownloadLanguages && -1 !== options.SubtitleDownloadLanguages.indexOf(elem.getAttribute("data-lang"))
        });
        renderMetadataReaders(parent, getOrderedPlugins(parent.availableOptions.MetadataReaders, options.LocalMetadataReaderOrder || []));
        renderMetadataFetchers(parent, parent.availableOptions, options);
        renderImageFetchers(parent, parent.availableOptions, options);
        renderSubtitleFetchers(parent, parent.availableOptions, options);
    }

    var currentLibraryOptions;
    var currentAvailableOptions;

    return {
        embed: embed,
        setContentType: setContentType,
        getLibraryOptions: getLibraryOptions,
        setLibraryOptions: setLibraryOptions,
        setAdvancedVisible: setAdvancedVisible
    }
});
