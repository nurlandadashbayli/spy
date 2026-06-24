// azul.js
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
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

import { AzulUI } from './azul-ui.js';

// Firebase Configuration (Reused from existing workspace games)
const firebaseConfig = {
    apiKey: "AIzaSyBT0StKCiled3K5uAi3lcrJlFALXI5KgvE",
    authDomain: "spy-game-4ce29.firebaseapp.com",
    databaseURL: "https://spy-game-4ce29-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spy-game-4ce29",
    storageBucket: "spy-game-4ce29.firebasestorage.app",
    messagingSenderId: "20232358549",
    appId: "1:20232358549:web:feb22d19fb56e13ec9699c"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

// Constants
const COLORS = ['blue', 'yellow', 'red', 'green', 'white'];
const COLOR_EMOJIS = {
    blue: '🔵',
    yellow: '🟡',
    red: '🔴',
    green: '🟩',
    white: '⚪',
    first: '🪙'
};

const WALL_COLORS = [
    ['blue', 'yellow', 'red', 'green', 'white'],
    ['white', 'blue', 'yellow', 'red', 'green'],
    ['green', 'white', 'blue', 'yellow', 'red'],
    ['red', 'green', 'white', 'blue', 'yellow'],
    ['yellow', 'red', 'green', 'white', 'blue']
];

const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

// Game State variables
let roomName = '';
let playerId = '';
let playerName = '';
let players = {};
let gameData = null;
let unsubscribeRoom = null;
let unsubscribePlayers = null;

// Local interactive state
let selectedFactoryIdx = null; // null, -1 (center), or index 0..N
let selectedColor = null; // null or color name

// Azul UI Instance
let azulUI = null;

// DOM Elements
const selectAzul = document.getElementById('select-azul');
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('azul-lobby-screen');
const gameScreen = document.getElementById('azul-game-screen');
const joinSection = document.getElementById('azul-join-section');
const lobbySection = document.getElementById('azul-lobby-section');
const backBtn = document.getElementById('azul-back-btn');
const leaveBtn = document.getElementById('azul-leave-btn');
const roomInput = document.getElementById('azul-room-name');
const nameInput = document.getElementById('azul-player-name');
const joinBtn = document.getElementById('azul-join-btn');
const playersList = document.getElementById('azul-players-list');
const startBtn = document.getElementById('azul-start-btn');

// In-Game UI DOM Elements
const rulesBtn = document.getElementById('azul-rules-btn');
const quitGameBtn = document.getElementById('azul-quit-game-btn');
const rulesModal = document.getElementById('azul-rules-modal');
const rulesCloseBtn = document.getElementById('azul-rules-close-btn');

// Initial Setup
if (selectAzul) {
    selectAzul.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
        
        // Auto-fill player name if saved previously in local storage
        const savedName = localStorage.getItem('azul_playerName');
        if (savedName && nameInput) {
            nameInput.value = savedName;
        }
    });
}

if (backBtn) backBtn.addEventListener('click', leaveRoom);
if (leaveBtn) leaveBtn.addEventListener('click', leaveRoom);
if (quitGameBtn) quitGameBtn.addEventListener('click', leaveRoom);
if (joinBtn) joinBtn.addEventListener('click', joinRoom);
if (rulesBtn) rulesBtn.addEventListener('click', () => rulesModal.style.display = 'flex');
if (rulesCloseBtn) rulesCloseBtn.addEventListener('click', () => rulesModal.style.display = 'none');

// Helper functions for setup
function getNumFactories(numPlayers) {
    if (numPlayers <= 2) return 5;
    if (numPlayers === 3) return 7;
    return 9; // 4 players
}

function generatePlayerId() {
    return 'p_' + Math.random().toString(36).substr(2, 9);
}

