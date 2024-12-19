
import React, { useState, useEffect } from 'react';

function QueueList({ player, currentQueue, onVote }) {
    return (
        <div className="queue-container">
            <h3>Up Next</h3>
            <div className="queue-list">
                {currentQueue.map((track, index) => (
                    <div key={track.id} className="queue-item">
                        <div className="track-info">
                            <img src={track.album.images[2].url} alt="" className="queue-cover" />
                            <div>
                                <div className="queue-track-name">{track.name}</div>
                                <div className="queue-artist-name">{track.artists[0].name}</div>
                            </div>
                        </div>
                        <div className="vote-section">
                            <span className="vote-count">{track.votes || 0}</span>
                            <button 
                                className="vote-button"
                                onClick={() => onVote(index)}
                            >
                                Vote
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QueueList;
