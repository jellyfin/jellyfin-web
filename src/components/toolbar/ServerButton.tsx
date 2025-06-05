import icon from './MBC_LOGO.png';
import Button from '@mui/material/Button/Button';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';

import { useSystemInfo } from 'hooks/useSystemInfo';

const ServerButton: FC = () => {
    const {
        data: systemInfo,
        isPending
    } = useSystemInfo();

    return (
      <>
      <img
        src={icon}
        alt="Server Logo"
        style={{ height: 24, marginRight: 8 }}
      />  
        
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
            {isPending ? '' : (systemInfo?.ServerName || 'BusanMBC')}
        </Button>
       </>
    );
};

export default ServerButton;
