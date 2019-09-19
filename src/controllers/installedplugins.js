define(["loading", "libraryMenu", "dom", "globalize", "cardStyle", "emby-button"], function(loading, libraryMenu, dom, globalize) {
    "use strict";

    function deletePlugin(page, uniqueid, name) {
        var msg = globalize.translate("UninstallPluginConfirmation").replace("{0}", name);
        require(["confirm"], function(confirm) {
            confirm({
                title: globalize.translate("UninstallPluginHeader"),
                text: msg,
                primary: "delete",
                confirmText: globalize.translate("UninstallPluginHeader")
            }).then(function() {
                loading.show();
                ApiClient.uninstallPlugin(uniqueid).then(function() {
                    reloadList(page);
                });
            })
        })
    }

    function showNoConfigurationMessage() {
        Dashboard.alert({
            message: globalize.translate("NoPluginConfigurationMessage")
        });
    }

    function showConnectMessage() {
        Dashboard.alert({
            message: globalize.translate("MessagePluginConfigurationRequiresLocalAccess")
        });
    }

    function getPluginCardHtml(plugin, pluginConfigurationPages) {
        var configPage = pluginConfigurationPages.filter(function(pluginConfigurationPage) {
                return pluginConfigurationPage.PluginId == plugin.Id;
        })[0];
        var configPageUrl = configPage ? Dashboard.getConfigurationPageUrl(configPage.Name) : null;

        var html = "";
        html += "<div data-id='" + plugin.Id + "' data-name='" + plugin.Name + "' class='card backdropCard'>";
        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable">';
        html += '<div class="cardPadder cardPadder-backdrop"></div>';
        html += configPageUrl ? '<a class="cardContent cardImageContainer" is="emby-linkbutton" href="' + configPageUrl + '">' : '<div class="cardContent noConfigPluginCard noHoverEffect cardImageContainer">';
        if (plugin.ImageUrl) {
            html += '<div class="cardImage coveredImage" style="background-image:url(\'' + plugin.ImageUrl + "');\">";
            html += "</div>";
        } else {
            html += '<i class="cardImageIcon md-icon">&#xE2C7;</i>';
        }
        html += configPageUrl ? "</a>" : "</div>";
        html += "</div>";
        html += '<div class="cardFooter">';
        html += '<div style="text-align:right; float:right;padding-top:5px;">';
        html += '<button type="button" is="paper-icon-button-light" class="btnCardMenu autoSize"><i class="md-icon">more_horiz</i></button>';
        html += "</div>";
        html += "<div class='cardText'>";
        html += configPage ? configPage.DisplayName || plugin.Name : plugin.Name;
        html += "</div>";
        html += "<div class='cardText cardText-secondary'>";
        html += plugin.Version;
        html += "</div>";
        html += "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    }

    function renderPlugins(page, plugins) {
        ApiClient.getJSON(ApiClient.getUrl("web/configurationpages") + "?pageType=PluginConfiguration").then(function(configPages) {
            populateList(page, plugins, configPages);
        });
    }

    function populateList(page, plugins, pluginConfigurationPages) {
        plugins = plugins.sort(function(plugin1, plugin2) {
            return plugin1.Name > plugin2.Name ? 1 : -1
        });
        var html = plugins.map(function(p) {
                return getPluginCardHtml(p, pluginConfigurationPages)
        }).join("");
        var installedPluginsElement = page.querySelector(".installedPlugins");
        installedPluginsElement.removeEventListener("click", onInstalledPluginsClick);
        installedPluginsElement.addEventListener("click", onInstalledPluginsClick);
        if (plugins.length) {
            installedPluginsElement.classList.add("itemsContainer");
            installedPluginsElement.classList.add("vertical-wrap");
        } else {
            html += '<div style="padding:5px;">';
            html += "<p>" + globalize.translate("MessageNoPluginsInstalled") + "</p>";
            html += '<p><a is="emby-linkbutton" class="button-link" href="availableplugins.html">';
            html += globalize.translate("BrowsePluginCatalogMessage");
            html += "</a></p>";
            html += "</div>";
        }
        installedPluginsElement.innerHTML = html;
        loading.hide();
    }

    function showPluginMenu(page, elem) {
        var card = dom.parentWithClass(elem, "card");
        var id = card.getAttribute("data-id");
        var name = card.getAttribute("data-name");
        var configHref = card.querySelector(".cardContent").getAttribute("href");
        var menuItems = [];
        if (configHref) {
            menuItems.push({
                name: globalize.translate("ButtonSettings"),
                id: "open",
                ironIcon: "mode-edit"
            });
        }
        menuItems.push({
            name: globalize.translate("ButtonUninstall"),
            id: "delete",
            ironIcon: "delete"
        });
        require(["actionsheet"], function(actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: elem,
                callback: function(resultId) {
                    switch (resultId) {
                        case "open":
                            Dashboard.navigate(configHref);
                            break;
                        case "delete":
                            deletePlugin(page, id, name)
                    }
                }
            });
        });
    }

    function reloadList(page) {
        loading.show();
        ApiClient.getInstalledPlugins().then(function(plugins) {
            renderPlugins(page, plugins);
        });
    }

    function getTabs() {
        return [{
            href: "installedplugins.html",
            name: globalize.translate("TabMyPlugins")
        }, {
            href: "availableplugins.html",
            name: globalize.translate("TabCatalog")
        }]
    }

    function onInstalledPluginsClick(e) {
        if (dom.parentWithClass(e.target, "noConfigPluginCard")) {
            showNoConfigurationMessage();
        } else if (dom.parentWithClass(e.target, "connectModePluginCard")) {
            showConnectMessage();
        } else {
            var btnCardMenu = dom.parentWithClass(e.target, "btnCardMenu");
            btnCardMenu && showPluginMenu(dom.parentWithClass(btnCardMenu, "page"), btnCardMenu);
        }
    }

    pageIdOn("pageshow", "pluginsPage", function() {
        libraryMenu.setTabs("plugins", 0, getTabs);
        reloadList(this);
    });

    window.PluginsPage = {
        renderPlugins: renderPlugins
    }
});
