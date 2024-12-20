
import React, { useState, useEffect } from 'react';
import QueueList from './QueueList';
import axios from 'axios';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

let previousTrack = "";
let currentTrack = "";
let qu = [];
let switching = false;
let highestVotedTrack = ""
let highestVotedIndex = ""

function WebPlayback(props) {
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);
    const [queue, setQueue] = useState([]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                updateQueue(player);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', async (state) => {
                console.log('Player state changed:', state);
            
                if (!state) return;
                

                if(switching===true){
                    
                    // Check if the highest-voted track is already handled
                    if (highestVotedTrack.id === state.track_window.current_track.id) {
                        console.log("Highest-voted track already handled:", highestVotedTrack.name);
                        switching=false
                        return; // Exit if already handled
                    }
                    await player.nextTrack();
                }



                if(state.loading == true){
                    previousTrack = state.track_window.previous_tracks[0]
                    if (currentTrack && previousTrack) {
                        if (currentTrack.name === previousTrack.name) {
                            switching=true
                            highestVotedIndex = qu.reduce((highestIndex, song, currentIndex, array) => {
                                return song.votes > array[highestIndex].votes ? currentIndex : highestIndex;
                            }, 0);
                        
                            highestVotedTrack = qu[highestVotedIndex];
                            return
                        }
                    } else {
                        console.log("One of the tracks is not available.");
                    }
                }
                // Update the current track and paused state
                setTrack(state.track_window.current_track);
                currentTrack = state.track_window.current_track
                setPaused(state.paused);
            
                // Update the active state of the player
                player.getCurrentState().then((state) => {
                    setActive(!!state);
                });
            
                // Refresh the custom queue if necessary
                updateQueue(props.token);
            });
            

            player.connect();
        };
    }, []);

    const fetchQueueFromAPI = async (accessToken) => {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/player/queue', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.queue; // Full queue
        } catch (error) {
            console.error('Error fetching queue:', error);
            return [];
        }
    };

    const updateQueue = async (accessToken) => {
        const fetchedQueue = await fetchQueueFromAPI(accessToken);
    
        setQueue((prevQueue) => {
            // Map the previous queue to retain votes
            const prevQueueMap = prevQueue.reduce((map, track) => {
                map[track.id] = track.votes || 0; // Use track.id to uniquely identify tracks
                return map;
            }, {});
    
            // Update the new queue with previous votes
            const nextTracks = fetchedQueue.slice(0, 3).map(track => ({
                ...track,
                votes: prevQueueMap[track.id] || 0 // Retain votes or default to 0
            }));
            qu = nextTracks
            return nextTracks;
        });
    };
    
    let lastHandledTrackId = ""; // Tracks the ID of the last handled highest-voted song

    const playHighestVotedSong = async (player) => {
        console.log("queue", qu);

        // Check if the highest-voted track is already handled
        if (highestVotedTrack.id === lastHandledTrackId) {
            console.log("Highest-voted track already handled:", highestVotedTrack.name);
            return; // Exit if already handled
        }
    
        // Update the last handled track ID
        lastHandledTrackId = highestVotedTrack.id;
    
        // Calculate the number of skips required
        const skipsRequired = highestVotedIndex;
    
        console.log(`Skipping ${skipsRequired} track(s) to reach the highest-voted song.`);
    
        // Skip tracks using a loop
        for (let i = 0; i < skipsRequired; i++) {
            try {
                console.log("Skipping track...");
                await player.nextTrack();
                console.log(`Skipped track ${i + 1}`);
            } catch (error) {
                console.error(`Error skipping track ${i + 1}:`, error);
                return; // Exit if skipping fails
            }
        }
    
        console.log("Now playing the highest-voted track:", highestVotedTrack.name);
    };
    
    
    
    const handleVote = (index) => {
        setQueue(prevQueue => {
            const newQueue = [...prevQueue];
            newQueue[index] = {
                ...newQueue[index],
                votes: (newQueue[index].votes || 0) + 1
            };
            qu= newQueue
            return newQueue;
        });
    };

    if (!is_active) {
        return (
            <div className="container">
                <div className="main-wrapper">
                    <b> Instance not active. Transfer your playback using your Spotify app </b>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="player-wrapper">
                <div className="main-wrapper">
                    <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                    <div className="now-playing__side">
                        <div className="now-playing__name">{current_track.name}</div>
                        <div className="now-playing__artist">{current_track.artists[0].name}</div>

                        <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
                            &lt;&lt;
                        </button>

                        <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                            {is_paused ? "PLAY" : "PAUSE"}
                        </button>

                        <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
                            &gt;&gt;
                        </button>
                    </div>
                </div>
                <QueueList 
                    player={player}
                    currentQueue={queue}
                    onVote={handleVote}
                />
            </div>
        </div>
    );
}

export default WebPlayback;
