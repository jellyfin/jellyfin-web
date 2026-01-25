import React from 'react';
import {
    CubeIcon,
    DesktopIcon,
    Link2Icon,
    MobileIcon,
    LaptopIcon,
    VideoIcon
} from '@radix-ui/react-icons';

import browser from 'scripts/browser';
import type { PlayTarget } from 'types/playTarget';

const PlayTargetIcon = ({ target }: { target: PlayTarget }) => {
    if (!target.deviceType && target.isLocalPlayer) {
        if (browser.tv) {
            return <VideoIcon />;
        } else if (browser.mobile) {
            return <MobileIcon />;
        }
        return <DesktopIcon />;
    }

    switch (target.deviceType) {
        case 'smartphone':
            return <MobileIcon />;
        case 'tablet':
            return <LaptopIcon />;
        case 'desktop':
            return <DesktopIcon />;
        case 'cast':
            return <Link2Icon />;
        case 'tv':
            return <VideoIcon />;
        default:
            return <CubeIcon />;
    }
};

export default PlayTargetIcon;
