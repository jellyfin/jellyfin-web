import React, { useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { EmbyTabs } from '../../../../elements';
import globalize from '../../../../lib/globalize';

import LiveTVGuidePage from './LiveTVGuidePage';
import LiveTVChannelsPage from './LiveTVChannelsPage';
import LiveTVRecordingsPage from './LiveTVRecordingsPage';
import LiveTVSchedulePage from './LiveTVSchedulePage';
import LiveTVSeriesTimersPage from './LiveTVSeriesTimersPage';

/**
 * Modern React-based Live TV Hub
 * Replaces the legacy livetv controller and its tab management
 */
const LiveTVPage = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const tabs = [
        { id: 'programs', name: globalize.translate('Programs') },
        { id: 'guide', name: globalize.translate('Guide') },
        { id: 'channels', name: globalize.translate('Channels') },
        { id: 'recordings', name: globalize.translate('Recordings') },
        { id: 'schedule', name: globalize.translate('Schedule') },
        { id: 'series', name: globalize.translate('Series') }
    ];

    const renderTabContent = () => {
        switch (tabIndex) {
            case 0:
                // Placeholder for suggested programs - would ideally be its own component
                return <Box sx={{ p: 3 }}><Typography level="h2">Suggested Programs</Typography></Box>;
            case 1:
                return <LiveTVGuidePage />;
            case 2:
                return <LiveTVChannelsPage />;
            case 3:
                return <LiveTVRecordingsPage />;
            case 4:
                return <LiveTVSchedulePage />;
            case 5:
                return <LiveTVSeriesTimersPage />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.surface', px: 2, pt: 2 }}>
                <Typography level="h2" sx={{ mb: 2, px: 1 }}>{globalize.translate('LiveTV')}</Typography>
                <EmbyTabs
                    items={tabs}
                    selectedIndex={tabIndex}
                    onTabChange={setTabIndex}
                    sx={{ '--Tabs-gap': '0px', bgcolor: 'transparent' }}
                />
            </Box>
            <Box sx={{ overflow: 'auto' }}>
                {renderTabContent()}
            </Box>
        </Box>
    );
};

export default LiveTVPage;
