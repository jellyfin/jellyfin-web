import React, { FunctionComponent } from 'react';
import datetime from '../../../scripts/datetime';
import globalize from '../../../scripts/globalize';

const createButtonElement = (index: number) => ({
    __html: `<button
        type='button'
        is='paper-icon-button-light'
        class='btnDelete listItemButton'
        data-index='${index}'
    >
        <span class='material-icons delete' aria-hidden='true' />
    </button>`
});

type IProps = {
    index: number;
    Id: number;
    DayOfWeek?: string;
    StartHour?: number ;
    EndHour?: number;
}

function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

const AccessScheduleList: FunctionComponent<IProps> = ({index, DayOfWeek, StartHour, EndHour}: IProps) => {
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
            <div
                dangerouslySetInnerHTML={createButtonElement(index)}
            />
        </div>
    );
};

export default AccessScheduleList;
