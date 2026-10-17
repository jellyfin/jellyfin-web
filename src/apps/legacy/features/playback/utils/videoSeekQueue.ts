import { TICKS_PER_SECOND } from 'constants/time';
import { createDoubleClickSeek } from './doubleClickSeek';

interface Request {
    target: number;
    blocked: boolean;
}

/** Serialize gesture seeks while player position is cached or a stream is restarting. */
export function createVideoSeekQueue(seek: (ticks: number) => unknown) {
    const acceleration = createDoubleClickSeek();
    let outstanding: Request | undefined;
    let logicalTarget: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function invalidate() {
        logicalTarget = undefined;
        acceleration.reset();
        if (outstanding) outstanding.blocked = true;
    }

    function reset() {
        clearTimeout(timer);
        timer = undefined;
        outstanding = undefined;
        logicalTarget = undefined;
        acceleration.reset();
    }

    function dispatch(target: number) {
        const request = { target, blocked: false };
        outstanding = request;
        timer = setTimeout(() => {
            if (outstanding === request) invalidate();
        }, 10_000);
        try {
            const result = seek(target);
            // Local seeks return void. A rejection does not prove stream work was canceled.
            Promise.resolve(result).catch(() => {
                if (outstanding === request) invalidate();
            });
            return true;
        } catch {
            if (outstanding === request) reset();
            return false;
        }
    }

    return {
        request(direction: -1 | 1, position: number, duration?: number) {
            if (!Number.isFinite(position) || outstanding?.blocked) return false;
            const end = duration != null && Number.isFinite(duration) && duration > 0 ? duration : undefined;
            const target = acceleration.getPosition(direction, logicalTarget ?? position, end);
            logicalTarget = target;
            if (outstanding) return true;
            // Already at a boundary: no request to wait for, and no invented completion.
            if ((target === 0 || target === end) && Math.abs(position - target) <= TICKS_PER_SECOND) {
                logicalTarget = undefined;
                return true;
            }
            return dispatch(target);
        },
        observe(position: number) {
            if (!outstanding || !Number.isFinite(position)
                || Math.abs(position - outstanding.target) > TICKS_PER_SECOND) return;
            clearTimeout(timer);
            timer = undefined;
            outstanding = undefined;
            const target = logicalTarget;
            logicalTarget = undefined;
            if (target != null && Math.abs(target - position) > TICKS_PER_SECOND) dispatch(target);
        },
        invalidate,
        reset
    };
}
