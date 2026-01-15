
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Button from '@mui/material/Button/Button';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import React, { FC, useCallback, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { LibraryRoutes } from '@/apps/experimental/features/libraries/constants/libraryRoutes';
import useCurrentTab from '@/hooks/useCurrentTab';
import globalize from '@/lib/globalize';

const LIBRARY_VIEW_MENU_ID = 'library-view-menu';

const LibraryViewMenu: FC = () => {
    const location = useLocation();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { activeTab } = useCurrentTab();

    const [ menuAnchorEl, setMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);

    const onMenuButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setMenuAnchorEl(null);
    }, []);

    const currentRoute = LibraryRoutes.find(({ path }) => path === location.pathname);
    const currentTab = currentRoute?.views.find(({ index }) => index === activeTab);

    if (!currentTab) return null;

    return (
        <>
            <Button
                variant='text'
                size='large'
                color='inherit'
                endIcon={<ArrowDropDown />}
                aria-controls={LIBRARY_VIEW_MENU_ID}
                aria-haspopup='true'
                onClick={onMenuButtonClick}
            >
                {globalize.translate(currentTab.label)}
            </Button>

            <Menu
                anchorEl={menuAnchorEl}
                id={LIBRARY_VIEW_MENU_ID}
                keepMounted
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                {currentRoute?.views.map(tab => (
                    <MenuItem
                        key={tab.view}
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick={() => {
                            searchParams.set('tab', `${tab.index}`);
                            setSearchParams(searchParams);
                            onMenuClose();
                        }}
                        selected={tab.index === currentTab.index}
                    >
                        {globalize.translate(tab.label)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LibraryViewMenu;
