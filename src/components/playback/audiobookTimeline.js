export function getAudiobookCumulativeOffsetTicks(sources, index) {
    let offset = 0;
    for (let i = 0; i < index; i++) {
        offset += sources[i].RunTimeTicks || 0;
    }
    return offset;
}

export function getAudiobookPartForGlobalTicks(sources, globalTicks) {
    if (!sources || sources.length <= 1) {
        return null;
    }

    let offset = 0;
    for (let i = 0; i < sources.length; i++) {
        const runtime = sources[i].RunTimeTicks || 0;
        if (globalTicks < offset + runtime || i === sources.length - 1) {
            return {
                index: i,
                source: sources[i],
                localTicks: Math.max(0, globalTicks - offset)
            };
        }
        offset += runtime;
    }

    return null;
}
