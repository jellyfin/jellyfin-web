import React, { type FC } from 'react';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import type { ChapterInfo } from '@jellyfin/sdk/lib/generated-client/models/chapter-info';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'lib/globalize';
import datetime from 'scripts/datetime';

interface ItemDetailsChapterListProps {
    item: BaseItemDto;
}

const ItemDetailsChapterList: FC<ItemDetailsChapterListProps> = ({ item }) => {
    const onClickPlay = (chapter: ChapterInfo) => () => {
        playbackManager.play({
            items: [item],
            startPositionTicks: chapter.StartPositionTicks
        }).catch(error => {
            console.error('playback failure', error);
        });
    };

    return (
        <Box>
            {item.Chapters?.map((chapter, index) => (
                <Box
                    key={chapter.StartPositionTicks}
                    className='listItem-border'
                    onClick={onClickPlay(chapter)}
                    sx={{ cursor: 'pointer', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
                >
                    <Box style={{ margin: '0 1em' }}>
                        {index + 1}
                    </Box>

                    <Box className='listItemBody'>
                        <Typography>
                            {chapter.Name ?? `${globalize.translate('HeaderChapter')} ${index + 1}`}
                        </Typography>
                    </Box>

                    <Typography className='secondary' style={{ margin: '0 1em' }}>
                        {datetime.getDisplayRunningTime(chapter.StartPositionTicks)}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

export default ItemDetailsChapterList;
