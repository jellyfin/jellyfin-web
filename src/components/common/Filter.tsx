import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
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
    const element = useRef<HTMLDivElement>(null);

    const showFilterMenu = useCallback(() => {
        import('../filtermenu/filtermenu').then(({ default: FilterMenu }) => {
            const filterMenu = new FilterMenu();
            filterMenu.show({
                settings: viewQuerySettings,
                visibleSettings: getVisibleFilters(),
                parentId: topParentId,
                itemTypes: getItemTypes(),
                serverId: window.ApiClient.serverId(),
                filterMenuOptions: getFilterMenuOptions(),
                setfilters: setViewQuerySettings
            }).catch(() => {
                // filter menu closed
            });
        }).catch(err => {
            console.error('[Filter] failed to load filter menu', err);
        });
    }, [viewQuerySettings, getVisibleFilters, topParentId, getItemTypes, getFilterMenuOptions, setViewQuerySettings]);

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
