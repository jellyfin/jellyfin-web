import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { FiltersI } from './interface';

interface FilterI {
    topParentId?: string | null;
    getItemTypes: () => string[];
    getFilters: () => FiltersI;
    getSettingsKey: () => string;
    getFilterMenuOptions: () => Record<string, never>;
    getVisibleFilters: () => string[];
    reloadItems: () => void;
}

const Filter: FC<FilterI> = ({
    topParentId,
    getItemTypes,
    getSettingsKey,
    getFilters,
    getVisibleFilters,
    getFilterMenuOptions,
    reloadItems
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showFilterMenu = useCallback(() => {
        import('../../components/filtermenu/filtermenu').then(({default: FilterMenu}) => {
            const filterMenu = new FilterMenu();
            filterMenu.show({
                settingsKey: getSettingsKey(),
                settings: getFilters(),
                visibleSettings: getVisibleFilters(),
                parentId: topParentId,
                itemTypes: getItemTypes(),
                serverId: window.ApiClient.serverId(),
                filterMenuOptions: getFilterMenuOptions()
            }).then(() => {
                reloadItems();
            });
        });
    }, [getSettingsKey, getFilters, getVisibleFilters, topParentId, getItemTypes, getFilterMenuOptions, reloadItems]);

    useEffect(() => {
        const btnFilter = element.current?.querySelector('.btnFilter');

        btnFilter?.addEventListener('click', showFilterMenu);

        return () => {
            btnFilter?.removeEventListener('click', showFilterMenu);
        };
    }, [showFilterMenu]);

    return (
        <div ref={element}>
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnFilter autoSize'
                title='Filter'
                icon='material-icons filter_list'
            />
        </div>
    );
};

export default Filter;
