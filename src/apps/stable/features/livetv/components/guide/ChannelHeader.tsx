import React from 'react';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { Text } from 'ui-primitives';
import * as styles from './ChannelHeader.css.ts';

interface ChannelHeaderProps {
    channel: any;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({ channel }) => {
    const apiClient = ServerConnections.getApiClient(channel.ServerId);
    const imageUrl = channel.ImageTags?.Primary
        ? apiClient.getScaledImageUrl(channel.Id, {
              maxHeight: 100,
              tag: channel.ImageTags.Primary,
              type: 'Primary'
          })
        : null;

    return (
        <div className={styles.styledChannelHeader}>
            {imageUrl ? (
                <img src={imageUrl} alt={channel.Name} className={styles.channelImage} />
            ) : (
                <Text size="xs">{channel.Name}</Text>
            )}
            {channel.ChannelNumber && <div className={styles.channelNumber}>{channel.ChannelNumber}</div>}
        </div>
    );
};

export default ChannelHeader;
