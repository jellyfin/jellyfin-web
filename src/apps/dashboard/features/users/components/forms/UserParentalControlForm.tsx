import type { UserPolicy } from '@jellyfin/sdk/lib/generated-client/models/user-policy';
import { UnratedItem } from '@jellyfin/sdk/lib/generated-client/models/unrated-item';
import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import {
    type SubmitHandler,
    useForm,
    CheckboxButtonGroup,
    SelectElement
} from 'react-hook-form-mui';
import { localizationHooks, userHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';
import Loading from 'components/loading/LoadingComponent';
import { groupRatingOpts, parseValue } from '../../utils/item';
import TagsSetting from '../TagsSetting';
import AccessScheduleSetting from '../AccessScheduleSetting';

export interface ParentalFormValues
    extends Omit<UserPolicy, 'AllowedTags' | 'BlockedTags'> {
    AllowedTags?: { value: string }[];
    BlockedTags?: { value: string }[];
}

const unratedItemOpts = [
    { label: 'Books', id: UnratedItem.Book },
    { label: 'Channels', id: UnratedItem.ChannelContent },
    { label: 'LiveTV', id: UnratedItem.LiveTvChannel },
    { label: 'Movies', id: UnratedItem.Movie },
    { label: 'TabMusic', id: UnratedItem.Music },
    { label: 'Trailers', id: UnratedItem.Trailer },
    { label: 'Shows', id: UnratedItem.Series },
    { label: 'Other', id: UnratedItem.Other }
];

interface UserParentalControlFormProps {
    currentUserPolicy: UserPolicy;
    currentUserId: string;
}

const UserParentalControlForm: FC<UserParentalControlFormProps> = ({
    currentUserPolicy,
    currentUserId
}) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const updateUserPolicyMutation = userHooks.useUpdateUserPolicy();
    const { isLoading, data: parentalRatings } =
        localizationHooks.useGetParentalRatings();

    const { control, handleSubmit, reset, formState } =
        useForm<ParentalFormValues>({
            defaultValues: {
                ...currentUserPolicy,
                MaxParentalRating: currentUserPolicy.MaxParentalRating,
                AllowedTags: currentUserPolicy.AllowedTags ?
                    currentUserPolicy.AllowedTags.map((tag) => ({
                        value: tag
                    })) :
                    [],
                BlockedTags: currentUserPolicy.BlockedTags ?
                    currentUserPolicy.BlockedTags.map((tag) => ({
                        value: tag
                    })) :
                    []
            }
        });

    const onSubmit: SubmitHandler<ParentalFormValues> = useCallback(
        async (data) => {
            try {
                await updateUserPolicyMutation.mutateAsync({
                    userId: currentUserId,
                    userPolicy: {
                        ...data,
                        MaxParentalRating: parseValue(
                            String(data.MaxParentalRating)
                        ),
                        AllowedTags: data.AllowedTags?.map((tag) => tag.value),
                        BlockedTags: data.BlockedTags?.map((tag) => tag.value)
                    }
                });

                toast(globalize.translate('SettingsSaved'));
                await queryClient.invalidateQueries({
                    queryKey: ['UserById', currentUserId]
                });
            } catch (error) {
                toast(globalize.translate('ErrorDefault'));
                console.error(
                    '[UserParentalControlForm] Error during submission:',
                    error
                );
            }
        },
        [updateUserPolicyMutation, currentUserId, queryClient]
    );

    const handleCancel = useCallback(() => {
        reset();
    }, [reset]);

    if (isLoading) return <Loading />;

    return (
        <Stack component='form' spacing={2} onSubmit={handleSubmit(onSubmit)}>
            {parentalRatings?.length ? (
                <SelectElement
                    label={globalize.translate('LabelMaxParentalRating')}
                    name='MaxParentalRating'
                    control={control}
                    SelectProps={{ displayEmpty: true }}
                    InputLabelProps={{ shrink: true }}
                    options={groupRatingOpts(parentalRatings)}
                    fullWidth
                    helperText={globalize.translate('MaxParentalRatingHelp')}
                />
            ) : null}

            <Card sx={{ borderRadius: 2 }}>
                <CardHeader
                    title={globalize.translate('HeaderBlockItemsWithNoRating')}
                />
                <CardContent
                    sx={{
                        backgroundColor: theme.palette.background.paper
                    }}
                >
                    <CheckboxButtonGroup
                        name='BlockUnratedItems'
                        control={control}
                        options={unratedItemOpts.map((option) => ({
                            id: option.id,
                            label: globalize.translate(option.label)
                        }))}
                    />
                </CardContent>
            </Card>

            <TagsSetting
                name='AllowedTags'
                control={control}
                title={'LabelAllowContentWithTags'}
                subTitle={'AllowContentWithTagsHelp'}
            />

            <TagsSetting
                name='BlockedTags'
                control={control}
                title={'LabelBlockContentWithTags'}
                subTitle={'BlockContentWithTagsHelp'}
            />

            {!currentUserPolicy?.IsAdministrator && (
                <AccessScheduleSetting
                    control={control}
                    title={'HeaderAccessSchedule'}
                    subTitle={'HeaderAccessScheduleHelp'}
                />
            )}

            <Stack spacing={0.5}>
                <Button
                    type='submit'
                    className='emby-button raised button-submit block'
                    disabled={!formState.isDirty || formState.isSubmitting}
                >
                    {globalize.translate('Save')}
                </Button>
                <Button
                    className='emby-button raised button-cancel'
                    disabled={!formState.isDirty}
                    onClick={handleCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default UserParentalControlForm;
