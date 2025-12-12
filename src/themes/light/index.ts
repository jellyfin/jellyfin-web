import type { ColorSystemOptions } from '@mui/material/styles';
import merge from 'lodash-es/merge';

import { DEFAULT_COLOR_SCHEME } from '@/themes/_base/theme';

/** The "Light" color scheme. */
const theme = merge<ColorSystemOptions, ColorSystemOptions, ColorSystemOptions>(
    {},
    DEFAULT_COLOR_SCHEME,
    {
        palette: {
            mode: 'light',
            background: {
                default: '#f2f2f2',
                paper: '#e8e8e8'
            },
            text: {
                primary: '#000',
                secondary: 'rgba(0, 0, 0, 0.87)'
            },
            action: {
                focus: '#bbb',
                hover: '#ddd'
            },
            Alert: {
                infoFilledBg: '#fff3a5',
                infoFilledColor: '#000'
            },
            AppBar: {
                defaultBg: '#e8e8e8'
            },
            Button: {
                inheritContainedBg: '#d8d8d8',
                inheritContainedHoverBg: '#ccc'
            }
        }
    }
);

export default theme;
