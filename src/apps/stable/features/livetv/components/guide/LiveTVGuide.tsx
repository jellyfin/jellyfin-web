import React, { useEffect, useState, useRef, useCallback } from 'react';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import ChannelHeader from './ChannelHeader';
import ProgramCell from './ProgramCell';
import TimeslotHeader from './TimeslotHeader';
import { styled } from '@mui/joy/styles';

const GuideContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)',
    border: '1px solid',
    borderColor: theme.vars.palette.divider,
    borderRadius: theme.vars.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.vars.palette.background.surface,
}));

const HeaderRow = styled(Box)({
    display: 'flex',
    width: '100%',
});

const GridBody = styled(Box)({
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
});

const ChannelColumn = styled(Box)({
    width: 120,
    flexShrink: 0,
    overflowY: 'auto',
    '&::-webkit-scrollbar': { display: 'none' },
});

const ProgramGrid = styled(Box)({
    flex: 1,
    overflow: 'auto',
    position: 'relative',
});

const ChannelRow = styled(Box)({
    display: 'flex',
    height: 80,
    width: '100%',
    position: 'relative',
});

const LiveTVGuide: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [channels, setChannels] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [currentDate] = useState(new Date());
    const apiClient = ServerConnections.currentApiClient();
    
    const channelScrollRef = useRef<HTMLDivElement>(null);
    const gridScrollRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    const loadGuide = useCallback(async () => {
        setIsLoading(true);
        const startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const channelsResult: any = await apiClient.getLiveTvChannels({ 
            UserId: apiClient.getCurrentUserId(),
            Limit: 50
        });

        const programsResult: any = await apiClient.getLiveTvPrograms({
            UserId: apiClient.getCurrentUserId(),
            channelIds: channelsResult.Items.map((c: any) => c.Id).join(','),
            MinEndDate: startDate.toISOString(),
            MaxStartDate: endDate.toISOString()
        });

        setChannels(channelsResult.Items);
        setPrograms(programsResult.Items);
        setIsLoading(false);
    }, [apiClient, currentDate]);

    useEffect(() => {
        loadGuide();
    }, [loadGuide]);

    const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = target.scrollLeft;
        if (channelScrollRef.current) channelScrollRef.current.scrollTop = target.scrollTop;
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress thickness={4} size="lg" />
            </Box>
        );
    }

    const msPerDay = 86400000;
    const dayStartMs = new Date(currentDate).setHours(0, 0, 0, 0);

    return (
        <GuideContainer>
            <HeaderRow>
                <Box sx={{ width: 120, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.level1' }} />
                <Box ref={headerScrollRef} sx={{ flex: 1, overflow: 'hidden' }}>
                    <TimeslotHeader startDate={currentDate} />
                </Box>
            </HeaderRow>
            
            <GridBody>
                <ChannelColumn ref={channelScrollRef}>
                    {channels.map(channel => (
                        <ChannelHeader key={channel.Id} channel={channel} />
                    ))}
                </ChannelColumn>
                
                <ProgramGrid ref={gridScrollRef} onScroll={handleGridScroll}>
                    <Box sx={{ width: '100%', height: channels.length * 80, position: 'relative' }}>
                        {channels.map((channel, rowIndex) => (
                            <ChannelRow key={channel.Id} sx={{ top: rowIndex * 80 }}>
                                {programs
                                    .filter(p => p.ChannelId === channel.Id)
                                    .map(program => {
                                        const startMs = new Date(program.StartDate).getTime();
                                        const endMs = new Date(program.EndDate).getTime();
                                        const startPct = Math.max(0, (startMs - dayStartMs) / msPerDay) * 100;
                                        const endPct = Math.min(1, (endMs - dayStartMs) / msPerDay) * 100;
                                        const widthPct = endPct - startPct;

                                        return (
                                            <ProgramCell
                                                key={program.Id}
                                                program={program}
                                                startPercent={startPct}
                                                widthPercent={widthPct}
                                            />
                                        );
                                    })}
                            </ChannelRow>
                        ))}
                    </Box>
                </ProgramGrid>
            </GridBody>
        </GuideContainer>
    );
};

export default LiveTVGuide;
