import React, { FC } from 'react';
import datetime from '../../../scripts/datetime';
import globalize from '../../../scripts/globalize';
import IconButton from '../../../elements/emby-button/IconButton';

function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

interface AccessScheduleListProps {
    index: number;
    Id?: number;
    DayOfWeek?: string;
    StartHour?: number ;
    EndHour?: number;
}

const AccessScheduleList: FC<AccessScheduleListProps> = ({ index, DayOfWeek, StartHour, EndHour }) => {
    return (
        <div
            className='liSchedule listItem'
            data-day={ DayOfWeek}
            data-start={ StartHour}
            data-end={ EndHour}
        >
            <div className='listItemBody two-line'>
                <h3 className='listItemBodyText'>
                    {globalize.translate(DayOfWeek)}
                </h3>
                <div className='listItemBodyText secondary'>
                    {getDisplayTime(StartHour) + ' - ' + getDisplayTime(EndHour)}
                </div>
            </div>
            <IconButton
                type='button'
                className='btnDelete listItemButton'
                title='Delete'
                icon='delete'
                data-index={index}
            />
        </div>
    );
};

export default AccessScheduleList;
