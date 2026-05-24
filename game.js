// Import Firebase SDK (ES modules require imports at the top)
import { animalNames, cities, countries, adjectives } from './constants.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove,
    update,
    get,
    onDisconnect
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBT0StKCiled3K5uAi3lcrJlFALXI5KgvE",
    authDomain: "spy-game-4ce29.firebaseapp.com",
    databaseURL: "https://spy-game-4ce29-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spy-game-4ce29",
    storageBucket: "spy-game-4ce29.firebasestorage.app",
    messagingSenderId: "20232358549",
    appId: "1:20232358549:web:feb22d19fb56e13ec9699c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log('✅ Firebase initialized');

// Monitor connection
const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snap) => {
    console.log(snap.val() ? '✅ Connected to Firebase' : '⚠️ Disconnected');
});

// Game State
const gameState = {
    currentPlayer: null,
    playerId: null,
    gameStarted: false,
    roomName: null
};

// Pools are imported from constants.js

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const selectSpy = document.getElementById('select-spy');
const selectWordle = document.getElementById('select-wordle');
const backToHubBtn = document.getElementById('back-to-hub-btn');

const playerNameInput = document.getElementById('player-name');
const roomNameInput = document.getElementById('room-name');
const joinBtn = document.getElementById('join-btn');
const playersWaiting = document.getElementById('players-waiting');
const playersList = document.getElementById('players-list');
const startGameBtn = document.getElementById('start-game-btn');
const leaveBtn = document.getElementById('leave-btn');
const roleDisplay = document.getElementById('role-display');
const gamePlayersList = document.getElementById('game-players-list');
const resetLobbyBtn = document.getElementById('reset-lobby-btn');
const newGameBtn = document.getElementById('new-game-btn');
const joinSection = document.getElementById('join-section');
const lobbyControls = document.getElementById('lobby-controls');
const lobbyControlsBottom = document.getElementById('lobby-controls-bottom');
const categorySelect = document.getElementById('category-select');
const activeRoomsSection = document.getElementById('active-rooms-section');
const activeRoomsList = document.getElementById('active-rooms-list');

// Ensure essential elements exist
if (!joinSection || !lobbyControls) {
    console.error('Critical DOM elements missing!');
}

// Room reference variables (dynamically set when joining)
let roomRef = null;
let playersRef = null;
let gameStatusRef = null;

// Firebase listener cleanup functions
let unsubscribePlayers = null;
let unsubscribeStatus = null;
let unsubscribeActiveRooms = null;

// Adjectives pool is imported from constants.js

// Event Listeners
if (joinBtn) joinBtn.addEventListener('click', joinGame);
if (playerNameInput) {
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
}
if (roomNameInput) {
    roomNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
}
// Category change (Player's vote)
if (categorySelect) {
    categorySelect.addEventListener('change', () => {
        if (gameState.playerId && gameState.roomName) {
            update(ref(database, `game/rooms/${gameState.roomName}/players/${gameState.playerId}`), {
                categoryVote: categorySelect.value
            });
        }
    });
}
// Start and Reset for all
if (startGameBtn) startGameBtn.addEventListener('click', startGame);
if (leaveBtn) leaveBtn.addEventListener('click', leaveGame);
if (newGameBtn) newGameBtn.addEventListener('click', resetGame);
if (resetLobbyBtn) resetLobbyBtn.addEventListener('click', resetLobby);

// Selection Screen Navigation
if (selectSpy) {
    selectSpy.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
        startActiveRoomsListener();
    });
}

if (selectWordle) {
    selectWordle.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        document.getElementById('wordle-lobby-screen').classList.add('active');
    });
}

if (backToHubBtn) {
    backToHubBtn.addEventListener('click', async () => {
        if (gameState.playerId) {
            await leaveGame();
        }
        stopActiveRoomsListener();
        lobbyScreen.classList.remove('active');
        gameScreen.classList.remove('active');
        selectionScreen.classList.add('active');
    });
}

