import Skeleton, { type SkeletonProps } from '@mui/material/Skeleton/Skeleton';
import React, { FC } from 'react';

interface LoadingSkeletonProps extends SkeletonProps {
    isLoading: boolean
}

export const LoadingSkeleton: FC<LoadingSkeletonProps> = ({
    children,
    isLoading,
    ...props
}) => (
    isLoading ? (
        <Skeleton {...props} />
    ) : (
        children
    )
);
