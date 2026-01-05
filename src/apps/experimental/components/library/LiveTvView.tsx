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
import 'material-design-icons-iconfont';
import 'elements/emby-programcell/emby-programcell';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-tabs/emby-tabs';
import 'elements/emby-scroller/emby-scroller';
// guide styles removed; LiveTvView uses standard library styles
import 'styles/scrollstyles.scss';
import 'styles/flexstyles.scss';

const LiveTvView: FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    // Persist view settings like the other library views
    const [libraryViewSettings, setLibraryViewSettings] = useLocalStorage<LibraryViewSettings>(
        getSettingsKey(LibraryTab.Channels, 'livetv'),
        getDefaultLibraryViewSettings(LibraryTab.Channels)
    );

    // Use the shared items fetch hook so Channels behave like other library views
    const {
        isPending: isLoading,
        data: itemsResult,
        isPlaceholderData,
        refetch,
        isError,
        error
    } = useGetItemsViewByType(LibraryTab.Channels, 'livetv', [], libraryViewSettings);

    const channels = itemsResult?.Items ?? [];
    console.log('LiveTvView channels loaded', channels);

    // Initialize selectedGroup from persisted view settings (if present)
    useEffect(() => {
        try {
            const persisted = (libraryViewSettings?.Filters as any)?.ChannelGroupId;
            if (persisted && persisted !== selectedGroup) {
                setSelectedGroup(persisted);
            }
        } catch (e) {
            // ignore
        }
        // Intentionally exclude selectedGroup and setLibraryViewSettings from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [libraryViewSettings]);

    // If the query encountered an error, extract a message
    const errorMessage = isError ? (error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error)) : null;

    // Build groups keyed by ChannelGroup.Id when available.
    const { groupsMap, groupsList } = useMemo(() => {
        const map: Record<string, { id: string; name: string; count: number; channels: any[] }> = {};

        for (const ch of channels) {
            const chAny = ch as any;
            const channelGroups = Array.isArray(chAny.ChannelGroups) && chAny.ChannelGroups.length
                ? chAny.ChannelGroups
                : null;

            if (channelGroups) {
                for (const g of channelGroups) {
                    const id = String(g.Id);
                    const name = g.Name || id;
                    if (!map[id]) map[id] = { id, name, count: 0, channels: [] };
                    map[id].count += 1;
                    map[id].channels.push(ch);
                }
            }
        }

        // Sort channels within each group by ChannelNumber (if present) then Name.
        for (const id in map) {
            map[id].channels.sort((a: any, b: any) => {
                const na = Number(a.ChannelNumber ?? a.Number) || Infinity;
                const nb = Number(b.ChannelNumber ?? b.Number) || Infinity;
                if (na !== nb) return na - nb;
                return String(a.Name || '').localeCompare(String(b.Name || ''));
            });
        }

        const list = Object.values(map).sort((a, b) => a.name.localeCompare(b.name)).map(({ id, name, count }) => ({ id, name, count }));
        return { groupsMap: map, groupsList: list };
    }, [channels]);

    const filteredChannels = useMemo(() => {
        if (!selectedGroup) {
            // Return all channels sorted by ChannelNumber then Name for consistent ordering
            return channels.slice().sort((a: any, b: any) => {
                const na = Number(a.ChannelNumber ?? a.Number) || Infinity;
                const nb = Number(b.ChannelNumber ?? b.Number) || Infinity;
                if (na !== nb) return na - nb;
                return String(a.Name || '').localeCompare(String(b.Name || ''));
            });
        }
        const group = groupsMap[selectedGroup];
        return group ? group.channels : [];
    }, [channels, selectedGroup, groupsMap]);

    // Persist selectedGroup into libraryViewSettings.Filters.ChannelGroupId
    useEffect(() => {
        setLibraryViewSettings(prev => {
            const prevFilters: any = (prev && prev.Filters) ? { ...prev.Filters } : {};

            if (!selectedGroup) {
                // remove filter when selecting All
                if ('ChannelGroupId' in prevFilters) {
                    delete prevFilters.ChannelGroupId;
                }
            } else {
                prevFilters.ChannelGroupId = selectedGroup;
            }

            return {
                ...(prev || {}),
                Filters: prevFilters
            } as any;
        });
        // only run when selectedGroup changes
    }, [selectedGroup, setLibraryViewSettings]);

    const { __legacyApiClient__ } = useApi();

    const itemsContainerClass = classNames(
        'centered padded-left padded-right padded-right-withalphapicker',
        libraryViewSettings.ViewMode === ViewMode.ListView ? 'vertical-list' : 'vertical-wrap'
    );

    const cardOptions = useMemo(() => ({
        shape: 'square',
        showTitle: libraryViewSettings.ShowTitle,
        showYear: libraryViewSettings.ShowYear,
        cardLayout: libraryViewSettings.CardLayout,
        centerText: true,
        context: 'livetv',
        coverImage: true,
        preferThumb: false,
        preferDisc: false,
        preferLogo: true,
        overlayText: !libraryViewSettings.ShowTitle,
        imageType: libraryViewSettings.ImageType,
        queryKey: ['ItemsViewByType'],
        serverId: __legacyApiClient__?.serverId()
    }), [libraryViewSettings, __legacyApiClient__]);

    return (
        <Box className='absolutePageTabContent' sx={{ paddingTop: 0, paddingBottom: 0 }}>
            {isLoading && <Loading />}
            {errorMessage && <div style={{ color: 'var(--error-color)' }}>Error: {errorMessage}</div>}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 220 }}>
                    <h3 style={{ marginTop: 0 }}>Channel groups</h3>
                    <div>
                        <button
                            onClick={() => setSelectedGroup('')}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: selectedGroup === '' ? '#e0e0e0' : 'transparent', border: 'none', color: '#ffffff' }}
                        >All ({channels.length})</button>
                        {groupsList.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroup(g.id)}
                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: selectedGroup === g.id ? '#e0e0e0' : 'transparent', border: 'none', color: '#ffffff' }}
                            >{g.name} ({g.count})</button>
                        ))}
                    </div>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>Channels</h3>
                    {/* Use Cards component if available, otherwise fallback to simple list */}
                    {typeof (Cards) === 'function' ? (
                        <ItemsContainer
                            className={itemsContainerClass}
                            parentId={'livetv'}
                            reloadItems={refetch}
                            queryKey={['ItemsViewByType']}
                        >
                            {/* @ts-ignore - Cards expects specific props in the project; pass minimal set */}
                            <Cards items={filteredChannels} cardOptions={cardOptions} />
                        </ItemsContainer>
                    ) : (
                        <div>
                            {filteredChannels.map(ch => (
                                <div key={ch.Id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{ch.Name}</div>
                            ))}
                        </div>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default LiveTvView;
