import React, { FC, useState, useMemo, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Loading from 'components/loading/LoadingComponent';
import Cards from 'components/cardbuilder/Card/Cards';
import classNames from 'classnames';
import { useApi } from 'hooks/useApi';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import { ViewMode, type Filters, type LibraryViewSettings } from 'types/library';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import { LibraryTab } from 'types/libraryTab';
import type { ItemDto } from 'types/base/models/item-dto';
import 'styles/scrollstyles.scss';
import 'styles/flexstyles.scss';

type LiveTvFilters = Filters & {
    ChannelGroupId?: string;
};

type ChannelGroup = {
    Id?: string | null;
    Name?: string | null;
};

type LiveTvChannelItem = ItemDto & {
    ChannelGroups?: ChannelGroup[];
    ChannelNumber?: string | null;
    Number?: string | null;
};

const getChannelGroups = (channel: ItemDto): ChannelGroup[] => {
    const groups = (channel as LiveTvChannelItem).ChannelGroups;
    return Array.isArray(groups) ? groups : [];
};

const getChannelNumber = (channel: ItemDto): number | null => {
    const c = channel as LiveTvChannelItem;
    const raw = c.ChannelNumber ?? c.Number;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

/* ---------- Sidebar item ---------- */

const GroupItem: FC<{
    active?: boolean;
    groupId: string;
    onClick: React.MouseEventHandler<HTMLElement>;
    children: React.ReactNode;
}> = ({ active, groupId, onClick, children }) => (
    <Box
        onClick={onClick}
        data-groupid={groupId}
        sx={{
            cursor: 'pointer',
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--primary-text-color)' : 'var(--secondary-text-color)',
            backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
            '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.06)'
            }
        }}
    >
        {children}
    </Box>
);

/* ---------- Main view ---------- */

const LiveTvView: FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    const onGroupClick = useCallback<React.MouseEventHandler<HTMLElement>>((e) => {
        const groupId = (e.currentTarget as HTMLElement).dataset.groupid || '';
        setSelectedGroup(groupId);
    }, []);

    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(LibraryTab.Channels, 'livetv'),
            getDefaultLibraryViewSettings(LibraryTab.Channels)
        );

    const {
        isPending: isLoading,
        data: itemsResult,
        refetch,
        isError,
        error
    } = useGetItemsViewByType(LibraryTab.Channels, 'livetv', [], libraryViewSettings);

    const channels = itemsResult?.Items ?? [];

    /* ---------- Restore persisted group ---------- */

    useEffect(() => {
        const persisted = (libraryViewSettings?.Filters as LiveTvFilters | undefined)?.ChannelGroupId;
        if (persisted && persisted !== selectedGroup) {
            setSelectedGroup(persisted);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [libraryViewSettings]);

    /* ---------- Group extraction ---------- */

    const { groupsMap, groupsList } = useMemo(() => {
        const map: Record<string, { id: string; name: string; count: number; channels: ItemDto[] }> = {};

        for (const ch of channels) {
            const groups = getChannelGroups(ch);
            if (!groups.length) continue;

            for (const g of groups) {
                const id = String(g.Id ?? '');
                if (!id) continue;
                const name = g.Name || id;

                if (!map[id]) map[id] = { id, name, count: 0, channels: [] };
                map[id].count += 1;
                map[id].channels.push(ch);
            }
        }

        for (const id in map) {
            map[id].channels.sort((a, b) => {
                const na = getChannelNumber(a);
                const nb = getChannelNumber(b);
                if (na != null && nb != null && na !== nb) return na - nb;
                if (na == null && nb != null) return 1;
                if (na != null && nb == null) return -1;
                return String(a.Name || '').localeCompare(String(b.Name || ''));
            });
        }

        const list = Object.values(map)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(({ id, name, count }) => ({ id, name, count }));

        return { groupsMap: map, groupsList: list };
    }, [channels]);

    /* ---------- Filtered channels ---------- */

    const filteredChannels = useMemo(() => {
        if (!selectedGroup) {
            return channels.slice().sort((a, b) => {
                const na = getChannelNumber(a);
                const nb = getChannelNumber(b);
                if (na != null && nb != null && na !== nb) return na - nb;
                if (na == null && nb != null) return 1;
                if (na != null && nb == null) return -1;
                return String(a.Name || '').localeCompare(String(b.Name || ''));
            });
        }
        return groupsMap[selectedGroup]?.channels ?? [];
    }, [channels, selectedGroup, groupsMap]);

    /* ---------- Persist selection ---------- */

    useEffect(() => {
        setLibraryViewSettings(prev => {
            const filters: LiveTvFilters = prev?.Filters ? { ...(prev.Filters as LiveTvFilters) } : {};

            if (!selectedGroup) {
                delete filters.ChannelGroupId;
            } else {
                filters.ChannelGroupId = selectedGroup;
            }

            return { ...(prev || {}), Filters: filters };
        });
    }, [selectedGroup, setLibraryViewSettings]);

    const { __legacyApiClient__ } = useApi();

    const itemsContainerClass = classNames(
        'centered padded-left padded-right padded-right-withalphapicker',
        libraryViewSettings.ViewMode === ViewMode.ListView ? 'vertical-list' : 'vertical-wrap'
    );

    const cardOptions = useMemo(() => ({
        shape: 'square',
        centerText: false,
        overlayText: true,
        preferLogo: true,
        showTitle: libraryViewSettings.ShowTitle,
        cardLayout: libraryViewSettings.CardLayout,
        imageType: libraryViewSettings.ImageType,
        context: 'livetv',
        queryKey: ['ItemsViewByType'],
        serverId: __legacyApiClient__?.serverId()
    }), [libraryViewSettings, __legacyApiClient__]);

    const errorMessage =
        isError && error
            ? typeof error === 'object' && 'message' in error
                ? (error as any).message :
                String(error) :
            null;

    return (
        <Box className='absolutePageTabContent' sx={{ pt: 0, pb: 0 }}>
            {isLoading && <Loading />}
            {errorMessage && <div style={{ color: 'var(--error-color)' }}>Error: {errorMessage}</div>}

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
                {/* ---------- Sidebar ---------- */}
                <Box
                    sx={{
                        minWidth: 220,
                        maxWidth: 260,
                        pr: 1,
                        borderRight: '1px solid var(--divider-color)'
                    }}
                >
                    <h3
                        style={{
                            marginTop: 0,
                            marginBottom: 8,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            opacity: 0.85
                        }}
                    >
                        Channel groups
                    </h3>

                    <GroupItem active={!selectedGroup} groupId='' onClick={onGroupClick}>
                        All <span style={{ opacity: 0.6 }}>({channels.length})</span>
                    </GroupItem>

                    {groupsList.map(g => (
                        <GroupItem
                            key={g.id}
                            groupId={g.id}
                            active={selectedGroup === g.id}
                            onClick={onGroupClick}
                        >
                            {g.name} <span style={{ opacity: 0.6 }}>({g.count})</span>
                        </GroupItem>
                    ))}
                </Box>

                {/* ---------- Channels ---------- */}
                <Box sx={{ flex: 1, pl: 1 }}>
                    <ItemsContainer
                        className={itemsContainerClass}
                        parentId='livetv'
                        reloadItems={refetch}
                        queryKey={['ItemsViewByType']}
                    >
                        {/* @ts-expect-error Cards has a narrower prop type than our filtered channel list */}
                        <Cards items={filteredChannels} cardOptions={cardOptions} />
                    </ItemsContainer>
                </Box>
            </Box>
        </Box>
    );
};

export default LiveTvView;
