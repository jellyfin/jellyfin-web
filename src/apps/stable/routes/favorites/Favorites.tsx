import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { LoadingView } from 'components/feedback/LoadingView';
import { MediaCard } from 'components/media/MediaCard';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import { toPlayableItem } from 'lib/utils/playbackUtils';
import React, { useCallback } from 'react';
import { playbackManagerBridge } from 'store/playbackManagerBridge';
import { useServerStore } from 'store/serverStore';
import { useUiStore } from 'store/uiStore';
import { vars } from 'styles/tokens.css.ts';
import { Box, Heading, Text } from 'ui-primitives';

interface FavoritesSectionProps {
    title: string;
    items: BaseItemDto[];
    shape: 'portrait' | 'landscape' | 'square' | 'backdrop';
    showTitle?: boolean;
    showYear?: boolean;
    showParentTitle?: boolean;
    coverImage?: boolean;
    overlayPlayButton?: boolean;
    viewAllUrl?: string;
    onPlay?: (item: BaseItemDto) => void;
    onItemClick?: (item: BaseItemDto) => void;
}

function FavoritesSection({
    title,
    items,
    shape,
    showTitle = true,
    showYear = true,
    showParentTitle = false,
    coverImage = false,
    overlayPlayButton = true,
    viewAllUrl,
    onPlay,
    onItemClick
}: FavoritesSectionProps) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <Box className="verticalSection">
            <Box className="sectionTitleContainer sectionTitleContainer-cards padded-left">
                {viewAllUrl ? (
                    <a
                        href={viewAllUrl}
                        className="more button-flat button-flat-mini sectionTitleTextButton"
                        style={{
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: vars.spacing['1']
                        }}
                    >
                        <Heading.H2 className="sectionTitle sectionTitle-cards">
                            {globalize.translate(title)}
                        </Heading.H2>
                        <Box className="material-icons" aria-hidden="true">
                            chevron_right
                        </Box>
                    </a>
                ) : (
                    <Heading.H2 className="sectionTitle sectionTitle-cards">
                        {globalize.translate(title)}
                    </Heading.H2>
                )}
            </Box>
            <Box
                className="padded-top-focusscale padded-bottom-focusscale"
                style={{
                    display: 'flex',
                    gap: vars.spacing['4'],
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory'
                }}
            >
                {items.slice(0, 12).map((item) => (
                    <MediaCard
                        key={item.Id}
                        item={item}
                        cardSize="medium"
                        showPlayButton={overlayPlayButton}
                        onPlay={onPlay}
                        onClick={onItemClick}
                    />
                ))}
            </Box>
        </Box>
    );
}

export function FavoritesView() {
    const { currentServer } = useServerStore();
    const { isLoading: isUiLoading } = useUiStore();

    const currentServerId = currentServer?.id;
    const currentUserId = currentServer?.userId;

    const handleItemClick = useCallback((item: BaseItemDto) => {
        appRouter.showItem(item);
    }, []);

    const handleItemPlay = useCallback(async (item: BaseItemDto) => {
        try {
            const playable = toPlayableItem(item);
            await playbackManagerBridge.setQueue([playable], 0);
            await playbackManagerBridge.play();
        } catch (error) {
            console.error('[Favorites] Failed to play item', error);
        }
    }, []);

    if (!currentServerId || !currentUserId) {
        return <LoadingView />;
    }

    if (isUiLoading) {
        return <LoadingView />;
    }

    return (
        <Box className="libraryPage libraryPage-favorites background-theme">
            <Box className="padded-bottom padded-sides">
                <Box className="sections">
                    <FavoritesSection
                        title="Movies"
                        items={[]}
                        shape="portrait"
                        showTitle
                        showYear
                        showParentTitle={false}
                        coverImage={false}
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=Movie&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Shows"
                        items={[]}
                        shape="portrait"
                        showTitle
                        showYear
                        showParentTitle={false}
                        coverImage={false}
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=Series&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Collections"
                        items={[]}
                        shape="portrait"
                        showTitle
                        showParentTitle={false}
                        coverImage={false}
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=BoxSet&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Playlists"
                        items={[]}
                        shape="square"
                        showTitle
                        showParentTitle={false}
                        coverImage
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=Playlist&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Artists"
                        items={[]}
                        shape="square"
                        showTitle
                        showParentTitle={false}
                        coverImage
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=MusicArtist&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Albums"
                        items={[]}
                        shape="square"
                        showTitle
                        showParentTitle
                        coverImage
                        overlayPlayButton
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=MusicAlbum&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                    <FavoritesSection
                        title="Songs"
                        items={[]}
                        shape="square"
                        showTitle
                        showParentTitle
                        coverImage
                        overlayPlayButton={false}
                        viewAllUrl={`/list.html?serverId=${currentServerId}&types=Audio&isFavorite=true`}
                        onPlay={handleItemPlay}
                        onItemClick={handleItemClick}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default FavoritesView;
