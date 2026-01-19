import React, { useEffect, useState } from 'react';
import { useAudioStore } from '../../../../store/audioStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import InfoIcon from '@mui/icons-material/Info';
import { visualizerSettings } from '../../../../components/visualizer/visualizers.logic';
import './NowPlayingPage.scss';

const NowPlayingPage: React.FC = () => {
    const { currentTrack, isPlaying, setIsPlaying, currentTime, duration } = useAudioStore();
    const navigate = useNavigate();
    const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);

    // Force enable visualizer on this page
    useEffect(() => {
        const originalState = visualizerSettings.butterchurn.enabled;
        visualizerSettings.butterchurn.enabled = true;
        
        // Add class to body to let CSS know we're in fullscreen
        document.body.classList.add('is-fullscreen-player');
        
        return () => {
            visualizerSettings.butterchurn.enabled = originalState;
            document.body.classList.remove('is-fullscreen-player');
        };
    }, []);

    if (!currentTrack) {
        return (
            <div className="nowPlayingPageEmpty">
                <IconButton onClick={() => navigate(-1)} style={{ color: 'white', position: 'absolute', top: 20, left: 20 }}>
                    <ArrowBackIcon />
                </IconButton>
                <p>No track playing</p>
            </div>
        );
    }

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="nowPlayingPage">
            <div className="fullscreenBackground">
                {/* Visualizer will render here from RootAppRouter */}
                <div className="gradientOverlay"></div>
            </div>

            <header className="pageHeader">
                <IconButton onClick={() => navigate(-1)} style={{ color: 'white' }}>
                    <ArrowBackIcon />
                </IconButton>
                <div className="headerInfo">
                    <span className="albumName">{currentTrack.album}</span>
                </div>
                <IconButton 
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)} 
                    style={{ color: showTechnicalInfo ? '#00a4dc' : 'white' }}
                >
                    <InfoIcon />
                </IconButton>
            </header>

            <main className="nowPlayingContent">
                <div className="mainLayout">
                    <div className="artworkSection">
                        <motion.div 
                            layoutId="now-playing-art"
                            className="largeArtwork"
                            style={{ 
                                backgroundImage: currentTrack.imageUrl ? `url(${currentTrack.imageUrl})` : 'none',
                                backgroundSize: 'cover',
                                borderRadius: '12px',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>

                    <div className="infoAndControls">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="trackMetadata"
                        >
                            <h1 className="trackTitle">{currentTrack.name}</h1>
                            <h2 className="trackArtist">{currentTrack.artist}</h2>
                        </motion.div>

                        <div className="controlsSection">
                            <div className="progressContainer">
                                <input 
                                    type="range" 
                                    className="progressSlider"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    readOnly
                                    style={{ backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%` }}
                                />
                                <div className="timeInfo">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="playbackButtons">
                                <IconButton style={{ color: 'white' }} size="large">
                                    <SkipPreviousIcon sx={{ fontSize: 40 }} />
                                </IconButton>
                                <IconButton 
                                    onClick={togglePlay} 
                                    className="mainPlayButton"
                                    size="large"
                                >
                                    {isPlaying ? <PauseIcon sx={{ fontSize: 56 }} /> : <PlayArrowIcon sx={{ fontSize: 56 }} />}
                                </IconButton>
                                <IconButton style={{ color: 'white' }} size="large">
                                    <SkipNextIcon sx={{ fontSize: 40 }} />
                                </IconButton>
                            </div>
                        </div>

                        {currentTrack.nextTrack && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="nextUpPreview"
                            >
                                <span className="nextLabel">NEXT UP</span>
                                <div className="nextTrackInfo">
                                    <img src={currentTrack.nextTrack.imageUrl} alt="" className="nextArt" />
                                    <div className="nextText">
                                        <div className="nextTitle">{currentTrack.nextTrack.name}</div>
                                        <div className="nextArtist">{currentTrack.nextTrack.artist}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showTechnicalInfo && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="technicalInfoPanel"
                    >
                        <h3>Technical Stream Info</h3>
                        <div className="infoGrid">
                            <div className="infoItem">
                                <label>Codec</label>
                                <span>{currentTrack.streamInfo?.codec?.toUpperCase() || 'Unknown'}</span>
                            </div>
                            <div className="infoItem">
                                <label>Bitrate</label>
                                <span>{currentTrack.streamInfo?.bitrate ? `${Math.round(currentTrack.streamInfo.bitrate / 1000)} kbps` : 'Unknown'}</span>
                            </div>
                            <div className="infoItem">
                                <label>Engine</label>
                                <span>Wasm (Next-Gen)</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function formatTime(seconds: number): string {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default NowPlayingPage;