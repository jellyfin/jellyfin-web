import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import classNames from 'classnames';
import React from 'react';
import itemHelper from '../../components/itemHelper';
import layoutManager from '../../components/layoutManager';
import './emby-button.scss';

interface IProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    item?: BaseItemDto;
    title?: string;
}

function TextActionButton(props: IProps) {
    const item = props.item;

    if (!item) {
        return null;
    }

    const text = props.title || itemHelper.getDisplayName(props.item);

    if (layoutManager.tv) {
        return text;
    }

    return (
        <button
            className={classNames('itemAction textActionButton', props.className)}
            title={text}
            aria-label={props['aria-label'] || props.title}
            data-action='link'
            data-id={item.Id}
            data-serverid={item.ServerId}
            data-type={item.Type}
            data-mediatype={item.MediaType}
            data-channelid={item.ChannelId}
            data-isfolder={item.IsFolder}
            data-collectiontype={item.CollectionType}
        >
            {text}
        </button>
    );
}

export default TextActionButton;