// Join Room Logic
async function joinRoom() {
    roomName = roomInput.value.trim().toLowerCase();
    playerName = nameInput.value.trim();

    if (!roomName || !playerName) {
        alert('Please enter both Room Name and Player Name.');
        return;
    }

    localStorage.setItem('azul_playerName', playerName);
    
    // Use push() to generate a unique player ID per tab/session
    const playersRef = ref(database, `game/azul/rooms/${roomName}/players`);
    const newPlayerRef = push(playersRef);
    playerId = newPlayerRef.key;

    joinSection.style.display = 'none';
    lobbySection.style.display = 'block';

    const playerRoomRef = ref(database, `game/azul/rooms/${roomName}/players/${playerId}`);
    const initialBoard = {
        score: 0,
        patternLines: [
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 }
        ],
        wall: [
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false]
        ],
        floor: []
    };

    // Save player info in room
    await set(playerRoomRef, {
        id: playerId,
        name: playerName,
        joinedAt: Date.now(),
        board: initialBoard
    });

    // Remove player on disconnect
    onDisconnect(playerRoomRef).remove();

    // If this player is the first/only player in the room, reset any stale game state
    // This prevents jumping straight to a game screen from a previous session
    const currentPlayersSnap = await get(ref(database, `game/azul/rooms/${roomName}/players`));
    const currentPlayerCount = currentPlayersSnap.exists() ? Object.keys(currentPlayersSnap.val()).length : 0;
    if (currentPlayerCount <= 1) {
        await update(ref(database, `game/azul/rooms/${roomName}`), {
            status: 'waiting',
            state: null
        });
    }

    // Start listening to the room
    subscribeToRoom();
}

function leaveRoom() {
    if (roomName && playerId) {
        remove(ref(database, `game/azul/rooms/${roomName}/players/${playerId}`));
        
        // If room is empty, delete room
        get(ref(database, `game/azul/rooms/${roomName}/players`)).then((snap) => {
            if (!snap.exists() || Object.keys(snap.val()).length === 0) {
                remove(ref(database, `game/azul/rooms/${roomName}`));
            }
        });
    }

    // Cleanup listeners
    if (unsubscribeRoom) unsubscribeRoom();
    if (unsubscribePlayers) unsubscribePlayers();
    unsubscribeRoom = null;
    unsubscribePlayers = null;

    roomName = '';
    players = {};
    gameData = null;
    clearSelection();

    // Reset screens
    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    selectionScreen.classList.add('active');

    // Reset Container Size
    document.querySelector('.container').classList.remove('wide-container');

    joinSection.style.display = 'block';
    lobbySection.style.display = 'none';
}

function subscribeToRoom() {
    const roomRef = ref(database, `game/azul/rooms/${roomName}`);
    
    // Make container wide for Azul gameplay
    document.querySelector('.container').classList.add('wide-container');

    unsubscribeRoom = onValue(roomRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
            // Room deleted by host/reset
            if (gameScreen.classList.contains('active')) {
                alert('Room has been closed.');
                leaveRoom();
            }
            return;
        }

        players = val.players || {};
        gameData = val.state || null;

        if (gameData) {
            // Sanitize factories: replace null/undefined with [] to prevent Firebase update failures due to "undefined" values
            if (gameData.factories) {
                const numPlayers = Object.keys(players).length;
                const numFactories = getNumFactories(numPlayers);
                const safeFactories = [];
                for (let i = 0; i < numFactories; i++) {
                    safeFactories[i] = gameData.factories[i] || [];
                }
                gameData.factories = safeFactories;
            } else {
                gameData.factories = [];
            }
            if (!gameData.center) {
                gameData.center = [];
            } else if (!Array.isArray(gameData.center)) {
                gameData.center = Object.values(gameData.center);
            }
            if (!gameData.lid) {
                gameData.lid = [];
            } else if (!Array.isArray(gameData.lid)) {
                gameData.lid = Object.values(gameData.lid);
            }
            
            // Sanitize player structures
            if (gameData.players) {
                Object.values(gameData.players).forEach(player => {
                    if (!player.patternLines) {
                        player.patternLines = [[], [], [], [], []];
                    } else {
                        // Ensure it's an array of length 5
                        const safeLines = [];
                        for (let i = 0; i < 5; i++) {
                            const line = player.patternLines[i] || [];
                            safeLines[i] = Array.isArray(line) ? line : Object.values(line);
                        }
                        player.patternLines = safeLines;
                    }
                    
                    if (!player.floorLine) {
                        player.floorLine = [];
                    } else if (!Array.isArray(player.floorLine)) {
                        player.floorLine = Object.values(player.floorLine);
                    }
                    
                    if (!player.wall) {
                        player.wall = [
                            [null, null, null, null, null],
                            [null, null, null, null, null],
                            [null, null, null, null, null],
                            [null, null, null, null, null],
                            [null, null, null, null, null]
                        ];
                    } else {
                        const safeWall = [];
                        for (let i = 0; i < 5; i++) {
                            const row = player.wall[i] || [null, null, null, null, null];
                            safeWall[i] = Array.isArray(row) ? row : Object.values(row);
                        }
                        player.wall = safeWall;
                    }
                });
            }
        }

        // Auto transition screen — only go to game if status is playing AND state data exists
        if ((val.status === 'playing' || val.status === 'gameover') && gameData) {
            lobbyScreen.classList.remove('active');
            gameScreen.classList.add('active');
            
            if (!azulUI) {
                const uiRoot = document.getElementById('azul-ui-root');
                azulUI = new AzulUI(uiRoot, {
                    onFactoryTileClick: (factoryIdx, color) => {
                        selectTiles(factoryIdx, color);
                    },
                    onPatternLineClick: (lineIdx) => {
                        placeTilesOnPatternLine(lineIdx);
                    },
                    onFloorLineClick: () => {
                        placeTilesOnFloorLine();
                    }
                });
            }
            
            azulUI.updateState(gameData, players, playerId);
        } else {
            // Back in lobby (or waiting for game to start)
            azulUI = null; // Reset UI so it reinitialises fresh on next game start
            lobbyScreen.classList.add('active');
            gameScreen.classList.remove('active');
            renderLobby();
        }
    });
}

