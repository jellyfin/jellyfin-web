import React, { ReactElement, useEffect, useState } from 'react';

/**
 * Component that changes the elevation of a child component when scrolled.
 */
const useScrollTrigger = () => {
    const [trigger, setTrigger] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setTrigger(window.scrollY > 0);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return trigger;
};

const ElevationScroll = ({
    children,
    elevate = false
}: {
    children: ReactElement;
    elevate?: boolean;
}) => {
    const trigger = useScrollTrigger();

    const isElevated = elevate || trigger;

    return React.cloneElement(children, {
        elevation: isElevated ? 4 : 0
    } as any);
};

export default ElevationScroll;
