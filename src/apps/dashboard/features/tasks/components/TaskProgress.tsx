import React, { type FunctionComponent } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Flex, Progress, Text } from 'ui-primitives';
import { type TaskProps } from '../types/taskProps';

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
                    <Progress
                        value={progress}
                        style={{ flex: 1, borderRadius: vars.borderRadius.sm }}
                    />
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