// Render Lobby
function renderLobby() {
    playersList.innerHTML = '';
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);

    sortedPlayers.forEach((p, idx) => {
        const item = document.createElement('div');
        item.style.padding = '0.75rem 1rem';
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.borderRadius = '8px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        
        item.innerHTML = `<span>👤 <strong>${escapeHtml(p.name)}</strong></span>`;
        playersList.appendChild(item);
    });

    // Show start button to anyone if player count is between 1 and 4
    if (sortedPlayers.length >= 1 && sortedPlayers.length <= 4) {
        startBtn.style.display = 'block';
        startBtn.onclick = startGame;
    } else {
        startBtn.style.display = 'none';
    }
}

// Initialize and Start Game
async function startGame() {
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
    const numPlayers = sortedPlayers.length;

    // Create a pool of 100 tiles (20 of each color)
    let bag = [];
    COLORS.forEach(c => {
        for (let i = 0; i < 20; i++) {
            bag.push(c);
        }
    });

    // Shuffle bag
    bag = shuffleArray(bag);

    // Set up factories
    const numFactories = getNumFactories(numPlayers);
    const factories = [];
    for (let i = 0; i < numFactories; i++) {
        const drawn = bag.splice(0, 4);
        factories.push(drawn);
    }

    // Set up Center
    const center = ['first'];

    const startingPlayerId = sortedPlayers[Math.floor(Math.random() * numPlayers)].id;

    // Reset player boards
    const playersUpdate = {};
    sortedPlayers.forEach(p => {
        playersUpdate[`players/${p.id}/board/score`] = 0;
        playersUpdate[`players/${p.id}/board/floor`] = [];
        playersUpdate[`players/${p.id}/board/wall`] = [
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false],
            [false, false, false, false, false]
        ];
        playersUpdate[`players/${p.id}/board/patternLines`] = [
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 },
            { color: null, count: 0 }
        ];
    });

    // Set state
    const state = {
        round: 1,
        turn: startingPlayerId,
        phase: 'drafting',
        bag: bag,
        lid: [],
        factories: factories,
        center: center,
        startingPlayerId: null // set when player draws first from center
    };

    const roomUpdate = {
        status: 'playing',
        state: state,
        ...playersUpdate
    };

    await update(ref(database, `game/azul/rooms/${roomName}`), roomUpdate);
}



