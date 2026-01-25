import React, { useEffect, useState } from 'react';
import globalize from 'lib/globalize';
import itemHelper from 'components/itemHelper';
import layoutManager from 'components/layoutManager';
import { getReadableSize } from 'utils/file';
import { copy } from 'scripts/clipboard';
import toast from 'components/toast/toast';

interface ItemMediaInfoComponentProps {
    user: any;
    item: any;
}

const ItemMediaInfoComponent: React.FC<ItemMediaInfoComponentProps> = ({ user, item }) => {
    const handleCopy = (text: string) => {
        copy(text)
            .then(() => {
                toast(globalize.translate('Copied'));
            })
            .catch(() => {
                console.error('Could not copy text');
                toast(globalize.translate('CopyFailed'));
            });
    };

    const attributeDelimiter = layoutManager.tv ? '' : ': ';

    const renderAttribute = (label: string, value: any, isLtr?: boolean) => (
        <div key={label} className="mediaInfoAttributeContainer">
            <span className="mediaInfoLabel">{label}</span>
            {!layoutManager.tv && <span className="hide">{attributeDelimiter}</span>}
            <span className="mediaInfoAttribute" dir={isLtr ? 'ltr' : undefined}>
                {value}
            </span>
        </div>
    );

    const renderMediaSource = (version: any, index: number) => {
        const attributes = [];
        if (version.Container) {
            attributes.push(renderAttribute(globalize.translate('MediaInfoContainer'), version.Container));
        }
        if (version.Formats?.length) {
            attributes.push(renderAttribute(globalize.translate('MediaInfoFormat'), version.Formats.join(',')));
        }
        if (version.Path && user?.Policy.IsAdministrator) {
            attributes.push(renderAttribute(globalize.translate('MediaInfoPath'), version.Path, true));
        }
        if (version.Size) {
            attributes.push(renderAttribute(globalize.translate('MediaInfoSize'), getReadableSize(version.Size)));
        }

        const streams = [...version.MediaStreams].sort(itemHelper.sortTracks);

        return (
            <div key={version.Id || index} className="mediaInfoSource">
                {version.Name && (
                    <div>
                        <h2 className="mediaInfoStreamType">
                            {version.Name}
                            {!layoutManager.tv && (
                                <button
                                    className="paper-icon-button-light btnCopy"
                                    title={globalize.translate('Copy')}
                                    onClick={() => handleCopy(version.Name)}
                                    type="button"
                                >
                                    <span className="material-icons content_copy" aria-hidden="true"></span>
                                </button>
                            )}
                        </h2>
                    </div>
                )}
                {attributes}
                {streams.map((stream, sIndex) => {
                    if (stream.Type === 'Data') return null;

                    let translateString = stream.Type;
                    if (stream.Type === 'EmbeddedImage') translateString = 'Image';

                    const displayType = globalize.translate(translateString);
                    const streamAttributes: any[] = [];

                    if (stream.DisplayTitle) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoTitle'), stream.DisplayTitle)
                        );
                    }
                    if (stream.Language && stream.Type !== 'Video') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoLanguage'), stream.Language)
                        );
                    }
                    if (stream.Codec) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoCodec'), stream.Codec.toUpperCase())
                        );
                    }
                    if (stream.CodecTag) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoCodecTag'), stream.CodecTag)
                        );
                    }
                    if (stream.IsAVC != null) {
                        streamAttributes.push(renderAttribute('AVC', stream.IsAVC ? 'Yes' : 'No'));
                    }
                    if (stream.Profile) {
                        streamAttributes.push(renderAttribute(globalize.translate('MediaInfoProfile'), stream.Profile));
                    }
                    if (stream.Level > 0) {
                        streamAttributes.push(renderAttribute(globalize.translate('MediaInfoLevel'), stream.Level));
                    }
                    if (stream.Width || stream.Height) {
                        streamAttributes.push(
                            renderAttribute(
                                globalize.translate('MediaInfoResolution'),
                                `${stream.Width}x${stream.Height}`
                            )
                        );
                    }
                    if (stream.AspectRatio && stream.Codec !== 'mjpeg') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoAspectRatio'), stream.AspectRatio)
                        );
                    }
                    if (stream.Type === 'Video') {
                        if (stream.IsAnamorphic != null) {
                            streamAttributes.push(
                                renderAttribute(
                                    globalize.translate('MediaInfoAnamorphic'),
                                    stream.IsAnamorphic ? 'Yes' : 'No'
                                )
                            );
                        }
                        streamAttributes.push(
                            renderAttribute(
                                globalize.translate('MediaInfoInterlaced'),
                                stream.IsInterlaced ? 'Yes' : 'No'
                            )
                        );
                    }
                    if (stream.ReferenceFrameRate && stream.Type === 'Video') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoFramerate'), stream.ReferenceFrameRate)
                        );
                    }
                    if (stream.ChannelLayout) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoLayout'), stream.ChannelLayout)
                        );
                    }
                    if (stream.Channels) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoChannels'), `${stream.Channels} ch`)
                        );
                    }
                    if (stream.BitRate) {
                        streamAttributes.push(
                            renderAttribute(
                                globalize.translate('MediaInfoBitrate'),
                                `${parseInt(stream.BitRate, 10) / 1000} kbps`
                            )
                        );
                    }
                    if (stream.SampleRate) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoSampleRate'), `${stream.SampleRate} Hz`)
                        );
                    }
                    if (stream.BitDepth) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoBitDepth'), `${stream.BitDepth} bit`)
                        );
                    }
                    if (stream.VideoRange && stream.Type === 'Video') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoVideoRange'), stream.VideoRange)
                        );
                    }
                    if (stream.VideoRangeType && stream.Type === 'Video') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoVideoRangeType'), stream.VideoRangeType)
                        );
                    }
                    if (stream.VideoDoViTitle) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoDoViTitle'), stream.VideoDoViTitle)
                        );
                        if (stream.DvVersionMajor != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoDvVersionMajor'), stream.DvVersionMajor)
                            );
                        if (stream.DvVersionMinor != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoDvVersionMinor'), stream.DvVersionMinor)
                            );
                        if (stream.DvProfile != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoDvProfile'), stream.DvProfile)
                            );
                        if (stream.DvLevel != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoDvLevel'), stream.DvLevel)
                            );
                        if (stream.RpuPresentFlag != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoRpuPresentFlag'), stream.RpuPresentFlag)
                            );
                        if (stream.ElPresentFlag != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoElPresentFlag'), stream.ElPresentFlag)
                            );
                        if (stream.BlPresentFlag != null)
                            streamAttributes.push(
                                renderAttribute(globalize.translate('MediaInfoBlPresentFlag'), stream.BlPresentFlag)
                            );
                        if (stream.DvBlSignalCompatibilityId != null)
                            streamAttributes.push(
                                renderAttribute(
                                    globalize.translate('MediaInfoDvBlSignalCompatibilityId'),
                                    stream.DvBlSignalCompatibilityId
                                )
                            );
                    }
                    if (stream.ColorSpace)
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoColorSpace'), stream.ColorSpace)
                        );
                    if (stream.ColorTransfer)
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoColorTransfer'), stream.ColorTransfer)
                        );
                    if (stream.ColorPrimaries)
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoColorPrimaries'), stream.ColorPrimaries)
                        );
                    if (stream.PixelFormat)
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoPixelFormat'), stream.PixelFormat)
                        );
                    if (stream.RefFrames)
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoRefFrames'), stream.RefFrames)
                        );
                    if (stream.Rotation && stream.Type === 'Video')
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoRotation'), stream.Rotation)
                        );
                    if (stream.NalLengthSize) streamAttributes.push(renderAttribute('NAL', stream.NalLengthSize));

                    if (stream.Type === 'Subtitle' || stream.Type === 'Audio') {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoDefault'), stream.IsDefault ? 'Yes' : 'No')
                        );
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoForced'), stream.IsForced ? 'Yes' : 'No')
                        );
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoExternal'), stream.IsExternal ? 'Yes' : 'No')
                        );
                    }
                    if (stream.Type === 'Video' && version.Timestamp) {
                        streamAttributes.push(
                            renderAttribute(globalize.translate('MediaInfoTimestamp'), version.Timestamp)
                        );
                    }

                    return (
                        <div key={stream.Index || sIndex} className="mediaInfoStream">
                            <h2 className="mediaInfoStreamType">
                                {displayType}
                                {!layoutManager.tv && (
                                    <button
                                        className="paper-icon-button-light btnCopy"
                                        title={globalize.translate('Copy')}
                                        type="button"
                                        onClick={() =>
                                            handleCopy(
                                                displayType +
                                                    '\n' +
                                                    streamAttributes
                                                        .map(
                                                            a =>
                                                                a.props.children[0].props.children +
                                                                ': ' +
                                                                a.props.children[2].props.children
                                                        )
                                                        .join('\n')
                                            )
                                        }
                                    >
                                        <span className="material-icons content_copy" aria-hidden="true"></span>
                                    </button>
                                )}
                            </h2>
                            {streamAttributes}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div id="mediaInfoContent">
            {item.MediaSources.map((version: any, index: number) => (
                <React.Fragment key={version.Id || index}>
                    {index > 0 && <div style={{ borderTop: '1px solid #444', margin: '1em 0' }}></div>}
                    {renderMediaSource(version, index)}
                </React.Fragment>
            ))}
        </div>
    );
};

export default ItemMediaInfoComponent;
