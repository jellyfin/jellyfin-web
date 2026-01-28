import React from 'react';
import { Avatar } from 'ui-primitives/Avatar';
import { Text, Heading } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { DiscIcon, HeartFilledIcon, HeartIcon } from '@radix-ui/react-icons';
import { vars } from 'styles/tokens.css';

import type { PlayableItem } from 'store/types';

export interface QueueNowPlayingProps {
    currentItem: PlayableItem | null;
    isFavorite?: boolean;
    onFavoriteClick?: () => void;
}

const formatDuration = (ticks: number | undefined): string => {
    if (!ticks) return '--:--';
    const seconds = Math.floor((ticks / 10000000) % 60);
    const minutes = Math.floor((ticks / 10000000 / 60) % 60);
    const hours = Math.floor(ticks / 10000000 / 60 / 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const QueueNowPlaying: React.FC<QueueNowPlayingProps> = ({
    currentItem,
    isFavorite = false,
    onFavoriteClick
}) => {
    const imageUrl = currentItem?.imageUrl;

    return (
        <div
            className="nowPlayingInfoContainer"
            style={{ display: 'flex', gap: vars.spacing['6'], marginBottom: vars.spacing['6'] }}
        >
            <div className="nowPlayingPageImageContainer">
                <Avatar
                    src={imageUrl || undefined}
                    style={{
                        width: 200,
                        height: 200,
                        backgroundColor: imageUrl ? 'transparent' : vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    {!imageUrl && <DiscIcon style={{ fontSize: 64, color: vars.colors.textSecondary }} />}
                </Avatar>
            </div>
            <div
                className="nowPlayingInfoControls"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
                <div className="infoContainer flex" style={{ marginBottom: vars.spacing['5'] }}>
                    <div className="nowPlayingInfoContainerMedia">
                        <Heading.H2 style={{ fontWeight: 'bold', marginBottom: vars.spacing['2'] }}>
                            {currentItem?.name || 'No track playing'}
                        </Heading.H2>
                        <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>{currentItem?.artist || ''}</Text>
                        <Text size="md" color="secondary">
                            {currentItem?.album || ''}
                        </Text>
                    </div>
                    {onFavoriteClick && (
                        <div className="nowPlayingPageUserDataButtonsTitle" style={{ marginLeft: 'auto' }}>
                            <IconButton
                                variant="plain"
                                onClick={onFavoriteClick}
                                style={{ color: isFavorite ? vars.colors.error : vars.colors.textSecondary }}
                            >
                                {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                            </IconButton>
                        </div>
                    )}
                </div>
                <Text size="sm" color="secondary">
                    {currentItem?.runtimeTicks ? formatDuration(currentItem.runtimeTicks) : '--:--'}
                </Text>
            </div>
        </div>
    );
};

export default QueueNowPlaying;
