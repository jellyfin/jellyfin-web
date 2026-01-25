/**
 * Episodes View
 *
 * React-based episodes browsing view with TanStack Query and ui-primitives.
 */

import React from 'react';
import { PlayIcon } from '@radix-ui/react-icons';

import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';

import { getItems } from 'lib/api/items';
import { queryKeys } from 'lib/queryKeys';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const Episodes: React.FC = () => {
    const { seriesId, seasonId } = useParams({ strict: false }) as { seriesId?: string; seasonId?: string };

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.episodes(seriesId, seasonId),
        queryFn: () =>
            getItems(seriesId || '', {
                includeTypes: ['Episode'],
                recursive: true,
                parentId: seasonId,
                sortBy: 'SortName',
                sortOrder: 'Ascending',
                // fields: 'PrimaryImageAspectRatio,SeriesStudio,UserData', // Not supported in current interface
                imageTypeLimit: 1,
                enableImageTypes: ['Primary', 'Backdrop', 'Banner', 'Thumb']
            }),
        enabled: !!seriesId
    });

    const handlePlayAll = () => {
        if (data?.Items) {
            data.Items.forEach(item => {
                const playbackManager = (window as any).playbackManager;
                if (playbackManager) {
                    playbackManager.playItem(item);
                }
            });
        }
    };

    if (error) {
        return (
            <Box style={{ padding: vars.spacing.lg, textAlign: 'center' }}>
                <Heading.H4 color="error">Error loading episodes</Heading.H4>
            </Box>
        );
    }

    return (
        <Box className="view-content">
            <Box style={{ padding: vars.spacing.md, borderBottom: `1px solid ${vars.colors.divider}` }}>
                <Flex
                    style={{
                        flexDirection: 'row',
                        gap: vars.spacing.md,
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Heading.H4>Episodes</Heading.H4>
                    <Button variant="primary" onClick={handlePlayAll} disabled={!data?.Items?.length}>
                        <PlayIcon style={{ marginRight: vars.spacing.xs }} /> Play All
                    </Button>
                </Flex>
            </Box>

            <Box style={{ padding: vars.spacing.md }}>
                <Box
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: vars.spacing.md
                    }}
                >
                    {data?.Items?.map(item => (
                        <Box
                            key={item.Id}
                            style={{
                                display: 'flex',
                                gap: vars.spacing.md,
                                padding: vars.spacing.sm,
                                border: `1px solid ${vars.colors.divider}`,
                                borderRadius: vars.borderRadius.md
                            }}
                        >
                            <Box
                                style={{
                                    width: 160,
                                    aspectRatio: '16/9',
                                    borderRadius: vars.borderRadius.sm,
                                    overflow: 'hidden'
                                }}
                            >
                                {item.ImageTags?.Primary && (
                                    <img
                                        src={`/api/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&maxWidth=400`}
                                        alt={item.Name || ''}
                                        loading="lazy"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}
                            </Box>
                            <Box style={{ flex: 1 }}>
                                <Heading.H5>{item.Name}</Heading.H5>
                                <Text size="sm" color="secondary">
                                    {item.SeriesName}
                                </Text>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default Episodes;
