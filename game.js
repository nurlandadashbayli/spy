// Import Firebase SDK (ES modules require imports at the top)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove,
    update,
    get
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
    gameStarted: false
};

// Animal names pool
const animalNames = [
    '🦊 Fox', '🐻 Bear', '🐼 Panda', '🦁 Lion', '🐯 Tiger',
    '🐨 Koala', '🐰 Rabbit', '🦝 Raccoon', '🦉 Owl', '🐺 Wolf',
    '🦌 Deer', '🐧 Penguin', '🦒 Giraffe', '🐘 Elephant', '🦛 Hippo',
    '🦓 Zebra', '🐆 Leopard', '🦘 Kangaroo', '🦥 Sloth', '🦦 Otter'
];

// DOM Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const playerNameInput = document.getElementById('player-name');
const joinBtn = document.getElementById('join-btn');
const playersWaiting = document.getElementById('players-waiting');
const playersList = document.getElementById('players-list');
const startGameBtn = document.getElementById('start-game-btn');
const leaveBtn = document.getElementById('leave-btn');
const roleDisplay = document.getElementById('role-display');
const gamePlayersList = document.getElementById('game-players-list');
const newGameBtn = document.getElementById('new-game-btn');

// Room reference (single room for all players)
const roomRef = ref(database, 'game/room');
const playersRef = ref(database, 'game/room/players');
const gameStatusRef = ref(database, 'game/room/status');

// Event Listeners
joinBtn.addEventListener('click', joinGame);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinGame();
});
startGameBtn.addEventListener('click', startGame);
leaveBtn.addEventListener('click', leaveGame);
newGameBtn.addEventListener('click', resetGame);

// Listen for players changes
onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    updatePlayersList(players);

    // Enable start button if at least 2 players
    startGameBtn.disabled = Object.keys(players).length < 2;
});

// Listen for game status changes
onValue(gameStatusRef, (snapshot) => {
    const status = snapshot.val();
    if (status === 'started' && !gameState.gameStarted) {
        gameState.gameStarted = true;
        showGameScreen();
    } else if (status === 'lobby') {
        gameState.gameStarted = false;
    }
});

// Join game function
async function joinGame() {
    const playerName = playerNameInput.value.trim();

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
        console.log('Joining game...');
        const newPlayerRef = push(playersRef);
        gameState.playerId = newPlayerRef.key;
        gameState.currentPlayer = {
            id: gameState.playerId,
            name: playerName,
            role: null,
            joinedAt: Date.now()
        };

        await set(newPlayerRef, gameState.currentPlayer);
        console.log('✅ Joined game!');

        // Show waiting area
        playersWaiting.style.display = 'block';
        document.querySelector('.card:first-of-type').style.display = 'none';

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
            alert('Need at least 2 players to start!');
            return;
        }

        // Assign roles
        const playerIds = Object.keys(players);
        const spyIndex = Math.floor(Math.random() * playerIds.length);

        // Shuffle animal names
        const shuffledAnimals = [...animalNames].sort(() => Math.random() - 0.5);

        // Assign roles to each player
        const updates = {};
        playerIds.forEach((playerId, index) => {
            if (index === spyIndex) {
                updates[`players/${playerId}/role`] = '🕵️ SPY';
            } else {
                updates[`players/${playerId}/role`] = shuffledAnimals[index];
            }
        });

        // Set game status to started
        updates['status'] = 'started';

        await update(roomRef, updates);

    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    }
}

// Show game screen
async function showGameScreen() {
    try {
        const snapshot = await get(ref(database, `game/room/players/${gameState.playerId}`));
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
    if (gameState.playerId) {
        try {
            await remove(ref(database, `game/room/players/${gameState.playerId}`));
            resetLocalState();
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }
}

// Reset game function
async function resetGame() {
    try {
        // Reset room to lobby state
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

        // Return to lobby
        gameScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
        gameState.gameStarted = false;

    } catch (error) {
        console.error('Error resetting game:', error);
        alert('Failed to reset game. Please try again.');
    }
}

// Reset local state
function resetLocalState() {
    gameState.currentPlayer = null;
    gameState.playerId = null;
    gameState.gameStarted = false;

    playerNameInput.value = '';
    playersWaiting.style.display = 'none';
    document.querySelector('.card:first-of-type').style.display = 'block';
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (gameState.playerId) {
        remove(ref(database, `game/room/players/${gameState.playerId}`));
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize - set room to lobby status if it doesn't exist
get(gameStatusRef).then(snapshot => {
    if (!snapshot.exists()) {
        set(gameStatusRef, 'lobby');
    }
});
