import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import useMediaQuery from '@mui/material/useMediaQuery';
import { debounce, isEqual } from '../../../utils/lodashUtils';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { EventType } from 'constants/eventType';
import Events from 'utils/events';

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

    const isBigScreen = useMediaQuery((theme: any) => theme.breakpoints.up('sm'));

    const onTabsUpdate = useCallback((
        _e: any,
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

        if (doc !== null) Events.on(doc, EventType.SET_TABS, onTabsUpdate);

        return () => {
            if (doc !== null) Events.off(doc, EventType.SET_TABS, onTabsUpdate);
        };
    }, [ onTabsUpdate ]);

    // HACK: Force resizing to workaround upstream bug with tab resizing
    useEffect(() => {
        handleResize();
    }, [ isDrawerOpen ]);

    if (!tabs?.length) return null;

    return (
        <Tabs
            value={activeIndex}
            onChange={(_, value) => setActiveIndex(value as number)}
            sx={{
                flexGrow: 1,
                bgcolor: 'transparent',
                '--Tabs-gap': '0px',
                '--Tab-indicatorThickness': '2px',
                '--Tab-indicatorRadius': '0px',
                '--TabList-padding': '0px',
                '--Tab-paddingX': '16px',
                '--Tab-minHeight': '48px',
            }}
        >
            <TabList
                variant="plain"
                sx={{
                    justifyContent: isBigScreen ? 'center' : 'flex-start',
                    overflowAuto: 'auto',
                    border: 'none',
                    bgcolor: 'transparent'
                }}
            >
                {tabs.map(({ href, name }, index) => (
                    <Tab
                        key={`tab-${name}`}
                        value={index}
                        component={Link}
                        to={href}
                        variant="plain"
                        sx={{
                            fontWeight: activeIndex === index ? 'bold' : 'normal',
                            color: activeIndex === index ? 'primary.plainColor' : 'neutral.plainColor',
                            '&:hover': {
                                bgcolor: 'transparent',
                                color: 'primary.plainColor',
                            },
                        }}
                    >
                        {name}
                    </Tab>
                ))}
            </TabList>
        </Tabs>
    );
};

export default AppTabs;