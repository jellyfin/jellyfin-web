import React, { FC, useCallback, useEffect, useRef } from 'react';
import IconButtonElement from '../../elements/IconButtonElement';
import { ViewSettingsI } from './interface';

interface FilterProps {
    topParentId?: string | null;
    getItemTypes: () => string[];
    getFilterMenuOptions: () => Record<string, never>;
    getVisibleFilters: () => string[];
    viewSettings: ViewSettingsI;
    setViewSettings: React.Dispatch<React.SetStateAction<ViewSettingsI>>;
}

const Filter: FC<FilterProps> = ({
    topParentId,
    getItemTypes,
    getVisibleFilters,
    getFilterMenuOptions,
    viewSettings,
    setViewSettings
}) => {
    const element = useRef<HTMLDivElement>(null);

    const showFilterMenu = useCallback(() => {
        import('../../components/filtermenu/filtermenu').then(({default: FilterMenu}) => {
            const filterMenu = new FilterMenu();
            filterMenu.show({
                settings: viewSettings,
                visibleSettings: getVisibleFilters(),
                parentId: topParentId,
                itemTypes: getItemTypes(),
                serverId: window.ApiClient.serverId(),
                filterMenuOptions: getFilterMenuOptions(),
                setfilters: setViewSettings
            });
        });
    }, [viewSettings, getVisibleFilters, topParentId, getItemTypes, getFilterMenuOptions, setViewSettings]);

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
