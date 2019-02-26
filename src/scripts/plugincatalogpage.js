define(["loading", "libraryMenu", "globalize", "cardStyle", "emby-linkbutton", "emby-checkbox", "emby-select"], function (loading, libraryMenu, globalize) {
    "use strict";

    function reloadList(page) {
        loading.show();
        var promise1 = ApiClient.getAvailablePlugins(query);
        var promise2 = ApiClient.getInstalledPlugins();
        Promise.all([promise1, promise2]).then(function (responses) {
            populateList({
                catalogElement: page.querySelector("#pluginTiles"),
                noItemsElement: page.querySelector("#noPlugins"),
                availablePlugins: responses[0],
                installedPlugins: responses[1]
            });
        });
    }

    function getHeaderText(category) {
        category = category.replace(" ", "");
        if ("Channel" === category) {
            category = "Channels";
        } else if ("Theme" === category) {
            category = "Themes";
        } else if ("LiveTV" === category) {
            category = "HeaderLiveTV";
        } else if ("ScreenSaver" === category) {
            category = "HeaderScreenSavers";
        }

        return globalize.translate(category);
    }

    function populateList(options) {
        var availablePlugins = options.availablePlugins;
        var installedPlugins = options.installedPlugins;
        var allPlugins = availablePlugins.filter(function (plugin) {
            plugin.category = plugin.category || "General";
            plugin.categoryDisplayName = getHeaderText(plugin.category);

            if (!options.categories || -1 != options.categories.indexOf(plugin.category)) {
                if (!options.targetSystem || plugin.targetSystem == options.targetSystem) {
                    return "UserInstalled" == plugin.type;
                }

                return false;
            }

            return false;
        });
        availablePlugins = allPlugins.sort(function (a__e, b__r) {
            var aName = a__e.category;
            var bName = b__r.category;

            if (aName > bName) {
                return 1;
            }

            if (bName > aName) {
                return -1;
            }

            aName = a__e.name;
            bName = b__r.name;

            if (aName > bName) {
                return 1;
            }

            if (bName > aName) {
                return -1;
            }

            return 0;
        });
        var i__q;
        var length;
        var plugin;
        var currentCategory;
        var html = "";

        if (!options.categories) {
            currentCategory = globalize.translate("HeaderTopPlugins");
            html += '<div class="verticalSection">';
            html += '<h2 class="sectionTitle sectionTitle-cards">' + currentCategory + "</h2>";
            var topPlugins = allPlugins.slice(0).sort(function (a__t, b__y) {
                if (a__t.installs > b__y.installs) {
                    return -1;
                }

                if (b__y.installs > a__t.installs) {
                    return 1;
                }

                var aName = a__t.name;
                var bName = b__y.name;

                if (aName > bName) {
                    return 1;
                }

                if (bName > aName) {
                    return -1;
                }

                return 0;
            });
            html += '<div class="itemsContainer vertical-wrap">';
            var limit = screen.availWidth >= 1920 ? 15 : 12;

            for (i__q = 0, length = Math.min(topPlugins.length, limit); i__q < length; i__q++) {
                html += getPluginHtml(topPlugins[i__q], options, installedPlugins);
            }

            html += "</div>";
            html += "</div>";
        }

        var hasOpenTag = false;

        for (currentCategory = null, false === options.showCategory && (html += '<div class="itemsContainer vertical-wrap">', hasOpenTag = true), i__q = 0, length = availablePlugins.length; i__q < length; i__q++) {
            plugin = availablePlugins[i__q];
            var category = plugin.categoryDisplayName;

            if (category != currentCategory) {
                if (false !== options.showCategory) {
                    if (currentCategory) {
                        hasOpenTag = false;
                        html += "</div>";
                        html += "</div>";
                    }

                    html += '<div class="verticalSection">';
                    html += '<h2 class="sectionTitle sectionTitle-cards">' + category + "</h2>";
                    html += '<div class="itemsContainer vertical-wrap">';
                    hasOpenTag = true;
                }

                currentCategory = category;
            }

            html += getPluginHtml(plugin, options, installedPlugins);
        }

        if (hasOpenTag) {
            html += "</div>";
            html += "</div>";
        }

        if (!availablePlugins.length && options.noItemsElement) {
            options.noItemsElement.classList.add("hide");
        }

        options.catalogElement.innerHTML = html;
        loading.hide();
    }

    function getPluginHtml(plugin, options, installedPlugins) {
        var html = "";
        var href = plugin.externalUrl ? plugin.externalUrl : "addplugin.html?name=" + encodeURIComponent(plugin.name) + "&guid=" + plugin.guid;

        if (options.context) {
            href += "&context=" + options.context;
        }

        var target = plugin.externalUrl ? ' target="_blank"' : "";
        html += "<div class='card backdropCard'>";
        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';
        html += '<div class="cardPadder cardPadder-backdrop"></div>';
        html += '<a class="cardContent cardImageContainer" is="emby-linkbutton" href="' + href + '"' + target + ">";

        if (plugin.thumbImage) {
            html += '<div class="cardImage coveredImage" style="background-image:url(\'' + plugin.thumbImage + "');\">";
            html += "</div>";
        } else {
            html += '<i class="cardImageIcon md-icon">&#xE2C7;</i>';
        }

        html += "</a>";
        html += "</div>";
        html += '<div class="cardFooter">';
        html += "<div class='cardText'>";
        html += plugin.name;
        html += "</div>";
        var installedPlugin = plugin.isApp ? null : installedPlugins.filter(function (ip) {
            return ip.Id == plugin.guid;
        })[0];
        html += "<div class='cardText cardText-secondary'>";
        html += installedPlugin ? globalize.translate("LabelVersionInstalled").replace("{0}", installedPlugin.Version) : "&nbsp;";
        html += "</div>";
        html += "</div>";
        html += "</div>";
        return html += "</div>";
    }

    function getTabs() {
        return [{
            href: "plugins.html",
            name: globalize.translate("TabMyPlugins")
        }, {
            href: "plugincatalog.html",
            name: globalize.translate("TabCatalog")
        }];
    }

    var query = {
        TargetSystems: "Server",
        IsAppStoreSafe: true,
        IsAdult: false
    };

    window.PluginCatalog = {
        renderCatalog: populateList
    };

    return function (view, params) {
        view.querySelector("#selectSystem").addEventListener("change", function () {
            query.TargetSystems = this.value;
            reloadList(view);
        });
        view.addEventListener("viewshow", function () {
            libraryMenu.setTabs("plugins", 1, getTabs);
            reloadList(this);
        });
    };
});
