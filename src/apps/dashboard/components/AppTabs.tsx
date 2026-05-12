import { Theme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import debounce from 'lodash-es/debounce';
import isEqual from 'lodash-es/isEqual';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { EventType } from 'constants/eventType';
import Events, { type Event } from 'utils/events';

interface AppTabsParams {
    isDrawerOpen: boolean
}

interface TabDefinition {
    href: string
    name: string
}

const handleResize = debounce(() => window.dispatchEvent(new Event('resize')), 100);

const AppTabs: FC<AppTabsParams> = ({
    isDrawerOpen
}) => {
    const documentRef = useRef<Document>(document);
    const [ activeIndex, setActiveIndex ] = useState(0);
    const [ tabs, setTabs ] = useState<TabDefinition[]>();

    const isBigScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'));

    const onTabsUpdate = useCallback((
        _e: Event,
        _newView?: string,
        newIndex: number | undefined = 0,
        newTabs?: TabDefinition[]
    ) => {
        setActiveIndex(newIndex);

        if (!isEqual(tabs, newTabs)) {
            setTabs(newTabs);
        }
    }, [ tabs ]);

    useEffect(() => {
        const doc = documentRef.current;

        if (doc) Events.on(doc, EventType.SET_TABS, onTabsUpdate);

        return () => {
            if (doc) Events.off(doc, EventType.SET_TABS, onTabsUpdate);
        };
    }, [ onTabsUpdate ]);

    // HACK: Force resizing to workaround upstream bug with tab resizing
    // https://github.com/mui/material-ui/issues/24011
    useEffect(() => {
        handleResize();
    }, [ isDrawerOpen ]);

    if (!tabs?.length) return null;

    return (
        <Tabs
            value={activeIndex}
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
                tabs.map(({ href, name }, index) => (
                    <Tab
                        key={`tab-${name}`}
                        label={name}
                        data-tab-index={`${index}`}
                        component={Link}
                        to={href}
                    />
                ))
            }
        </Tabs>
    );
};

export default AppTabs;
