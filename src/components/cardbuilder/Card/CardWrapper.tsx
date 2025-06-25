import { type FC, type PropsWithChildren } from 'react';
import layoutManager from 'components/layoutManager';
import type { DataAttributes } from 'types/dataAttributes';

interface CardWrapperProps {
    className: string;
    dataAttributes: DataAttributes;
}

const CardWrapper: FC<PropsWithChildren<CardWrapperProps>> = ({
    className,
    dataAttributes,
    children
}) => {
    if (layoutManager.tv) {
        return (
            <button className={className} {...dataAttributes}>
                {children}
            </button>
        );
    } else {
        return (
            <div className={className} {...dataAttributes}>
                {children}
            </div>
        );
    }
};

export default CardWrapper;
