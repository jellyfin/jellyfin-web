import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import { styled } from '@mui/joy/styles';
import datetime from '../../../../../../scripts/datetime';

const StyledTimeslotHeader = styled(Box)(({ theme }) => ({
    height: 40,
    width: '100%',
    display: 'flex',
    borderBottom: '1px solid',
    borderColor: theme.vars.palette.divider,
    backgroundColor: theme.vars.palette.background.level1,
}));

const TimeslotCell = styled(Box)(({ theme }) => ({
    width: `${(1 / 48) * 100}%`, // 30 mins in 24 hours
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(1),
    borderRight: '1px solid',
    borderColor: theme.vars.palette.divider,
}));

interface TimeslotHeaderProps {
    startDate: Date;
}

const TimeslotHeader: React.FC<TimeslotHeaderProps> = ({ startDate }) => {
    const slots = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < 48; i++) {
        slots.push(new Date(current));
        current.setMinutes(current.getMinutes() + 30);
    }

    return (
        <StyledTimeslotHeader>
            {slots.map((date, i) => (
                <TimeslotCell key={i}>
                    <Typography level="body-xs">
                        {datetime.getDisplayTime(date).toLowerCase()}
                    </Typography>
                </TimeslotCell>
            ))}
        </StyledTimeslotHeader>
    );
};

export default TimeslotHeader;
