export function ticksToMs(ticks) {
    if (typeof ticks === 'number') {
        return ticks / 10000;
    } else {
        return ticks; // Undefined or not a number.
    }
}

export function msToTicks(milliseconds) {
    if (typeof milliseconds === 'number') {
        return milliseconds * 10000;
    } else {
        return milliseconds; // Undefined or not a number.
    }
}

export function ticksToSeconds(ticks) {
    if (typeof ticks === 'number') {
        return ticks / 10000000;
    } else {
        return ticks; // Undefined or not a number.
    }
}

export function msToSeconds(milliseconds) {
    if (typeof milliseconds === 'number') {
        return milliseconds / 1000;
    } else {
        return milliseconds; // Undefined or not a number.
    }
}

export function secondsToMs(seconds) {
    if (typeof seconds === 'number') {
        return seconds * 1000;
    } else {
        return seconds; // Undefined or not a number.
    }
}

export function secondsToTicks(seconds) {
    if (typeof seconds === 'number') {
        return seconds * 10000000;
    } else {
        return seconds; // Undefined or not a number.
    }
}
