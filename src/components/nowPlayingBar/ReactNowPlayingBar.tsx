import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../../store/audioStore';
import { motion, AnimatePresence } from 'framer-motion';
import './nowPlayingBar.scss'; // Reuse existing styles
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import IconButton from '@mui/material/IconButton/IconButton';

export const NowPlayingBar: React.FC = () => {
    const { currentTrack, isPlaying, setIsPlaying, currentTime, duration, volume, setVolume } = useAudioStore();

    if (!currentTrack) {
        return null;
    }

    const togglePlay = () => {
        // This will be connected to the actual player logic later
        setIsPlaying(!isPlaying); 
    };

    return (
        <AnimatePresence>
            <motion.div 
                className="nowPlayingBar"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="nowPlayingBarTop">
                    <div className="nowPlayingBarPositionContainer sliderContainer">
                        <input 
                            type="range" 
                            className="slider-medium-thumb nowPlayingBarPositionSlider"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            readOnly // Read-only for now until connected
                            style={{ backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%` }}
                        />
                    </div>

                    <div className="nowPlayingBarInfoContainer">
                        <motion.div 
                            layoutId="now-playing-art"
                            className="nowPlayingImage"
                            style={{ 
                                backgroundImage: currentTrack.imageUrl ? `url(${currentTrack.imageUrl})` : 'none',
                                backgroundSize: 'cover'
                            }}
                        />
                        <div className="nowPlayingBarText">
                            <div className="nowPlayingBarTitle">{currentTrack.name}</div>
                            <div className="nowPlayingBarArtist">{currentTrack.artist}</div>
                        </div>
                    </div>

                    <div className="nowPlayingBarCenter">
                        <IconButton 
                            onClick={togglePlay}
                            className="playPauseButton"
                            size="large"
                            style={{ color: 'var(--theme-text-color)' }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    </div>

                    <div className="nowPlayingBarRight">
                        <div className="nowPlayingBarVolumeSliderContainer">
                            <input 
                                type="range" 
                                className="slider-medium-thumb nowPlayingBarVolumeSlider"
                                min={0}
                                max={100}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                style={{ backgroundSize: `${volume}% 100%` }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
