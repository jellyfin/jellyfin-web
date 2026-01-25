import { style } from '@vanilla-extract/css';

export const boxStyles = {
    flex: style({
        display: 'flex'
    }),
    flexRow: style({
        display: 'flex',
        flexDirection: 'row'
    }),
    flexCol: style({
        display: 'flex',
        flexDirection: 'column'
    }),
    inlineFlex: style({
        display: 'inline-flex'
    }),
    grid: style({
        display: 'grid'
    }),
    block: style({
        display: 'block'
    }),
    inline: style({
        display: 'inline'
    }),
    hidden: style({
        display: 'none'
    }),
    center: style({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    })
};

