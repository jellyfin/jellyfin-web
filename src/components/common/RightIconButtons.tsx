import { type FC } from 'react';
import IconButton from '@mui/material/IconButton';

interface RightIconButtonsProps {
    className?: string;
    id: string;
    icon: string;
    title: string;
}

const RightIconButtons: FC<RightIconButtonsProps> = ({ className, id, title, icon }) => {
    return (
        <IconButton
            className={className}
            data-action='custom'
            data-customaction={id}
            title={title}
        >
            {icon}
        </IconButton>
    );
};

export default RightIconButtons;
