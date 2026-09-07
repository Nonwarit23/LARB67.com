// Sample Music Data List (Using public audio tracks)
const playlist = [
    {
        id: 1,
        title: "Elika",
        artist: "Herms Niel",
        src: "Song/Erika German Military Song Re Upload.mp3",
        cover: "Picture/hitter.png",
        lyrics: [
            { time: 0, text: "Auf der Heide blüht ein kleines Blümelein" },
            { time: 10, text: "BOY" },
            { time: 20, text: "เสียงดนตรีนำทางความสุขเข้ามา" },
            { time: 35, text: "ปล่อยใจให้สบายไปกับเสียงเพลง" }
        ]
    },
    {
        id: 2,
        title: "Tiki tik phonk",
        artist: "BEN10",
        src: "Song/TIKI TIKI Slowed.mp3",
        cover: "Picture/Tiki.png",
        lyrics: [
            { time: 0, text: "🎸 (สายลมเย็นๆ พร้อมกีตาร์โปร่ง)" },
            { time: 12, text: "ฟังเสียงลมพัดผ่านยอดไม้" },
            { time: 25, text: "ความรู้สึกผ่อนคลายในวันหยุด" },
            { time: 40, text: "พักผ่อนกายและใจให้เต็มที่" }
        ]
    },
    {
        id: 3,
        title: "Proud",
        artist: "Tan Liptapallop",
        src: "Song/fellow fellow Proud OFFICIAL MV.mp3",
        cover: "Picture/Proud.png",
        lyrics: [
            { time: 0, text: "💡 (บีตสร้างสรรค์จังหวะปานกลาง)" },
            { time: 15, text: "สร้างสรรค์ไอเดียใหม่ๆ ในทำงาน" },
            { time: 30, text: "เดินไปข้างหน้าอย่างไร้ขีดจำกัด" }
        ]
    }
];

// State Management
let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let favorites = [];

// DOM Elements
const audio = document.getElementById('audio-player');
const playBtn = document.getElementById('btn-play');
const seekSlider = document.getElementById('seek-slider');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const volumeSlider = document.getElementById('volume-slider');

// Player UI Elements
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerCover = document.getElementById('player-cover');
const playerFavBtn = document.getElementById('player-fav-btn');

// Sidebar Mini Info
const sidebarTrackInfo = document.getElementById('sidebar-track-info');
const sidebarTitle = document.getElementById('sidebar-title');
const sidebarArtist = document.getElementById('sidebar-artist');
const sidebarCover = document.getElementById('sidebar-cover');

// App Initialization
window.onload = () => {
    renderSongs();
    loadSong(currentSongIndex, false);
    setupAudioEventListeners();
};

// Render All Songs Grid
function renderSongs() {
    const grid = document.getElementById('song-grid');
    grid.innerHTML = playlist.map((song, index) => `
        <div onclick="playSong(${index})" class="bg-custom-elevated p-3 rounded-md hover:bg-gray-800/80 transition group cursor-pointer flex flex-col">
            <div class="relative mb-3">
                <img src="${song.cover}" class="w-full aspect-square object-cover rounded-md shadow" alt="${song.title}">
                <button class="absolute bottom-2 right-2 w-10 h-10 bg-custom-primary text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition shadow-lg">
                    <i class="fa-solid fa-play pl-0.5"></i>
                </button>
            </div>
            <h3 class="font-semibold text-sm truncate mb-1">${song.title}</h3>
            <p class="text-xs text-gray-400 truncate">${song.artist}</p>
        </div>
    `).join('');
}

// Load Selected Song
function loadSong(index, shouldPlay = true) {
    currentSongIndex = index;
    const song = playlist[currentSongIndex];

    audio.src = song.src;
    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerCover.src = song.cover;

    sidebarTitle.textContent = song.title;
    sidebarArtist.textContent = song.artist;
    sidebarCover.src = song.cover;
    sidebarTrackInfo.classList.remove('hidden');

    document.getElementById('lyrics-title').textContent = song.title;
    document.getElementById('lyrics-artist').textContent = song.artist;
    document.getElementById('lyrics-cover').src = song.cover;
    renderLyrics(song.lyrics);

    updateFavoriteIcon();

    if (shouldPlay) {
        playAudio();
    }
}

// Audio Controls
function playAudio() {
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = `<i class="fa-solid fa-pause text-lg"></i>`;
    playerCover.classList.add('playing-animation');
}

function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = `<i class="fa-solid fa-play text-lg pl-0.5"></i>`;
    playerCover.classList.remove('playing-animation');
}

function togglePlayPause() {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

function playSong(index) {
    loadSong(index, true);
}

function nextSong() {
    if (isShuffle) {
        currentSongIndex = Math.floor(Math.random() * playlist.length);
    } else {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
    }
    loadSong(currentSongIndex, true);
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    loadSong(currentSongIndex, true);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('btn-shuffle').classList.toggle('text-custom-primary', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('btn-repeat').classList.toggle('text-custom-primary', isRepeat);
}

// Audio Events Setup
function setupAudioEventListeners() {
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            seekSlider.value = progress;
            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationTimeEl.textContent = formatTime(audio.duration);

            updateLyricsHighlight(audio.currentTime);
        }
    });

    audio.addEventListener('ended', () => {
        if (isRepeat) {
            playAudio();
        } else {
            nextSong();
        }
    });
}

function seekTo(value) {
    if (audio.duration) {
        audio.currentTime = (value / 100) * audio.duration;
    }
}