// Drafting Selection Logics
function selectTiles(factoryIdx, color) {
    console.log('[Azul Debug] selectTiles called - factoryIdx:', factoryIdx, 'color:', color);
    if (gameData.phase !== 'drafting' || gameData.turn !== playerId) {
        console.warn('[Azul Debug] selectTiles early return. phase:', gameData.phase, 'turn:', gameData.turn, 'playerId:', playerId);
        return;
    }

    if (selectedFactoryIdx === factoryIdx && selectedColor === color) {
        console.log('[Azul Debug] Deselecting tiles');
        clearSelection();
    } else {
        selectedFactoryIdx = factoryIdx;
        selectedColor = color;
        console.log('[Azul Debug] Tiles selected. Globals set:', selectedFactoryIdx, selectedColor);
    }
    if (azulUI) azulUI.setSelection(selectedFactoryIdx, selectedColor);
}

function clearSelection() {
    console.log('[Azul Debug] clearSelection called');
    selectedFactoryIdx = null;
    selectedColor = null;
    if (azulUI && gameScreen.classList.contains('active')) {
        azulUI.setSelection(null, null);
    }
}

function getSelectedTilesCount() {
    if (selectedFactoryIdx === null || !selectedColor) return 0;

    if (selectedFactoryIdx === -1) {
        // Count in Center
        return gameData.center.filter(t => t === selectedColor).length;
    } else {
        // Count in Factory
        const f = gameData.factories[selectedFactoryIdx];
        return f ? f.filter(t => t === selectedColor).length : 0;
    }
}

// Place Drafted Tiles Action
async function placeTilesOnPatternLine(lineIdx) {
    console.log('[Azul Debug] placeTilesOnPatternLine called for line:', lineIdx);
    console.log('[Azul Debug] Globals - selectedFactoryIdx:', selectedFactoryIdx, 'selectedColor:', selectedColor);

    if (selectedFactoryIdx === null || !selectedColor) {
        console.warn('[Azul Debug] Aborting: No factory/color selected');
        return;
    }

    const countToPlace = getSelectedTilesCount();
    console.log('[Azul Debug] countToPlace:', countToPlace);
    let containsFirst = false;

    // 1. Take tiles from gameData
    const newFactories = [...(gameData.factories || [])];
    let newCenter = [...(gameData.center || [])];
    
    if (selectedFactoryIdx === -1) {
        // Take from Center
        newCenter = newCenter.filter(t => t !== selectedColor);
        // If center has 'first', player takes it
        const firstIdx = newCenter.indexOf('first');
        if (firstIdx !== -1) {
            containsFirst = true;
            newCenter.splice(firstIdx, 1);
        }
    } else {
        // Take from Factory
        const originalTiles = newFactories[selectedFactoryIdx];
        const leftovers = originalTiles.filter(t => t !== selectedColor);
        newCenter = [...newCenter, ...leftovers];
        newFactories[selectedFactoryIdx] = [];
    }

    const myBoard = { ...players[playerId].board };
    const myPatternLines = [...myBoard.patternLines];
    const myFloor = myBoard.floor ? [...myBoard.floor] : [];

    const line = { ...myPatternLines[lineIdx] };
    const capacity = lineIdx + 1;
    const currentCount = line.count;

    // VALIDATION (Server side equivalent check)
    const wallColorsInRow = WALL_COLORS[lineIdx];
    const colIdx = wallColorsInRow.indexOf(selectedColor);
    const hasTileOnWall = myBoard.wall && myBoard.wall[lineIdx] && myBoard.wall[lineIdx][colIdx] === true;
    const emptyOrMatches = line.count === 0 || line.color === selectedColor;
    const isNotFull = line.count < capacity;

    console.log('[Azul Debug] Validation - hasTileOnWall:', hasTileOnWall, 'emptyOrMatches:', emptyOrMatches, 'isNotFull:', isNotFull);

    if (hasTileOnWall || !emptyOrMatches || !isNotFull) {
        console.warn('[Azul Debug] Aborting: Validation failed');
        return;
    }

    let placedCount = 0;
    let overflowCount = 0;

    const spacesLeft = capacity - currentCount;
    if (countToPlace <= spacesLeft) {
        placedCount = countToPlace;
    } else {
        placedCount = spacesLeft;
        overflowCount = countToPlace - spacesLeft;
    }

    // Update pattern line color & count
    line.color = selectedColor;
    line.count = currentCount + placedCount;
    myPatternLines[lineIdx] = line;

    // Put overflow to floor line
    const newLid = gameData.lid ? [...gameData.lid] : [];
    if (containsFirst) {
        if (myFloor.length < 7) {
            myFloor.push('first');
        }
        // Save startingPlayerId for next round
        gameData.startingPlayerId = playerId;
    }

    for (let i = 0; i < overflowCount; i++) {
        if (myFloor.length < 7) {
            myFloor.push(selectedColor);
        } else {
            newLid.push(selectedColor);
        }
    }

    myBoard.patternLines = myPatternLines;
    myBoard.floor = myFloor;

    // 3. Determine next turn
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
    const myIndex = sortedPlayers.findIndex(p => p.id === playerId);
    const nextIndex = (myIndex + 1) % sortedPlayers.length;
    let nextTurnId = sortedPlayers[nextIndex].id;

    // 4. Check if Drafting Phase Ends
    const anyFactoryHasTiles = newFactories.some(f => f && f.length > 0);
    const centerHasColors = newCenter.some(t => t !== 'first');
    
    let currentPhase = 'drafting';
    let currentRound = gameData.round;

    if (!anyFactoryHasTiles && !centerHasColors) {
        // Drafting finished! Run automatic Wall-Tiling Phase
        executeWallTiling(myBoard, newFactories, newCenter, newLid);
        return;
    }

    // Push drafting updates to Firebase
    const stateUpdate = {
        'state/factories': newFactories,
        'state/center': newCenter,
        'state/lid': newLid,
        'state/turn': nextTurnId,
        'state/startingPlayerId': gameData.startingPlayerId || null,
        [`players/${playerId}/board`]: myBoard
    };

    console.log('[Azul Debug] Updating Firebase with stateUpdate:', stateUpdate);
    try {
        await update(ref(database, `game/azul/rooms/${roomName}`), stateUpdate);
        console.log('[Azul Debug] Firebase update success');
    } catch (err) {
        console.error('[Azul Debug] Firebase update error:', err);
    }
    clearSelection();
}

