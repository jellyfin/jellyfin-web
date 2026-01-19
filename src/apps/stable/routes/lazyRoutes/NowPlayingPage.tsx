import React from 'react';
import { useAudioStore } from '../../../../store/audioStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import './NowPlayingPage.scss';

const NowPlayingPage: React.FC = () => {
    const { currentTrack, isPlaying, setIsPlaying, currentTime, duration, volume, setVolume } = useAudioStore();
    const navigate = useNavigate();

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
            <IconButton 
                onClick={() => navigate(-1)} 
                className="backButton"
                style={{ color: 'white' }}
            >
                <ArrowBackIcon />
            </IconButton>

            <div className="nowPlayingContent">
                <div className="artworkContainer">
                    <motion.div 
                        layoutId="now-playing-art"
                        className="largeArtwork"
                        style={{ 
                            backgroundImage: currentTrack.imageUrl ? `url(${currentTrack.imageUrl})` : 'none',
                            backgroundSize: 'cover',
                            borderRadius: '12px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                    />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="trackInfo"
                >
                    <h1 className="trackTitle">{currentTrack.name}</h1>
                    <h2 className="trackArtist">{currentTrack.artist}</h2>
                </motion.div>

                <div className="controlsContainer">
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
                            <SkipPreviousIcon fontSize="large" />
                        </IconButton>
                        <IconButton 
                            onClick={togglePlay} 
                            style={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }} 
                            size="large"
                        >
                            {isPlaying ? <PauseIcon sx={{ fontSize: 48 }} /> : <PlayArrowIcon sx={{ fontSize: 48 }} />}
                        </IconButton>
                        <IconButton style={{ color: 'white' }} size="large">
                            <SkipNextIcon fontSize="large" />
                        </IconButton>
                    </div>
                </div>
            </div>
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
