import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LoadingView } from 'components/feedback/LoadingView';
import { PageContainer } from 'components/layout/PageContainer';
import { useApi } from 'hooks/useApi';
import { useUserViews } from 'hooks/useUserViews';
import { getItems } from 'lib/api/items';
import globalize from 'lib/globalize';
import { ConnectionState } from 'lib/jellyfin-apiclient/connectionState';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useConnectionStore } from 'store/connectionStore';
import { vars } from 'styles/tokens.css.ts';
import { Box, Flex, Heading, IconButton, Text } from 'ui-primitives';

interface FlatTreeItem {
    id: string;
    name: string;
    level: number;
    isFolder: boolean;
    parentId: string | null;
}

export const MetadataManager: React.FC = () => {
    const { user } = useApi();
    const { data: views, isLoading: viewsLoading } = useUserViews(user?.Id);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const parentRef = useRef<HTMLDivElement>(null);

    const { currentState, currentUserId } = useConnectionStore();

    // In a real implementation, we would need a way to fetch all expanded levels.
    // For this prototype, we'll simplify and only show the root views.
    // To properly virtualize a tree, we'd flatten the expanded parts.

    const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const flatData = useMemo(() => {
        return (
            views?.Items?.map((item) => ({
                id: item.Id ?? '',
                name: item.Name ?? '',
                level: 0,
                isFolder: item.IsFolder ?? false,
                parentId: null
            })) || []
        );
    }, [views]);

    const rowVirtualizer = useVirtualizer({
        count: flatData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 10
    });

    if (viewsLoading) {
        return <LoadingView />;
    }

    return (
        <PageContainer padding={false}>
            <Flex style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                {/* Sidebar */}
                <Box
                    style={{
                        width: 350,
                        borderRight: `1px solid ${vars.colors.divider}`,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: vars.colors.surface
                    }}
                >
                    <Box
                        style={{
                            padding: vars.spacing['4'],
                            borderBottom: `1px solid ${vars.colors.divider}`
                        }}
                    >
                        <Heading.H4>{globalize.translate('MetadataManager')}</Heading.H4>
                    </Box>
                    <Box
                        ref={parentRef}
                        style={{ flexGrow: 1, overflowY: 'auto', padding: vars.spacing['2'] }}
                    >
                        <Box
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative'
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const item = flatData[virtualRow.index];
                                const isSelected = selectedItemId === item.id;
                                const isExpanded = expandedIds.has(item.id);

                                return (
                                    <Box
                                        key={virtualRow.key}
                                        onClick={() => setSelectedItemId(item.id)}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                            padding: `${vars.spacing['1']} ${vars.spacing['3']}`,
                                            paddingLeft: vars.spacing['3'] + item.level * 16,
                                            cursor: 'pointer',
                                            borderRadius: vars.borderRadius.sm,
                                            backgroundColor: isSelected
                                                ? vars.colors.surfaceHover
                                                : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: vars.spacing['2']
                                        }}
                                    >
                                        {item.isFolder ? (
                                            <IconButton
                                                size="sm"
                                                variant="plain"
                                                onClick={(e) => toggleExpand(item.id, e)}
                                                style={{ padding: 0, width: 20, height: 20 }}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDownIcon />
                                                ) : (
                                                    <ChevronRightIcon />
                                                )}
                                            </IconButton>
                                        ) : (
                                            <Box style={{ width: 20 }} />
                                        )}
                                        <Text
                                            size="sm"
                                            weight={isSelected ? 'bold' : 'normal'}
                                            noWrap
                                        >
                                            {item.name}
                                        </Text>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box
                    style={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        padding: vars.spacing['6'],
                        backgroundColor: vars.colors.background
                    }}
                >
                    {selectedItemId ? (
                        <Box>
                            <Heading.H2>Editing Item: {selectedItemId}</Heading.H2>
                            <Text color="secondary" style={{ marginTop: vars.spacing['4'] }}>
                                Metadata editor content will go here.
                            </Text>
                        </Box>
                    ) : (
                        <Flex align="center" justify="center" style={{ height: '100%' }}>
                            <Box style={{ textAlign: 'center' }}>
                                <Heading.H3 color="secondary">
                                    {globalize.translate('MetadataManager')}
                                </Heading.H3>
                                <Text color="secondary" style={{ marginTop: vars.spacing['2'] }}>
                                    Select an item from the sidebar to edit its metadata.
                                </Text>
                            </Box>
                        </Flex>
                    )}
                </Box>
            </Flex>
        </PageContainer>
    );
};
