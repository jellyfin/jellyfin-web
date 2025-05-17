import React, { type FC, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import RecordingFields from 'components/recordingcreator/recordingfields';

interface RecordingFieldsContainerProps {
    programId: string;
    serverId?: string | null;
}

const RecordingFieldsContainer: FC<RecordingFieldsContainerProps> = ({
    programId,
    serverId
}) => {
    const recordingFieldsInstance = useRef<RecordingFields | null>();
    const recordingFieldsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = recordingFieldsRef.current;
        if (!element) {
            console.error('Unexpected null reference');
            return;
        }
        if (!recordingFieldsInstance.current) {
            recordingFieldsInstance.current = new RecordingFields({
                parent: element,
                programId: programId,
                serverId: serverId
            });
        }

        return () => {
            if (recordingFieldsInstance.current) {
                recordingFieldsInstance.current.destroy();
                recordingFieldsInstance.current = null;
            }
        };
    }, [programId, serverId]);

    return (
        <Box
            ref={recordingFieldsRef}
            className='recordingFields'
            sx={{ margin: '0.5em 0 1.5em' }}
        />
    );
};

export default RecordingFieldsContainer;