function startActiveRoomsListener() {
    if (unsubscribeActiveRooms) return;

    // Only show if we haven't joined a room
    if (!gameState.playerId && activeRoomsSection) {
        activeRoomsSection.style.display = 'block';
    }

    const roomsRef = ref(database, 'game/rooms');
    unsubscribeActiveRooms = onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val() || {};
        const activeRooms = [];

        for (const [roomName, roomData] of Object.entries(rooms)) {
            // Check if there are players
            const players = roomData.players || {};
            const playerCount = Object.keys(players).length;

            // Exclude rooms that are already started
            if (playerCount > 0 && roomData.status === 'lobby') {
                activeRooms.push({
                    name: roomName,
                    count: playerCount
                });
            }
        }

        if (activeRoomsList) {
            if (activeRooms.length === 0) {
                activeRoomsList.innerHTML = '<p class="waiting-text">No active rooms found. Create one above!</p>';
            } else {
                activeRoomsList.innerHTML = activeRooms.map(room => `
                    <button class="btn btn-secondary active-room-btn" data-room="${escapeHtml(room.name)}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; width: 100%;">
                        <span>${escapeHtml(room.name)}</span>
                        <span class="badge" style="background: var(--primary);">${room.count} player${room.count > 1 ? 's' : ''}</span>
                    </button>
                `).join('');

                // Add click listeners to new buttons
                document.querySelectorAll('.active-room-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetRoom = e.currentTarget.getAttribute('data-room');
                        quickJoinRoom(targetRoom);
                    });
                });
            }
        }
    });
}

function stopActiveRoomsListener() {
    if (unsubscribeActiveRooms) {
        unsubscribeActiveRooms();
        unsubscribeActiveRooms = null;
    }
    if (activeRoomsSection) {
        activeRoomsSection.style.display = 'none';
    }
}

function quickJoinRoom(targetRoom) {
    if (roomNameInput) roomNameInput.value = targetRoom;

    // Generate random name
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    // get random animal name without emoji
    const randomAnimalStr = animalNames[Math.floor(Math.random() * animalNames.length)];
    // Split by space, take the word part
    const [, ...animalParts] = randomAnimalStr.split(' ');
    const randomAnimal = animalParts.join('');

    const randomName = `${randomAdjective}${randomAnimal}`;
    if (playerNameInput) playerNameInput.value = randomName;

    joinGame();
}

function setupRoomListeners() {
    // Listen for players changes
    unsubscribePlayers = onValue(playersRef, (snapshot) => {
        const players = snapshot.val() || {};

        // If we were removed from the room (kicked by lobby reset), clean up
        if (gameState.playerId && !players[gameState.playerId]) {
            console.warn('You have been removed from the lobby.');
            resetLocalState();
            lobbyScreen.classList.remove('active');
            gameScreen.classList.remove('active');
            selectionScreen.classList.add('active');
            return;
        }

        updatePlayersList(players);

        // Update Start Game button state
        const playerCount = Object.keys(players).length;
        if (startGameBtn) startGameBtn.disabled = playerCount < 2;
    });

    // Listen for game status changes
    unsubscribeStatus = onValue(gameStatusRef, (snapshot) => {
        const status = snapshot.val();
        if (status === 'started' && !gameState.gameStarted) {
            gameState.gameStarted = true;
            showGameScreen();
        } else if (status === 'lobby' && gameState.gameStarted) {
            gameState.gameStarted = false;
            // Switch all clients back to lobby screen
            gameScreen.classList.remove('active');
            lobbyScreen.classList.add('active');
        } else if (status === 'lobby') {
            gameState.gameStarted = false;
        }
    });
}
// Join game function
async function joinGame() {
    const roomName = roomNameInput ? roomNameInput.value.trim().toLowerCase() : '';
    const playerName = playerNameInput.value.trim();

    if (!roomName) {
        alert('Please enter a room name!');
        if (roomNameInput) roomNameInput.focus();
        return;
    }

    if (!playerName) {
        alert('Please enter your name!');
        playerNameInput.focus();
        return;
    }

    if (playerName.length > 20) {
        alert('Name is too long! Maximum 20 characters.');
        return;
    }

    try {
        console.log(`Joining room: ${roomName}...`);

        gameState.roomName = roomName;
        roomRef = ref(database, `game/rooms/${roomName}`);
        playersRef = ref(database, `game/rooms/${roomName}/players`);
        gameStatusRef = ref(database, `game/rooms/${roomName}/status`);

        // Initialize status if needed
        const statusSnap = await get(gameStatusRef);
        if (!statusSnap.exists()) {
            await set(gameStatusRef, 'lobby');
        }

        const newPlayerRef = push(playersRef);
        gameState.playerId = newPlayerRef.key;
        gameState.currentPlayer = {
            id: gameState.playerId,
            name: playerName,
            categoryVote: categorySelect ? categorySelect.value : 'cities',
            role: null,
            joinedAt: Date.now()
        };

        await set(newPlayerRef, gameState.currentPlayer);

        console.log('✅ Joined game!');

        stopActiveRoomsListener();
        setupRoomListeners();

        // Update UI state
        if (joinSection) joinSection.style.display = 'none';
        if (lobbyControls) lobbyControls.style.display = 'block';
        if (lobbyControlsBottom) lobbyControlsBottom.style.display = 'block';

        // Hide "Waiting" text if it exists
        const waitingMsg = document.getElementById('waiting-for-host-msg');
        if (waitingMsg) waitingMsg.style.display = 'none';

    } catch (error) {
        console.error('Error joining game:', error);
        alert('Failed to join: ' + error.message);
    }
}

