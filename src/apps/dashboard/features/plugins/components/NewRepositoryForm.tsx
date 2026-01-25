import React, { useCallback } from 'react';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogPortal, DialogOverlayComponent, DialogContentClass } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Box, Flex, FlexRow, FlexCol } from 'ui-primitives/Box';
import globalize from 'lib/globalize';
import { Input } from 'ui-primitives/Input';
import { DialogContent, DialogOverlay } from 'ui-primitives/Dialog';
import { vars } from 'styles/tokens.css';

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
        <Dialog open={open} onOpenChange={open => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogOverlay />
                <DialogPrimitive.Content className={DialogContentClass} style={{ minWidth: 400 }}>
                    <Box style={{ padding: '24px' }}>
                        <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span
                                style={{
                                    fontSize: vars.typography.fontSizeMd,
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
                                        fontSize: vars.typography.fontSizeMd,
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

                                <FlexRow style={{ gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
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
