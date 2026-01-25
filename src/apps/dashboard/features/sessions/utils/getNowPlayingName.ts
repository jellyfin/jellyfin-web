import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import itemHelper from 'components/itemHelper';
import { formatDistanceToNow } from 'date-fns';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale';

interface NowPlayingInfo {
    topText?: string;
    bottomText: string;
    image?: string;
}

const getNowPlayingName = (session: SessionInfo): NowPlayingInfo => {
    let imgUrl = '';
    const nowPlayingItem = session.NowPlayingItem;
    // FIXME: It seems that, sometimes, server sends date in the future, so date-fns displays messages like 'in less than a minute'. We should fix
    // how dates are returned by the server when the session is active and show something like 'Active now', instead of past/future sentences
    if (!nowPlayingItem) {
        return {
            bottomText: globalize.translate(
                'LastSeen',
                formatDistanceToNow(Date.parse(session.LastActivityDate!), getLocaleWithSuffix())
            )
        };
    }

    let topText = itemHelper.getDisplayName({
        ...nowPlayingItem,
        Id: nowPlayingItem.Id ?? ''
    } as import('components/itemHelper').BaseItem);
    let bottomText = '';

    if (nowPlayingItem.Artists?.length) {
        bottomText = topText;
        topText = nowPlayingItem.Artists[0];
    } else if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
        bottomText = topText;
        topText = (nowPlayingItem.SeriesName || nowPlayingItem.Album) ?? '';
    } else if (nowPlayingItem.ProductionYear) {
        bottomText = nowPlayingItem.ProductionYear.toString();
    }

    if (nowPlayingItem.ImageTags?.Logo) {
        imgUrl = ServerConnections.getApiClient(session.ServerId!).getScaledImageUrl(nowPlayingItem.Id!, {
            tag: nowPlayingItem.ImageTags.Logo,
            maxHeight: 24,
            maxWidth: 130,
            type: 'Logo'
        });
    } else if (nowPlayingItem.ParentLogoImageTag) {
        imgUrl = ServerConnections.getApiClient(session.ServerId!).getScaledImageUrl(nowPlayingItem.ParentLogoItemId!, {
            tag: nowPlayingItem.ParentLogoImageTag,
            maxHeight: 24,
            maxWidth: 130,
            type: 'Logo'
        });
    }

    return {
        topText: topText,
        bottomText: bottomText,
        image: imgUrl
    };
};

export default getNowPlayingName;
