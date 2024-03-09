export enum CardShape {
    Backdrop = 'backdrop',
    BackdropOverflow = 'overflowBackdrop',
    Banner = 'banner',
    Portrait = 'portrait',
    PortraitOverflow = 'overflowPortrait',
    Square = 'square',
    SquareOverflow = 'overflowSquare',
    Auto = 'auto',
    AutoHome = 'autohome',
    AutoOverflow = 'autooverflow',
    AutoVertical = 'autoVertical',
    Mixed = 'mixed',
    MixedSquare = 'mixedSquare',
    MixedBackdrop = 'mixedBackdrop',
    MixedPortrait = 'mixedPortrait',
}

export function getSquareShape(enableOverflow = true) {
    return enableOverflow ? CardShape.SquareOverflow : CardShape.Square;
}

export function getBackdropShape(enableOverflow = true) {
    return enableOverflow ? CardShape.BackdropOverflow : CardShape.Backdrop;
}

export function getPortraitShape(enableOverflow = true) {
    return enableOverflow ? CardShape.PortraitOverflow : CardShape.Portrait;
}
