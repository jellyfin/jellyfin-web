import React, { Component } from 'react';

export interface CardOverlayProps {
    action?: string;
    className?: string;
}

type IProps = React.PropsWithChildren<CardOverlayProps>

class CardOverlay extends Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }

    render() {
        return (
            <div className='cardOverlayContainer itemAction' data-action={this.props.action}>
                {this.props.children}
            </div>
        );
    }
}

export default CardOverlay;
