import globalize from 'lib/globalize';

export function showFilterMenu(instance) {
    const self = instance;

    import('../filtermenu/filtermenu').then(({ default: FilterMenu }) => {
        new FilterMenu().show({
            settingsKey: instance.getSettingsKey(),
            settings: instance.getFilters(),
            visibleSettings: instance.getVisibleFilters(),
            onChange: instance.itemsContainer.refreshItems.bind(instance.itemsContainer),
            parentId: instance.params.parentId,
            itemTypes: instance.getItemTypes(),
            serverId: instance.params.serverId,
            filterMenuOptions: instance.getFilterMenuOptions()
        }).then(() => {
            instance.itemsContainer.refreshItems();
        });
    });
}
