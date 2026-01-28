import React, { FC, PropsWithChildren } from 'react';
import AppHeader from '../AppHeader';
import AppBody from '../AppBody';
import { useLayoutMode } from './useLayoutMode';
import { useDrawerGestures } from './useDrawerGestures';
import { useLegacyDrawerSync } from './useLegacyDrawerSync';
import { MainLayout } from './MainLayout';

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
                <MainLayout>
                    {children}
                </MainLayout>
            ) : (
                <AppBody>
                    {children}
                </AppBody>
            )}
        </>
    );
};
