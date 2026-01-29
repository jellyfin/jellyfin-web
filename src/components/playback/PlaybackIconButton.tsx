import {
    ChatBubbleIcon,
    DesktopIcon,
    DotsVerticalIcon,
    HeartFilledIcon,
    HeartIcon,
    LoopIcon,
    MixerHorizontalIcon,
    PauseIcon,
    PlayIcon,
    ShuffleIcon,
    SpeakerLoudIcon,
    SpeakerOffIcon,
    StopIcon,
    TrackNextIcon,
    TrackPreviousIcon
} from '@radix-ui/react-icons';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { IconButton } from 'ui-primitives';

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
    | 'more-vert'
    | 'crossfade';

interface PlaybackIconButtonProps {
    icon?: PlaybackIconType;
    active?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'plain' | 'soft' | 'solid' | 'ghost' | 'danger';
    className?: string;
    'aria-label'?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    sx?: React.CSSProperties;
}

const iconMap: Record<PlaybackIconType, React.ReactNode> = {
    play: <PlayIcon />,
    pause: <PauseIcon />,
    previous: <TrackPreviousIcon />,
    next: <TrackNextIcon />,
    stop: <StopIcon />,
    'volume-up': <SpeakerLoudIcon />,
    'volume-off': <SpeakerOffIcon />,
    repeat: <LoopIcon />,
    'repeat-one': <LoopIcon />,
    shuffle: <ShuffleIcon />,
    favorite: <HeartFilledIcon />,
    'favorite-border': <HeartIcon />,
    lyrics: <ChatBubbleIcon />,
    airplay: <DesktopIcon />,
    'more-vert': <DotsVerticalIcon />,
    crossfade: <MixerHorizontalIcon />
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
                ...sx
            }}
            aria-label={ariaLabel}
            {...props}
        >
            {iconNode}
        </IconButton>
    );
};
