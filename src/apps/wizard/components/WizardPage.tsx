import React, { useCallback } from 'react';
import Container from '@mui/material/Container';
import Page, { type PageProps } from 'components/Page';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import globalize from 'lib/globalize';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { Form } from 'react-router-dom';

interface WizardPageProps extends PageProps {
    onNext?: () => void;
    onPrevious?: () => void;
    onFinish?: () => void;
}

const WizardPage = ({ children, onNext, onPrevious, onFinish, ...pageProps }: WizardPageProps) => {
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (onNext) {
            onNext();
        } else if (onFinish) {
            onFinish();
        }
    }, [onNext, onFinish]);

    return (
        <Page
            className='mainAnimatedPage type-interior wizardPage'
            {...pageProps}
        >
            <Container className='padded-top' maxWidth='md'>
                <Form method='POST' onSubmit={onSubmit}>
                    {children}

                    <Stack
                        mt={6}
                        justifyContent={'flex-end'}
                        direction='row'
                        gap={1}
                    >
                        {onPrevious ? (
                            <Button
                                startIcon={<ArrowBackIcon />}
                                variant='outlined'
                                onClick={onPrevious}
                            >
                                {globalize.translate('Previous')}
                            </Button>
                        ) : null}

                        {onNext ? (
                            <Button
                                endIcon={<ArrowForwardIcon />}
                                type='submit'
                            >
                                {globalize.translate('Next')}
                            </Button>
                        ) : null}

                        {onFinish ? (
                            <Button
                                endIcon={<CheckIcon />}
                                type='submit'
                            >
                                {globalize.translate('LabelFinish')}
                            </Button>
                        ) : null}
                    </Stack>
                </Form>
            </Container>
        </Page>
    );
};

export default WizardPage;
