import React, { FunctionComponent } from 'react';
import { TaskProps } from '../types/taskProps';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

const TaskProgress: FunctionComponent<TaskProps> = ({ task }: TaskProps) => {
    const progress = task.CurrentProgressPercentage;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '1.2rem' }}>
            {progress != null ? (
                <>
                    <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress variant='determinate' value={progress} />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                        <Typography
                            variant='body1'
                        >{`${Math.round(progress)}%`}</Typography>
                    </Box>
                </>
            ) : (
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                </Box>
            )}
        </Box>
    );
};

export default TaskProgress;
