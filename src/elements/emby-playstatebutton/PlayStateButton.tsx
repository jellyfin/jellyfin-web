import { BaseItemDto, UserItemDataDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { Component, MouseEvent } from 'react';
import Button from '../emby-button/Button';
import serverNotifications from '../../scripts/serverNotifications';
import { ApiClient, Event as EventObject, Events } from 'jellyfin-apiclient';
import globalize from '../../scripts/globalize';
import ServerConnections from '../../components/ServerConnections';

interface IProps {
    className: string;
    item: BaseItemDto;
    'aria-label'?: string;
}

interface IState {
    itemId: string;
    serverId: string;
    itemType: string;
    played: boolean;
}

class PlayStateButton extends Component<IProps, IState> {
    //element: null;

    constructor(props: IProps) {
        super(props);

        const item = this.props.item;

        if (item) {
            this.state = {
                itemId: item.Id || '',
                serverId: item.ServerId || '',
                itemType: item.Type || '',
                played: item.UserData?.Played || false
            };
        } else {
            this.state = {
                itemId: '',
                serverId: '',
                itemType: '',
                played: false
            };
        }

        //this.element = React.createRef()

        this.onClick = this.onClick.bind(this);
        this.onUserDataChanged = this.onUserDataChanged.bind(this);
    }

    // FIXME: Change item via props?
    setItem(item: BaseItemDto) {
        if (item) {
            const itemId = item.Id;
            const serverId = item.ServerId;

            if (itemId && serverId) {
                const itemType = item.Type || '';
                const played = item.UserData?.Played || false;

                this.bindEvents();

                this.setState({
                    itemId,
                    serverId,
                    itemType,
                    played
                });

                return;
            }
        }

        this.unbindEvents();

        this.setState({
            itemId: '',
            serverId: '',
            itemType: '',
            played: false
        });
    }

    bindEvents() {
        this.unbindEvents();

        if (this.state.itemId && this.state.serverId) {
            //this.element.current.addEventListener('click', this.onClick);
            Events.on(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
        }
    }

    unbindEvents() {
        //this.element.current.removeEventListener('click', this.onClick);
        Events.off(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
    }

    onClick(_e: MouseEvent<HTMLButtonElement>) {
        const itemId = this.state.itemId;
        const serverId = this.state.serverId;

        if (!itemId || !serverId) {
            //throw new Error('Unexpected click - item Id or server Id are undefined');
            return;
        }

        const apiClient = ServerConnections.getApiClient(serverId);
        const currentUserId = apiClient.getCurrentUserId();
        const date = new Date();

        if (!this.state.played) {
            apiClient.markPlayed(currentUserId, itemId, date);
            this.setState({played: true});
        } else {
            apiClient.markUnplayed(currentUserId, itemId, date);
            this.setState({played: false});
        }

        // FIXME: the original implementation uses `data-action="none"'
        //e.stopPropagation();
        //e.preventDefault();
    }

    onUserDataChanged(e: EventObject, apiClient: ApiClient, userData: UserItemDataDto) {
        if (userData.ItemId === this.state.itemId) {
            this.setState({played: userData.Played || false});
        }
    }

    componentDidMount() {
        this.bindEvents();
    }

    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (this.state.itemId !== prevState.itemId || this.state.serverId !== prevState.serverId) {
            this.bindEvents();
        }
    }

    componentWillUnmount() {
        this.unbindEvents();
    }

    /*handleRef(ref) {
        this.element.current = ref;
    }*/

    render() {
        const played = this.state.played;

        let buttonClass = this.props.className;

        if (played) {
            buttonClass += ' playstatebutton-played';
        }

        const iconClass = played ? 'playstatebutton-icon-played' : 'playstatebutton-icon-unplayed';

        const itemType = this.state.itemType;
        let title;

        if (itemType !== 'AudioBook' && itemType !== 'AudioPodcast') {
            title = played ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            title = played ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return (
            <Button
                className={buttonClass}
                title={title}
                aria-label={this.props['aria-label']}
                action='none'
                // FIXME: Probably unnecessary
                data-id={this.state.itemId}
                data-serverid={this.state.serverId}
                data-itemtype={itemType}
                data-played={played}
                onClick={this.onClick}
            >
                <span className={`material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check ${iconClass}`} aria-hidden='true'></span>
            </Button>
        );
    }
}

export default PlayStateButton;
