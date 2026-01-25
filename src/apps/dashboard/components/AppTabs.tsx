import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';

import { EventType } from 'constants/eventType';
import { Tabs, TabList, Tab } from 'ui-primitives/Tabs';
import { vars } from 'styles/tokens.css';
import Events from 'utils/events';
import { debounce, isEqual } from '../../../utils/lodashUtils';

interface AppTabsParams {
    isDrawerOpen: boolean;
}

interface TabDefinition {
    href: string;
    name: string;
}

const handleResize = debounce(() => window.dispatchEvent(new Event('resize')), 100);

const AppTabs: FC<AppTabsParams> = ({ isDrawerOpen }) => {
    const documentRef = useRef<Document>(document);
    const [activeIndex, setActiveIndex] = useState('0');
    const [tabs, setTabs] = useState<TabDefinition[]>();

    const onTabsUpdate = useCallback(
        (_e: unknown, _newView?: string, newIndex = 0, newTabs?: TabDefinition[]) => {
            setActiveIndex(String(newIndex));

            if (!isEqual(tabs, newTabs)) {
                setTabs(newTabs);
            }
        },
        [tabs]
    );

    useEffect(() => {
        const doc = documentRef.current;

        if (doc != null) Events.on(doc, EventType.SET_TABS, onTabsUpdate as Parameters<typeof Events.on>[2]);

        return () => {
            if (doc != null) Events.off(doc, EventType.SET_TABS, onTabsUpdate as Parameters<typeof Events.off>[2]);
        };
    }, [onTabsUpdate]);

    const handleTabChange = (value: string): void => setActiveIndex(value);

    useEffect(() => {
        handleResize();
    }, [isDrawerOpen]);

    if (!tabs || tabs.length === 0) return null;

    return (
        <Tabs
            value={activeIndex}
            onValueChange={handleTabChange}
            style={{
                flexGrow: 1,
                backgroundColor: 'transparent'
            }}
        >
            <TabList
                style={{
                    justifyContent: 'center',
                    overflow: 'auto',
                    borderBottom: 'none',
                    backgroundColor: 'transparent'
                }}
            >
                {tabs.map(({ href, name }, index) => {
                    const value = String(index);
                    const isActive = activeIndex === value;

                    return (
                        <Tab
                            key={`tab-${name}`}
                            value={value}
                            asChild
                            style={{
                                fontWeight: isActive ? 'bold' : 'normal',
                                color: isActive ? vars.colors.primary : vars.colors.textSecondary,
                                backgroundColor: 'transparent'
                            }}
                        >
                            <Link to={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {name}
                            </Link>
                        </Tab>
                    );
                })}
            </TabList>
        </Tabs>
    );
};

export default AppTabs;
