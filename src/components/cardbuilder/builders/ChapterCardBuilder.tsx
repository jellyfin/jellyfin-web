import { ServerConnections } from 'lib/jellyfin-apiclient';
import React from 'react';
import datetime from '../../../scripts/datetime';
import BaseCard from '../Card/BaseCard';
import * as styles from './ChapterCardBuilder.css.ts';

interface ChapterCardBuilderProps {
    item: any;
    chapters: any[];
    onChapterClick?: (chapter: any) => void;
}

const ChapterCardBuilder: React.FC<ChapterCardBuilderProps> = ({
    item,
    chapters,
    onChapterClick
}) => {
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    return (
        <div className={styles.grid}>
            {chapters.map((chapter, index) => {
                const imgUrl = chapter.ImageTag
                    ? apiClient.getScaledImageUrl(item.Id, {
                          maxWidth: 400,
                          tag: chapter.ImageTag,
                          type: 'Chapter',
                          index
                      })
                    : null;

                return (
                    <div key={chapter.Id || index}>
                        <BaseCard
                            title={chapter.Name}
                            text={datetime.getDisplayRunningTime(chapter.StartPositionTicks)}
                            image={imgUrl}
                            icon={
                                <span
                                    className="material-icons local_movies"
                                    style={{ fontSize: 48 }}
                                />
                            }
                            onClick={() => onChapterClick?.(chapter)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default ChapterCardBuilder;
