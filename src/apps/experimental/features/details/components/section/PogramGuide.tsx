import React, { type FC } from 'react';
import { useGetGroupProgramsByDate } from '../../api/useGetGroupProgramsByDate';
import Loading from 'components/loading/LoadingComponent';
import SectionContainer from 'components/common/SectionContainer';
import type { ItemDto } from 'types/base/models/item-dto';

interface PogramGuideProps {
    item: ItemDto;
}

const PogramGuide: FC<PogramGuideProps> = ({ item }) => {
    const {
        isLoading,
        data: groupedPrograms,
        refetch
    } = useGetGroupProgramsByDate(item.Id);

    if (isLoading) return <Loading />;
    if (!groupedPrograms?.length) return null;

    return (
        <>
            {groupedPrograms.map((groupsProgram) => (
                <SectionContainer
                    key={groupsProgram.name}
                    listMode
                    noPadding
                    sectionHeaderProps={{
                        title: groupsProgram.name
                    }}
                    itemsContainerProps={{
                        queryKey: ['PogramGuide'],
                        reloadItems: refetch
                    }}
                    items={groupsProgram.items}
                    listOptions={{
                        enableUserDataButtons: false,
                        showParentTitle: true,
                        image: false,
                        showProgramTime: true,
                        showMediaInfo: false,
                        includeParentInfoInTitle: true,
                        includeIndexNumber: true,
                        parentTitleWithTitle: true,
                        queryKey: ['PogramGuide']
                    }}
                />
            ))}
        </>
    );
};

export default PogramGuide;
