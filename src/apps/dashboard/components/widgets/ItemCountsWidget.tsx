import Book from '@mui/icons-material/Book';
import Movie from '@mui/icons-material/Movie';
import MusicNote from '@mui/icons-material/MusicNote';
import MusicVideo from '@mui/icons-material/MusicVideo';
import Tv from '@mui/icons-material/Tv';
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import Grid from '@mui/material/Grid2';
import React, { useMemo } from 'react';

import { useItemCounts } from 'apps/dashboard/features/metrics/api/useItemCounts';
import MetricCard, { type MetricCardProps } from 'apps/dashboard/features/metrics/components/MetricCard';
import globalize from 'lib/globalize';

const ItemCountsWidget = () => {
    const {
        data: counts,
        isPending
    } = useItemCounts();

    const cards: MetricCardProps[] = useMemo(() => {
        const cardProps: MetricCardProps[] = [];

        if (isPending || counts?.MovieCount) {
            cardProps.push({
                Icon: Movie,
                metrics: [{
                    label: globalize.translate('Movies'),
                    value: counts?.MovieCount
                }]
            });
        }

        if (isPending || counts?.SeriesCount || counts?.EpisodeCount) {
            cardProps.push({
                Icon: Tv,
                metrics: [{
                    label: globalize.translate('Series'),
                    value: counts?.SeriesCount
                }, {
                    label: globalize.translate('Episodes'),
                    value: counts?.EpisodeCount
                }]
            });
        }

        if (isPending || counts?.AlbumCount || counts?.SongCount) {
            cardProps.push({
                Icon: MusicNote,
                metrics: [{
                    label: globalize.translate('Albums'),
                    value: counts?.AlbumCount
                }, {
                    label: globalize.translate('Songs'),
                    value: counts?.SongCount
                }]
            });
        }

        if (isPending || counts?.MusicVideoCount) {
            cardProps.push({
                Icon: MusicVideo,
                metrics: [{
                    label: globalize.translate('MusicVideos'),
                    value: counts?.MusicVideoCount
                }]
            });
        }

        if (isPending || counts?.BookCount) {
            cardProps.push({
                Icon: Book,
                metrics: [{
                    label: globalize.translate('Books'),
                    value: counts?.BookCount
                }]
            });
        }

        if (isPending || counts?.BoxSetCount) {
            cardProps.push({
                Icon: VideoLibrary,
                metrics: [{
                    label: globalize.translate('Collections'),
                    value: counts?.BoxSetCount
                }]
            });
        }

        return cardProps;
    }, [ counts, isPending ]);

    return (
        <Grid
            container
            spacing={2}
            sx={{
                alignItems: 'stretch',
                marginTop: 2
            }}
        >
            {cards.map(card => (
                <Grid
                    key={card.metrics.map(metric => metric.label).join('-')}
                    size={{ xs: 12, sm: 6, lg: 4 }}
                >
                    <MetricCard {...card} />
                </Grid>
            ))}
        </Grid>
    );
};

export default ItemCountsWidget;
