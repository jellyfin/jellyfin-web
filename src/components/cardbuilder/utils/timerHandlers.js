export function onTimerCreated(programId, newTimerId, itemsContainer) {
    if (!itemsContainer) {
        return;
    }

    itemsContainer.querySelectorAll('.btnTimer').forEach((btn) => {
        if (programId === btn.getAttribute('data-program-id')) {
            btn.innerHTML = newTimerId;
        }
    });
}

export function onTimerCancelled(timerId, itemsContainer) {
    if (!itemsContainer) {
        return;
    }

    itemsContainer.querySelectorAll('.btnTimer').forEach((btn) => {
        if (timerId === btn.getAttribute('data-timer-id')) {
            btn.innerHTML = '<i class="md-icon">alarm_add</i>';
        }
    });
}

export function onSeriesTimerCancelled(cancelledTimerId, itemsContainer) {
    if (!itemsContainer) {
        return;
    }

    itemsContainer.querySelectorAll('.btnTimer').forEach((btn) => {
        if (cancelledTimerId === btn.getAttribute('data-timer-id')) {
            btn.innerHTML = '<i class="md-icon">series_record</i>';
        }
    });
}
