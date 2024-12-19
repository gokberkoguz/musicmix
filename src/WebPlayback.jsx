
import React, { useState, useEffect } from 'react';
import QueueList from './QueueList';

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

            player.addListener('player_state_changed', (state => {
                if (!state) {
                    return;
                }

                setTrack(state.track_window.current_track);
                setPaused(state.paused);
                updateQueue(player);

                player.getCurrentState().then(state => {
                    (!state) ? setActive(false) : setActive(true)
                });
            }));

            player.connect();
        };
    }, []);

    const updateQueue = async (player) => {
        if (player) {
            const state = await player.getCurrentState();
            if (state && state.track_window.next_tracks) {
                const nextTracks = state.track_window.next_tracks.slice(0, 3).map(track => ({
                    ...track,
                    votes: 0
                }));
                setQueue(nextTracks);
            }
        }
    };

    const handleVote = (index) => {
        setQueue(prevQueue => {
            const newQueue = [...prevQueue];
            newQueue[index] = {
                ...newQueue[index],
                votes: (newQueue[index].votes || 0) + 1
            };

            // Sort by votes
            newQueue.sort((a, b) => (b.votes || 0) - (a.votes || 0));
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
