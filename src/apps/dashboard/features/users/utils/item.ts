import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';
import datetime from 'scripts/datetime';

export function parseValue(value: string): number | null | undefined {
    if (value === '') {
        return undefined;
    } else if (value === 'null') {
        return null;
    } else {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    }
}

interface Rating {
    label?: string | null;
    id: string;
}

export function groupRatingOpts(parentalRatings: ParentalRating[]) {
    const ratings: Rating[] = [{ label: 'None', id: '' }];

    for (const { Name, Value } of parentalRatings) {
        const rating = {
            label: Name,
            id: Value !== undefined && Value !== null ? String(Value) : 'null'
        };

        const existingRating = ratings.find((r) => r.id === rating.id);
        if (existingRating) {
            existingRating.label += '/' + rating.label;
        } else {
            ratings.push(rating);
        }
    }

    return ratings;
}

export function getDevicesTitle(item: DeviceInfoDto) {
    let title = item?.CustomName || item.Name;
    const appName = item?.AppName;

    if (appName) {
        title += ' - ' + appName;
    }

    return title;
}

export function getDisplayTime(hours = 0) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = Math.floor(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 0, 1, hours, minutes, 0, 0));
}

export function generateTimeSlots() {
    const timeSlots = [];

    for (let i = 0; i < 24; i += 0.5) {
        timeSlots.push({ id: i, label: getDisplayTime(i) });
    }

    timeSlots.push({ id: 24, label: getDisplayTime(24) });

    return timeSlots;
}
