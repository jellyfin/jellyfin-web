import useScrollTrigger from '@mui/material/useScrollTrigger';
import { ReactElement, cloneElement } from 'react';

/**
 * Component that changes the elevation of a child component when scrolled.
 */
const ElevationScroll = ({ children, elevate = false }: { children: ReactElement, elevate?: boolean }) => {
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0
    });

    const isElevated = elevate || trigger;

    return cloneElement(children, {
        color: isElevated ? 'default' : 'transparent',
        elevation: isElevated ? 4 : 0
    });
};

export default ElevationScroll;
