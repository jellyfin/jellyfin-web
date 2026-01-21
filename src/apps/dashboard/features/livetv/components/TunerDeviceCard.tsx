import React, { useCallback, useState } from 'react';
import type { TunerHostInfo } from '@jellyfin/sdk/lib/generated-client/models/tuner-host-info';
import BaseCard from 'components/cardbuilder/Card/BaseCard';
import { Menu, MenuItem } from 'ui-primitives/Menu';
import { IconButton } from 'ui-primitives/IconButton';
import getTunerName from '../utils/getTunerName';
import globalize from 'lib/globalize';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from 'components/ConfirmDialog';
import { useDeleteTuner } from '../api/useDeleteTuner';

// Inline SVG icons
const DvrIcon = () => (
    <svg width='70' height='70' viewBox='0 0 24 24' fill='currentColor'>
        <title>DVR</title>
        <path d='M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zm-10.5-9.5h3v3h-3zM5 8h3v3H5zm0 6h3v3H5zm12-6h3v3h-3zm0 6h3v3h-3z'/>
    </svg>
);

const EditIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>Edit</title>
        <path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z'/>
        <path d='M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/>
    </svg>
);

const DeleteIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
        <title>Delete</title>
        <path d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z'/>
    </svg>
);

interface TunerDeviceCardProps {
    tunerHost: TunerHostInfo;
}

const TunerDeviceCard = ({ tunerHost }: TunerDeviceCardProps) => {
    const navigate = useNavigate();
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const [ isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen ] = useState(false);
    const deleteTuner = useDeleteTuner();

    const navigateToEditPage = useCallback(() => {
        navigate(`/dashboard/livetv/tuner?id=${tunerHost.Id}`);
    }, [ navigate, tunerHost ]);

    const onDelete = useCallback(() => {
        if (tunerHost.Id) {
            deleteTuner.mutate({
                id: tunerHost.Id
            }, {
                onSettled: () => {
                    setIsConfirmDeleteDialogOpen(false);
                }
            });
        }
    }, [ deleteTuner, tunerHost ]);

    const showDeleteDialog = useCallback(() => {
        setIsMenuOpen(false);
        setIsConfirmDeleteDialogOpen(true);
    }, []);

    const onDeleteDialogClose = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
    }, []);

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteDialogOpen}
                title={globalize.translate('HeaderDeleteDevice')}
                text={globalize.translate('MessageConfirmDeleteTunerDevice')}
                onCancel={onDeleteDialogClose}
                onConfirm={onDelete}
                confirmButtonColor='danger'
                confirmButtonText={globalize.translate('Delete')}
            />

            <BaseCard
                title={tunerHost.FriendlyName || getTunerName(tunerHost.Type) || ''}
                text={tunerHost.Url || ''}
                icon={<DvrIcon />}
                action={true}
                onActionClick={() => setIsMenuOpen(true)}
                onClick={navigateToEditPage}
            />

            <Menu
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                trigger={<div />}
            >
                <MenuItem onClick={navigateToEditPage}>
                    <EditIcon />
                    <span>{globalize.translate('Edit')}</span>
                </MenuItem>
                <MenuItem onClick={showDeleteDialog} variant='danger'>
                    <DeleteIcon />
                    <span>{globalize.translate('Delete')}</span>
                </MenuItem>
            </Menu>
        </>
    );
};

export default TunerDeviceCard;
