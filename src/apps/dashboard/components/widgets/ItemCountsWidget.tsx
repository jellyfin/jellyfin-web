import type { ItemCounts } from '@jellyfin/sdk/lib/generated-client/models/item-counts';
import { DesktopIcon, DiscIcon, ReaderIcon, StackIcon, VideoIcon } from '@radix-ui/react-icons';
import { useItemCounts } from 'apps/dashboard/features/metrics/api/useItemCounts';
import MetricCard, {
    type MetricCardProps
} from 'apps/dashboard/features/metrics/components/MetricCard';
import globalize from 'lib/globalize';
import React, { useMemo } from 'react';
import { Flex, Grid } from 'ui-primitives';

interface MetricDefinition {
    key: keyof ItemCounts;
    i18n: string;
}

interface CardDefinition {
    Icon: React.ComponentType<{ style?: React.CSSProperties }>;
    metrics: MetricDefinition[];
}

const CARD_DEFINITIONS: CardDefinition[] = [
    {
        Icon: VideoIcon,
        metrics: [{ key: 'MovieCount', i18n: 'Movies' }]
    },
    {
        Icon: DesktopIcon,
        metrics: [
            { key: 'SeriesCount', i18n: 'Series' },
            { key: 'EpisodeCount', i18n: 'Episodes' }
        ]
    },
    {
        Icon: DiscIcon,
        metrics: [
            { key: 'AlbumCount', i18n: 'Albums' },
            { key: 'SongCount', i18n: 'Songs' }
        ]
    },
    {
        Icon: VideoIcon,
        metrics: [{ key: 'MusicVideoCount', i18n: 'MusicVideos' }]
    },
    {
        Icon: ReaderIcon,
        metrics: [{ key: 'BookCount', i18n: 'Books' }]
    },
    {
        Icon: StackIcon,
        metrics: [{ key: 'BoxSetCount', i18n: 'Collections' }]
    }
];

const ItemCountsWidget = (): React.ReactElement => {
    const { data: counts, isPending } = useItemCounts();

    const cards: MetricCardProps[] = useMemo(() => {
        return CARD_DEFINITIONS.filter(
            (def) => isPending || def.metrics.some(({ key }) => counts?.[key] != null)
        ).map(({ Icon, metrics }) => ({
            Icon,
            metrics: metrics.map(({ i18n, key }) => ({
                label: globalize.translate(i18n),
                value: counts?.[key]
            }))
        }));
    }, [counts, isPending]);

    return (
        <Flex>
            <Grid
                container
                spacing="md"
                style={{
                    alignItems: 'stretch'
                }}
            >
                {cards.map((card) => (
                    <Grid
                        key={card.metrics.map((metric) => metric.label).join('-')}
                        xs={12}
                        sm={6}
                        lg={4}
                    >
                        <MetricCard {...card} />
                    </Grid>
                ))}
            </Grid>
        </Flex>
    );
};

export default ItemCountsWidget;
