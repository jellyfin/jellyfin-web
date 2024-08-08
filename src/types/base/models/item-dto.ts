import type { BaseItemDto, CollectionTypeOptions, SearchHint, SeriesTimerInfoDto, TimerInfoDto, UserItemDataDto, VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client';
import type { ItemStatusType } from './item-status';
import type { ItemType } from './item-kind';
import type { ItemMediaType } from './item-media-kind';

type BaseItem = Omit<BaseItemDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Status' | 'Type' | 'Artists' | 'MediaType' | 'Name' | 'CollectionType'>;
type TimerInfo = Omit<TimerInfoDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Status' | 'Type' | 'Name'>;
type SeriesTimerInfo = Omit<SeriesTimerInfoDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Type' | 'Name'>;
type SearchHintItem = Omit<SearchHint, 'ItemId' |'Artists' | 'Id' | 'MediaType' | 'Name' | 'StartDate' | 'Type'>;
type UserItem = Omit<UserItemDataDto, 'ItemId'>;
type VirtualFolder = Omit<VirtualFolderInfo, 'CollectionType'>;

export interface ItemDto extends BaseItem, TimerInfo, SeriesTimerInfo, SearchHintItem, UserItem, VirtualFolder {
    'ChannelId'?: string | null;
    'EndDate'?: string | null;
    'Id'?: string | null;
    'StartDate'?: string | null;
    'Type'?: ItemType | string | null;
    'Status'?: ItemStatusType | string | null;
    'CollectionType'?: CollectionTypeOptions | string | null;
    'Artists'?: Array<string> | null;
    'MediaType'?: ItemMediaType | string | null;
    'Name'?: string | null;
    'ItemId'?: string | null;
}