// Update players list
function updatePlayersList(players) {
    const playerArray = Object.entries(players || {}).map(([id, player]) => ({
        id,
        ...player
    }));

    // Sort by join time
    playerArray.sort((a, b) => a.joinedAt - b.joinedAt);

    // Update lobby list
    playersList.innerHTML = playerArray.map(player => `
        <div class="player-item">
            <span class="player-icon">👤</span>
            <span class="player-name">${escapeHtml(player.name)}</span>
        </div>
    `).join('');

    // Update game screen list if game started
    if (gameState.gameStarted) {
        gamePlayersList.innerHTML = playerArray.map(player => `
            <div class="player-item">
                <span class="player-icon">👤</span>
                <span class="player-name">${escapeHtml(player.name)}</span>
            </div>
        `).join('');
    }
}

// Start game function
async function startGame() {
    try {
        const snapshot = await get(playersRef);
        const players = snapshot.val();

        if (!players || Object.keys(players).length < 2) {
            console.warn('❌ Not enough players');
            alert('Need at least 2 players to start!');
            return;
        }

        // Tally category votes
        let votes = { animals: 0, cities: 0, countries: 0 };
        Object.values(players).forEach(p => {
            const vote = p.categoryVote || 'cities';
            votes[vote] = (votes[vote] || 0) + 1;
        });

        // Determine winning category
        let winningCategory = 'cities';
        let maxVotes = 0;
        for (const [cat, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                winningCategory = cat;
            }
        }

        let wordPool;
        if (winningCategory === 'cities') wordPool = cities;
        else if (winningCategory === 'countries') wordPool = countries;
        else wordPool = animalNames;

        // Assign roles
        const playerIds = Object.keys(players);
        const spyIndex = Math.floor(Math.random() * playerIds.length);
        const commonWord = wordPool[Math.floor(Math.random() * wordPool.length)];

        const updates = {};
        playerIds.forEach((playerId, index) => {
            if (index === spyIndex) {
                updates[`players/${playerId}/role`] = '🕵️ SPY';
            } else {
                updates[`players/${playerId}/role`] = commonWord;
            }
        });

        updates['status'] = 'started';
        updates['category'] = winningCategory;
        await update(roomRef, updates);

    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    }
}

