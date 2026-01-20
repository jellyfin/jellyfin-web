import React, { useCallback, useState } from 'react';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import ListItem from '@mui/joy/ListItem';
import Tooltip from '@mui/joy/Tooltip';
import Delete from '@mui/icons-material/Delete';
import globalize from 'lib/globalize';
import IconButton from '@mui/joy/IconButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Avatar from '@mui/joy/Avatar';
import ListItemButton from '@mui/joy/ListItemButton';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
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
                confirmButtonColor='danger'
                confirmButtonText={globalize.translate('Delete')}
            />
            <ListItem
                endAction={
                    <Tooltip title={globalize.translate('ButtonRemove')} variant="soft">
                        <IconButton
                            variant="plain"
                            color="danger"
                            onClick={confirmDeletePrompt}
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton>
                    <ListItemDecorator>
                        <Link
                            href={repository.Url || '#'}
                            target='_blank'
                            rel='noopener noreferrer'
                            sx={{ color: 'inherit' }}
                        >
                            <Avatar variant="soft" color="primary">
                                <OpenInNew />
                            </Avatar>
                        </Link>
                    </ListItemDecorator>
                    <ListItemContent>
                        <Typography level="title-md">{repository.Name}</Typography>
                        <Typography level="body-xs" color="neutral" noWrap>
                            {repository.Url}
                        </Typography>
                    </ListItemContent>
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default RepositoryListItem;