import { useState, useCallback } from 'react';

const calculateDuration = (items) => {
  return items.reduce((total, item) => {
    return total + (item.RunTimeTicks ? item.RunTimeTicks / 600000000 : 0);
  }, 0);
};

export const useSmartPlaylist = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlaylist = useCallback(async (criteria) => {
    setIsGenerating(true);
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockItems = [
        { Id: '1', Name: 'The Matrix', Genres: ['Action', 'Sci-Fi'], RunTimeTicks: 8160000000 },
        { Id: '2', Name: 'Inception', Genres: ['Action', 'Sci-Fi'], RunTimeTicks: 8880000000 },
        { Id: '3', Name: 'John Wick', Genres: ['Action', 'Thriller'], RunTimeTicks: 6060000000 },
        { Id: '4', Name: 'The Dark Knight', Genres: ['Action', 'Drama'], RunTimeTicks: 9120000000 },
      ];
      
      const playlist = {
        id: `smart-${Date.now()}`,
        name: 'Smart Playlist',
        description: 'Generated playlist',
        items: mockItems,
        criteria,
        totalDuration: calculateDuration(mockItems)
      };
      
      return playlist;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePlaylist, isGenerating };
};