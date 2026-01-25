import React from 'react';
import { Box } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';

import { useServerStore } from 'store/serverStore';
import { useUiStore } from 'store/uiStore';
import { MediaCard } from 'components/media/MediaCard';
import { LoadingView } from 'components/feedback/LoadingView';
import globalize from 'lib/globalize';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

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
    viewAllUrl
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
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <Heading.H2 className="sectionTitle sectionTitle-cards">
                            {globalize.translate(title)}
                        </Heading.H2>
                        <Box className="material-icons" aria-hidden="true">
                            chevron_right
                        </Box>
                    </a>
                ) : (
                    <Heading.H2 className="sectionTitle sectionTitle-cards">{globalize.translate(title)}</Heading.H2>
                )}
            </Box>
            <Box
                className="padded-top-focusscale padded-bottom-focusscale"
                style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory'
                }}
            >
                {items.slice(0, 12).map(item => (
                    <MediaCard key={item.Id} item={item} cardSize="medium" showPlayButton={overlayPlayButton} />
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
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default FavoritesView;
