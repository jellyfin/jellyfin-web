export function getSelectedMediaSource(page, mediaSources) {
    const mediaSourceId = page.querySelector('.selectSource').value;
    return mediaSources.filter((m) => m.Id === mediaSourceId)[0];
}

export function onTrackSelectionsSubmit(e) {
    e.preventDefault();
    return false;
}
