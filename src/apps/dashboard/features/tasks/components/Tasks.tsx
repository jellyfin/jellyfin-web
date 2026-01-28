import React, { type FunctionComponent } from 'react';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import Task from './Task';
import { List } from 'ui-primitives';
import { Paper } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

interface TasksProps {
    category: string;
    tasks: TaskInfo[];
}

const Tasks: FunctionComponent<TasksProps> = ({ category, tasks }: TasksProps) => {
    return (
        <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
            <Heading.H3>{category}</Heading.H3>
            <Paper
                variant="outlined"
                style={{
                    borderRadius: vars.borderRadius.md,
                    overflow: 'hidden'
                }}
            >
                <List
                    style={{
                        '--list-item-padding-y': '12px',
                        '--list-item-padding-x': '16px',
                        backgroundColor: vars.colors.surface
                    }}
                >
                    {tasks.map((task, index) => (
                        <React.Fragment key={task.Id}>
                            <Task task={task} />
                            {index < tasks.length - 1 && (
                                <div style={{ height: 1, backgroundColor: vars.colors.divider }} />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Flex>
    );
};

export default Tasks;
