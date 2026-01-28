import React, { type FunctionComponent } from 'react';
import { type TaskProps } from '../types/taskProps';
import { Progress } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

const TaskProgress: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const progress = task.CurrentProgressPercentage;

    return (
        <Box
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: vars.spacing['4'],
                marginTop: vars.spacing['2'],
                minWidth: '170px'
            }}
        >
            {progress != null ? (
                <>
                    <Progress value={progress} style={{ flex: 1, borderRadius: vars.borderRadius.sm }} />
                    <Text size="xs" style={{ fontWeight: vars.typography.fontWeightBold }}>
                        {`${Math.round(progress)}%`}
                    </Text>
                </>
            ) : (
                <Progress style={{ flex: 1, borderRadius: vars.borderRadius.sm }} />
            )}
        </Box>
    );
};

export default TaskProgress;
