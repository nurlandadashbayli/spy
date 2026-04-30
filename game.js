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
    gameStarted: false
};

// Interval references for ghost player detection
let heartbeatInterval = null;
let ghostCheckInterval = null;

// Animal names pool
const animalNames = [
    '🐶 Dog', '🐱 Cat', '🐭 Mouse', '🐹 Hamster', '🐰 Rabbit', '🦊 Fox', '🐻 Bear', '🐼 Panda', '🐻‍❄️ Polar Bear', '🐨 Koala',
    '🐯 Tiger', '🦁 Lion', '🐮 Cow', '🐷 Pig', '🐸 Frog', '🐵 Monkey', '🐔 Chicken', '🐧 Penguin', '🐦 Bird', '🐤 Chick',
    '🦆 Duck', '🦅 Eagle', '🦉 Owl', '🦇 Bat', '🐺 Wolf', '🐗 Boar', '🐴 Horse', '🦄 Unicorn', '🐝 Bee', '🐛 Bug',
    '🦋 Butterfly', '🐌 Snail', '🐞 Beetle', '🐜 Ant', '🦟 Mosquito', '🦗 Cricket', '🕷️ Spider', '🐢 Turtle', '🐍 Snake', '🦎 Lizard',
    '🦂 Scorpion', '🐊 Crocodile', '🦑 Squid', '🐙 Octopus', '🦐 Shrimp', '🦀 Crab', '🐡 Pufferfish', '🐠 Fish', '🐬 Dolphin', '🐋 Whale',
    '🦈 Shark', '🦭 Seal', '🐆 Leopard', '🦓 Zebra', '🦍 Gorilla', '🦧 Orangutan', '🐘 Elephant', '🦛 Hippo', '🦏 Rhino', '🐪 Camel',
    '🦒 Giraffe', '🦘 Kangaroo', '🐃 Buffalo', '🐂 Ox', '🐏 Ram', '🐑 Sheep', '🐐 Goat', '🦙 Llama', '🦌 Deer', '🦃 Turkey',
    '🐓 Rooster', '🦚 Peacock', '🦜 Parrot', '🦢 Swan', '🦩 Flamingo', '🕊️ Dove', '🦫 Beaver', '🦡 Badger', '🦥 Sloth', '🦦 Otter',
    '🦨 Skunk', '🦔 Hedgehog', '🦕 Sauropod', '🦖 T-Rex', '🐉 Dragon', '🐋 Whale', '🐀 Rat', '🐁 Mouse', '🐈‍⬛ Black Cat', '🐩 Poodle',
    '🦮 Guide Dog', '🐕‍🦺 Service Dog', '🐅 Tiger', '🐎 Horse', '🐖 Pig', '🦣 Mammoth', '🦤 Dodo', '🦖 T-Rex', '🐡 Blowfish', '🦈 Shark'
];

// Capitals pool
const capitals = [
    'Paris', 'London', 'Berlin', 'Rome', 'Madrid', 'Lisbon', 'Amsterdam', 'Brussels', 'Vienna', 'Bern',
    'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki', 'Reykjavik', 'Dublin', 'Warsaw', 'Prague', 'Budapest', 'Athens',
    'Moscow', 'Kyiv', 'Ankara', 'Beijing', 'Tokyo', 'Seoul', 'Bangkok', 'Hanoi', 'New Delhi', 'Cairo',
    'Ottawa', 'Washington D.C.', 'Mexico City', 'Brasilia', 'Buenos Aires', 'Santiago', 'Lima', 'Bogota', 'Canberra', 'Wellington',
    'Riyadh', 'Baghdad', 'Tehran', 'Jerusalem', 'Beirut', 'Doha', 'Dubai (Not Capital, but fun)', 'Abu Dhabi', 'Nairobi', 'Cape Town'
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
const resetLobbyBtn = document.getElementById('reset-lobby-btn');
const newGameBtn = document.getElementById('new-game-btn');
const joinSection = document.getElementById('join-section');
const lobbyControls = document.getElementById('lobby-controls');
const categorySelect = document.getElementById('category-select');

// Ensure essential elements exist
if (!joinSection || !lobbyControls) {
    console.error('Critical DOM elements missing!');
}

// Room reference (single room for all players)
const roomRef = ref(database, 'game/room');
const playersRef = ref(database, 'game/room/players');
const gameStatusRef = ref(database, 'game/room/status');
const hostRef = ref(database, 'game/room/host');
const categoryRef = ref(database, 'game/room/category');

// Event Listeners
if (joinBtn) joinBtn.addEventListener('click', joinGame);
if (playerNameInput) {
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinGame();
    });
}
// Category change (Host only - validated in listener but good to have)
if (categorySelect) {
    categorySelect.addEventListener('change', () => {
        if (gameState.hostId === gameState.playerId) {
            set(categoryRef, categorySelect.value);
        } else {
            // Revert if non-host tries to change (UI should disable, but safety net)
            get(categoryRef).then(snap => {
                categorySelect.value = snap.val() || 'animals';
            });
        }
    });
}
// Start and Reset only work if you are host (UI prevents clicking, but good to check state too)
if (startGameBtn) startGameBtn.addEventListener('click', startGame);
if (leaveBtn) leaveBtn.addEventListener('click', leaveGame);
if (newGameBtn) newGameBtn.addEventListener('click', resetGame);
if (resetLobbyBtn) resetLobbyBtn.addEventListener('click', resetLobby);

