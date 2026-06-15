const API_BASE = window.location.port === '3000' ? '' : `${window.location.protocol}//${window.location.hostname}:3000`;

async function apiFetch(endpoint, options = {}) {
    options.credentials = 'include';
    return fetch(`${API_BASE}${endpoint}`, options);
}

// State
let currentUser = null;
let currentMusics = [];
let currentPlaylist = [];
let isPlaying = false;
let currentTrackIndex = -1;

let isShuffle = false;
let isRepeat = false;
let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
window.currentViewTracks = [];

let isCurrentTrackYT = false;
let ytPlayer = null;
let isYTReady = false;
let ytInterval = null;

// YouTube IFrame API Initialization
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '0', width: '0',
        playerVars: { 
            'autoplay': 0, 
            'controls': 0,
            'origin': window.location.origin
        },
        events: {
            'onReady': () => { isYTReady = true; },
            'onStateChange': onYTStateChange
        }
    });
}
function onYTStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayBtn();
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayBtn();
    } else if (event.data == YT.PlayerState.ENDED) {
        isPlaying = false;
        updatePlayBtn();
        clearInterval(ytInterval);
        playNext();
    }
}

// DOM Elements
const authModal = document.getElementById('auth-modal');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const toggleAuthLink = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const usernameGroup = document.getElementById('username-group');
const authBtn = document.getElementById('auth-btn');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

const displayName = document.getElementById('display-name');
const displayRole = document.getElementById('display-role');
const userAvatar = document.getElementById('user-avatar');

const musicGrid = document.getElementById('music-grid');
const audioElement = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause');
const progress = document.getElementById('progress');
const progressBar = document.querySelector('.progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const volumeBar = document.getElementById('volume-bar');
const volumeProgress = document.getElementById('volume-progress');

// Navigation Elements
const navHome = document.getElementById('nav-home');
const navDiscover = document.getElementById('nav-discover');
const navArtists = document.getElementById('nav-artists');
const navRecent = document.getElementById('nav-recent');
const navLiked = document.getElementById('nav-liked');
const navPlaylists = document.getElementById('nav-playlists');
const listItems = [
    document.getElementById('li-home'), document.getElementById('li-discover'),
    document.getElementById('li-artists'), document.getElementById('li-recent'),
    document.getElementById('li-liked'), document.getElementById('li-playlists')
];

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    listItems.forEach(li => {
        if(li) {
            li.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('active');
                }
            });
        }
    });
}

let isLoginMode = true;

// Auth Logic
toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = "Welcome to VR Music";
        usernameGroup.style.display = "none";
        document.getElementById('username').removeAttribute('required');
        authBtn.innerText = "Log In";
        toggleAuthLink.innerText = "Register";
        document.getElementById('auth-switch-text').childNodes[0].nodeValue = "Don't have an account? ";
    } else {
        authTitle.innerText = "Create an Account";
        usernameGroup.style.display = "block";
        document.getElementById('username').setAttribute('required', 'true');
        authBtn.innerText = "Sign Up";
        toggleAuthLink.innerText = "Login";
        document.getElementById('auth-switch-text').childNodes[0].nodeValue = "Already have an account? ";
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;

    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const payload = isLoginMode ? { email, password } : { email, password, username };

    try {
        const response = await apiFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            initApp();
        } else {
            authError.innerText = data.message || "Authentication failed";
        }
    } catch (err) {
        authError.innerText = "Server error. Please try again.";
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
    } catch (err) {
        console.error(err);
    }
});

// App Initialization
function initApp() {
    authModal.classList.remove('show');
    appContainer.style.display = 'flex';
    
    displayName.innerText = currentUser.username || currentUser.email.split('@')[0];
    displayRole.innerText = currentUser.role;
    userAvatar.src = `https://ui-avatars.com/api/?name=${displayName.innerText}&background=random`;

    fetchUserPlaylists().then(() => {
        fetchMusics();
    });
}

