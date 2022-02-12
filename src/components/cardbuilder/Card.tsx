import classNames from 'classnames';
import React, { FunctionComponent, ReactNode } from 'react';
import cardBuilder from './cardBuilder';
import CardInnerFooter from './CardInnerFooter';
import CardInnerHeader from './CardInnerHeader';
import CardMedia from './CardMedia';
import CardOuterFooter from './CardOuterFooter';
import layoutManager from '../layoutManager';
import './card.scss';

/**
 * Shape of card.
 */
export enum Shape {
    Portrait = 'portrait',
    Thumb = 'thumb',
    Square = 'square',
    Banner = 'banner',
    Backdrop = 'backdrop',
    SmallBackdrop = 'smallBackdrop',
}

export interface CardProps {
    attributes?: any; // FIXME: Is there a better way to pass 'data-' attributes?
    backgroundClass?: string;
    blurhash?: string;
    cardLayout?: boolean;
    className?:string;
    coverImage?: boolean;
    coverImageContain?: boolean;
    defaultText?: string;
    imgUrl?: string;
    shape?: Shape;
}

type IProps = React.PropsWithChildren<CardProps>

type CardPadderProps = React.PropsWithChildren<{
    shape: Shape
}>

function CardPadder(props: CardPadderProps) {
    return (
        <div className={`cardPadder cardPadder-${props.shape}`}>{props.children}</div>
    );
}

type CardWrapperProps = React.PropsWithChildren<{
    attributes?: any;
    className?: string;
}>

function CardWrapper(props: CardWrapperProps) {
    if (layoutManager.tv) {
        return (
            <button className={classNames(props.className, 'itemAction')} {...props.attributes}>
                {props.children}
            </button>
        );
    } else {
        return (
            <div className={props.className} {...props.attributes}>
                {props.children}
            </div>
        );
    }
}

/**
 * Generic card.
 */
const Card: FunctionComponent<IProps> = (props) => {
    let {
        attributes,
        backgroundClass,
        blurhash,
        cardLayout,
        children,
        className,
        coverImage,
        coverImageContain,
        defaultText = '',
        imgUrl,
        shape = Shape.Portrait
    } = props;

    const cardInnerHeader: ReactNode[] = [];
    // FIXME: What to do with provided CardMedia?
    const cardMedia: ReactNode[] = [];
    const cardInnerFooter: ReactNode[] = [];
    const cardOuterFooter: ReactNode[] = [];
    const restChildren: ReactNode[] = [];

    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            if (child.type === CardMedia) {
                cardMedia.push(child);
                return;
            } else if (child.type === CardInnerHeader) {
                cardInnerHeader.push(child);
                return;
            } else if (child.type === CardInnerFooter) {
                cardInnerFooter.push(child);
                return;
            } else if (child.type === CardOuterFooter) {
                if (cardLayout) {
                    // FIXME: Add 'cardLayout' to CardOuterFooter?
                    child = React.cloneElement(child, {
                        key: cardOuterFooter.length,
                        className: 'cardFooter-transparent'
                    });
                }
                cardOuterFooter.push(child);
                return;
            }
        }

        restChildren.push(child);
    });

    const cardClass = `card ${shape}Card ${className}`;

    let cardBoxClass = cardLayout ? 'cardBox visualCardBox' : 'cardBox';

    if (cardOuterFooter.length && !cardLayout) {
        cardBoxClass += ' cardBox-bottompadded';
    }

    let cardImageContainerClass = 'cardImageContainer';

    if (coverImage) {
        cardImageContainerClass += ' coveredImage';

        if (coverImageContain) {
            cardImageContainerClass += ' coveredImage-contain';
        }
    }

    if (!imgUrl) {
        if (!backgroundClass) {
            backgroundClass = cardBuilder.getDefaultBackgroundClass('');
        }

        cardImageContainerClass += ` ${backgroundClass}`;
    }

    return (
        <CardWrapper className={cardClass} attributes={attributes}>
            <div className={cardBoxClass}>
                <div className='cardScalable'>
                    <CardPadder shape={shape}>
                        {imgUrl ? <div dangerouslySetInnerHTML={{__html: defaultText}}></div> : null}
                    </CardPadder>

                    <CardMedia
                        blurhash={blurhash}
                        className={cardImageContainerClass}
                        imgUrl={imgUrl}
                    >
                        {cardInnerHeader}
                        {!imgUrl ? <div dangerouslySetInnerHTML={{__html: defaultText}}></div> : null}
                        {cardInnerFooter}
                    </CardMedia>

                    {restChildren}
                </div>

                {cardOuterFooter}
            </div>
        </CardWrapper>
    );
};

export default Card;
