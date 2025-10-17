import React from 'react';
import { SmartPlaylistGenerator } from '../smart-playlist';

const Home = () => {
  return (
    <div className="homeContainer">
      {/* Jellyfin existing home content */}
      
      {/* SMART PLAYLIST INTEGRATION */}
      <div style={{ margin: '30px 0', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <SmartPlaylistGenerator />
      </div>
      
      {/* More Jellyfin content */}
    </div>
  );
};

export default Home;