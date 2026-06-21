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
const COLORS = ['blue', 'yellow', 'red', 'black', 'cyan'];
const COLOR_EMOJIS = {
    blue: '🔵',
    yellow: '🟡',
    red: '🔴',
    black: '⚫',
    cyan: '⚪',
    first: '🪙'
};

const WALL_COLORS = [
    ['blue', 'yellow', 'red', 'black', 'cyan'],
    ['cyan', 'blue', 'yellow', 'red', 'black'],
    ['black', 'cyan', 'blue', 'yellow', 'red'],
    ['red', 'black', 'cyan', 'blue', 'yellow'],
    ['yellow', 'red', 'black', 'cyan', 'blue']
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
let activeTabPlayerId = null; // playerId of board currently being viewed

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
const roundIndicator = document.getElementById('azul-round-indicator');
const statusText = document.getElementById('azul-status-text');
const rulesBtn = document.getElementById('azul-rules-btn');
const quitGameBtn = document.getElementById('azul-quit-game-btn');
const bagLidStatus = document.getElementById('azul-bag-lid-status');
const factoriesGrid = document.getElementById('azul-factories-grid');
const centerPile = document.getElementById('azul-center-pile');
const selectionPanel = document.getElementById('azul-selection-panel');
const selectedTilesPreview = document.getElementById('azul-selected-tiles-preview');
const cancelSelectionBtn = document.getElementById('azul-cancel-selection-btn');
const boardTabs = document.getElementById('azul-board-tabs');
const boardOwnerName = document.getElementById('azul-board-owner-name');
const boardScore = document.getElementById('azul-board-score');
const patternLinesContainer = document.querySelector('.azul-pattern-lines-container');
const wallGrid = document.getElementById('azul-wall-grid');
const floorLineRow = document.getElementById('azul-floor-line-row');
const floorLineSection = document.getElementById('azul-floor-line-section');
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
if (cancelSelectionBtn) cancelSelectionBtn.addEventListener('click', clearSelection);

// Helper functions for setup
function getNumFactories(numPlayers) {
    if (numPlayers === 2) return 5;
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

        // Auto transition screen
        if (val.status === 'playing' || val.status === 'gameover') {
            lobbyScreen.classList.remove('active');
            gameScreen.classList.add('active');
            
            // Default active board view tab to current player if not set
            if (!activeTabPlayerId || !players[activeTabPlayerId]) {
                activeTabPlayerId = playerId;
            }
            
            renderGameBoard();
        } else {
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

    // Show start button to anyone if player count is between 2 and 4
    if (sortedPlayers.length >= 2 && sortedPlayers.length <= 4) {
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

// Render Board & In-game HUD
function renderGameBoard() {
    if (!gameData) return;

    // 1. HUD & Info Status
    roundIndicator.textContent = `Round ${gameData.round}`;
    
    // Status text
    const activePlayer = players[gameData.turn];
    const isMyTurn = gameData.turn === playerId;
    
    if (gameData.phase === 'game_over') {
        const winnerName = gameData.winner ? players[gameData.winner]?.name || 'Unknown' : 'Draw';
        statusText.textContent = `🏆 Game Over! Winner: ${winnerName}`;
        statusText.style.color = 'var(--warning)';
    } else {
        if (isMyTurn) {
            statusText.textContent = `👉 Your Turn! Draft tiles.`;
            statusText.style.color = 'var(--success)';
        } else {
            statusText.textContent = `⏳ Waiting for ${activePlayer ? activePlayer.name : 'opponent'}...`;
            statusText.style.color = 'var(--text-secondary)';
        }
    }

    // Bag & Lid status
    bagLidStatus.textContent = `Bag: ${gameData.bag ? gameData.bag.length : 0} | Discard Lid: ${gameData.lid ? gameData.lid.length : 0}`;

    // 2. Factories Grid
    factoriesGrid.innerHTML = '';
    if (gameData.factories) {
        gameData.factories.forEach((factoryTiles, idx) => {
            const plate = document.createElement('div');
            plate.className = `azul-factory-plate ${(!factoryTiles || factoryTiles.length === 0) ? 'empty' : ''}`;
            
            if (factoryTiles && factoryTiles.length > 0) {
                factoryTiles.forEach(tileColor => {
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${tileColor}`;
                    tile.textContent = COLOR_EMOJIS[tileColor] || '';
                    tile.dataset.factoryIdx = idx;
                    tile.dataset.color = tileColor;
                    
                    // Click listener for drafting selection
                    if (isMyTurn && gameData.phase === 'drafting') {
                        tile.addEventListener('click', (e) => {
                            e.stopPropagation();
                            selectTiles(idx, tileColor);
                        });
                    }
                    plate.appendChild(tile);
                });
            } else {
                plate.innerHTML = `<span style="grid-column: span 2; grid-row: span 2; font-size: 0.8rem; color: var(--text-muted);">Empty</span>`;
            }
            factoriesGrid.appendChild(plate);
        });
    }

    // 3. Center Pile
    centerPile.innerHTML = '';
    if (gameData.center && gameData.center.length > 0) {
        gameData.center.forEach(tileColor => {
            const tile = document.createElement('div');
            tile.className = `azul-tile ${tileColor}`;
            tile.textContent = COLOR_EMOJIS[tileColor] || '';
            tile.dataset.factoryIdx = -1;
            tile.dataset.color = tileColor;

            if (isMyTurn && gameData.phase === 'drafting' && tileColor !== 'first') {
                tile.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectTiles(-1, tileColor);
                });
            }
            centerPile.appendChild(tile);
        });
    } else {
        centerPile.innerHTML = `<span style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">No tiles in center</span>`;
    }

    // Highlight selected tiles locally
    if (selectedFactoryIdx !== null && selectedColor) {
        const allMatchingDomTiles = document.querySelectorAll(`.azul-tile[data-color="${selectedColor}"][data-factory-idx="${selectedFactoryIdx}"]`);
        allMatchingDomTiles.forEach(t => t.classList.add('selected'));
        
        // Show selection panel
        selectionPanel.style.display = 'flex';
        selectedTilesPreview.innerHTML = '';
        
        // Calculate how many matching tiles there are
        const count = getSelectedTilesCount();
        for (let i = 0; i < count; i++) {
            const tNode = document.createElement('div');
            tNode.className = `azul-tile ${selectedColor}`;
            tNode.style.width = '30px';
            tNode.style.height = '30px';
            tNode.style.fontSize = '0.8rem';
            tNode.textContent = COLOR_EMOJIS[selectedColor];
            selectedTilesPreview.appendChild(tNode);
        }
    } else {
        selectionPanel.style.display = 'none';
    }

    // 4. Tab Switcher
    boardTabs.innerHTML = '';
    const sortedPlayers = Object.values(players).sort((a, b) => a.joinedAt - b.joinedAt);
    sortedPlayers.forEach(p => {
        const tab = document.createElement('button');
        tab.className = `azul-tab-btn ${p.id === activeTabPlayerId ? 'active' : ''} ${p.id === gameData.turn ? 'is-turn' : ''}`;
        tab.innerHTML = `👤 ${escapeHtml(p.name)} <span style="font-size: 0.8rem; opacity: 0.8;">(${p.board?.score || 0})</span>`;
        tab.addEventListener('click', () => {
            activeTabPlayerId = p.id;
            renderGameBoard();
        });
        boardTabs.appendChild(tab);
    });

    // 5. Active Player Board Card Rendering
    const viewedPlayer = players[activeTabPlayerId];
    if (viewedPlayer && viewedPlayer.board) {
        const board = viewedPlayer.board;
        boardOwnerName.textContent = viewedPlayer.id === playerId ? 'Your Player Board' : `${viewedPlayer.name}'s Board`;
        boardScore.textContent = board.score || 0;

        // Render Pattern Lines
        patternLinesContainer.innerHTML = '';
        const isSelfBoard = viewedPlayer.id === playerId;
        const validPlacement = isSelfBoard && isMyTurn && selectedColor !== null;

        for (let r = 0; r < 5; r++) {
            const line = board.patternLines[r];
            const size = r + 1;

            const rowDiv = document.createElement('div');
            rowDiv.className = 'azul-pattern-line-row';
            
            // Check if placing is valid in this pattern line
            let isValidForPlacement = false;
            if (validPlacement) {
                // Rules:
                // 1. Color must not exist in this row of the wall
                const wallColorsInRow = WALL_COLORS[r];
                const colIdx = wallColorsInRow.indexOf(selectedColor);
                const hasTileOnWall = board.wall && board.wall[r] && board.wall[r][colIdx] === true;

                // 2. Line must be empty or match color and not be full
                const emptyOrMatches = line.count === 0 || line.color === selectedColor;
                const isNotFull = line.count < size;

                if (!hasTileOnWall && emptyOrMatches && isNotFull) {
                    isValidForPlacement = true;
                }
            }

            if (isValidForPlacement) {
                rowDiv.classList.add('valid-move');
                rowDiv.addEventListener('click', () => {
                    placeTilesOnPatternLine(r);
                });
            }

            // Render slots
            for (let s = size - 1; s >= 0; s--) {
                const slot = document.createElement('div');
                slot.className = 'azul-space-slot';
                
                if (s < line.count) {
                    // Fill slot with tile
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${line.color}`;
                    tile.textContent = COLOR_EMOJIS[line.color] || '';
                    slot.appendChild(tile);
                } else {
                    slot.innerHTML = `<span style="font-size: 0.7rem; color: rgba(255,255,255,0.15);">●</span>`;
                }
                rowDiv.appendChild(slot);
            }
            patternLinesContainer.appendChild(rowDiv);
        }

        // Render Wall Grid
        wallGrid.innerHTML = '';
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const isFilled = board.wall && board.wall[r] && board.wall[r][c] === true;
                const cellColor = WALL_COLORS[r][c];
                
                const cell = document.createElement('div');
                cell.className = 'azul-wall-cell';
                
                if (isFilled) {
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${cellColor}`;
                    tile.textContent = COLOR_EMOJIS[cellColor] || '';
                    cell.appendChild(tile);
                } else {
                    // Render Ghost tile
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${cellColor} ghost`;
                    tile.textContent = COLOR_EMOJIS[cellColor] || '';
                    cell.appendChild(tile);
                }
                wallGrid.appendChild(cell);
            }
        }

        // Render Floor Line
        floorLineRow.innerHTML = '';
        for (let f = 0; f < 7; f++) {
            const slot = document.createElement('div');
            slot.className = 'azul-floor-slot';
            
            const circle = document.createElement('div');
            circle.className = 'azul-floor-circle';
            
            const floorTileColor = board.floor ? board.floor[f] : null;
            if (floorTileColor) {
                const tile = document.createElement('div');
                tile.className = `azul-tile ${floorTileColor}`;
                tile.textContent = COLOR_EMOJIS[floorTileColor] || '';
                circle.appendChild(tile);
            } else {
                circle.innerHTML = `<span style="font-size: 0.75rem; color: rgba(255,255,255,0.15);">●</span>`;
            }
            
            const penaltyLabel = document.createElement('span');
            penaltyLabel.className = 'azul-penalty-label';
            penaltyLabel.textContent = `${FLOOR_PENALTIES[f]}`;
            
            slot.appendChild(circle);
            slot.appendChild(penaltyLabel);
            floorLineRow.appendChild(slot);
        }

        // Handle Floor Line as a placement target
        if (validPlacement) {
            floorLineSection.classList.add('valid-move');
            floorLineSection.onclick = () => {
                placeTilesOnFloorLine();
            };
        } else {
            floorLineSection.classList.remove('valid-move');
            floorLineSection.onclick = null;
        }
    }
}

// Drafting Selection Logics
function selectTiles(factoryIdx, color) {
    if (gameData.phase !== 'drafting' || gameData.turn !== playerId) return;

    if (selectedFactoryIdx === factoryIdx && selectedColor === color) {
        // Deselect
        clearSelection();
    } else {
        selectedFactoryIdx = factoryIdx;
        selectedColor = color;
    }
    renderGameBoard();
}

function clearSelection() {
    selectedFactoryIdx = null;
    selectedColor = null;
    if (gameScreen.classList.contains('active')) {
        renderGameBoard();
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
    if (selectedFactoryIdx === null || !selectedColor) return;

    const countToPlace = getSelectedTilesCount();
    let containsFirst = false;

    // 1. Take tiles from gameData
    const newFactories = [...gameData.factories];
    let newCenter = [...gameData.center];
    
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

    // 2. Update current player board
    const myBoard = { ...players[playerId].board };
    const myPatternLines = [...myBoard.patternLines];
    const myFloor = myBoard.floor ? [...myBoard.floor] : [];

    const line = { ...myPatternLines[lineIdx] };
    const capacity = lineIdx + 1;
    const currentCount = line.count;

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

    await update(ref(database, `game/azul/rooms/${roomName}`), stateUpdate);
    clearSelection();
}

async function placeTilesOnFloorLine() {
    if (selectedFactoryIdx === null || !selectedColor) return;

    const countToPlace = getSelectedTilesCount();
    let containsFirst = false;

    // Take tiles from gameData
    const newFactories = [...gameData.factories];
    let newCenter = [...gameData.center];
    
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
        // Drafting finished! Run wall tiling
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

    await update(ref(database, `game/azul/rooms/${roomName}`), stateUpdate);
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
    let nextBag = [...gameData.bag];
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
