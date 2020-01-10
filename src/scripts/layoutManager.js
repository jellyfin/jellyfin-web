define("layoutManager", ["components/layoutManager", "apphost"], function getLayoutManager(layoutManager, appHost) {
    if (appHost.getDefaultLayout) {
        layoutManager.defaultLayout = appHost.getDefaultLayout();
    }

    layoutManager.init();
    return layoutManager;
});