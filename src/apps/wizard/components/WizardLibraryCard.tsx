import React, { useCallback, useRef, useState } from 'react';
import BaseCard from 'apps/dashboard/components/BaseCard';
import getCollectionTypeOptions from 'apps/dashboard/features/libraries/utils/collectionTypeOptions';
import globalize from 'lib/globalize';
import Icon from '@mui/material/Icon';
import { getLibraryIcon } from 'utils/image';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ListItemText from '@mui/material/ListItemText';
import InputDialog from 'components/InputDialog';
import ConfirmDialog from 'components/ConfirmDialog';
import type { WizardDraftLibrary } from 'apps/wizard/utils/wizardDraft';

interface WizardLibraryCardProps {
    library: WizardDraftLibrary;
    onRename: (newName: string) => void;
    onRemove: () => void;
}

// Libraries don't exist server-side until Finish, so unlike the Dashboard's LibraryCard
// this only supports Rename/Remove against the in-memory draft entry - no live server calls.
const WizardLibraryCard = ({ library, onRename, onRemove }: WizardLibraryCardProps) => {
    const actionRef = useRef<HTMLButtonElement | null>(null);
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);
    const [ isRenameDialogOpen, setIsRenameDialogOpen ] = useState(false);
    const [ isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen ] = useState(false);

    const typeName = getCollectionTypeOptions().find(t => t.value == library.CollectionType)?.name
        || globalize.translate('Other');
    const locations = (library.LibraryOptions?.PathInfos ?? [])
        .map(p => p.Path)
        .filter((p): p is string => !!p);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
    }, []);

    const onActionClick = useCallback(() => {
        setAnchorEl(actionRef.current);
        setIsMenuOpen(true);
    }, []);

    const openRenameDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsRenameDialogOpen(true);
    }, []);

    const hideRenameDialog = useCallback(() => {
        setIsRenameDialogOpen(false);
    }, []);

    const onConfirmRename = useCallback((newName: string) => {
        if (newName && newName !== library.Name) {
            onRename(newName);
        }
        hideRenameDialog();
    }, [ library, onRename, hideRenameDialog ]);

    const showDeleteDialog = useCallback(() => {
        setAnchorEl(null);
        setIsMenuOpen(false);
        setIsConfirmDeleteDialogOpen(true);
    }, []);

    const onCancelDelete = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        setIsConfirmDeleteDialogOpen(false);
        onRemove();
    }, [ onRemove ]);

    return (
        <>
            <InputDialog
                title={globalize.translate('ButtonRename')}
                open={isRenameDialogOpen}
                onClose={hideRenameDialog}
                label={globalize.translate('LabelNewName')}
                helperText={globalize.translate('MessageRenameMediaFolder')}
                initialText={library.Name}
                confirmButtonText={globalize.translate('ButtonRename')}
                onConfirm={onConfirmRename}
            />

            <ConfirmDialog
                open={isConfirmDeleteDialogOpen}
                title={globalize.translate('HeaderRemoveMediaFolder')}
                text={
                    globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder') + '\n\n'
                    + globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') + '\n\n'
                    + locations.join('\n')
                }
                confirmButtonText={globalize.translate('Delete')}
                confirmButtonColor='error'
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />

            <BaseCard
                title={library.Name}
                text={typeName}
                icon={<Icon sx={{ fontSize: 70 }}>{getLibraryIcon(library.CollectionType)}</Icon>}
                action={true}
                actionRef={actionRef}
                onActionClick={onActionClick}
                height={260}
            />
            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                <MenuItem onClick={openRenameDialog}>
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ButtonRename')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={showDeleteDialog}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('ButtonRemove')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default WizardLibraryCard;
