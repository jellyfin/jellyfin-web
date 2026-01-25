import React from 'react';
import { CircularProgress } from 'ui-primitives/CircularProgress';
import { useUiStore } from '../../../store';

export const LoadingOverlay: React.FC = () => {
    const isLoading = useUiStore(state => state.isLoading);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 20000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 1 : 0,
                pointerEvents: isLoading ? 'auto' : 'none',
                transition: 'opacity 0.2s ease'
            }}
        >
            <CircularProgress size='lg' />
        </div>
    );
};
