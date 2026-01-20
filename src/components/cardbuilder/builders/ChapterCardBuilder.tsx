import React from 'react';
import Grid from '@mui/joy/Grid';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import BaseCard from '../Card/BaseCard';
import datetime from '../../../scripts/datetime';

interface ChapterCardBuilderProps {
    item: any;
    chapters: any[];
    onChapterClick?: (chapter: any) => void;
}

const ChapterCardBuilder: React.FC<ChapterCardBuilderProps> = ({ item, chapters, onChapterClick }) => {
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    return (
        <Grid container spacing={2}>
            {chapters.map((chapter, index) => {
                const imgUrl = chapter.ImageTag ? apiClient.getScaledImageUrl(item.Id, {
                    maxWidth: 400,
                    tag: chapter.ImageTag,
                    type: 'Chapter',
                    index
                }) : null;

                return (
                    <Grid key={index} xs={12} sm={6} md={4} lg={3}>
                        <BaseCard
                            title={chapter.Name}
                            text={datetime.getDisplayRunningTime(chapter.StartPositionTicks)}
                            image={imgUrl}
                            icon={<span className="material-icons local_movies" style={{ fontSize: 48 }} />}
                            onClick={() => onChapterClick?.(chapter)}
                        />
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default ChapterCardBuilder;
