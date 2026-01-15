import React from 'react';
import Cast from '@mui/icons-material/Cast';
import Computer from '@mui/icons-material/Computer';
import Devices from '@mui/icons-material/Devices';
import Smartphone from '@mui/icons-material/Smartphone';
import Tablet from '@mui/icons-material/Tablet';
import Tv from '@mui/icons-material/Tv';

import browser from '@/scripts/browser';
import type { PlayTarget } from '@/types/playTarget';

const PlayTargetIcon = ({ target }: { target: PlayTarget }) => {
    if (!target.deviceType && target.isLocalPlayer) {
        if (browser.tv) {
            return <Tv />;
        } else if (browser.mobile) {
            return <Smartphone />;
        }
        return <Computer />;
    }

    switch (target.deviceType) {
        case 'smartphone':
            return <Smartphone />;
        case 'tablet':
            return <Tablet />;
        case 'desktop':
            return <Computer />;
        case 'cast':
            return <Cast />;
        case 'tv':
            return <Tv />;
        default:
            return <Devices />;
    }
};

export default PlayTargetIcon;
