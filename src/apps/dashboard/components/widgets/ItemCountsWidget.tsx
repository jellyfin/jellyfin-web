import Book from '@mui/icons-material/Book';
import Movie from '@mui/icons-material/Movie';
import MusicNote from '@mui/icons-material/MusicNote';
import MusicVideo from '@mui/icons-material/MusicVideo';
import Tv from '@mui/icons-material/Tv';
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import Grid from '@mui/material/Grid2';
import React from 'react';

import { useItemCounts } from 'apps/dashboard/features/metrics/api/useItemCounts';
import MetricCard from 'apps/dashboard/features/metrics/components/MetricCard';
import globalize from 'lib/globalize';

const ItemCountsWidget = () => {
    const { data: counts } = useItemCounts();

    return (
        <Grid
            container
            spacing={2}
            sx={{
                alignItems: 'stretch',
                marginTop: 2
            }}
        >
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={Movie}
                    metrics={[{
                        label: globalize.translate('Movies'),
                        value: counts?.MovieCount
                    }]}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={Tv}
                    metrics={[{
                        label: globalize.translate('Series'),
                        value: counts?.SeriesCount
                    }, {
                        label: globalize.translate('Episodes'),
                        value: counts?.EpisodeCount
                    }]}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={MusicNote}
                    metrics={[{
                        label: globalize.translate('Albums'),
                        value: counts?.AlbumCount
                    }, {
                        label: globalize.translate('Songs'),
                        value: counts?.SongCount
                    }]}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={MusicVideo}
                    metrics={[{
                        label: globalize.translate('MusicVideos'),
                        value: counts?.MusicVideoCount
                    }]}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={Book}
                    metrics={[{
                        label: globalize.translate('Books'),
                        value: counts?.BookCount
                    }]}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <MetricCard
                    Icon={VideoLibrary}
                    metrics={[{
                        label: globalize.translate('Collections'),
                        value: counts?.BoxSetCount
                    }]}
                />
            </Grid>
        </Grid>
    );
};

export default ItemCountsWidget;
