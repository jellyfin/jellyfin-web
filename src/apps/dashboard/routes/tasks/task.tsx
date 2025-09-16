import React, { useCallback, useMemo, useState } from 'react';
import Page from 'components/Page';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import Loading from 'components/loading/LoadingComponent';
import { MRT_ColumnDef, MRT_Table, useMaterialReactTable } from 'material-react-table';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import globalize from '../../../../lib/globalize';
import { useTask } from 'apps/dashboard/features/tasks/api/useTask';
import { useUpdateTask } from 'apps/dashboard/features/tasks/api/useUpdateTask';
import ConfirmDialog from 'components/ConfirmDialog';
import TaskTriggerCell from 'apps/dashboard/features/tasks/components/TaskTriggerCell';
import NewTriggerForm from 'apps/dashboard/features/tasks/components/NewTriggerForm';

export const Component = () => {
    const { id: taskId } = useParams();
    const updateTask = useUpdateTask();
    const { data: task, isLoading } = useTask({ taskId: taskId || '' });
    const [ isAddTriggerDialogOpen, setIsAddTriggerDialogOpen ] = useState(false);
    const [ isRemoveConfirmOpen, setIsRemoveConfirmOpen ] = useState(false);
    const [ pendingDeleteTrigger, setPendingDeleteTrigger ] = useState<TaskTriggerInfo | null>(null);

    const onCloseRemoveConfirmDialog = useCallback(() => {
        setPendingDeleteTrigger(null);
        setIsRemoveConfirmOpen(false);
    }, []);

    const onDeleteTrigger = useCallback((trigger: TaskTriggerInfo | null | undefined) => {
        if (trigger) {
            setPendingDeleteTrigger(trigger);
            setIsRemoveConfirmOpen(true);
        }
    }, []);

    const onConfirmDelete = useCallback(() => {
        const triggersRemaining = task?.Triggers?.filter(trigger => trigger !== pendingDeleteTrigger);

        if (task?.Id && triggersRemaining) {
            updateTask.mutate({
                taskId: task.Id,
                taskTriggerInfo: triggersRemaining
            });
            setIsRemoveConfirmOpen(false);
        }
    }, [task, pendingDeleteTrigger, updateTask]);

    const showAddTriggerDialog = useCallback(() => {
        setIsAddTriggerDialogOpen(true);
    }, []);

    const handleNewTriggerDialogClose = useCallback(() => {
        setIsAddTriggerDialogOpen(false);
    }, []);

    const onNewTriggerAdd = useCallback((trigger: TaskTriggerInfo) => {
        if (task?.Triggers && task?.Id) {
            const triggers = [...task.Triggers, trigger];

            updateTask.mutate({
                taskId: task.Id,
                taskTriggerInfo: triggers
            });
            setIsAddTriggerDialogOpen(false);
        }
    }, [task, updateTask]);

    const columns = useMemo<MRT_ColumnDef<TaskTriggerInfo>[]>(() => [
        {
            id: 'TriggerTime',
            accessorFn: row => row,
            Cell: TaskTriggerCell,
            header: globalize.translate('LabelTime')
        }
    ], []);

    const table = useMaterialReactTable({
        columns,
        data: task?.Triggers || [],

        enableSorting: false,
        enableFilters: false,
        enableColumnActions: false,
        enablePagination: false,

        state: {
            isLoading
        },

        muiTableContainerProps: {
            sx: {
                maxHeight: 'calc(100% - 7rem)' // 2 x 3.5rem for header and footer
            }
        },

        // Custom actions
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: ''
            }
        },
        renderRowActions: ({ row }) => {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <Tooltip disableInteractive title={globalize.translate('ButtonRemove')}>
                        <IconButton
                            color='error'
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => onDeleteTrigger(row.original)}
                        >
                            <RemoveCircleIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        }
    });

    if (isLoading || !task) {
        return <Loading />;
    }

    return (
        <Page
            id='scheduledTaskPage'
            className='mainAnimatedPage type-interior'
        >
            <ConfirmDialog
                open={isRemoveConfirmOpen}
                title={globalize.translate('HeaderDeleteTaskTrigger')}
                text={globalize.translate('MessageDeleteTaskTrigger')}
                onCancel={onCloseRemoveConfirmDialog}
                onConfirm={onConfirmDelete}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('ButtonRemove')}
            />
            <NewTriggerForm
                open={isAddTriggerDialogOpen}
                title={globalize.translate('ButtonAddScheduledTaskTrigger')}
                onClose={handleNewTriggerDialogClose}
                onAdd={onNewTriggerAdd}
            />
            <Box className='content-primary'>
                <Box className='readOnlyContent'>
                    <Stack spacing={2}>
                        <Typography variant='h2'>{task.Name}</Typography>
                        <Typography variant='body1'>{task.Description}</Typography>
                        <Button
                            sx={{ alignSelf: 'flex-start' }}
                            startIcon={<AddIcon />}
                            onClick={showAddTriggerDialog}
                        >{globalize.translate('ButtonAddScheduledTaskTrigger')}</Button>
                        <MRT_Table table={table} />
                    </Stack>
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TaskPage';
