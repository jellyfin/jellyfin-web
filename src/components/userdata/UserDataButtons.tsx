import React, { useState, useCallback } from 'react';

import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { vars } from 'styles/tokens.css';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import { logger } from 'utils/logger';

export interface UserDataButtonsProps {
    item: {
        Id: string;
        ServerId: string;
        UserData?: {
            Played?: boolean;
            IsFavorite?: boolean;
        };
    };
    includePlayed?: boolean;
    cssClass?: string;
    style?: 'fab' | 'icon' | 'fab-mini';
    iconCssClass?: string;
    onUpdate?: (updatedItem: { Played: boolean; IsFavorite: boolean }) => void;
}

export const UserDataButtons: React.FC<UserDataButtonsProps> = ({
    item,
    includePlayed = true,
    cssClass,
    style = 'icon',
    iconCssClass,
    onUpdate
}) => {
    const [isPlayed, setIsPlayed] = useState(item.UserData?.Played || false);
    const [isFavorite, setIsFavorite] = useState(item.UserData?.IsFavorite || false);
    const [loading, setLoading] = useState<'played' | 'favorite' | null>(null);

    const handleMarkPlayed = useCallback(async () => {
        if (loading === 'played') return;

        setLoading('played');
        try {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            const newPlayedState = !isPlayed;

            const method = newPlayedState ? 'markPlayed' : 'markUnplayed';
            await apiClient[method](apiClient.getCurrentUserId(), item.Id, new Date());

            setIsPlayed(newPlayedState);
            onUpdate?.({ Played: newPlayedState, IsFavorite: isFavorite });

            logger.debug('Marked item as ' + (newPlayedState ? 'played' : 'unplayed'), {
                component: 'UserDataButtons',
                itemId: item.Id
            });
        } catch (error) {
            logger.error('Failed to mark item as played', { component: 'UserDataButtons', error });
        } finally {
            setLoading(null);
        }
    }, [item, isPlayed, isFavorite, loading, onUpdate]);

    const handleMarkFavorite = useCallback(async () => {
        if (loading === 'favorite') return;

        setLoading('favorite');
        try {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            const newFavoriteState = !isFavorite;

            await apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), item.Id, newFavoriteState);

            setIsFavorite(newFavoriteState);
            onUpdate?.({ Played: isPlayed, IsFavorite: newFavoriteState });

            logger.debug((newFavoriteState ? 'Added' : 'Removed') + ' item from favorites', {
                component: 'UserDataButtons',
                itemId: item.Id
            });
        } catch (error) {
            logger.error('Failed to update favorite status', { component: 'UserDataButtons', error });
        } finally {
            setLoading(null);
        }
    }, [item, isPlayed, isFavorite, loading, onUpdate]);

    const canMarkPlayed = includePlayed && item.UserData?.Played !== undefined;

    const getButtonClassName = (baseClass: string, isActive: boolean) => {
        let className = baseClass;
        if (cssClass) {
            className += ' ' + cssClass;
        }
        if (isActive) {
            className += ' btnUserDataOn';
        }
        return className;
    };

    const isFabStyle = style === 'fab' || style === 'fab-mini';
    const effectiveStyle = style === 'fab-mini' ? 'fab' : style;

    return (
        <div className="userDataButtons" style={{ display: 'flex', gap: vars.spacing['1'] }}>
            {canMarkPlayed && (
                <Tooltip title={globalize.translate(isPlayed ? 'MarkPlayed' : 'AddToPlayQueue')}>
                    <IconButton
                        variant="plain"
                        color={isPlayed ? 'primary' : 'neutral'}
                        size={effectiveStyle === 'fab' ? 'lg' : 'md'}
                        className={getButtonClassName('btnUserData', isPlayed)}
                        onClick={handleMarkPlayed}
                        disabled={loading === 'played'}
                        style={{
                            ...(effectiveStyle === 'fab' && {
                                borderRadius: '50%',
                                minWidth: 'auto',
                                width: 'auto',
                                height: 'auto'
                            }),
                            ...(style === 'fab-mini' && {
                                transform: 'scale(0.75)'
                            })
                        }}
                    >
                        <span className={`material-icons ${iconCssClass || ''}`}>{isPlayed ? 'check' : 'add'}</span>
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title={globalize.translate(isFavorite ? 'Favorite' : 'AddToFavorites')}>
                <IconButton
                    variant="plain"
                    color={isFavorite ? 'primary' : 'neutral'}
                    size={effectiveStyle === 'fab' ? 'lg' : 'md'}
                    className={getButtonClassName('btnUserData', isFavorite)}
                    onClick={handleMarkFavorite}
                    disabled={loading === 'favorite'}
                    style={{
                        ...(effectiveStyle === 'fab' && {
                            borderRadius: '50%',
                            minWidth: 'auto',
                            width: 'auto',
                            height: 'auto'
                        }),
                        ...(style === 'fab-mini' && {
                            transform: 'scale(0.75)'
                        })
                    }}
                >
                    <span className={`material-icons ${iconCssClass || ''}`}>
                        {isFavorite ? 'favorite' : 'favorite_border'}
                    </span>
                </IconButton>
            </Tooltip>
        </div>
    );
};

export default UserDataButtons;
