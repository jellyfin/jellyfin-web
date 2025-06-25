import Album from '@mui/icons-material/Album';
import Lan from '@mui/icons-material/Lan';
import Memory from '@mui/icons-material/Memory';
import Storage from '@mui/icons-material/Storage';
import Usb from '@mui/icons-material/Usb';
import { type FC } from 'react';

import { StorageType } from '../constants/StorageType';

interface StorageTypeIconProps {
    type?: string | null
}

const StorageTypeIcon: FC<StorageTypeIconProps> = ({
    type
}) => {
    switch (type) {
        case StorageType.CDRom:
            return <Album />;
        case StorageType.Network:
            return <Lan />;
        case StorageType.Ram:
            return <Memory />;
        case StorageType.Removable:
            return <Usb />;
        default:
            return <Storage />;
    }
};

export default StorageTypeIcon;
