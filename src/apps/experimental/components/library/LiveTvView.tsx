import React, { FC, useState, useMemo, useEffect } from 'react';
import Box from '@mui/material/Box';
import Loading from 'components/loading/LoadingComponent';
import Cards from 'components/cardbuilder/Card/Cards';
import classNames from 'classnames';
import { useApi } from 'hooks/useApi';
import ItemsContainer from 'elements/emby-itemscontainer/ItemsContainer';
import { ViewMode } from 'types/library';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import { LibraryTab } from 'types/libraryTab';
import type { LibraryViewSettings } from 'types/library';
import 'styles/scrollstyles.scss';
import 'styles/flexstyles.scss';

/* ---------- Sidebar item ---------- */

const GroupItem: FC<{
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <Box
        onClick={onClick}
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
        const persisted = (libraryViewSettings?.Filters as any)?.ChannelGroupId;
        if (persisted && persisted !== selectedGroup) {
            setSelectedGroup(persisted);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [libraryViewSettings]);

    /* ---------- Group extraction ---------- */

    const { groupsMap, groupsList } = useMemo(() => {
        const map: Record<string, { id: string; name: string; count: number; channels: any[] }> = {};

        for (const ch of channels) {
            const groups = (ch as any).ChannelGroups;
            if (!Array.isArray(groups)) continue;

            for (const g of groups) {
                const id = String(g.Id);
                const name = g.Name || id;

                if (!map[id]) map[id] = { id, name, count: 0, channels: [] };
                map[id].count += 1;
                map[id].channels.push(ch);
            }
        }

        for (const id in map) {
            map[id].channels.sort((a: any, b: any) => {
                const na = Number(a.ChannelNumber ?? a.Number) || Infinity;
                const nb = Number(b.ChannelNumber ?? b.Number) || Infinity;
                if (na !== nb) return na - nb;
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
            return channels.slice().sort((a: any, b: any) => {
                const na = Number(a.ChannelNumber ?? a.Number) || Infinity;
                const nb = Number(b.ChannelNumber ?? b.Number) || Infinity;
                if (na !== nb) return na - nb;
                return String(a.Name || '').localeCompare(String(b.Name || ''));
            });
        }
        return groupsMap[selectedGroup]?.channels ?? [];
    }, [channels, selectedGroup, groupsMap]);

    /* ---------- Persist selection ---------- */

    useEffect(() => {
        setLibraryViewSettings(prev => {
            const filters = prev?.Filters ? { ...prev.Filters } : {};

            if (!selectedGroup) delete (filters as any).ChannelGroupId;
            else (filters as any).ChannelGroupId = selectedGroup;

            return { ...(prev || {}), Filters: filters } as any;
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
                ? (error as any).message
                : String(error)
            : null;

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

                    <GroupItem active={!selectedGroup} onClick={() => setSelectedGroup('')}>
                        All <span style={{ opacity: 0.6 }}>({channels.length})</span>
                    </GroupItem>

                    {groupsList.map(g => (
                        <GroupItem
                            key={g.id}
                            active={selectedGroup === g.id}
                            onClick={() => setSelectedGroup(g.id)}
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
                        {/* @ts-ignore */}
                        <Cards items={filteredChannels} cardOptions={cardOptions} />
                    </ItemsContainer>
                </Box>
            </Box>
        </Box>
    );
};

export default LiveTvView;
