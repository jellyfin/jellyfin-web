import globalize from 'lib/globalize';

export function showViewSettingsMenu(instance) {
    const self = instance;

    import('../viewSettings/viewSettings').then(({ default: ViewSettings }) => {
        new ViewSettings().show({
            settingsKey: instance.getSettingsKey(),
            settings: instance.getViewSettings(),
            visibleSettings: instance.getVisibleViewSettings()
        }).then(() => {
            instance.updateItemsContainerForViewType(instance);
            instance.itemsContainer.refreshItems();
        });
    });
}
