import React from 'react';
import datetime from '../../../../../../scripts/datetime';
import { Text } from 'ui-primitives/Text';
import * as styles from './TimeslotHeader.css';

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
        <div className={styles.styledTimeslotHeader}>
            {slots.map((date) => (
                <div key={date.getTime()} className={styles.timeslotCell}>
                    <Text size="xs">
                        {datetime.getDisplayTime(date).toLowerCase()}
                    </Text>
                </div>
            ))}
        </div>
    );
};

export default TimeslotHeader;
