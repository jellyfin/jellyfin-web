import React from 'react';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import type { TabsProps } from '@mui/joy/Tabs';

export interface EmbyTabItem {
    id: string;
    name: string;
    icon?: string;
}

export interface EmbyTabsProps extends Omit<TabsProps, 'onChange'> {
    items: EmbyTabItem[];
    selectedIndex?: number;
    onTabChange?: (index: number) => void;
}

const EmbyTabs: React.FC<EmbyTabsProps> = ({
    items,
    selectedIndex = 0,
    onTabChange,
    ...props
}) => {
    return (
        <Tabs
            value={selectedIndex}
            onChange={(_, value) => onTabChange?.(value as number)}
            {...props}
        >
            <TabList
                variant="plain"
                sx={{
                    bgcolor: 'background.body',
                    p: 0.5,
                    gap: 1,
                    borderRadius: 'md',
                    '& .MuiTab-root': {
                        borderRadius: 'sm',
                        flex: 1,
                        '&[aria-selected="true"]': {
                            bgcolor: 'background.surface',
                            boxShadow: 'sm',
                        },
                    },
                }}
            >
                {items.map((item, index) => (
                    <Tab key={item.id} value={index}>
                        {item.name}
                    </Tab>
                ))}
            </TabList>
        </Tabs>
    );
};

export default EmbyTabs;
