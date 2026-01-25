import React, { useEffect, useState } from 'react';

import { Heading } from 'ui-primitives/Text';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';
import * as userSettings from '../../scripts/settings/userSettings';
import * as styles from './NextUpSection.css';

const NextUpSection: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const apiClient = ServerConnections.currentApiClient();
    const useEpisodeImages = !(userSettings as any).useEpisodeImagesInNextUpAndResume();

    useEffect(() => {
        if (!apiClient) return;
        const oldestDateForNextUp = new Date();
        oldestDateForNextUp.setDate(oldestDateForNextUp.getDate() - (userSettings as any).maxDaysForNextUp());

        const options = {
            Limit: 24,
            Fields: 'PrimaryImageAspectRatio,DateCreated,Path,MediaSourceCount',
            UserId: apiClient.getCurrentUserId(),
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false,
            DisableFirstEpisode: false,
            NextUpDateCutoff: oldestDateForNextUp.toISOString(),
            EnableResumable: false,
            EnableRewatching: (userSettings as any).enableRewatchingInNextUp()
        };

        apiClient.getNextUpEpisodes(options).then((result: any) => {
            setItems(result.Items);
            setIsLoading(false);
        });
    }, [apiClient]);

    if (isLoading || items.length === 0) return null;

    const cardOptions: CardOptions = {
        shape: 'backdrop',
        showTitle: true,
        showParentTitle: true,
        overlayPlayButton: true,
        preferThumb: true,
        inheritThumb: useEpisodeImages
    };

    return (
        <div className={styles.container}>
            <Heading.H3 className={styles.header}>{globalize.translate('NextUp')}</Heading.H3>
            <CardBuilder items={items} options={cardOptions} />
        </div>
    );
};

export default NextUpSection;
