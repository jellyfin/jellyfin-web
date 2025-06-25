import icon from '@jellyfin/ux-web/icon-transparent.png';
import Button from '@mui/material/Button/Button';
import { Link } from 'react-router-dom';

import { useSystemInfo } from 'hooks/useSystemInfo';

export default function ServerButton() {
    const {
        data: systemInfo,
        isPending
    } = useSystemInfo();

    return (
        <Button
            variant='text'
            size='large'
            color='inherit'
            startIcon={
                <img
                    src={icon}
                    alt=''
                    aria-hidden
                    style={{
                        maxHeight: '1.25em',
                        maxWidth: '1.25em'
                    }}
                />
            }
            component={Link}
            to='/'
        >
            {isPending ? '' : (systemInfo?.ServerName || 'Jellyfin')}
        </Button>
    );
};
