/**
 * Live TV View
 *
 * Displays live TV with sections for on now, upcoming programs, channels, and recordings.
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
    CalendarIcon,
    DesktopIcon,
    DotFilledIcon,
    MixerHorizontalIcon,
    VideoIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@radix-ui/react-icons';

import { itemsApi } from 'lib/api/items';
import { usePagination } from 'hooks/usePagination';
import { LoadingSpinner } from 'components/LoadingSpinner';
import { ErrorState } from 'components/ErrorState';
import { EmptyState } from 'components/EmptyState';
import { logger } from 'utils/logger';
import { Tabs, TabList, Tab, TabPanel } from 'ui-primitives/Tabs';
import { IconButton } from 'ui-primitives/IconButton';
import { Chip } from 'ui-primitives/Chip';
import { Divider } from 'ui-primitives/Divider';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

type LiveTVTab = 'suggestions' | 'guide' | 'channels' | 'recordings' | 'series';

export const LiveTV: React.FC = () => {
    const [activeTab, setActiveTab] = useState<LiveTVTab>('suggestions');

    const { pageIndex, pageSize, setPageIndex, hasNextPage, hasPreviousPage } = usePagination('livetv');

    const {
        data: onNowData,
        isLoading: loadingOnNow,
        isError: errorOnNow,
        refetch: refetchOnNow
    } = useQuery({
        queryKey: ['livetv', 'on-now'],
        queryFn: async () => {
            logger.debug('Fetching live TV on now', { component: 'LiveTV' });

            return itemsApi.getItems('', {
                startIndex: 0,
                limit: 6,
                includeTypes: ['LiveTVProgram'],
                recursive: true
            });
        },
        staleTime: 2 * 60 * 1000
    });

    const {
        data: upcomingData,
        isLoading: loadingUpcoming,
        isError: errorUpcoming,
        refetch: refetchUpcoming
    } = useQuery({
        queryKey: ['livetv', 'upcoming'],
        queryFn: async () => {
            logger.debug('Fetching upcoming programs', { component: 'LiveTV' });

            return itemsApi.getItems('', {
                startIndex: 0,
                limit: 12,
                includeTypes: ['LiveTVProgram'],
                recursive: true
            });
        },
        staleTime: 5 * 60 * 1000
    });

    const {
        data: channelsData,
        isLoading: loadingChannels,
        isError: errorChannels,
        refetch: refetchChannels
    } = useQuery({
        queryKey: ['livetv', 'channels', pageIndex],
        queryFn: async () => {
            logger.debug('Fetching TV channels', { component: 'LiveTV' });

            return itemsApi.getItems('', {
                startIndex: pageIndex * pageSize,
                limit: pageSize,
                includeTypes: ['LiveTVChannel'],
                recursive: true
            });
        },
        staleTime: 10 * 60 * 1000
    });

    const isLoading = loadingOnNow || loadingUpcoming || loadingChannels;
    const isError = errorOnNow || errorUpcoming || errorChannels;

    const refetch = useCallback(() => {
        refetchOnNow();
        refetchUpcoming();
        refetchChannels();
    }, [refetchOnNow, refetchUpcoming, refetchChannels]);

    const handleNextPage = useCallback(() => {
        if (hasNextPage) {
            setPageIndex(prev => prev + 1);
        }
    }, [hasNextPage, setPageIndex]);

    const handlePreviousPage = useCallback(() => {
        if (hasPreviousPage && pageIndex > 0) {
            setPageIndex(prev => prev - 1);
        }
    }, [hasPreviousPage, pageIndex, setPageIndex]);

    if (isLoading) {
        return <LoadingSpinner message="Loading Live TV..." />;
    }

    if (isError) {
        return <ErrorState message="Failed to load Live TV data" onRetry={refetch} />;
    }

    const onNowPrograms = onNowData?.Items || [];
    const upcomingPrograms = upcomingData?.Items || [];
    const channels = channelsData?.Items || [];
    const channelCount = channelsData?.TotalRecordCount || 0;

    return (
        <Box style={{ padding: vars.spacing.lg }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.xl }}>
                <Heading.H3>Live TV</Heading.H3>
                <Button startDecorator={<MixerHorizontalIcon />} variant="soft">
                    Settings
                </Button>
            </Flex>

            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as LiveTVTab)}>
                <TabList>
                    <Tab value="suggestions">
                        <DesktopIcon style={{ marginRight: vars.spacing.sm }} /> On Now
                    </Tab>
                    <Tab value="guide">
                        <CalendarIcon style={{ marginRight: vars.spacing.sm }} /> Guide
                    </Tab>
                    <Tab value="channels">
                        <MixerHorizontalIcon style={{ marginRight: vars.spacing.sm }} /> Channels
                    </Tab>
                    <Tab value="recordings">
                        <DotFilledIcon style={{ marginRight: vars.spacing.sm }} /> Recordings
                    </Tab>
                    <Tab value="series">
                        <VideoIcon style={{ marginRight: vars.spacing.sm }} /> Series
                    </Tab>
                </TabList>

                <TabPanel value="suggestions">
                    <Box style={{ marginBottom: vars.spacing.xl }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing.md }}>On Now</Heading.H3>
                        {onNowPrograms.length > 0 ? (
                            <Box
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                    gap: vars.spacing.md
                                }}
                            >
                                {onNowPrograms.map(item => (
                                    <Box key={item.Id} style={{ cursor: 'pointer' }}>
                                        <Box
                                            style={{
                                                aspectRatio: '16/9',
                                                borderRadius: vars.borderRadius.md,
                                                overflow: 'hidden',
                                                marginBottom: vars.spacing.xs
                                            }}
                                        >
                                            {(item as any).PrimaryImageTag && (
                                                <img
                                                    src={`/api/Items/${item.Id}/Images/Primary?tag=${(item as any).PrimaryImageTag}&maxWidth=400`}
                                                    alt={item.Name || ''}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                        </Box>
                                        <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                            {item.Name}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <EmptyState
                                title="No Programs On Now"
                                description="Check the TV guide for upcoming programs."
                            />
                        )}
                    </Box>

                    <Divider />

                    <Box style={{ marginBottom: vars.spacing.xl }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Shows</Heading.H3>
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: vars.spacing.md
                            }}
                        >
                            {upcomingPrograms.slice(0, 6).map(item => (
                                <Box key={item.Id} style={{ cursor: 'pointer' }}>
                                    <Box
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: vars.borderRadius.md,
                                            overflow: 'hidden',
                                            marginBottom: vars.spacing.xs
                                        }}
                                    >
                                        {(item as any).PrimaryImageTag && (
                                            <img
                                                src={`/api/Items/${item.Id}/Images/Primary?tag=${(item as any).PrimaryImageTag}&maxWidth=400`}
                                                alt={item.Name || ''}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                    </Box>
                                    <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                        {item.Name}
                                    </Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Divider />

                    <Box>
                        <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Movies</Heading.H3>
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: vars.spacing.md
                            }}
                        >
                            {upcomingPrograms.slice(6, 12).map(item => (
                                <Box key={item.Id} style={{ cursor: 'pointer' }}>
                                    <Box
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: vars.borderRadius.md,
                                            overflow: 'hidden',
                                            marginBottom: vars.spacing.xs
                                        }}
                                    >
                                        {(item as any).PrimaryImageTag && (
                                            <img
                                                src={`/api/Items/${item.Id}/Images/Primary?tag=${(item as any).PrimaryImageTag}&maxWidth=400`}
                                                alt={item.Name || ''}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                    </Box>
                                    <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                        {item.Name}
                                    </Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </TabPanel>

                <TabPanel value="guide">
                    <Box style={{ textAlign: 'center', padding: '48px' }}>
                        <Heading.H4 style={{ marginBottom: vars.spacing.md }}>TV Guide</Heading.H4>
                        <Text color="secondary">
                            The TV guide is available in the Jellyfin mobile app or desktop client.
                        </Text>
                    </Box>
                </TabPanel>

                <TabPanel value="channels">
                    <Flex
                        style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing.md }}
                    >
                        <Text size="sm" color="secondary">
                            {channelCount} channel{channelCount !== 1 ? 's' : ''}
                        </Text>
                        {(hasPreviousPage || hasNextPage) && (
                            <Flex style={{ gap: vars.spacing.sm, alignItems: 'center' }}>
                                <IconButton
                                    size="sm"
                                    onClick={handlePreviousPage}
                                    disabled={!hasPreviousPage || pageIndex === 0}
                                >
                                    <ChevronLeftIcon />
                                </IconButton>
                                <Chip size="sm">{pageIndex + 1}</Chip>
                                <IconButton size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Flex>
                        )}
                    </Flex>

                    {channels.length > 0 ? (
                        <Box
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: vars.spacing.md
                            }}
                        >
                            {channels.map(item => (
                                <Box key={item.Id} style={{ cursor: 'pointer' }}>
                                    <Box
                                        style={{
                                            aspectRatio: '16/9',
                                            borderRadius: vars.borderRadius.md,
                                            overflow: 'hidden',
                                            marginBottom: vars.spacing.xs
                                        }}
                                    >
                                        {(item as any).PrimaryImageTag && (
                                            <img
                                                src={`/api/Items/${item.Id}/Images/Primary?tag=${(item as any).PrimaryImageTag}&maxWidth=400`}
                                                alt={item.Name || ''}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                    </Box>
                                    <Text size="sm" style={{ fontWeight: 'bold' }} noWrap>
                                        {item.Name}
                                    </Text>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <EmptyState
                            title="No Channels"
                            description="Configure Live TV in your Jellyfin server settings to add channels."
                        />
                    )}
                </TabPanel>

                <TabPanel value="recordings">
                    <Box style={{ marginBottom: vars.spacing.xl }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Latest Recordings</Heading.H3>
                        <EmptyState
                            title="No Recordings"
                            description="Recordings from your Live TV tuner will appear here."
                        />
                    </Box>

                    <Divider />

                    <Box>
                        <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Scheduled Recordings</Heading.H3>
                        <EmptyState
                            title="No Scheduled Recordings"
                            description="Schedule recordings from the TV guide."
                        />
                    </Box>
                </TabPanel>

                <TabPanel value="series">
                    <Heading.H3 style={{ marginBottom: vars.spacing.md }}>Recorded Series</Heading.H3>
                    <EmptyState title="No Recorded Series" description="Record entire series to see them here." />
                </TabPanel>
            </Tabs>
        </Box>
    );
};

export default LiveTV;
