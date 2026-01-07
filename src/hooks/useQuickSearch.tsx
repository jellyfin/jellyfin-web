import React, { createContext, useContext, useState, useEffect, useCallback, type FC, type ReactNode } from 'react';

interface QuickSearchContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const QuickSearchContext = createContext<QuickSearchContextValue | null>(null);

interface QuickSearchProviderProps {
    children: ReactNode;
}

export const QuickSearchProvider: FC<QuickSearchProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('quicksearch:open', handleOpen);
        return () => window.removeEventListener('quicksearch:open', handleOpen);
    }, []);

    return (
        <QuickSearchContext.Provider value={{ isOpen, open, close }}>
            {children}
        </QuickSearchContext.Provider>
    );
};

export function useQuickSearch(): QuickSearchContextValue {
    const context = useContext(QuickSearchContext);
    if (!context) {
        throw new Error('useQuickSearch must be used within a QuickSearchProvider');
    }
    return context;
}
