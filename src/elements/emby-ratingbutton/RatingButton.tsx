import { BaseItemDto, UserItemDataDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import { ApiClient, Event as EventObject, Events } from 'jellyfin-apiclient';
import React, { Component } from 'react';
import ServerConnections from '../../components/ServerConnections';
import Button from '../emby-button/Button';
import globalize from '../../scripts/globalize';
import serverNotifications from '../../scripts/serverNotifications';

interface IProps {
    className: string;
    item: BaseItemDto;
    'aria-label'?: string;
}

interface IState {
    itemId: string;
    serverId: string;
    itemType: string;
    favorite: boolean;
    likes: boolean;
}

class RatingButton extends Component<IProps, IState> {
    //element: null;

    constructor(props: IProps) {
        super(props);

        const item = this.props.item;

        if (item) {
            this.state = {
                itemId: item.Id || '',
                serverId: item.ServerId || '',
                itemType: item.Type || '',
                favorite: item.UserData?.IsFavorite || false,
                likes: item.UserData?.Likes || false
            };
        } else {
            this.state = {
                itemId: '',
                serverId: '',
                itemType: '',
                favorite: false,
                likes: false
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
            const itemType = item.Type || '';
            const favorite = item.UserData?.IsFavorite || false;
            const likes = item.UserData?.Likes || false;

            if (itemId && serverId) {
                this.bindEvents();

                this.setState({
                    itemId,
                    serverId,
                    itemType,
                    favorite,
                    likes
                });

                return;
            }
        }

        this.unbindEvents();

        this.setState({
            itemId: '',
            serverId: '',
            itemType: '',
            favorite: false,
            likes: false
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

    onClick() {
        const itemId = this.state.itemId;
        const serverId = this.state.serverId;

        if (!itemId || !serverId) {
            //throw new Error('Unexpected click - item Id or server Id are undefined');
            return;
        }

        const apiClient = ServerConnections.getApiClient(serverId);

        apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), itemId, !this.state.favorite).then((userData) => {
            // FIXME: userData contains 'Key' instead of 'ItemId'
            this.onUserDataChanged(null, apiClient, userData);
        });
    }

    onUserDataChanged(e: EventObject|null, apiClient: ApiClient, userData: UserItemDataDto) {
        if (userData.ItemId === this.state.itemId) {
            this.setState({
                favorite: userData.IsFavorite || false,
                likes: userData.Likes || false
            });
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
        const isFavorite = this.state.favorite;

        let buttonClass = this.props.className;
        let iconClass = '';
        let title: string;

        if (isFavorite) {
            buttonClass += ' ratingbutton-withrating';
            iconClass += ' ratingbutton-icon-withrating';
            title = globalize.translate('Favorite');
        } else {
            title = globalize.translate('AddToFavorites');
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
                data-itemtype={this.state.itemType}
                data-isfavorite={isFavorite}
                data-likes={this.state.likes}
                onClick={this.onClick}
            >
                <span className={`material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite ${iconClass}`} aria-hidden='true'></span>
            </Button>
        );
    }
}

export default RatingButton;
