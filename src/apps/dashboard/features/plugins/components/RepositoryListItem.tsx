import React, { useCallback, useState } from 'react';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import ListItem from '@mui/material/ListItem';
import Tooltip from '@mui/material/Tooltip';
import Delete from '@mui/icons-material/Delete';
import globalize from 'lib/globalize';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Avatar from '@mui/material/Avatar';
import ListItemButton from '@mui/material/ListItemButton';
import Link from '@mui/material/Link';
import ConfirmDialog from 'components/ConfirmDialog';

type IProps = {
    repository: RepositoryInfo;
    onDelete: (repository: RepositoryInfo) => void;
};

const RepositoryListItem = ({ repository, onDelete }: IProps) => {
    const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState(false);

    const confirmDeletePrompt = useCallback(() => {
        setIsConfirmDeleteOpen(true);
    }, []);

    const onCancel = useCallback(() => {
        setIsConfirmDeleteOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        onDelete(repository);
        setIsConfirmDeleteOpen(false);
    }, [ onDelete, repository ]);

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteOpen}
                title={globalize.translate('ConfirmDeleteRepository')}
                text={globalize.translate('DeleteRepositoryConfirmation')}
                onConfirm={onConfirmDelete}
                onCancel={onCancel}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
            <ListItem
                disablePadding
                secondaryAction={
                    <Tooltip disableInteractive title={globalize.translate('ButtonRemove')}>
                        <IconButton onClick={confirmDeletePrompt}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton>
                    <Link href={repository.Url || '#'} target='_blank'>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <OpenInNew sx={{ color: '#fff' }} />
                            </Avatar>
                        </ListItemAvatar>
                    </Link>
                    <ListItemText
                        primary={repository.Name}
                        secondary={repository.Url}
                        slotProps={{
                            primary: {
                                variant: 'h3'
                            },
                            secondary: {
                                variant: 'body1'
                            }
                        }}
                    />
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default RepositoryListItem;
