import React, { useState, useRef, useCallback, type ChangeEvent, type FormEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeftIcon, UploadIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormLabel, FormControl } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { Cross2Icon } from '@radix-ui/react-icons';
import { getSubtitleApi } from '@jellyfin/sdk/lib/utils/api/subtitle-api';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { readFileAsBase64 } from 'utils/file';
import globalize from 'lib/globalize';
import { vars } from 'styles/tokens.css.ts';
import { createRoot } from 'react-dom/client';

interface SubtitleUploaderProps {
    isOpen: boolean;
    onClose: (hasChanges?: boolean) => void;
    itemId: string;
    serverId: string;
    languages?: { list: string; value: string };
}

const VALID_SUBTITLE_EXTENSIONS = ['.sub', '.srt', '.vtt', '.ass', '.ssa', '.mks'];

function isValidSubtitleFile(file: File): boolean {
    return file && VALID_SUBTITLE_EXTENSIONS.some(ext => file.name.endsWith(ext));
}

export function SubtitleUploader({ isOpen, onClose, itemId, serverId, languages }: SubtitleUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [language, setLanguage] = useState('');
    const [isForced, setIsForced] = useState(false);
    const [isHearingImpaired, setIsHearingImpaired] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && isValidSubtitleFile(selectedFile)) {
            setFile(selectedFile);
        } else {
            setFile(null);
        }
    }, []);

    const handleBrowse = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        try {
            const apiClient = ServerConnections.getApiClient(serverId);
            const subtitleApi = getSubtitleApi(toApi(apiClient));
            const data = await readFileAsBase64(file);
            const format = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();

            await subtitleApi.uploadSubtitle({
                itemId,
                uploadSubtitleDto: {
                    Data: data,
                    Language: language,
                    IsForced: isForced,
                    Format: format,
                    IsHearingImpaired: isHearingImpaired
                }
            });

            onClose(true);
        } catch (error) {
            console.error('Failed to upload subtitle:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = useCallback(() => {
        setFile(null);
        setLanguage('');
        setIsForced(false);
        setIsHearingImpaired(false);
        onClose(false);
    }, [onClose]);

    const dialogContentStyle: React.CSSProperties = {
        backgroundColor: vars.colors.surface,
        borderRadius: vars.borderRadius.lg,
        boxShadow: vars.shadows.xl,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        zIndex: vars.zIndex.modal
    };

    const dialogOverlayStyle: React.CSSProperties = {
        backgroundColor: vars.colors.overlay,
        position: 'fixed',
        inset: 0,
        animation: 'fade-in 150ms ease',
        zIndex: vars.zIndex.modalBackdrop
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && handleClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay style={dialogOverlayStyle} />
                <DialogPrimitive.Content style={dialogContentStyle}>
                    <Box style={{ padding: vars.spacing['5'] }}>
                        <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['5'] }}>
                            <Heading.H3 style={{ margin: 0 }}>{globalize.translate('HeaderUploadSubtitle')}</Heading.H3>
                            <DialogPrimitive.Close asChild>
                                <button
                                    type="button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    aria-label={globalize.translate('ButtonClose')}
                                >
                                    <Cross2Icon />
                                </button>
                            </DialogPrimitive.Close>
                        </Flex>

                        <form onSubmit={handleSubmit}>
                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['4'], marginBottom: vars.spacing['4'] }}>
                                    <Heading.H4 style={{ margin: 0 }}>
                                        {globalize.translate('HeaderAddUpdateSubtitle')}
                                    </Heading.H4>
                                    <Button type="button" variant="secondary" onClick={handleBrowse}>
                                        <UploadIcon style={{ marginRight: '8px' }} />
                                        {globalize.translate('Browse')}
                                    </Button>
                                </Flex>

                                <Box
                                    style={{
                                        position: 'relative',
                                        border: `2px dashed ${vars.colors.textSecondary}`,
                                        borderRadius: vars.borderRadius.md,
                                        padding: '48px 24px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onClick={handleBrowse}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".sub,.srt,.vtt,.ass,.ssa,.mks"
                                        onChange={handleFileChange}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {file ? (
                                        <Flex style={{ alignItems: 'center', justifyContent: 'center', gap: vars.spacing['2'] }}>
                                            <Text>{file.name}</Text>
                                        </Flex>
                                    ) : (
                                        <Text color="secondary">{globalize.translate('LabelDropSubtitleHere')}</Text>
                                    )}
                                </Box>
                            </Box>

                            {file && (
                                <>
                                    <Box style={{ marginBottom: vars.spacing['5'] }}>
                                        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'], marginBottom: '12px' }}>
                                            <FormControl>
                                                <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                                                    <Checkbox
                                                        checked={isForced}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            setIsForced(e.target.checked)
                                                        }
                                                    />
                                                    <FormLabel style={{ marginBottom: 0 }}>
                                                        {globalize.translate('LabelIsForced')}
                                                    </FormLabel>
                                                </Flex>
                                            </FormControl>
                                        </Flex>

                                        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                                            <FormControl>
                                                <Flex style={{ alignItems: 'center', gap: vars.spacing['2'] }}>
                                                    <Checkbox
                                                        checked={isHearingImpaired}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            setIsHearingImpaired(e.target.checked)
                                                        }
                                                    />
                                                    <FormLabel style={{ marginBottom: 0 }}>
                                                        {globalize.translate('LabelIsHearingImpaired')}
                                                    </FormLabel>
                                                </Flex>
                                            </FormControl>
                                        </Flex>
                                    </Box>

                                    <Box style={{ marginBottom: vars.spacing['5'] }}>
                                        <FormControl>
                                            <FormLabel>{globalize.translate('LabelLanguage')}</FormLabel>
                                            <Select value={language} onValueChange={setLanguage}>
                                                <SelectTrigger style={{ width: '100%' }}>
                                                    <SelectValue placeholder={globalize.translate('SelectLanguage')} />
                                                    <SelectContent>
                                                        {languages?.list && (
                                                            <div dangerouslySetInnerHTML={{ __html: languages.list }} />
                                                        )}
                                                    </SelectContent>
                                                </SelectTrigger>
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Flex style={{ gap: vars.spacing['3'], justifyContent: 'flex-end' }}>
                                        <Button type="button" variant="ghost" onClick={handleClose}>
                                            {globalize.translate('ButtonCancel')}
                                        </Button>
                                        <Button type="submit" variant="primary" loading={isUploading}>
                                            {globalize.translate('Upload')}
                                        </Button>
                                    </Flex>
                                </>
                            )}
                        </form>
                    </Box>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

