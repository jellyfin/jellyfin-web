import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';

import { UserSettings } from 'scripts/settings/userSettings';

import { MediaSegmentAction } from '../constants/mediaSegmentAction';

const PREFIX = 'segmentTypeAction';

export const getId = (type: MediaSegmentType) => `${PREFIX}__${type}`;

export function getMediaSegmentAction(userSettings: UserSettings, type: MediaSegmentType): MediaSegmentAction {
    const action = userSettings.get(getId(type), false);
    let defaultAction = MediaSegmentAction.None;
    if (type === MediaSegmentType.Intro || type === MediaSegmentType.Outro) {
        defaultAction = MediaSegmentAction.AskToSkip;
    }
    return action ? action as MediaSegmentAction : defaultAction;
}
