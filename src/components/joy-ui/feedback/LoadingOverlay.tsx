import React from 'react';
import Backdrop from '@mui/joy/Backdrop';
import CircularProgress from '@mui/joy/CircularProgress';
import { useUiStore } from '../../../store';

export const LoadingOverlay: React.FC = () => {
    const isLoading = useUiStore(state => state.isLoading);

    return (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: 20000,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
            }}
            open={isLoading}
        >
            <CircularProgress color="primary" size="lg" />
        </Backdrop>
    );
};
