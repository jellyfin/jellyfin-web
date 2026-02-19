import { ItemDto } from './item-dto';

export interface ItemDtoQueryResult {
    Items?: Array<ItemDto>;
    TotalRecordCount?: number;
    StartIndex?: number;
}