interface UseSubtitleUploaderOptions {
    itemId: string;
    serverId: string;
    languages?: { list: string; value: string };
}

export function useSubtitleUploader(options: UseSubtitleUploaderOptions) {
    const [isOpen, setIsOpen] = useState(false);
    const [resolvePromise, setResolvePromise] = useState<((hasChanges: boolean) => void) | null>(null);

    const show = (): Promise<boolean> => {
        return new Promise(resolve => {
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    };

    const handleClose = (hasChanges = false) => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(hasChanges);
        }
    };

    const dialog = (
        <SubtitleUploader
            isOpen={isOpen}
            onClose={handleClose}
            itemId={options.itemId}
            serverId={options.serverId}
            languages={options.languages}
        />
    );

    return { show, dialog };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SubtitleUploader {
    export function show(options: UseSubtitleUploaderOptions): Promise<boolean> {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        return new Promise(resolve => {
            function handleClose(hasChanged = false) {
                root.unmount();
                document.body.removeChild(container);
                resolve(hasChanged);
            }

            root.render(
                <SubtitleUploader
                    isOpen={true}
                    onClose={handleClose}
                    itemId={options.itemId}
                    serverId={options.serverId}
                    languages={options.languages}
                />
            );
        });
    }
}

export default SubtitleUploader;