// Show game screen
async function showGameScreen() {
    try {
        const snapshot = await get(ref(database, `game/rooms/${gameState.roomName}/players/${gameState.playerId}`));
        const playerData = snapshot.val();

        if (playerData && playerData.role) {
            const role = playerData.role;
            const isSpy = role.includes('SPY');

            // Update role display
            if (isSpy) {
                roleDisplay.innerHTML = `
                    <div class="role-icon">🕵️</div>
                    <div class="role-name">SPY</div>
                `;
            } else {
                // Extract emoji and name from role string
                const [emoji, ...nameParts] = role.split(' ');
                const name = nameParts.join(' ');
                roleDisplay.innerHTML = `
                    <div class="role-icon">${emoji}</div>
                    <div class="role-name">${name}</div>
                `;
            }

            // Fetch category to update instructions
            const roomSnap = await get(ref(database, `game/rooms/${gameState.roomName}/category`));
            const category = roomSnap.val() || 'cities';
            
            const categoryDisplay = document.getElementById('game-category-display');
            if (categoryDisplay) {
                let displayStr = '🏙️ Cities';
                if (category === 'animals') displayStr = '🐶 Animals';
                if (category === 'countries') displayStr = '🌍 Countries';
                categoryDisplay.innerText = `Category: ${displayStr}`;
            }
            
            const instructionCivilian = document.getElementById('instruction-civilian');
            if (instructionCivilian) {
                if (category === 'animals') {
                    instructionCivilian.innerHTML = "<strong>If you're an animal:</strong> Discuss and figure out who the spy is!";
                } else if (category === 'cities') {
                    instructionCivilian.innerHTML = "<strong>If you're a city:</strong> Discuss and figure out who the spy is!";
                } else if (category === 'countries') {
                    instructionCivilian.innerHTML = "<strong>If you're a country:</strong> Discuss and figure out who the spy is!";
                }
            }

            // Switch screens
            lobbyScreen.classList.remove('active');
            gameScreen.classList.add('active');

            // Update game players list
            const playersSnapshot = await get(playersRef);
            updatePlayersList(playersSnapshot.val());
        }
    } catch (error) {
        console.error('Error showing game screen:', error);
    }
}

// Leave game function
async function leaveGame() {
    if (gameState.playerId && gameState.roomName) {
        try {
            const playerRef = ref(database, `game/rooms/${gameState.roomName}/players/${gameState.playerId}`);
            await remove(playerRef);
            resetLocalState();
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }
}

// Reset game function
async function resetGame() {
    try {
        await update(roomRef, {
            status: 'lobby'
        });

        // Clear all player roles
        const snapshot = await get(playersRef);
        const players = snapshot.val();
        if (players) {
            const updates = {};
            Object.keys(players).forEach(playerId => {
                updates[`players/${playerId}/role`] = null;
            });
            await update(roomRef, updates);
        }

    } catch (error) {
        console.error('Error resetting game:', error);
        alert('Failed to reset game. Please try again.');
    }
}

// Reset Lobby function (Global Cleanup)
async function resetLobby() {
    try {
        console.log('Resetting lobby...');
        await remove(playersRef);
        await update(roomRef, {
            status: 'lobby'
        });
        console.log('✅ Lobby reset successful');
    } catch (error) {
        console.error('Error resetting lobby:', error);
        alert('Failed to reset lobby: ' + error.message);
    }
}

// Reset local state
function resetLocalState() {
    if (unsubscribePlayers) {
        unsubscribePlayers();
        unsubscribePlayers = null;
    }
    if (unsubscribeStatus) {
        unsubscribeStatus();
        unsubscribeStatus = null;
    }

    gameState.currentPlayer = null;
    gameState.playerId = null;
    gameState.gameStarted = false;
    gameState.roomName = null;

    roomRef = null;
    playersRef = null;
    gameStatusRef = null;

    playerNameInput.value = '';
    if (roomNameInput) roomNameInput.value = '';

    // UI Reset
    if (joinSection) joinSection.style.display = 'block';
    if (lobbyControls) lobbyControls.style.display = 'none';
    if (lobbyControlsBottom) lobbyControlsBottom.style.display = 'none';
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (gameState.playerId && gameState.roomName) {
        remove(ref(database, `game/rooms/${gameState.roomName}/players/${gameState.playerId}`));
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const stringText = String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return stringText.replace(/[&<>"']/g, m => map[m]);
}

// Initialize - set room to lobby status if it doesn't exist
get(gameStatusRef).then(snapshot => {
    if (!snapshot.exists()) {
        set(gameStatusRef, 'lobby');
    }
});
