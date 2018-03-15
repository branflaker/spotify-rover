import React, { Component } from 'react';
import _filter from 'lodash/filter';
import _findIndex from 'lodash/findIndex';
import * as SpotifyWebApi from 'spotify-web-api-js';
import logo from './logo.svg';
import './App.css';

const ITEM_LIMIT = 50;

const spotifyAPI = new SpotifyWebApi();
const clientID = 'e946aac8d2ea4e5f8dd47bf222dd8b83';

const getFollowedArtistsCount = () =>
    spotifyAPI
        .getFollowedArtists({ limit: 1 })
        .then(response => response.artists.total);

const getAllFollowedArtists = after => {
    const options = { limit: ITEM_LIMIT };
    if (typeof after !== 'undefined') {
        options.after = after;
    }
    return spotifyAPI.getFollowedArtists(options).then(response => {
        if (response.artists.next === null) {
            return response.artists.items;
        }
        const after = response.artists.next.split('after=')[1];
        return getAllFollowedArtists(after).then(artists => [...response.artists.items, ...artists])
    });
};

const getAllSavedAlbums = (offset = 0) => {
    const options = {
        limit: ITEM_LIMIT,
        offset
    };
    return spotifyAPI.getMySavedAlbums(options).then(response => {
        if (response.items.length < ITEM_LIMIT) {
            return response.items;
        }
        return getAllSavedAlbums(offset + ITEM_LIMIT).then(albums => [...response.items, ...albums]);
    });
};

const findArtistAlbums = (artistID, albums) => _filter(
    albums,
    album => _findIndex(album.album.artists, artist => artist.id === artistID) !== -1
);

class App extends Component {
    componentDidMount() {
        const scopes = 'user-follow-read user-library-read';
        const apiURL = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=${scopes ? encodeURIComponent(scopes) : ''}&showDialog=true&redirect_uri=${encodeURIComponent('http://localhost:3000')}`;
        if (!window.location.hash) {
            window.location.replace(apiURL);
        }
        else {
            const hash = window.location.href.split('#')[1].split('&')[0].split('=')[1];
            spotifyAPI.setAccessToken(hash);
            const countPromise = getFollowedArtistsCount();
            const artistsPromise = getAllFollowedArtists();
            const albumsPromise = getAllSavedAlbums();
            Promise.all([countPromise, artistsPromise, albumsPromise]).then(([count, artists, albums]) => {
                const artistIndex = Math.floor(Math.random() * count);
                const artistAlbums = findArtistAlbums(artists[artistIndex].id, albums);
                const albumIndex = Math.floor(Math.random() * artistAlbums.length);
                const albumName = artistAlbums.length > 0 ? artistAlbums[albumIndex].album.name : '?';
                alert(`${artists[artistIndex].name} - ${albumName}`);
            })
        }
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <p className="App-intro">
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
            </div>
        );
    }
}

export default App;
