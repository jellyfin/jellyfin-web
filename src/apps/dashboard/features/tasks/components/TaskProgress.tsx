import React, { FunctionComponent } from 'react';
import { TaskProps } from '../types/taskProps';
import Box from '@mui/joy/Box';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';

const TaskProgress: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const progress = task.CurrentProgressPercentage;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mt: 0.5,
                minWidth: '170px'
            }}
        >
            {progress != null ? (
                <>
                    <LinearProgress
                        determinate
                        value={progress}
                        color="primary"
                        sx={{ flex: 1, borderRadius: 'sm' }}
                    />
                    <Typography level="body-xs" fontWeight="bold">
                        {`${Math.round(progress)}%`}
                    </Typography>
                </>
            ) : (
                <LinearProgress
                    color="primary"
                    sx={{ flex: 1, borderRadius: 'sm' }}
                />
            )}
        </Box>
    );
};

export default TaskProgress;