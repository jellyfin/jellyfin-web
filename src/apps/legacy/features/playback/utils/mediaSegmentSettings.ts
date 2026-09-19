import type { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';

import type { UserSettings } from 'scripts/settings/userSettings';

import { MediaSegmentAction } from '../constants/mediaSegmentAction';

const PREFIX = 'segmentTypeAction';

export const getId = (type: MediaSegmentType) => `${PREFIX}__${type}`;

export function getMediaSegmentAction(userSettings: UserSettings, type: MediaSegmentType): MediaSegmentAction {
    const action = userSettings.get(getId(type), false);

    return action ? action as MediaSegmentAction : MediaSegmentAction.AskToSkip;
}
