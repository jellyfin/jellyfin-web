define(["loading", "libraryMenu", "globalize", "cardStyle", "emby-button", "emby-checkbox", "emby-select"], function (loading, libraryMenu, globalize) {
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
            }
            return false;
        });

        availablePlugins = allPlugins.sort(function (a, b) {
            if (a.category > b.category) {
                return 1;
            } else if (b.category > a.category) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            } else if (b.name > a.name) {
                return -1;
            }
            return 0;
        });

        var length;
        var plugin;
        var currentCategory;
        var html = "";

        var hasOpenTag = false;
        currentCategory = null;
        if (options.showCategory === false) {
            html += '<div class="itemsContainer vertical-wrap">';
            hasOpenTag = true;
        }
        for (var i = 0; i < availablePlugins.length; i++) {
            plugin = availablePlugins[i];
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
