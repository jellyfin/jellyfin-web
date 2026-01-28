/**
 * MetadataDisplay - Track metadata display (title, artist, album)
 */

import { type ReactElement } from 'react';
import { Text } from 'ui-primitives';
import {
    container,
    title as titleStyle,
    artist as artistStyle,
    album as albumStyle,
    link
} from './MetadataDisplay.css.ts';

export interface MetadataDisplayProps {
    readonly title?: string | null;
    readonly artist?: string | null;
    readonly album?: string | null;
    readonly titleUrl?: string | null;
    readonly artistUrl?: string | null;
    readonly onTitleClick?: () => void;
    readonly onArtistClick?: () => void;
    readonly size?: 'sm' | 'md' | 'lg';
}

export function MetadataDisplay({
    title,
    artist,
    album,
    titleUrl,
    artistUrl,
    onTitleClick,
    onArtistClick,
    size = 'lg'
}: MetadataDisplayProps): ReactElement {
    const getTitleSize = (): 'sm' | 'md' | 'lg' | 'xl' => {
        if (size === 'sm') return 'md';
        if (size === 'md') return 'lg';
        return 'xl';
    };

    const getArtistSize = (): 'sm' | 'md' | 'lg' => {
        if (size === 'sm') return 'sm';
        return 'md';
    };

    const getAlbumSize = (): 'sm' | 'md' | 'lg' | 'xl' | 'xs' => {
        if (size === 'sm') return 'xs';
        if (size === 'md') return 'sm';
        return 'sm';
    };

    const hasTitle = title != null && title !== '';
    const hasArtist = artist != null && artist !== '';
    const hasAlbum = album != null && album !== '';

    const titleSize = getTitleSize();
    const artistSize = getArtistSize();
    const albumSize = getAlbumSize();

    const renderTitle = (): ReactElement | null => {
        if (!hasTitle) return null;

        const content = (
            <Text as="span" className={titleStyle} size={titleSize} color="primary">
                {title}
            </Text>
        );

        if (titleUrl != null || onTitleClick) {
            return (
                <a href={titleUrl ?? undefined} onClick={onTitleClick} className={link}>
                    {content}
                </a>
            );
        }

        return content;
    };

    const renderArtist = (): ReactElement | null => {
        if (!hasArtist) return null;

        const content = (
            <Text as="span" className={artistStyle} size={artistSize} color="secondary">
                {artist}
            </Text>
        );

        if (artistUrl != null || onArtistClick) {
            return (
                <a href={artistUrl ?? undefined} onClick={onArtistClick} className={link}>
                    {content}
                </a>
            );
        }

        return content;
    };

    return (
        <div className={container}>
            {renderTitle()}
            {renderArtist()}
            {hasAlbum && (
                <Text as="span" className={albumStyle} size={albumSize} color="secondary">
                    {album}
                </Text>
            )}
        </div>
    );
}