// Listen for players changes
onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    updatePlayersList(players);

    // Check if host exists, if not and we are in lobby, maybe claim it?
    // Self-healing: Check for zombie host
    if (!gameState.gameStarted && gameState.playerId && Object.keys(players).length > 0) {
        // Check if the current known host is actually in the room
        const currentHostId = gameState.hostId;
        const hostExistsInRoom = currentHostId && players[currentHostId];

        if (!hostExistsInRoom) {
            console.log('⚠️ Host appears to be missing/zombie. Checking for promotion...');

            // Find oldest player
            const sortedPlayers = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
            const oldestPlayerId = sortedPlayers[0][0];

            if (oldestPlayerId === gameState.playerId) {
                console.log('👑 Promoting myself to host (Oldest Player)');
                set(hostRef, gameState.playerId);
            }
        }
    }

    // Check if we are host and need to enable buttons
    checkHostStatus(players);
});

// Listen for Host changes to update UI
onValue(hostRef, (snapshot) => {
    gameState.hostId = snapshot.val();
    checkHostStatus();

    // Re-render player list to show new host icon
    get(playersRef).then(snap => updatePlayersList(snap.val() || {}));
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

// Listen for Category changes
onValue(categoryRef, (snapshot) => {
    const category = snapshot.val() || 'animals';
    if (categorySelect) categorySelect.value = category;
});

// Check if current player is host and update UI
function checkHostStatus(currentPlayers = null) {
    const isHost = gameState.playerId && gameState.hostId === gameState.playerId;
    const isLobby = !gameState.gameStarted;

    // Ghost Check Logic (Host Only)
    if (isHost) {
        if (!ghostCheckInterval) {
            ghostCheckInterval = setInterval(async () => {
                try {
                    const snap = await get(playersRef);
                    const players = snap.val();
                    if (!players) return;

                    const now = Date.now();
                    for (const [id, player] of Object.entries(players)) {
                        // If no ping for 15 seconds, or ping is missing, assume ghost
                        const isStale = player.lastPing === undefined || (now - player.lastPing) > 15000;
                        if (isStale) {
                            console.log(`👻 Removing ghost player: ${player.name} (${id})`);
                            await remove(ref(database, `game/room/players/${id}`));
                        }
                    }
                } catch (e) {
                    console.error('Error during ghost check:', e);
                }
            }, 10000);
        }
    } else {
        if (ghostCheckInterval) {
            clearInterval(ghostCheckInterval);
            ghostCheckInterval = null;
        }
    }

    if (isHost && isLobby) {
        startGameBtn.style.display = 'inline-block';
        resetLobbyBtn.style.display = 'inline-block';
        if (categorySelect) categorySelect.disabled = false;

        // Use provided players or fetch them
        if (currentPlayers) {
            const count = Object.keys(currentPlayers).length;
            startGameBtn.disabled = count < 2;
        } else {
            get(playersRef).then(snap => {
                const count = snap.exists() ? Object.keys(snap.val()).length : 0;
                startGameBtn.disabled = count < 2;
            });
        }

        // Hide "Waiting" text if it was used for non-hosts
        const waitingMsg = document.getElementById('waiting-for-host-msg');
        if (waitingMsg) waitingMsg.style.display = 'none';

    } else {
        // Non-host or game started
        startGameBtn.style.display = 'none';
        resetLobbyBtn.style.display = 'none';
        if (categorySelect) categorySelect.disabled = true;

        // Show "Waiting for host" if in lobby and joined
        if (isLobby && gameState.playerId) {
            let waitingMsg = document.getElementById('waiting-for-host-msg');
            if (!waitingMsg) {
                waitingMsg = document.createElement('p');
                waitingMsg.id = 'waiting-for-host-msg';
                waitingMsg.className = 'waiting-text';
                waitingMsg.innerText = 'Waiting for Host to start game...';
                const container = document.querySelector('#lobby-controls .button-group');
                if (container) container.parentNode.insertBefore(waitingMsg, container);
            }
            waitingMsg.style.display = 'block';
        }
    }

}


// Join game function - No changes needed to initialization, but ensure default category
get(categoryRef).then(snap => {
    if (!snap.exists()) set(categoryRef, 'animals');
});

// Join game function (EXISTING CODE BELOW...)
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
            joinedAt: Date.now(),
            lastPing: Date.now()
        };

        await set(newPlayerRef, gameState.currentPlayer);

        // Start heartbeat to prevent being marked as a ghost
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            if (gameState.playerId) {
                update(ref(database, `game/room/players/${gameState.playerId}`), {
                    lastPing: Date.now()
                }).catch(e => console.error("Heartbeat failed", e));
            }
        }, 5000);

        // Register server-side cleanup: Firebase will auto-remove this player on disconnect
        onDisconnect(newPlayerRef).remove();

        // Check if there is a host, if not, claim it
        // OR if we are the only player, claim it (overwrites stale host)
        const playersSnap = await get(playersRef);
        const currentPlayers = playersSnap.val();
        const playerCount = currentPlayers ? Object.keys(currentPlayers).length : 0;

        const hostSnap = await get(hostRef);
        if (!hostSnap.exists() || playerCount === 1) {
            await set(hostRef, gameState.playerId);
            gameState.hostId = gameState.playerId;
            console.log('👑 You are now the Host!');

            // Force reset status to lobby if we are the only one (fixes stale 'started' state)
            await set(gameStatusRef, 'lobby');
        }

        console.log('✅ Joined game!');

        // Update UI state
        if (joinSection) joinSection.style.display = 'none';
        if (lobbyControls) lobbyControls.style.display = 'block';

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
    playersList.innerHTML = playerArray.map(player => {
        const isHost = player.id === gameState.hostId;
        return `
        <div class="player-item">
            <span class="player-icon">${isHost ? '👑' : '👤'}</span>
            <span class="player-name">${escapeHtml(player.name)}${isHost ? ' (Host)' : ''}</span>
        </div>
    `}).join('');

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
    // Double check host
    if (gameState.hostId !== gameState.playerId) return;

    try {
        const snapshot = await get(playersRef);
        const players = snapshot.val();


        if (!players || Object.keys(players).length < 2) {
            console.warn('❌ Not enough players');
            alert('Need at least 2 players to start!');
            return;
        }

        // Get Selected Category
        const categorySnap = await get(categoryRef);
        const category = categorySnap.val() || 'animals';
        const wordPool = category === 'capitals' ? capitals : animalNames;

        // Assign roles
        const playerIds = Object.keys(players);
        const spyIndex = Math.floor(Math.random() * playerIds.length);

        // Pick ONE common item logic
        const commonWord = wordPool[Math.floor(Math.random() * wordPool.length)];

        // Assign roles to each player

        const updates = {};
        playerIds.forEach((playerId, index) => {
            if (index === spyIndex) {
                updates[`players/${playerId}/role`] = '🕵️ SPY';
            } else {
                updates[`players/${playerId}/role`] = commonWord;
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
            // Cancel the onDisconnect hook since we're leaving cleanly
            const playerRef = ref(database, `game/room/players/${gameState.playerId}`);
            await onDisconnect(playerRef).cancel();
            await remove(playerRef);

            // Host Migration Logic
            if (gameState.hostId === gameState.playerId) {
                const snap = await get(playersRef);
                const players = snap.val();
                if (players && Object.keys(players).length > 0) {
                    // Find oldest player
                    const sortedPlayers = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
                    const newHostId = sortedPlayers[0][0];
                    await set(hostRef, newHostId);
                } else {
                    // No players left
                    await set(hostRef, null);
                    await set(gameStatusRef, 'lobby'); // Reset status if empty
                }
            }

            resetLocalState();
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }
}

// Reset game function
async function resetGame() {
    // Only host can reset
    if (gameState.hostId !== gameState.playerId) return;

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

// Reset Lobby function (Global Cleanup)
async function resetLobby() {
    try {
        console.log('Resetting lobby...');

        // Delete the entire players node
        await remove(playersRef);
        await set(hostRef, null); // Clear host

        // Ensure status is lobby
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
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (ghostCheckInterval) clearInterval(ghostCheckInterval);
    heartbeatInterval = null;
    ghostCheckInterval = null;

    gameState.currentPlayer = null;
    gameState.playerId = null;
    gameState.gameStarted = false;

    playerNameInput.value = '';

    // UI Reset
    if (joinSection) joinSection.style.display = 'block';
    if (lobbyControls) lobbyControls.style.display = 'none';
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (gameState.playerId) {
        // We can't easily do async await here reliably, but we try.
        // For host migration on close, we rely on checking active players or periodic cleanup,
        // but for this simple app, we can try to trigger leave.
        // Ideally, we'd use onDisconnect() from Firebase.

        // Basic cleanup attempt
        remove(ref(database, `game/room/players/${gameState.playerId}`));
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
