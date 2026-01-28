import { ChevronDownIcon } from '@radix-ui/react-icons';
import React, { type FC, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useSearchParams } from 'hooks/useSearchParams';
import { Button } from 'ui-primitives';
import { Menu, MenuItem } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

import { LibraryRoutes } from 'apps/experimental/features/libraries/constants/libraryRoutes';
import useCurrentTab from 'hooks/useCurrentTab';
import globalize from 'lib/globalize';

const LIBRARY_VIEW_MENU_ID = 'library-view-menu';

const LibraryViewMenu: FC = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { activeTab } = useCurrentTab();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const currentRoute = LibraryRoutes.find(({ path }) => path === location.pathname);
    const currentTab = currentRoute?.views.find(({ index }) => index === activeTab);

    if (!currentTab) return null;

    return (
        <Menu
            id={LIBRARY_VIEW_MENU_ID}
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            align="end"
            trigger={
                <Button
                    variant="plain"
                    size="lg"
                    endIcon={<ChevronDownIcon />}
                    aria-controls={LIBRARY_VIEW_MENU_ID}
                    aria-haspopup="true"
                >
                    {globalize.translate(currentTab.label)}
                </Button>
            }
        >
            {currentRoute?.views.map(tab => (
                <MenuItem
                    key={tab.view}
                    // eslint-disable-next-line react/jsx-no-bind
                    onClick={() => {
                        searchParams.set('tab', `${tab.index}`);
                        setSearchParams(searchParams);
                        setIsMenuOpen(false);
                    }}
                >
                    <Text
                        size="md"
                        weight={tab.index === currentTab.index ? 'medium' : 'normal'}
                        style={{
                            color: tab.index === currentTab.index ? vars.colors.primary : undefined
                        }}
                    >
                        {globalize.translate(tab.label)}
                    </Text>
                </MenuItem>
            ))}
        </Menu>
    );
};

export default LibraryViewMenu;