async function placeTilesOnFloorLine() {
    console.log('[Azul Debug] placeTilesOnFloorLine called');
    console.log('[Azul Debug] Globals - selectedFactoryIdx:', selectedFactoryIdx, 'selectedColor:', selectedColor);

    if (selectedFactoryIdx === null || !selectedColor) {
        console.warn('[Azul Debug] Aborting: No factory/color selected');
        return;
    }

    const countToPlace = getSelectedTilesCount();
    console.log('[Azul Debug] countToPlace:', countToPlace);
    let containsFirst = false;

    // Take tiles from gameData
    const newFactories = [...(gameData.factories || [])];
    let newCenter = [...(gameData.center || [])];
    
    if (selectedFactoryIdx === -1) {
        newCenter = newCenter.filter(t => t !== selectedColor);
        const firstIdx = newCenter.indexOf('first');
        if (firstIdx !== -1) {
            containsFirst = true;
            newCenter.splice(firstIdx, 1);
        }
    } else {
        const originalTiles = newFactories[selectedFactoryIdx];
        const leftovers = originalTiles.filter(t => t !== selectedColor);
        newCenter = [...newCenter, ...leftovers];
        newFactories[selectedFactoryIdx] = [];
    }

    // Update board
    const myBoard = { ...players[playerId].board };
    const myFloor = myBoard.floor ? [...myBoard.floor] : [];
    const newLid = gameData.lid ? [...gameData.lid] : [];

    if (containsFirst) {
        if (myFloor.length < 7) {
            myFloor.push('first');
        }
        gameData.startingPlayerId = playerId;
    }

    for (let i = 0; i < countToPlace; i++) {
        if (myFloor.length < 7) {
            myFloor.push(selectedColor);
        } else {
            newLid.push(selectedColor);
        }
    }

    myBoard.floor = myFloor;

    // Next turn
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
    const myIndex = sortedPlayers.findIndex(p => p.id === playerId);
    const nextIndex = (myIndex + 1) % sortedPlayers.length;
    let nextTurnId = sortedPlayers[nextIndex].id;

    // Check end drafting
    const anyFactoryHasTiles = newFactories.some(f => f && f.length > 0);
    const centerHasColors = newCenter.some(t => t !== 'first');

    if (!anyFactoryHasTiles && !centerHasColors) {
        console.log('[Azul Debug] Drafting ends, starting executeWallTiling');
        executeWallTiling(myBoard, newFactories, newCenter, newLid);
        return;
    }

    const stateUpdate = {
        'state/factories': newFactories,
        'state/center': newCenter,
        'state/lid': newLid,
        'state/turn': nextTurnId,
        'state/startingPlayerId': gameData.startingPlayerId || null,
        [`players/${playerId}/board`]: myBoard
    };

    console.log('[Azul Debug] Updating Firebase with stateUpdate (floor):', stateUpdate);
    try {
        await update(ref(database, `game/azul/rooms/${roomName}`), stateUpdate);
        console.log('[Azul Debug] Firebase update success (floor)');
    } catch (err) {
        console.error('[Azul Debug] Firebase update error (floor):', err);
    }
    clearSelection();
}