function setVolume(value) {
    audio.volume = value;
    const volumeIcon = document.getElementById('btn-volume');
    if (value == 0) {
        volumeIcon.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
    } else if (value < 0.5) {
        volumeIcon.innerHTML = `<i class="fa-solid fa-volume-low"></i>`;
    } else {
        volumeIcon.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    }
}

function toggleMute() {
    if (audio.volume > 0) {
        audio.volume = 0;
        volumeSlider.value = 0;
    } else {
        audio.volume = 0.7;
        volumeSlider.value = 0.7;
    }
    setVolume(audio.volume);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Favorites Functionality
function toggleFavoriteCurrent() {
    const currentSong = playlist[currentSongIndex];
    const index = favorites.findIndex(item => item.id === currentSong.id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(currentSong);
    }
    updateFavoriteIcon();
    renderFavorites();
}

function updateFavoriteIcon() {
    const currentSong = playlist[currentSongIndex];
    const isFav = favorites.some(item => item.id === currentSong.id);
    if (isFav) {
        playerFavBtn.innerHTML = `<i class="fa-solid fa-heart text-red-500"></i>`;
    } else {
        playerFavBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
    }
}

function renderFavorites() {
    const favContainer = document.getElementById('favorites-list');
    document.getElementById('fav-count').textContent = `${favorites.length} เพลง`;

    if (favorites.length === 0) {
        favContainer.innerHTML = `<p class="text-gray-400 py-4">ยังไม่มีเพลงที่ถูกใจ กดหัวใจเพื่อเพิ่มเพลงได้เลย</p>`;
        return;
    }

    favContainer.innerHTML = favorites.map((song) => {
        const originalIndex = playlist.findIndex(p => p.id === song.id);
        return `
            <div onclick="playSong(${originalIndex})" class="flex items-center justify-between p-2 rounded-md hover:bg-custom-elevated transition cursor-pointer group">
                <div class="flex items-center gap-3">
                    <img src="${song.cover}" class="w-10 h-10 rounded object-cover" alt="Cover">
                    <div>
                        <p class="text-sm font-semibold">${song.title}</p>
                        <p class="text-xs text-gray-400">${song.artist}</p>
                    </div>
                </div>
                <button class="text-xs text-gray-400 group-hover:text-white">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Search Functionality
function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (query.trim() !== '') {
        switchTab('search');
    }
    
    const filtered = playlist.filter(song => 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query)
    );

    const searchContainer = document.getElementById('search-results');
    if (filtered.length === 0) {
        searchContainer.innerHTML = `<p class="text-gray-400">ไม่พบเพลงที่คุณค้นหา</p>`;
        return;
    }

    searchContainer.innerHTML = filtered.map((song) => {
        const originalIndex = playlist.findIndex(p => p.id === song.id);
        return `
            <div onclick="playSong(${originalIndex})" class="flex items-center justify-between p-3 rounded-lg bg-custom-elevated hover:bg-gray-800 transition cursor-pointer">
                <div class="flex items-center gap-3">
                    <img src="${song.cover}" class="w-12 h-12 rounded object-cover" alt="Cover">
                    <div>
                        <p class="font-semibold">${song.title}</p>
                        <p class="text-xs text-gray-400">${song.artist}</p>
                    </div>
                </div>
                <i class="fa-solid fa-play text-gray-400"></i>
            </div>
        `;
    }).join('');
}

// Interactive Lyrics
function renderLyrics(lyrics) {
    const box = document.getElementById('lyrics-box');
    if (!lyrics || lyrics.length === 0) {
        box.innerHTML = `<p class="text-gray-500 italic">ไม่มีเนื้อเพลงสำหรับเพลงนี้</p>`;
        return;
    }

    box.innerHTML = lyrics.map((line, idx) => `
        <p id="lyric-line-${idx}" class="lyric-line text-gray-400 py-1">${line.text}</p>
    `).join('');
}

function updateLyricsHighlight(time) {
    const song = playlist[currentSongIndex];
    if (!song.lyrics) return;

    song.lyrics.forEach((line, idx) => {
        const el = document.getElementById(`lyric-line-${idx}`);
        if (el) {
            if (time >= line.time && (idx === song.lyrics.length - 1 || time < song.lyrics[idx + 1].time)) {
                el.classList.add('active');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('active');
            }
        }
    });
}

// Navigation Tabs Toggle
function switchTab(tab) {
    document.getElementById('view-home').classList.add('hidden');
    document.getElementById('view-search').classList.add('hidden');
    document.getElementById('view-favorites').classList.add('hidden');
    document.getElementById('view-lyrics').classList.add('hidden');

    document.getElementById(`view-${tab}`).classList.remove('hidden');

    ['home', 'search', 'favorites'].forEach(t => {
        const navBtn = document.getElementById(`nav-${t}`);
        if (navBtn) {
            navBtn.classList.remove('bg-custom-elevated', 'text-white');
            navBtn.classList.add('text-gray-400');
        }
    });

    const activeNav = document.getElementById(`nav-${tab}`);
    if (activeNav) {
        activeNav.classList.add('bg-custom-elevated', 'text-white');
        activeNav.classList.remove('text-gray-400');
    }

    if (tab === 'favorites') {
        renderFavorites();
    }
}

function toggleLyricsView() {
    const lyricsSec = document.getElementById('view-lyrics');
    if (lyricsSec.classList.contains('hidden')) {
        switchTab('lyrics');
        document.getElementById('lyrics-btn').classList.add('text-custom-primary');
    } else {
        switchTab('home');
        document.getElementById('lyrics-btn').classList.remove('text-custom-primary');
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Theme Switcher Logic
function setTheme(themeName) {
    document.body.className = `theme-${themeName} bg-custom-base text-white h-screen flex flex-col overflow-hidden`;
}