import { BaseItemDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import { ApiClient, Event as EventObject, Events } from 'jellyfin-apiclient';
import React, { Component } from 'react';
import ProgressRing from '../emby-progressring/ProgressRing';
import serverNotifications from '../../scripts/serverNotifications';

interface IProps {
    className?: string;
    item?: BaseItemDto;
}

interface IState {
    progress: number;
    status: string;
}

class ItemRefreshIndicator extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            progress: /*props.item.RefreshProgress ||*/ 0,
            status: /*props.item.RefreshStatus ||*/ ''
        };

        this.onRefreshProgress = this.onRefreshProgress.bind(this);
    }

    bindEvents() {
        this.unbindEvents();

        if (this.props.item?.Id) {
            Events.on(serverNotifications, 'RefreshProgress', this.onRefreshProgress);
        }
    }

    unbindEvents() {
        Events.off(serverNotifications, 'RefreshProgress', this.onRefreshProgress);
    }

    onRefreshProgress(e: EventObject, apiClient: ApiClient, info: any) {
        if (info.ItemId === this.props.item?.Id) {
            this.setState({
                progress: info.progress || 0
            });
        }
    }

    componentDidMount() {
        this.bindEvents();
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.item?.Id !== prevProps.item?.Id) {
            this.bindEvents();
        }
    }

    componentWillUnmount() {
        this.unbindEvents();
    }

    render() {
        let className = this.props.className;

        if (!this.state.progress || this.state.progress >= 100) {
            className += ' hide';
        }

        return (
            <ProgressRing className={className} progress={this.state.progress} status={this.state.status}/>
        );
    }
}

export default ItemRefreshIndicator;
