import React, { FC } from 'react';
import IconButton from '../../elements/emby-button/IconButton';
import { ViewQuerySettings } from '../../types/interface';

interface FilterProps {
    topParentId?: string | null;
    getItemTypes: () => string[];
    getFilterMenuOptions: () => Record<string, never>;
    getVisibleFilters: () => string[];
    viewQuerySettings: ViewQuerySettings;
    setViewQuerySettings: React.Dispatch<React.SetStateAction<ViewQuerySettings>>;
}

const Filter: FC<FilterProps> = ({
    topParentId,
    getItemTypes,
    getVisibleFilters,
    getFilterMenuOptions,
    viewQuerySettings,
    setViewQuerySettings
}) => {
    const showFilterMenu = () => {
        import('../filtermenu/filtermenu').then(({default: FilterMenu}) => {
            const filterMenu = new FilterMenu();
            filterMenu.show({
                settings: viewQuerySettings,
                visibleSettings: getVisibleFilters(),
                parentId: topParentId,
                itemTypes: getItemTypes(),
                serverId: window.ApiClient.serverId(),
                filterMenuOptions: getFilterMenuOptions(),
                setfilters: setViewQuerySettings
            });
        });
    };

    return (
        <IconButton
            type='button'
            className='btnFilter autoSize'
            title='Filter'
            icon='filter_list'
            onClick={showFilterMenu}
        />
    );
};

export default Filter;
