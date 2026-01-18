import React, { useCallback } from 'react';
import Snackbar, { SnackbarProps } from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const Toast = (props: SnackbarProps) => {
    const onCloseClick = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        props.onClose?.(e, 'clickaway');
    }, [ props ]);

    const action = (
        <IconButton
            size='small'
            color='inherit'
            onClick={onCloseClick}
        >
            <CloseIcon fontSize='small' />
        </IconButton>
    );

    return (
        <Snackbar
            autoHideDuration={3300}
            action={action}
            { ...props }
        />
    );
};

export default Toast;