async function fetchMusics() {
    try {
        const response = await apiFetch('/api/music');
        const data = await response.json();
        
        if (response.ok) {
            currentMusics = data.musics;
            renderMusics();
        } else {
            musicGrid.innerHTML = `<div class="error-text">Failed to load music: ${data.message}</div>`;
        }
    } catch (err) {
        musicGrid.innerHTML = `<div class="error-text">Failed to connect to server</div>`;
    }
}

function renderMusics(filter = 'all') {
    let filteredMusics = currentMusics;
    
    if (filter === 'liked') {
        filteredMusics = currentMusics.filter(music => currentUser && music.likes && music.likes.includes(currentUser.id));
    }
    renderCustomGrid(filteredMusics);
}

function getTrackArt(track) {
    if (track.uri && (track.uri.includes('youtube.com') || track.uri.includes('youtu.be'))) {
        let videoId = '';
        if (track.uri.includes('youtu.be/')) {
            videoId = track.uri.split('youtu.be/')[1].split('?')[0];
        } else if (track.uri.includes('v=')) {
            videoId = track.uri.split('v=')[1].split('&')[0];
        }
        if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return `https://picsum.photos/seed/${track._id}/300/300`;
}

function renderCustomGrid(tracks) {
    window.currentViewTracks = tracks;
    if (!tracks || tracks.length === 0) {
        musicGrid.innerHTML = `<div class="loading-spinner" style="grid-column: 1/-1;">No tracks found here.</div>`;
        return;
    }

    musicGrid.innerHTML = tracks.map((music, i) => {
        const isLiked = currentUser && music.likes && music.likes.includes(currentUser.id);
        const artUrl = getTrackArt(music);
        
        return `
            <div class="music-card">
                <div class="music-art">
                    <img src="${artUrl}" alt="Art">
                    <div class="play-overlay">
                        <button onclick="playTrack(${i}, window.currentViewTracks)"><i class="fa-solid fa-play"></i></button>
                    </div>
                </div>
                <div class="music-info">
                    <h3>${music.title}</h3>
                    <p>${music.artist.username || 'Unknown Artist'}</p>
                </div>
                <div class="music-meta" style="justify-content: flex-end; gap: 10px;">
                    <button class="icon-btn" onclick="openAddToPlaylistModal('${music._id}')" title="Add to Playlist">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button class="like-action ${isLiked ? 'liked' : ''}" onclick="toggleLike('${music._id}', this)">
                        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        <span class="like-count">${music.likes ? music.likes.length : 0}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Navigation Logic
const heroListenBtn = document.getElementById('hero-listen-btn');
const heroExploreBtn = document.getElementById('hero-explore-btn');

heroListenBtn.addEventListener('click', () => {
    if (currentMusics && currentMusics.length > 0) {
        playTrack(0, currentMusics);
    }
});

heroExploreBtn.addEventListener('click', () => {
    navDiscover.click();
    setTimeout(() => {
        musicGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
});

function setActiveNav(activeId) {
    listItems.forEach(li => li && li.classList.remove('active'));
    if (document.getElementById(activeId)) {
        document.getElementById(activeId).classList.add('active');
    }
}

navHome.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('li-home'); renderMusics('all'); });
navLiked.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('li-liked'); renderMusics('liked'); });
navPlaylists.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('li-playlists'); renderPlaylists(); });

navDiscover.addEventListener('click', (e) => { 
    e.preventDefault(); setActiveNav('li-discover'); 
    let shuffled = [...currentMusics].sort(() => 0.5 - Math.random());
    renderCustomGrid(shuffled); 
});

navArtists.addEventListener('click', (e) => { 
    e.preventDefault(); setActiveNav('li-artists'); 
    const artistMap = {};
    currentMusics.forEach(m => {
        if (m.artist) artistMap[m.artist._id] = m.artist.username || 'Unknown';
    });
    
    if (Object.keys(artistMap).length === 0) {
        musicGrid.innerHTML = `<div class="loading-spinner" style="grid-column: 1/-1;">No artists found.</div>`;
        return;
    }
    
    musicGrid.innerHTML = Object.keys(artistMap).map(artistId => `
        <div class="music-card" onclick="renderArtistSongs('${artistId}')" style="cursor: pointer;">
            <div class="music-art" style="border-radius: 50%; overflow: hidden;">
                <img src="https://ui-avatars.com/api/?name=${artistMap[artistId]}&background=random&size=300" alt="Artist">
            </div>
            <div class="music-info" style="text-align: center;">
                <h3>${artistMap[artistId]}</h3>
                <p>Artist</p>
            </div>
        </div>
    `).join('');
});

window.renderArtistSongs = function(artistId) {
    const songs = currentMusics.filter(m => m.artist && m.artist._id === artistId);
    renderCustomGrid(songs);
}

navRecent.addEventListener('click', (e) => { 
    e.preventDefault(); setActiveNav('li-recent'); 
    renderCustomGrid(recentlyPlayed);
});

// Playlist Logic
let userPlaylistsCache = [];
let currentSongToAdd = null;

window.fetchUserPlaylists = async function() {
    try {
        const response = await apiFetch('/api/playlist');
        const data = await response.json();
        if (response.ok) {
            userPlaylistsCache = data.playlists || [];
        }
    } catch (e) {
        console.error("Failed to fetch playlists");
    }
}

window.renderPlaylists = async function() {
    await fetchUserPlaylists();
    musicGrid.innerHTML = `
        <div style="grid-column: 1/-1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: var(--text-primary); font-size: 1.5rem;">Your Playlists</h3>
            <button class="btn primary-btn" style="width: auto; padding: 8px 16px;" onclick="document.getElementById('create-playlist-modal').classList.add('show')">Create New</button>
        </div>
    `;
    
    if (userPlaylistsCache.length === 0) {
        musicGrid.innerHTML += `<div style="grid-column: 1/-1; color: var(--text-secondary);">You don't have any playlists yet.</div>`;
        return;
    }
    
    const playlistsHtml = userPlaylistsCache.map(pl => `
        <div class="music-card" onclick="viewPlaylist('${pl._id}')" style="cursor: pointer;">
            <div class="music-art">
                <img src="https://picsum.photos/seed/${pl._id}/300/300" alt="Playlist Art">
                <div class="play-overlay"><i class="fa-solid fa-list"></i></div>
            </div>
            <div class="music-info">
                <h3>${pl.name}</h3>
                <p>${pl.musics ? pl.musics.length : 0} tracks</p>
            </div>
        </div>
    `).join('');
    musicGrid.innerHTML += playlistsHtml;
}

window.viewPlaylist = function(playlistId) {
    const pl = userPlaylistsCache.find(p => p._id === playlistId);
    if (!pl) return;
    renderCustomGrid(pl.musics || []);
    document.querySelector('.section-header h2').innerText = pl.name;
};

document.getElementById('btn-create-playlist').addEventListener('click', async () => {
    const nameInput = document.getElementById('playlist-name-input');
    const name = nameInput.value.trim();
    if (!name) return alert("Enter a playlist name");
    
    try {
        const res = await apiFetch('/api/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            nameInput.value = '';
            document.getElementById('create-playlist-modal').classList.remove('show');
            if (document.getElementById('li-playlists').classList.contains('active')) {
                renderPlaylists();
            } else {
                fetchUserPlaylists();
            }
        } else {
            alert("Failed to create playlist");
        }
    } catch (e) {
        alert("Error creating playlist");
    }
});

window.openAddToPlaylistModal = async function(musicId) {
    currentSongToAdd = musicId;
    await fetchUserPlaylists();
    
    const listContainer = document.getElementById('user-playlists-list');
    if (userPlaylistsCache.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No playlists found. Create one first!</p>';
    } else {
        listContainer.innerHTML = userPlaylistsCache.map(pl => `
            <div style="padding: 10px; background: rgba(255,255,255,0.05); margin-bottom: 5px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="addSongToPlaylistAPI('${pl._id}', '${musicId}')">
                <span style="font-weight: 500;">${pl.name}</span>
                <i class="fa-solid fa-plus" style="color: var(--accent-color);"></i>
            </div>
        `).join('');
    }
    document.getElementById('add-to-playlist-modal').classList.add('show');
};

window.addSongToPlaylistAPI = async function(playlistId, musicId) {
    try {
        const res = await apiFetch('/api/playlist/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlistId, musicId })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('add-to-playlist-modal').classList.remove('show');
            fetchUserPlaylists();
            alert("Added to playlist!");
        } else {
            alert(data.message || "Failed to add song");
        }
    } catch (e) {
        alert("Error adding song");
    }
};

// Player Logic
function playTrack(index, tracksArray = currentMusics) {
    if (index < 0 || index >= tracksArray.length) return;
    currentPlaylist = tracksArray;
    currentTrackIndex = index;
    const track = tracksArray[index];
    
    // Track recently played
    recentlyPlayed = recentlyPlayed.filter(t => t._id !== track._id);
    recentlyPlayed.unshift(track);
    if (recentlyPlayed.length > 20) recentlyPlayed.pop();
    localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    
    document.getElementById('player-title').innerText = track.title;
    document.getElementById('player-artist').innerText = track.artist.username || 'Unknown Artist';
    const artUrl = getTrackArt(track);
    document.getElementById('player-art').innerHTML = `<img src="${artUrl}" alt="Art">`;
    
    const isLiked = track.likes && track.likes.includes(currentUser.id);
    const likeBtn = document.getElementById('player-like');
    likeBtn.className = `like-btn ${isLiked ? 'liked' : ''}`;
    likeBtn.innerHTML = `<i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
    likeBtn.onclick = () => toggleLike(track._id, likeBtn);

    // Check if it's a YouTube link
    if (track.uri && (track.uri.includes('youtube.com') || track.uri.includes('youtu.be'))) {
        isCurrentTrackYT = true;
        audioElement.pause();
        
        let videoId = '';
        if (track.uri.includes('youtu.be/')) {
            videoId = track.uri.split('youtu.be/')[1].split('?')[0];
        } else if (track.uri.includes('v=')) {
            videoId = track.uri.split('v=')[1].split('&')[0];
        }
        
        if (isYTReady && ytPlayer && videoId) {
            ytPlayer.loadVideoById(videoId);
            isPlaying = true;
            updatePlayBtn();
            
            clearInterval(ytInterval);
            ytInterval = setInterval(() => {
                if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
                    const current = ytPlayer.getCurrentTime();
                    const duration = ytPlayer.getDuration();
                    if (duration > 0) {
                        progress.style.width = `${(current / duration) * 100}%`;
                        currentTimeEl.innerText = formatTime(current);
                        totalTimeEl.innerText = formatTime(duration);
                    }
                }
            }, 500);
        }
        return;
    }

    isCurrentTrackYT = false;
    if (isYTReady && ytPlayer && ytPlayer.stopVideo) {
        ytPlayer.stopVideo();
        clearInterval(ytInterval);
    }

    // Regular Audio
    audioElement.src = track.uri; 
    audioElement.play().catch(e => {
        console.log("Audio play blocked or invalid URI. Mocking playback.");
        isPlaying = true;
        updatePlayBtn();
    });
    
    isPlaying = true;
    updatePlayBtn();
}

function playNext() {
    if (currentPlaylist.length === 0) return;
    let nextIndex = currentTrackIndex + 1;
    if (isShuffle) {
        nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else if (nextIndex >= currentPlaylist.length) {
        nextIndex = isRepeat ? 0 : -1;
    }
    if (nextIndex !== -1) playTrack(nextIndex, currentPlaylist);
}

function playPrev() {
    if (currentPlaylist.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = isRepeat ? currentPlaylist.length - 1 : 0;
    playTrack(prevIndex, currentPlaylist);
}

btnNext.addEventListener('click', playNext);
btnPrev.addEventListener('click', playPrev);

btnShuffle.addEventListener('click', () => {
    isShuffle = !isShuffle;
    btnShuffle.style.color = isShuffle ? 'var(--primary-color)' : 'var(--text-secondary)';
});

btnRepeat.addEventListener('click', () => {
    isRepeat = !isRepeat;
    btnRepeat.style.color = isRepeat ? 'var(--primary-color)' : 'var(--text-secondary)';
});

audioElement.addEventListener('ended', playNext);

playPauseBtn.addEventListener('click', () => {
    if (currentTrackIndex === -1) return;
    
    if (isCurrentTrackYT && isYTReady && ytPlayer) {
        if (isPlaying) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    } else {
        if (isPlaying) audioElement.pause();
        else audioElement.play().catch(e => console.log("Mocking play"));
    }
    isPlaying = !isPlaying;
    updatePlayBtn();
});

function updatePlayBtn() {
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        playPauseBtn.classList.add('playing');
    } else {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        playPauseBtn.classList.remove('playing');
    }
}

audioElement.addEventListener('timeupdate', () => {
    if (!audioElement.duration) return;
    const current = audioElement.currentTime;
    const duration = audioElement.duration;
    
    progress.style.width = `${(current / duration) * 100}%`;
    currentTimeEl.innerText = formatTime(current);
    totalTimeEl.innerText = formatTime(duration);
});

progressBar.addEventListener('click', (e) => {
    const clickX = e.offsetX;
    const width = progressBar.clientWidth;
    
    if (isCurrentTrackYT && isYTReady && ytPlayer && ytPlayer.getDuration) {
        const duration = ytPlayer.getDuration();
        if (duration) {
            const newTime = (clickX / width) * duration;
            ytPlayer.seekTo(newTime, true);
        }
    } else if (audioElement.duration) {
        const newTime = (clickX / width) * audioElement.duration;
        audioElement.currentTime = newTime;
    }
});

let currentVolume = 1.0;
volumeBar.addEventListener('click', (e) => {
    const clickX = e.offsetX;
    const width = volumeBar.clientWidth;
    currentVolume = Math.max(0, Math.min(1, clickX / width));
    volumeProgress.style.width = `${currentVolume * 100}%`;
    
    audioElement.volume = currentVolume;
    if (isYTReady && ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(currentVolume * 100);
    }
});

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Like Logic
async function toggleLike(musicId, btnElement) {
    try {
        const response = await apiFetch(`/api/music/${musicId}/like`, { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            // Re-fetch or update UI locally
            const isNowLiked = data.message.includes("liked");
            if (isNowLiked) {
                btnElement.classList.add('liked');
                btnElement.querySelector('i').classList.replace('fa-regular', 'fa-solid');
            } else {
                btnElement.classList.remove('liked');
                btnElement.querySelector('i').classList.replace('fa-solid', 'fa-regular');
            }
            if (btnElement.querySelector('.like-count')) {
                btnElement.querySelector('.like-count').innerText = data.likes;
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// Check if user is already logged in via cookie on load
// We can try to fetch music, if it fails with 401, they need to login.
window.onload = async () => {
    try {
        const res = await apiFetch('/api/music');
        if (res.ok) {
            // User is logged in, but we need user details.
            // For now, let's just make them log in since there's no /me endpoint
            // Wait, we can add a simple mock profile or just show login
            // Since we don't have a /api/auth/me endpoint, we'll just show the login modal.
            authModal.classList.add('show');
        } else {
            authModal.classList.add('show');
        }
    } catch (e) {
        authModal.classList.add('show');
    }
};
