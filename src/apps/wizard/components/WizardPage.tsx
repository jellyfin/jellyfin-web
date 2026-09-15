import React, { useCallback } from 'react';
import Container from '@mui/material/Container';
import Page, { type PageProps } from 'components/Page';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import globalize from 'lib/globalize';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import { Form, useLocation } from 'react-router-dom';
import { getWizardStepNumber, TOTAL_WIZARD_STEPS } from 'apps/wizard/utils/wizardSteps';

interface WizardPageProps extends PageProps {
    onNext?: () => void;
    onPrevious?: () => void;
    onFinish?: () => void;
    nextLabel?: string;
}

const WizardPage = ({ children, onNext, onPrevious, onFinish, nextLabel, ...pageProps }: WizardPageProps) => {
    const location = useLocation();
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (onNext) {
            onNext();
        } else if (onFinish) {
            onFinish();
        }
    }, [onNext, onFinish]);

    const stepId = location.pathname.split('/').pop();
    const stepNumber = getWizardStepNumber(stepId);

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
                                {nextLabel || globalize.translate('Next')}
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

                {stepNumber ? (
                    <Stack spacing={0.5} mt={4} alignItems='center'>
                        <Typography variant='caption' color='text.secondary'>
                            {globalize.translate('LabelWizardStep', stepNumber, TOTAL_WIZARD_STEPS)}
                        </Typography>
                        <LinearProgress
                            variant='determinate'
                            value={(stepNumber / TOTAL_WIZARD_STEPS) * 100}
                            sx={{ width: '12em', borderRadius: '0.4em' }}
                        />
                    </Stack>
                ) : null}
            </Container>
        </Page>
    );
};

export default WizardPage;
