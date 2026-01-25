import { Component2Icon, CubeIcon, DiscIcon, GlobeIcon, StackIcon } from '@radix-ui/react-icons';
import React, { type FC } from 'react';

import { StorageType } from '../constants/StorageType';

interface StorageTypeIconProps {
    type?: string | null
}

const StorageTypeIcon: FC<StorageTypeIconProps> = ({
    type
}) => {
    switch (type) {
        case StorageType.CDRom:
            return <DiscIcon />;
        case StorageType.Network:
            return <GlobeIcon />;
        case StorageType.Ram:
            return <CubeIcon />;
        case StorageType.Removable:
            return <Component2Icon />;
        default:
            return <StackIcon />;
    }
};

export default StorageTypeIcon;
