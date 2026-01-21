import React from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LyricsIcon from '@mui/icons-material/Lyrics';
import AirplayIcon from '@mui/icons-material/Airplay';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { vars } from 'styles/tokens.css';

export type PlaybackIconType =
    | 'play'
    | 'pause'
    | 'previous'
    | 'next'
    | 'stop'
    | 'volume-up'
    | 'volume-off'
    | 'repeat'
    | 'repeat-one'
    | 'shuffle'
    | 'favorite'
    | 'favorite-border'
    | 'lyrics'
    | 'airplay'
    | 'more-vert';

interface PlaybackIconButtonProps {
    icon?: PlaybackIconType;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'plain' | 'soft' | 'solid' | 'ghost' | 'danger';
    'aria-label'?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    sx?: React.CSSProperties;
}

const iconMap: Record<PlaybackIconType, React.ReactNode> = {
    'play': <PlayArrowIcon />,
    'pause': <PauseIcon />,
    'previous': <SkipPreviousIcon />,
    'next': <SkipNextIcon />,
    'stop': <StopIcon />,
    'volume-up': <VolumeUpIcon />,
    'volume-off': <VolumeOffIcon />,
    'repeat': <RepeatIcon />,
    'repeat-one': <RepeatOneIcon />,
    'shuffle': <ShuffleIcon />,
    'favorite': <FavoriteIcon />,
    'favorite-border': <FavoriteBorderIcon />,
    'lyrics': <LyricsIcon />,
    'airplay': <AirplayIcon />,
    'more-vert': <MoreVertIcon />,
};

export const PlaybackIconButton: React.FC<PlaybackIconButtonProps> = ({
    icon,
    active = false,
    size = 'sm',
    variant = 'plain',
    sx,
    'aria-label': ariaLabel,
    ...props
}) => {
    const iconNode = icon ? iconMap[icon] : null;

    return (
        <IconButton
            size={size}
            variant={variant}
            style={{
                color: active ? vars.colors.primary : vars.colors.text,
                transition: vars.transitions.fast,
                ...sx,
            }}
            aria-label={ariaLabel}
            {...props}
        >
            {iconNode}
        </IconButton>
    );
};