// Automatic Wall-Tiling Phase execution
async function executeWallTiling(myCurrentBoard, finalFactories, finalCenter, finalLid) {
    const roomRef = ref(database, `game/azul/rooms/${roomName}`);
    
    // Retrieve all player boards (so we score all of them)
    // Note: since this client triggers it, we simulate wall tiling for ALL players
    const updatedPlayers = {};
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);

    let lid = [...finalLid];

    sortedPlayers.forEach(p => {
        // Use my current board update if it's the current player, else use standard board from DB
        const board = p.id === playerId ? myCurrentBoard : p.board;
        const newBoard = JSON.parse(JSON.stringify(board)); // deep copy

        let scoreGained = 0;

        // Process pattern lines
        for (let r = 0; r < 5; r++) {
            const line = newBoard.patternLines[r];
            const size = r + 1;

            if (line.count === size) {
                // Complete! Tile the wall
                const tileColor = line.color;
                const colIdx = WALL_COLORS[r].indexOf(tileColor);

                // Place on wall
                newBoard.wall[r][colIdx] = true;

                // Calculate adjacent scoring points
                const pts = calculateTileScore(newBoard.wall, r, colIdx);
                scoreGained += pts;

                // Move remaining to lid
                for (let i = 0; i < r; i++) {
                    lid.push(tileColor);
                }

                // Reset pattern line
                line.color = null;
                line.count = 0;
            }
        }

        // Apply floor line penalty
        let penaltyPoints = 0;
        const floorCount = newBoard.floor ? newBoard.floor.length : 0;
        for (let i = 0; i < floorCount; i++) {
            penaltyPoints += FLOOR_PENALTIES[i];
        }

        // Update score
        newBoard.score = Math.max(0, (newBoard.score || 0) + scoreGained + penaltyPoints);

        // Move colored floor tiles to lid
        if (newBoard.floor) {
            newBoard.floor.forEach(tile => {
                if (tile !== 'first') {
                    lid.push(tile);
                }
            });
        }

        // Clear floor
        newBoard.floor = [];

        updatedPlayers[`players/${p.id}/board`] = newBoard;
    });

    // Determine starting player for next round
    let nextRoundTurn = gameData.startingPlayerId;
    if (!nextRoundTurn) {
        // Fallback to random
        nextRoundTurn = sortedPlayers[Math.floor(Math.random() * sortedPlayers.length)].id;
    }

    // Check if the game is over (if any player completed a horizontal row on their wall)
    let isGameOver = false;
    sortedPlayers.forEach(p => {
        const board = p.id === playerId ? updatedPlayers[`players/${p.id}/board`] : updatedPlayers[`players/${p.id}/board`];
        
        for (let r = 0; r < 5; r++) {
            const isRowComplete = board.wall[r].every(cell => cell === true);
            if (isRowComplete) {
                isGameOver = true;
            }
        }
    });

    let currentPhase = 'drafting';
    let status = 'playing';
    let winner = null;
    let nextBag = [...(gameData.bag || [])];
    let nextFactories = [];
    let nextCenter = ['first'];
    let nextRound = gameData.round + 1;

    if (isGameOver) {
        // Score final bonuses
        sortedPlayers.forEach(p => {
            const board = updatedPlayers[`players/${p.id}/board`];
            let bonuses = 0;

            // 1. Horizontal row completion: +2
            for (let r = 0; r < 5; r++) {
                if (board.wall[r].every(c => c === true)) {
                    bonuses += 2;
                }
            }

            // 2. Vertical columns completion: +7
            for (let c = 0; c < 5; c++) {
                let isColComplete = true;
                for (let r = 0; r < 5; r++) {
                    if (board.wall[r][c] !== true) {
                        isColComplete = false;
                        break;
                    }
                }
                if (isColComplete) {
                    bonuses += 7;
                }
            }

            // 3. Completed colors: +10
            COLORS.forEach(color => {
                let isColorComplete = true;
                for (let r = 0; r < 5; r++) {
                    const colIdx = WALL_COLORS[r].indexOf(color);
                    if (board.wall[r][colIdx] !== true) {
                        isColorComplete = false;
                        break;
                    }
                }
                if (isColorComplete) {
                    bonuses += 10;
                }
            });

            board.score += bonuses;
            updatedPlayers[`players/${p.id}/board`] = board;
        });

        // Determine winner
        let highestScore = -1;
        let highestHorizRows = -1;

        sortedPlayers.forEach(p => {
            const board = updatedPlayers[`players/${p.id}/board`];
            let completedRowsCount = 0;
            for (let r = 0; r < 5; r++) {
                if (board.wall[r].every(c => c === true)) {
                    completedRowsCount++;
                }
            }

            if (board.score > highestScore) {
                highestScore = board.score;
                highestHorizRows = completedRowsCount;
                winner = p.id;
            } else if (board.score === highestScore) {
                // Tiebreaker: horizontal rows
                if (completedRowsCount > highestHorizRows) {
                    highestHorizRows = completedRowsCount;
                    winner = p.id;
                }
            }
        });

        status = 'gameover';
        currentPhase = 'game_over';
    } else {
        // Setup next round factories
        const numFactories = getNumFactories(sortedPlayers.length);
        
        for (let i = 0; i < numFactories; i++) {
            if (nextBag.length < 4) {
                // Draw remaining, then dump lid, shuffle, and continue drawing
                const drawn = [...nextBag];
                nextBag = [...lid];
                lid = [];
                nextBag = shuffleArray(nextBag);
                
                const needed = 4 - drawn.length;
                const extra = nextBag.splice(0, needed);
                nextFactories.push([...drawn, ...extra]);
            } else {
                const drawn = nextBag.splice(0, 4);
                nextFactories.push(drawn);
            }
        }
    }

    // Write final room state
    const stateUpdate = {
        'status': status,
        'state/round': nextRound,
        'state/phase': currentPhase,
        'state/turn': nextRoundTurn,
        'state/bag': nextBag,
        'state/lid': lid,
        'state/factories': nextFactories,
        'state/center': nextCenter,
        'state/startingPlayerId': null,
        'state/winner': winner,
        ...updatedPlayers
    };

    await update(roomRef, stateUpdate);
    clearSelection();
}

// Calculate the points for a placed tile on wall
function calculateTileScore(wall, row, col) {
    // Check horizontal line
    let hCount = 1;
    // Scan left
    let c = col - 1;
    while (c >= 0 && wall[row][c] === true) {
        hCount++;
        c--;
    }
    // Scan right
    c = col + 1;
    while (c < 5 && wall[row][c] === true) {
        hCount++;
        c++;
    }

    // Check vertical line
    let vCount = 1;
    // Scan up
    let r = row - 1;
    while (r >= 0 && wall[r][col] === true) {
        vCount++;
        r--;
    }
    // Scan down
    r = row + 1;
    while (r < 5 && wall[r][col] === true) {
        vCount++;
        r++;
    }

    // Score calculation:
    // If we have both horizontal & vertical adjacent tiles, both count and the new tile is counted in both lines.
    // If only horizontal line exists (> 1 tile), score hCount.
    // If only vertical line exists (> 1 tile), score vCount.
    // If neither exists, score 1.
    if (hCount > 1 && vCount > 1) {
        return hCount + vCount;
    } else if (hCount > 1) {
        return hCount;
    } else if (vCount > 1) {
        return vCount;
    } else {
        return 1;
    }
}

// Shuffle Utility
function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Helper to escape HTML characters
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
