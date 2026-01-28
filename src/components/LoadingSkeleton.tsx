import React, { FC } from 'react';
import { Skeleton, type SkeletonProps } from 'ui-primitives';

interface LoadingSkeletonProps extends SkeletonProps {
    isLoading: boolean;
    children?: React.ReactNode;
}

export const LoadingSkeleton: FC<LoadingSkeletonProps> = ({ children, isLoading, ...props }) =>
    isLoading ? <Skeleton {...props} /> : children;
