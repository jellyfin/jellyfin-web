define("viewManager", ["components/viewManager/viewManager"], function (viewManager) {
    window.ViewManager = viewManager;
    viewManager.dispatchPageEvents(true);
    return viewManager;
});