import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import globalize from 'lib/globalize';
import React, { useCallback } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogContentClass,
    DialogOverlay,
    DialogOverlayComponent,
    DialogPortal,
    Flex,
    FlexCol,
    FlexRow,
    Input
} from 'ui-primitives';

interface IProps {
    open: boolean;
    onClose: () => void;
    onAdd: (repository: RepositoryInfo) => void;
}

const NewRepositoryForm = ({ open, onClose, onAdd }: IProps) => {
    const onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());

            const repository: RepositoryInfo = {
                Name: data.Name?.toString(),
                Url: data.Url?.toString(),
                Enabled: true
            };

            onAdd(repository);
        },
        [onAdd]
    );

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogOverlay />
                <DialogPrimitive.Content className={DialogContentClass} style={{ minWidth: 400 }}>
                    <Box style={{ padding: vars.spacing['5'] }}>
                        <FlexRow
                            style={{
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16
                            }}
                        >
                            <span
                                style={{
                                    fontSize: vars.typography['6'].fontSize,
                                    fontWeight: vars.typography.fontWeightMedium
                                }}
                            >
                                {globalize.translate('HeaderNewRepository')}
                            </span>
                            <DialogPrimitive.Close asChild>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: vars.typography['6'].fontSize,
                                        color: vars.colors.textSecondary
                                    }}
                                    type="button"
                                >
                                    ×
                                </button>
                            </DialogPrimitive.Close>
                        </FlexRow>

                        <form onSubmit={onSubmit}>
                            <FlexCol style={{ gap: 24, marginTop: 8 }}>
                                <Input
                                    name="Name"
                                    label={globalize.translate('LabelRepositoryName')}
                                    helperText={globalize.translate('LabelRepositoryNameHelp')}
                                    required
                                    autoFocus
                                />

                                <Input
                                    name="Url"
                                    label={globalize.translate('LabelRepositoryUrl')}
                                    helperText={globalize.translate('LabelRepositoryUrlHelp')}
                                    type="url"
                                    required
                                />

                                <FlexRow
                                    style={{ gap: 8, justifyContent: 'flex-end', marginTop: 16 }}
                                >
                                    <Button type="submit">{globalize.translate('Add')}</Button>
                                    <Button onClick={onClose} variant="ghost">
                                        {globalize.translate('ButtonCancel')}
                                    </Button>
                                </FlexRow>
                            </FlexCol>
                        </form>
                    </Box>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </Dialog>
    );
};

export default NewRepositoryForm;
