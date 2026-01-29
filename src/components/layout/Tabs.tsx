import React, { type FC, useEffect, useState } from 'react';
import { Box, Tab, TabList, Tabs as TabsRoot } from 'ui-primitives';
import { EventType } from '../../constants/eventType';
import Events from '../../utils/events';
import maintabsmanager from '../maintabsmanager';

export interface TabInfo {
    name: string;
    href?: string;
    cssClass?: string;
    enabled?: boolean;
}

export const Tabs: FC = () => {
    const [tabsState, setTabsState] = useState<{
        type: string | null;
        selectedIndex: number;
        tabs: TabInfo[];
    } | null>(null);

    useEffect(() => {
        const handleSetTabs = (
            _e: any,
            type: string | null,
            selectedIndex: number,
            tabs: TabInfo[]
        ) => {
            // Check if we have the required data
            // If type is null, it's a reset
            if (type === null || !tabs) {
                setTabsState(null);
            } else {
                setTabsState({
                    type,
                    selectedIndex: selectedIndex ?? 0,
                    tabs
                });
            }
        };

        Events.on(document, EventType.SET_TABS, handleSetTabs as any);
        return () => Events.off(document, EventType.SET_TABS, handleSetTabs as any);
    }, []);

    if (!tabsState || !tabsState.tabs || tabsState.tabs.length === 0) {
        return null;
    }

    const handleTabChange = (value: string) => {
        const index = parseInt(value, 10);
        maintabsmanager.selectedTabIndex(index);
    };

    return (
        <Box style={{ padding: '0 1rem', overflowX: 'auto' }}>
            <TabsRoot value={String(tabsState.selectedIndex)} onValueChange={handleTabChange}>
                <TabList>
                    {tabsState.tabs.map((tab, index) => {
                        if (tab.enabled === false) return null;

                        const trigger = (
                            <Tab key={index} value={String(index)}>
                                {tab.name}
                            </Tab>
                        );

                        if (tab.href) {
                            return (
                                <a
                                    key={index}
                                    href={tab.href}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {trigger}
                                </a>
                            );
                        }

                        return trigger;
                    })}
                </TabList>
            </TabsRoot>
        </Box>
    );
};
