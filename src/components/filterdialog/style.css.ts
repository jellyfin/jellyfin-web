import { style } from '@vanilla-extract/css';

export const dynamicFilterDialog = style({
    position: 'fixed',
    top: '5%',
    bottom: '5%',
    marginTop: 0,
    marginBottom: 0,
    marginRight: 0,
    borderRadius: 0,
    maxHeight: 'none',
    maxWidth: 'none',
    '@media': {
        'all and (min-height: 600px)': {
            top: '10%',
            bottom: '25%'
        },
        'all and (max-width: 400px)': {
            width: 'auto',
            left: '10vw',
            right: '10vw',
            marginLeft: 0
        },
        'all and (min-width: 400px)': {
            width: '20.16em',
            marginLeft: '-10.08em',
            left: '50%'
        }
    }
});
