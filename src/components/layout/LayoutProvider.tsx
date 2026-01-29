import React, { FC, PropsWithChildren } from 'react';
import AppBody from '../AppBody';
import AppHeader from '../AppHeader';
import { MainLayout } from './MainLayout';
import { useDrawerGestures } from './useDrawerGestures';
import { useLayoutMode } from './useLayoutMode';
import { useLegacyDrawerSync } from './useLegacyDrawerSync';

export const LayoutProvider: FC<PropsWithChildren> = ({ children }) => {
    const { shouldHideLegacyHeader, isNewLayoutPath, isExperimentalLayout } = useLayoutMode();
    useDrawerGestures();
    useLegacyDrawerSync();

    return (
        <>
            <AppHeader isHidden={shouldHideLegacyHeader} />

            {isNewLayoutPath ? (
                children
            ) : isExperimentalLayout ? (
                <MainLayout>{children}</MainLayout>
            ) : (
                <AppBody>{children}</AppBody>
            )}
        </>
    );
};
