import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import AlphaPicker from './alphaPicker';

// React compatibility wrapper component for alphaPicker.js
const AlphaPickerComponent = ({ onAlphaPicked = () => {} }) => {
    const [ alphaPicker, setAlphaPicker ] = useState(null);
    const element = useRef(null);

    useEffect(() => {
        setAlphaPicker(new AlphaPicker({
            element: element.current,
            mode: 'keyboard'
        }));

        element.current?.addEventListener('alphavalueclicked', onAlphaPicked);

        return () => {
            alphaPicker?.destroy();
        };
    }, []);

    useEffect(() => {

    }, [ alphaPicker ]);

    return (
        <div
            ref={element}
            className='alphaPicker align-items-center'
        />
    );
};

AlphaPickerComponent.propTypes = {
    onAlphaPicked: PropTypes.func
};

export default AlphaPickerComponent;
