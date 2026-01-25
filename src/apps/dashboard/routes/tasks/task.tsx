import React, { useCallback, useMemo, useState } from 'react';
import Page from 'components/Page';
import { useParams } from '@tanstack/react-router';
import { MinusCircledIcon, PlusIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Heading, Text } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import Loading from 'components/loading/LoadingComponent';
import type { TaskTriggerInfo } from '@jellyfin/sdk/lib/generated-client/models/task-trigger-info';
import type { ColumnDef } from '@tanstack/react-table';
import type { CellContext } from '@tanstack/react-table';
import { vars } from 'styles/tokens.css';
import globalize from '../../../../lib/globalize';
import { useTask } from 'apps/dashboard/features/tasks/api/useTask';
import { useUpdateTask } from 'apps/dashboard/features/tasks/api/useUpdateTask';
import ConfirmDialog from 'components/ConfirmDialog';
import TaskTriggerCell from 'apps/dashboard/features/tasks/components/TaskTriggerCell';
import NewTriggerForm from 'apps/dashboard/features/tasks/components/NewTriggerForm';
import { DataTable } from 'ui-primitives/DataTable';

export const Component = (): React.ReactElement => {
    const { id: taskId } = useParams({ strict: false }) as { id?: string };
    const updateTask = useUpdateTask();
    const { data: task, isLoading } = useTask({ taskId: taskId || '' });
    const [isAddTriggerDialogOpen, setIsAddTriggerDialogOpen] = useState(false);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [pendingDeleteTrigger, setPendingDeleteTrigger] = useState<TaskTriggerInfo | null>(null);

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
        const triggersRemaining = task?.Triggers?.filter(trigger => trigger != pendingDeleteTrigger);

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

    const onNewTriggerAdd = useCallback(
        (trigger: TaskTriggerInfo) => {
            if (task?.Triggers && task?.Id) {
                const triggers = [...task.Triggers, trigger];

                updateTask.mutate({
                    taskId: task.Id,
                    taskTriggerInfo: triggers
                });
                setIsAddTriggerDialogOpen(false);
            }
        },
        [task, updateTask]
    );

    const columns = useMemo<ColumnDef<TaskTriggerInfo, any>[]>(
        () => [
            {
                id: 'TriggerTime',
                accessorFn: row => row,
                cell: (info: any) => <TaskTriggerCell {...info} />,
                header: globalize.translate('LabelTime')
            }
        ],
        []
    );

    const renderRowActions = useCallback(
        (row: TaskTriggerInfo) => {
            return (
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}
                >
                    <Tooltip title={globalize.translate('ButtonRemove')}>
                        <IconButton variant="danger" onClick={() => onDeleteTrigger(row)}>
                            <MinusCircledIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        },
        [onDeleteTrigger]
    );

    if (isLoading || !task) {
        return <Loading />;
    }

    return (
        <Page id="scheduledTaskPage" className="mainAnimatedPage type-interior">
            <ConfirmDialog
                open={isRemoveConfirmOpen}
                title={globalize.translate('HeaderDeleteTaskTrigger')}
                message={globalize.translate('MessageDeleteTaskTrigger')}
                onCancel={onCloseRemoveConfirmDialog}
                onConfirm={onConfirmDelete}
                isDestructive={true}
                confirmText={globalize.translate('ButtonRemove')}
            />
            <NewTriggerForm
                open={isAddTriggerDialogOpen}
                title={globalize.translate('ButtonAddScheduledTaskTrigger')}
                onClose={handleNewTriggerDialogClose}
                onAdd={onNewTriggerAdd}
            />
            <Box className="content-primary">
                <Box className="readOnlyContent">
                    <Flex direction="column" gap={vars.spacing.md}>
                        <Heading.H2>{task.Name}</Heading.H2>
                        <Text>{task.Description}</Text>
                        <Button
                            style={{ alignSelf: 'flex-start' }}
                            startDecorator={<PlusIcon />}
                            onClick={showAddTriggerDialog}
                        >
                            {globalize.translate('ButtonAddScheduledTaskTrigger')}
                        </Button>
                        <Box style={{ maxHeight: 'calc(100% - 7rem)', overflow: 'auto' }}>
                            <DataTable
                                data={task.Triggers || []}
                                columns={columns as any}
                                enableRowActions={true}
                                renderRowActions={renderRowActions}
                                sortable={false}
                            />
                        </Box>
                    </Flex>
                </Box>
            </Box>
        </Page>
    );
};

Component.displayName = 'TaskPage';
