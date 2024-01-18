import { Theme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { debounce } from 'lodash-es';
import React, { FC, useCallback, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import TabRoutes from './tabRoutes';
import useCurrentTab from 'hooks/useCurrentTab';

interface AppTabsParams {
    isDrawerOpen: boolean
}

const handleResize = debounce(() => window.dispatchEvent(new Event('resize')), 100);

const AppTabs: FC<AppTabsParams> = ({
    isDrawerOpen
}) => {
    const isBigScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));
    const { searchParams, setSearchParams, activeTab } = useCurrentTab();

    // HACK: Force resizing to workaround upstream bug with tab resizing
    // https://github.com/mui/material-ui/issues/24011
    useEffect(() => {
        handleResize();
    }, [ isDrawerOpen ]);

    const onTabClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();

        const tabIndex = event.currentTarget.dataset.tabIndex;

        if (tabIndex) {
            searchParams.set('tab', tabIndex);
            setSearchParams(searchParams);
        }
    }, [ searchParams, setSearchParams ]);

    return (
        <Routes>
            {
                TabRoutes.map(route => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <Tabs
                                value={activeTab}
                                sx={{
                                    width: '100%',
                                    flexShrink: {
                                        xs: 0,
                                        lg: 'unset'
                                    },
                                    order: {
                                        xs: 100,
                                        lg: 'unset'
                                    }
                                }}
                                variant={isBigScreen ? 'standard' : 'scrollable'}
                                centered={isBigScreen}
                            >
                                {
                                    route.tabs.map(({ index, label }) => (
                                        <Tab
                                            key={`${route.path}-tab-${index}`}
                                            label={label}
                                            data-tab-index={`${index}`}
                                            onClick={onTabClick}
                                        />
                                    ))
                                }
                            </Tabs>
                        }
                    />
                ))
            }
        </Routes>
    );
};

export default AppTabs;
