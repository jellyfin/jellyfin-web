import React, { useEffect, useState } from 'react';
import { Box } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getBackdropShape, getPortraitShape, getSquareShape } from 'utils/card';
import { vars } from 'styles/tokens.css';
import type { CardOptions } from 'types/cardOptions';

interface FavoritesTabProps {
    autoFocus?: boolean;
}

interface Section {
    name: string;
    types: string;
    shape: string;
    showTitle: boolean;
    showYear?: boolean;
    showParentTitle?: boolean;
    overlayPlayButton: boolean;
    overlayText: boolean;
    centerText: boolean;
    preferThumb?: boolean;
    overlayMoreButton?: boolean;
    action?: string;
    coverImage?: boolean;
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({ autoFocus = false }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [sectionData, setSectionData] = useState<Array<{ section: Section; items: any[] }>>([]);
    const apiClient = ServerConnections.currentApiClient();

    const getSections = (): Section[] => [
        {
            name: 'Movies',
            types: 'Movie',
            shape: getPortraitShape(true),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        },
        {
            name: 'Shows',
            types: 'Series',
            shape: getPortraitShape(true),
            showTitle: true,
            showYear: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        },
        {
            name: 'HeaderSeasons',
            types: BaseItemKind.Season,
            shape: getPortraitShape(true),
            showTitle: true,
            showParentTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        },
        {
            name: 'Episodes',
            types: 'Episode',
            shape: getBackdropShape(true),
            preferThumb: false,
            showTitle: true,
            showParentTitle: true,
            overlayPlayButton: true,
            overlayText: false,
            centerText: true
        }
    ];

    const fetchSectionData = async (section: Section) => {
        const options: Record<string, unknown> = {
            SortBy: [ItemSortBy.SeriesSortName, ItemSortBy.SortName].join(','),
            SortOrder: 'Ascending',
            Filters: 'IsFavorite',
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio',
            CollapseBoxSetItems: false,
            ExcludeLocationTypes: 'Virtual',
            EnableTotalRecordCount: false,
            Limit: 20,
            includeTypes: [section.types]
        };

        if (!apiClient) return [];

        const userId = apiClient.getCurrentUserId();

        if (section.types === 'MusicArtist') {
            return apiClient.getArtists(userId, options);
        }

        if (section.types === 'Person') {
            return apiClient.getPeople(userId, options);
        }

        return apiClient.getItems(userId, options);
    };

    const renderCards = (items: any[], section: Section): string => {
        const cardLayout = false;
        let lines = 0;

        if (section.showTitle) lines++;
        if (section.showYear) lines++;
        if (section.showParentTitle) lines++;

        return cardBuilder.getCardsHtml(items, {
            preferThumb: section.preferThumb,
            shape: section.shape,
            centerText: section.centerText && !cardLayout,
            overlayText: section.overlayText !== false,
            showTitle: section.showTitle,
            showYear: section.showYear,
            showParentTitle: section.showParentTitle,
            scalable: true,
            coverImage: section.coverImage,
            overlayPlayButton: section.overlayPlayButton,
            overlayMoreButton: section.overlayMoreButton && !cardLayout,
            action: section.action,
            allowBottomPadding: true,
            cardLayout: cardLayout,
            lines: lines
        } as any);
    };

    useEffect(() => {
        const loadSections = async () => {
            if (!apiClient) {
                setIsLoading(false);
                return;
            }

            try {
                const sections = getSections();
                const data = await Promise.all(
                    sections.map(async section => {
                        const result = (await fetchSectionData(section)) as { Items?: unknown[] };
                        return {
                            section,
                            items: result.Items || []
                        };
                    })
                );
                setSectionData(data);
            } catch (err) {
                console.error('[FavoritesTab] Failed to load favorites:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadSections();
    }, [apiClient]);

    if (isLoading) {
        return (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <CircularProgress size="lg" />
            </Box>
        );
    }

    return (
        <Box style={{ paddingBottom: '2rem' }}>
            {sectionData.map(({ section, items }) => (
                <Box key={section.name} className="verticalSection" style={{ marginBottom: '1.5rem' }}>
                    <Box className="sectionTitleContainer sectionTitleContainer-cards padded-left">
                        <Text
                            className="sectionTitle sectionTitle-cards"
                            style={{
                                fontSize: vars.typography['6'].fontSize,
                                fontWeight: vars.typography.fontWeightMedium
                            }}
                        >
                            {section.name}
                        </Text>
                    </Box>
                    {items.length > 0 ? (
                        <Box
                            className="scrollX hiddenScrollX"
                            style={{
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                whiteSpace: 'nowrap',
                                padding: '0.5rem 0'
                            }}
                            dangerouslySetInnerHTML={{ __html: renderCards(items, section) }}
                        />
                    ) : (
                        <Box className="padded-left" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                            <Text>No favorite {section.types.toLowerCase()}s yet</Text>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default FavoritesTab;
