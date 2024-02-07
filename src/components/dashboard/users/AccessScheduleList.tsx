import React, { FunctionComponent } from 'react';
import datetime from '../../../scripts/datetime';
import globalize from '../../../scripts/globalize';
import IconButtonElement from '../../../elements/IconButtonElement';

type AccessScheduleListProps = {
    index: number;
    DayOfWeek?: string;
    StartHour?: number ;
    EndHour?: number;
};

function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

const AccessScheduleList: FunctionComponent<AccessScheduleListProps> = ({ index, DayOfWeek, StartHour, EndHour }: AccessScheduleListProps) => {
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
            <IconButtonElement
                is='paper-icon-button-light'
                className='btnDelete listItemButton'
                title='Delete'
                icon='delete'
                dataIndex={index}
            />
        </div>
    );
};

export default AccessScheduleList;
