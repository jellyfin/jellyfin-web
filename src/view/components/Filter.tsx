import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { FiltersI, QueryI } from './interface';

interface FilterProps {
    topParentId?: string | null;
    getItemTypes: () => string[];
    getFilters: () => FiltersI;
    getSettingsKey: () => string;
    getFilterMenuOptions: () => Record<string, never>;
    getVisibleFilters: () => string[];
    setQuery: React.Dispatch<React.SetStateAction<QueryI>>;
    reloadItems: () => void;
}

const Filter: FC<FilterProps> = ({
    topParentId,
    getItemTypes,
    getSettingsKey,
    getFilters,
    getVisibleFilters,
    getFilterMenuOptions,
    setQuery,
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
                setQuery({StartIndex: 0});
                reloadItems();
            });
        });
    }, [getSettingsKey, getFilters, getVisibleFilters, topParentId, getItemTypes, getFilterMenuOptions, setQuery, reloadItems]);

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
