import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import { ExternalLinkIcon, TrashIcon } from '@radix-ui/react-icons';
import ConfirmDialog from 'components/ConfirmDialog';
import globalize from 'lib/globalize';
import React, { useCallback, useState } from 'react';
import {
    Avatar,
    Heading,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemContent,
    ListItemDecorator,
    Text,
    Tooltip
} from 'ui-primitives';

interface IProps {
    repository: RepositoryInfo;
    onDelete: (repository: RepositoryInfo) => void;
}

const RepositoryListItem = ({ repository, onDelete }: IProps): React.ReactElement => {
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    const confirmDeletePrompt = useCallback(() => {
        setIsConfirmDeleteOpen(true);
    }, []);

    const onCancel = useCallback(() => {
        setIsConfirmDeleteOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        onDelete(repository);
        setIsConfirmDeleteOpen(false);
    }, [onDelete, repository]);

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteOpen}
                title={globalize.translate('ConfirmDeleteRepository')}
                text={globalize.translate('DeleteRepositoryConfirmation')}
                onConfirm={onConfirmDelete}
                onCancel={onCancel}
                confirmButtonColor="danger"
                confirmButtonText={globalize.translate('Delete')}
            />
            <ListItem
                style={{ paddingRight: 80 }}
                endAction={
                    <Tooltip title={globalize.translate('ButtonRemove')}>
                        <IconButton variant="plain" color="danger" onClick={confirmDeletePrompt}>
                            <TrashIcon />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton>
                    <ListItemDecorator>
                        <a
                            href={repository.Url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit' }}
                        >
                            <Avatar variant="soft" color="primary">
                                <ExternalLinkIcon />
                            </Avatar>
                        </a>
                    </ListItemDecorator>
                    <ListItemContent>
                        <Heading.H4 style={{ margin: 0 }}>{repository.Name}</Heading.H4>
                        <Text
                            size="xs"
                            color="secondary"
                            style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {repository.Url}
                        </Text>
                    </ListItemContent>
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default RepositoryListItem;
