import React, { useCallback, useRef, useState } from 'react';
import type { TunerHostInfo } from '@jellyfin/sdk/lib/generated-client/models/tuner-host-info';
import BaseCard from 'apps/dashboard/components/BaseCard';
import DvrIcon from '@mui/icons-material/Dvr';
import getTunerName from '../utils/getTunerName';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ListItemText from '@mui/material/ListItemText';
import globalize from 'lib/globalize';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from 'components/ConfirmDialog';
import { useDeleteTuner } from '../api/useDeleteTuner';
import { useTunerHostTypes } from '../api/useTunerHostTypes';

interface TunerDeviceCardProps {
    tunerHost: TunerHostInfo;
}

const TunerDeviceCard = ({ tunerHost }: TunerDeviceCardProps) => {
    const navigate = useNavigate();
    const actionRef = useRef<HTMLButtonElement | null>(null);
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const [ isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen ] = useState(false);
    const deleteTuner = useDeleteTuner();
    const { data: tunerTypes } = useTunerHostTypes();

    // Prefer the name the server reports for this tuner type; this covers plugin-provided tuners that the
    // static getTunerName() list does not know about. getTunerName is kept as a fallback while it loads.
    const typeName = tunerTypes?.find(type => type.Id === tunerHost.Type)?.Name;

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
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsConfirmDeleteDialogOpen(true);
    }, []);

    const onDeleteDialogClose = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
    }, []);

    const onActionClick = useCallback(() => {
        setAnchorEl(actionRef.current);
        setIsMenuOpen(true);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteDialogOpen}
                title={globalize.translate('HeaderDeleteDevice')}
                text={globalize.translate('MessageConfirmDeleteTunerDevice')}
                onCancel={onDeleteDialogClose}
                onConfirm={onDelete}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />

            <BaseCard
                title={tunerHost.FriendlyName || typeName || getTunerName(tunerHost.Type) || ''}
                text={tunerHost.Url || ''}
                icon={<DvrIcon sx={{ fontSize: 70 }} />}
                action={true}
                actionRef={actionRef}
                onActionClick={onActionClick}
                onClick={navigateToEditPage}
            />

            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                <MenuItem onClick={navigateToEditPage}>
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('Edit')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showDeleteDialog}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('Delete')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default TunerDeviceCard;
