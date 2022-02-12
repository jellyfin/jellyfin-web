import React, { FunctionComponent } from 'react';
import layoutManager from '../layoutManager';

type IProps = React.PropsWithChildren<{
    action?: string;
    blurhash?: string;
    className?: string;
    imgUrl?: string;
}>

const CardMedia: FunctionComponent<IProps> = (props: IProps) => {
    if (props.imgUrl) {
        if (layoutManager.tv) {
            // Don't use the IMG tag with safari because it puts a white border around it
            return (
                <div
                    className={`${props.className} cardContent lazy`}
                    data-src={props.imgUrl}
                    data-blurhash={props.blurhash}
                >
                    {props.children}
                </div>
            );
        } else {
            // Don't use the IMG tag with safari because it puts a white border around it
            return (
                <button
                    className={`${props.className} cardContent itemAction lazy`}
                    data-action={props.action}
                    data-blurhash={props.blurhash}
                    data-src={props.imgUrl}
                >
                    {props.children}
                </button>
            );
        }
    } else {
        if (layoutManager.tv) {
            return (
                <div className={`${props.className} cardContent`}>{props.children}</div>
            );
        } else {
            return (
                <button className={`${props.className} cardContent itemAction`} data-action={props.action}>{props.children}</button>
            );
        }
    }
};

export default CardMedia;
