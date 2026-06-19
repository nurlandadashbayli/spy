// scrabble-game.js
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

// Firebase Configuration (Reused)
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
const letterData = {
    'A': { count: 9, points: 1 },
    'E': { count: 5, points: 1 },
    'Ə': { count: 9, points: 1 },
    'İ': { count: 8, points: 1 },
    'I': { count: 5, points: 1 },
    'N': { count: 7, points: 1 },
    'R': { count: 6, points: 1 },
    'L': { count: 6, points: 1 },
    'T': { count: 5, points: 1 },
    'D': { count: 4, points: 2 },
    'M': { count: 5, points: 2 },
    'S': { count: 4, points: 2 },
    'O': { count: 4, points: 2 },
    'Y': { count: 4, points: 2 },
    'Q': { count: 4, points: 2 },
    'Ş': { count: 3, points: 2 },
    'U': { count: 4, points: 2 },
    'B': { count: 3, points: 3 },
    'K': { count: 4, points: 3 },
    'C': { count: 2, points: 3 },
    'V': { count: 2, points: 3 },
    'Z': { count: 2, points: 3 },
    'X': { count: 1, points: 4 },
    'P': { count: 1, points: 4 },
    'Ç': { count: 2, points: 4 },
    'Ğ': { count: 2, points: 5 },
    'G': { count: 2, points: 5 },
    'Ö': { count: 3, points: 5 },
    'H': { count: 2, points: 5 },
    'Ü': { count: 3, points: 5 },
    'F': { count: 1, points: 8 },
    'J': { count: 1, points: 10 },
    '*': { count: 5, points: 0 }
};

const TW = ['0,0','0,7','0,14','7,0','7,14','14,0','14,7','14,14'];
const DW = ['1,1','2,2','3,3','4,4','10,10','11,11','12,12','13,13','1,13','2,12','3,11','4,10','13,1','12,2','11,3','10,4'];
const TL = ['1,5','1,9','5,1','5,5','5,9','5,13','9,1','9,5','9,9','9,13','13,5','13,9'];
const DL = ['0,3','0,11','2,6','2,8','3,0','3,7','3,14','6,2','6,6','6,8','6,12','7,3','7,11','8,2','8,6','8,8','8,12','11,0','11,7','11,14','12,6','12,8','14,3','14,11'];
const CENTER = '7,7';

// State
let roomName = '';
let playerId = '';
let playerName = '';
let players = {};
let gameData = null;
let unsubscribeRoom = null;
let unsubscribePlayers = null;

// Local State for Drag & Drop
let pendingPlacements = []; // Array of {r, c, letter, rackIdx}
let draggedTileInfo = null; // {source: 'rack'|'board', rackIdx, r, c, letter}

// DOM
const selectScrabble = document.getElementById('select-scrabble');
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('scrabble-lobby-screen');
const gameScreen = document.getElementById('scrabble-game-screen');
const joinSection = document.getElementById('scrabble-join-section');
const lobbySection = document.getElementById('scrabble-lobby-section');
const backBtn = document.getElementById('scrabble-back-btn');
const quitBtn = document.getElementById('scrabble-quit-btn');
const joinBtn = document.getElementById('scrabble-join-btn');
const startBtn = document.getElementById('scrabble-start-btn');
const leaveBtn = document.getElementById('scrabble-leave-btn');
const roomInput = document.getElementById('scrabble-room-name');
const nameInput = document.getElementById('scrabble-player-name');
const playersList = document.getElementById('scrabble-players-list');
const boardDiv = document.getElementById('scrabble-board');
const rackDiv = document.getElementById('scrabble-rack');
const playBtn = document.getElementById('scrabble-play-btn');
const passBtn = document.getElementById('scrabble-pass-btn');
const recallBtn = document.getElementById('scrabble-recall-btn');
const scoresList = document.getElementById('scrabble-scores-list');
const bagCount = document.getElementById('scrabble-bag-count');
const turnIndicator = document.getElementById('scrabble-turn-indicator');

// Modal DOM
const failModal = document.getElementById('scrabble-fail-modal');
const failText = document.getElementById('scrabble-fail-text');
const failCancelBtn = document.getElementById('scrabble-fail-cancel-btn');
const failRequestBtn = document.getElementById('scrabble-fail-request-btn');

const waitingModal = document.getElementById('scrabble-waiting-modal');

const decisionModal = document.getElementById('scrabble-decision-modal');
const decisionText = document.getElementById('scrabble-decision-text');
const decisionNoBtn = document.getElementById('scrabble-decision-no-btn');
const decisionYesBtn = document.getElementById('scrabble-decision-yes-btn');

const jokerModal = document.getElementById('scrabble-joker-modal');
const jokerInput = document.getElementById('scrabble-joker-input');
const jokerCancelBtn = document.getElementById('scrabble-joker-cancel-btn');
const jokerOkBtn = document.getElementById('scrabble-joker-ok-btn');

let pendingJokerDrop = null; // {r, c, rackIdx}
let pendingCommitData = null; // {word, wordScore, tempBoard}
let hasShuffledThisTurn = false;
let isSwapMode = false;
let tilesToSwap = [];

// DOM elements for Shuffle/Swap
const shuffleBtn = document.getElementById('scrabble-shuffle-btn');
const swapBtn = document.getElementById('scrabble-swap-btn');
const swapUi = document.getElementById('scrabble-swap-ui');
const confirmSwapBtn = document.getElementById('scrabble-confirm-swap-btn');
const cancelSwapBtn = document.getElementById('scrabble-cancel-swap-btn');

// Event Listeners
if (selectScrabble) {
    selectScrabble.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
    });
}

if (backBtn) backBtn.addEventListener('click', leaveRoom);
if (leaveBtn) leaveBtn.addEventListener('click', leaveRoom);
if (quitBtn) quitBtn.addEventListener('click', leaveRoom);
if (joinBtn) joinBtn.addEventListener('click', joinRoom);
if (startBtn) startBtn.addEventListener('click', startGame);

if (playBtn) playBtn.addEventListener('click', handlePlayWord);
if (passBtn) passBtn.addEventListener('click', handlePassTurn);
if (recallBtn) recallBtn.addEventListener('click', () => {
    pendingPlacements = [];
    renderGame();
});

if (shuffleBtn) shuffleBtn.addEventListener('click', async () => {
    if (gameData.currentTurn !== playerId) return alert("Not your turn.");
    if (hasShuffledThisTurn) return alert("You have already shuffled this turn.");
    
    let rack = [...(gameData.players[playerId].rack || [])];
    if (rack.length < 2) return;
    
    for (let i = rack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rack[i], rack[j]] = [rack[j], rack[i]];
    }
    
    hasShuffledThisTurn = true;
    
    // Update Firebase to persist shuffle
    await update(ref(database, `game/scrabble/rooms/${roomName}/players/${playerId}`), {
        rack: rack
    });
});

if (swapBtn) swapBtn.addEventListener('click', () => {
    if (gameData.currentTurn !== playerId) return alert("Not your turn.");
    if (pendingPlacements.length > 0) return alert("Recall tiles from the board first.");
    if (gameData.bag && gameData.bag.length < 1) return alert("Not enough tiles in the bag.");
    
    isSwapMode = true;
    tilesToSwap = [];
    swapUi.style.display = 'flex';
    renderGame();
});

if (cancelSwapBtn) cancelSwapBtn.addEventListener('click', () => {
    isSwapMode = false;
    tilesToSwap = [];
    swapUi.style.display = 'none';
    renderGame();
});

if (confirmSwapBtn) confirmSwapBtn.addEventListener('click', async () => {
    if (tilesToSwap.length === 0) return alert("Select at least 1 tile to swap.");
    
    const bag = [...(gameData.bag || [])];
    const rack = [...(gameData.players[playerId].rack || [])];
    
    // Remove chosen tiles from rack, add to bag
    // Important: sort descending to splice correctly
    const sortedIndices = [...tilesToSwap].sort((a, b) => b - a);
    for (let idx of sortedIndices) {
        bag.push(rack[idx]);
        rack.splice(idx, 1);
    }
    
    // Shuffle bag
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    
    // Draw new tiles
    while (rack.length < 7 && bag.length > 0) {
        const tile = drawBalancedTile(rack, bag);
        if (tile) rack.push(tile);
    }
    
    const turnOrder = gameData.turnOrder;
    const currIdx = turnOrder.indexOf(playerId);
    const nextTurn = turnOrder[(currIdx + 1) % turnOrder.length];
    
    // Commit changes
    await update(ref(database, `game/scrabble/rooms/${roomName}`), {
        bag: bag,
        [`players/${playerId}/rack`]: rack,
        currentTurn: nextTurn
    });
    
    isSwapMode = false;
    tilesToSwap = [];
    swapUi.style.display = 'none';
});

// Bag Modal Logic
const bagInfoBtn = document.getElementById('scrabble-bag-info-btn');
const bagModal = document.getElementById('scrabble-bag-modal');
const bagCloseBtn = document.getElementById('scrabble-bag-close-btn');
const bagGrid = document.getElementById('scrabble-bag-grid');

if (bagInfoBtn) bagInfoBtn.addEventListener('click', () => {
    if (!gameData || !gameData.bag) return;
    
    let counts = {};
    for (let letter of gameData.bag) {
        counts[letter] = (counts[letter] || 0) + 1;
    }
    
    bagGrid.innerHTML = Object.keys(letterData).map(letter => {
        // letterData keys are uppercase, gameData.bag also uses uppercase!
        const searchKey = letter;
        const count = counts[searchKey] || 0;
        const displayLetter = letter === '*' ? '' : letter;
        const points = letter === '*' ? 0 : letterData[letter].points;
        
        return `
            <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 8px; opacity: ${count === 0 ? '0.5' : '1'};">
                <div class="scrabble-tile" style="position: relative; cursor: default; margin-bottom: 0.25rem;">
                    ${displayLetter}
                    <span class="points">${points}</span>
                </div>
                <span style="font-size: 0.9rem; font-weight: bold;">x${count}</span>
            </div>
        `;
    }).join('');
    
    bagModal.style.display = 'flex';
});

if (bagCloseBtn) bagCloseBtn.addEventListener('click', () => bagModal.style.display = 'none');

// How To Play Modal
const htpBtn = document.getElementById('scrabble-how-to-play-btn');
const htpModal = document.getElementById('scrabble-how-to-play-modal');
const htpCloseBtn = document.getElementById('scrabble-htp-close-btn');

if (htpBtn) htpBtn.addEventListener('click', () => htpModal.style.display = 'flex');
if (htpCloseBtn) htpCloseBtn.addEventListener('click', () => htpModal.style.display = 'none');

// Modal Event Listeners
if (failCancelBtn) failCancelBtn.addEventListener('click', () => {
    failModal.style.display = 'none';
    playBtn.disabled = false;
    playBtn.innerText = 'Play Word';
});

if (failRequestBtn) failRequestBtn.addEventListener('click', async () => {
    failModal.style.display = 'none';
    if (!pendingCommitData) return;
    try {
        await update(ref(database, `game/scrabble/rooms/${roomName}`), {
            approvalRequest: {
                status: 'pending',
                word: pendingCommitData.mainWord,
                from: playerId
            }
        });
        waitingModal.style.display = 'flex';
    } catch (e) {
        console.error(e);
        alert('Failed to send request.');
        playBtn.disabled = false;
        playBtn.innerText = 'Play Word';
    }
});

if (decisionYesBtn) decisionYesBtn.addEventListener('click', async () => {
    decisionModal.style.display = 'none';
    await update(ref(database, `game/scrabble/rooms/${roomName}/approvalRequest`), { status: 'approved' });
});

if (decisionNoBtn) decisionNoBtn.addEventListener('click', async () => {
    decisionModal.style.display = 'none';
    await update(ref(database, `game/scrabble/rooms/${roomName}/approvalRequest`), { status: 'rejected' });
});

if (jokerCancelBtn) jokerCancelBtn.addEventListener('click', () => {
    jokerModal.style.display = 'none';
    pendingJokerDrop = null;
});

if (jokerOkBtn) jokerOkBtn.addEventListener('click', () => {
    let val = jokerInput.value.toLocaleUpperCase('az');
    if (!val || !letterData[val]) return alert('Please enter a valid letter.');
    
    jokerModal.style.display = 'none';
    if (pendingJokerDrop) {
        pendingPlacements.push({
            r: pendingJokerDrop.r,
            c: pendingJokerDrop.c,
            letter: val.toLowerCase(), // store as lowercase to indicate joker
            rackIdx: pendingJokerDrop.rackIdx
        });
        pendingJokerDrop = null;
        renderGame();
    }
});

// Setup Rack Drop Zone
rackDiv.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allow drop
});
rackDiv.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedTileInfo || draggedTileInfo.source !== 'board') return;
    
    // Remove from pending
    pendingPlacements = pendingPlacements.filter(p => !(p.r === draggedTileInfo.r && p.c === draggedTileInfo.c));
    renderGame();
});

// Lobby Logic
async function joinRoom() {
    roomName = roomInput.value.trim().toLowerCase();
    playerName = nameInput.value.trim();

    if (!roomName || !playerName) return alert('Enter room and name');

    try {
        const roomRef = ref(database, `game/scrabble/rooms/${roomName}`);
        const snap = await get(roomRef);
        const data = snap.val() || {};

        if (data.status === 'started') {
            return alert('Game already started in this room!');
        }

        const playerRef = ref(database, `game/scrabble/rooms/${roomName}/players`);
        const newPlayerRef = push(playerRef);
        playerId = newPlayerRef.key;

        await set(newPlayerRef, {
            name: playerName,
            score: 0,
            rack: []
        });

        if (!data.status) {
            await update(roomRef, { status: 'lobby' });
        }

        onDisconnect(newPlayerRef).remove();

        joinSection.style.display = 'none';
        lobbySection.style.display = 'block';

        setupRealtimeListeners();
    } catch (e) {
        console.error(e);
        alert('Failed to join.');
    }
}

let currentLocalTurn = null;

function setupRealtimeListeners() {
    const playersRef = ref(database, `game/scrabble/rooms/${roomName}/players`);
    const roomRef = ref(database, `game/scrabble/rooms/${roomName}`);

    unsubscribePlayers = onValue(playersRef, (snap) => {
        players = snap.val() || {};
        if (playerId && !players[playerId]) {
            resetToSelection();
            return;
        }
        updateLobbyUI();
    });

    unsubscribeRoom = onValue(roomRef, (snap) => {
        gameData = snap.val() || {};
        if (gameData.status === 'started') {
            lobbyScreen.classList.remove('active');
            gameScreen.classList.add('active');
            
            if (gameData.currentTurn !== currentLocalTurn) {
                currentLocalTurn = gameData.currentTurn;
                hasShuffledThisTurn = false;
                isSwapMode = false;
                tilesToSwap = [];
                if (swapUi) swapUi.style.display = 'none';
            }

            // If turn changes or board updates from another player, clear pending to prevent conflicts
            if (!gameData.currentTurn || gameData.currentTurn !== playerId) {
                pendingPlacements = [];
            }
            renderGame();
            if (gameData.approvalRequest) {
                handleApprovalRequest(gameData.approvalRequest);
            } else {
                if (waitingModal) waitingModal.style.display = 'none';
                if (decisionModal) decisionModal.style.display = 'none';
            }
        } else {
            gameScreen.classList.remove('active');
            lobbyScreen.classList.add('active');
        }
    });
}

function updateLobbyUI() {
    const pArray = Object.keys(players);
    playersList.innerHTML = Object.values(players).map(p => `
        <div class="card" style="padding: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            👤 ${escapeHtml(p.name)}
        </div>
    `).join('');

    if (pArray.length >= 2) {
        startBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'none';
    }
}

async function leaveRoom() {
    if (playerId && roomName) {
        await remove(ref(database, `game/scrabble/rooms/${roomName}/players/${playerId}`));
        const snap = await get(ref(database, `game/scrabble/rooms/${roomName}/players`));
        if (!snap.exists()) {
            await remove(ref(database, `game/scrabble/rooms/${roomName}`));
        }
    }
    resetToSelection();
}

function resetToSelection() {
    if (unsubscribePlayers) unsubscribePlayers();
    if (unsubscribeRoom) unsubscribeRoom();
    playerId = '';
    roomName = '';
    players = {};
    gameData = null;
    pendingPlacements = [];

    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    selectionScreen.classList.add('active');
    joinSection.style.display = 'block';
    lobbySection.style.display = 'none';
}

// Game Logic
function createBag() {
    const bag = [];
    for (const [letter, data] of Object.entries(letterData)) {
        for (let i = 0; i < data.count; i++) {
            bag.push(letter);
        }
    }
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
}

function drawBalancedTile(rack, bag) {
    if (bag.length === 0) return null;
    const vowels = ['A', 'E', 'Ə', 'İ', 'I', 'O', 'Ö', 'U', 'Ü'];
    let vCount = 0, cCount = 0;
    for (let tile of rack) {
        if (tile === '*') continue;
        if (vowels.includes(tile)) vCount++;
        else cCount++;
    }
    if (vCount >= 3) {
        const idx = bag.findLastIndex(t => t !== '*' && !vowels.includes(t));
        if (idx !== -1) return bag.splice(idx, 1)[0];
    }
    if (cCount >= 4) {
        const idx = bag.findLastIndex(t => vowels.includes(t));
        if (idx !== -1) return bag.splice(idx, 1)[0];
    }
    return bag.pop();
}

async function startGame() {
    try {
        let bag = createBag();
        const pKeys = Object.keys(players);
        const updates = {};
        
        pKeys.forEach(pId => {
            let rack = [];
            for (let i = 0; i < 7; i++) {
                const tile = drawBalancedTile(rack, bag);
                if (tile) rack.push(tile);
            }
            updates[`players/${pId}/rack`] = rack;
            updates[`players/${pId}/score`] = 0;
        });

        const board = Array(15).fill().map(() => Array(15).fill(null));

        updates.status = 'started';
        updates.board = board;
        updates.bag = bag;
        updates.currentTurn = pKeys[0];
        updates.turnOrder = pKeys;

        await update(ref(database, `game/scrabble/rooms/${roomName}`), updates);
    } catch(e) {
        console.error(e);
    }
}

function renderGame() {
    if (!gameData) return;
    
    // Scores
    scoresList.innerHTML = Object.entries(gameData.players || {}).map(([id, p]) => `
        <div style="display: flex; justify-content: space-between; align-items: center; ${id === gameData.currentTurn ? 'font-weight: bold; color: var(--primary-light);' : ''}">
            <span>${id === gameData.currentTurn ? '▶ ' : ''}${escapeHtml(p.name)} ${id === playerId ? '(You)' : ''}</span>
            <span class="badge">${p.score} pts</span>
        </div>
    `).join('');

    bagCount.innerText = gameData.bag ? gameData.bag.length : 0;

    const isMyTurn = gameData.currentTurn === playerId;
    if (isMyTurn) {
        turnIndicator.innerHTML = '<span style="color: var(--success);">Your Turn!</span>';
        playBtn.disabled = false;
        passBtn.disabled = false;
    } else {
        const currPName = gameData.players[gameData.currentTurn]?.name || 'Opponent';
        turnIndicator.innerHTML = `<span style="color: var(--warning);">${escapeHtml(currPName)}'s Turn</span>`;
        playBtn.disabled = true;
        passBtn.disabled = true;
    }

    const lastWordCard = document.getElementById('scrabble-last-word-card');
    const lastWordContent = document.getElementById('scrabble-last-word-content');

    if (gameData.lastPlay) {
        lastWordCard.style.display = 'block';
        if (gameData.lastPlay.allWords) {
            lastWordContent.innerHTML = gameData.lastPlay.allWords.map(w => `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--primary-light);">${w.word}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">${w.definition || 'No definition found.'}</div>
                </div>
            `).join('');
        } else {
            // Backwards compatibility for games started before this update
            lastWordContent.innerHTML = `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--primary-light);">${gameData.lastPlay.word}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">${gameData.lastPlay.definition || 'No definition found.'}</div>
                </div>`;
        }
    } else {
        lastWordCard.style.display = 'none';
    }

    renderBoard();
    renderRack();
}

function createTileElement(letter, isPending) {
    const tile = document.createElement('div');
    tile.className = `scrabble-tile ${isPending ? 'pending-tile' : ''}`;
    
    if (gameData.currentTurn === playerId && isPending !== false) {
        tile.draggable = true;
        tile.addEventListener('dragstart', (e) => {
            tile.classList.add('is-dragging');
        });
        tile.addEventListener('dragend', (e) => {
            tile.classList.remove('is-dragging');
            draggedTileInfo = null;
        });
    }

    // Handle Joker styling
    const isJoker = letter === letter.toLowerCase() && letter !== '*';
    const displayLetter = letter.toLocaleUpperCase('az');
    const points = isJoker ? 0 : (letterData[displayLetter]?.points || 0);

    tile.innerHTML = `
        ${displayLetter}
        <span class="points">${points}</span>
    `;
    return tile;
}

function renderRack() {
    rackDiv.innerHTML = '';
    const myRack = gameData.players[playerId]?.rack || [];
    
    // Find which rack indices are currently pending on the board
    const pendingIndices = pendingPlacements.map(p => p.rackIdx);

    myRack.forEach((letter, idx) => {
        if (pendingIndices.includes(idx)) {
            // Keep the empty space where the tile was dragged from to preserve rack structure
            const placeholder = document.createElement('div');
            placeholder.style.width = '45px';
            placeholder.style.height = '45px';
            rackDiv.appendChild(placeholder);
            return;
        }
        
        // If in swap mode, tiles shouldn't be draggable
        const tile = createTileElement(letter, isSwapMode ? false : undefined);
        
        if (isSwapMode) {
            tile.draggable = false;
            tile.style.cursor = 'pointer';
            if (tilesToSwap.includes(idx)) {
                tile.style.border = '3px solid var(--primary-light)';
                tile.style.transform = 'translateY(-8px)';
                tile.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)';
            }
            tile.addEventListener('click', () => {
                if (tilesToSwap.includes(idx)) {
                    tilesToSwap = tilesToSwap.filter(i => i !== idx);
                } else {
                    tilesToSwap.push(idx);
                }
                renderRack();
            });
        } else {
            tile.addEventListener('dragstart', () => {
                draggedTileInfo = { source: 'rack', letter, rackIdx: idx };
            });
        }
        
        rackDiv.appendChild(tile);
    });
}

function renderBoard() {
    boardDiv.innerHTML = '';
    const board = Array(15).fill().map(() => Array(15).fill(null));
    if (gameData.board) {
        for (let r = 0; r < 15; r++) {
            if (gameData.board[r]) {
                for (let c = 0; c < 15; c++) {
                    if (gameData.board[r][c]) board[r][c] = gameData.board[r][c];
                }
            }
        }
    }
    
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            const cell = document.createElement('div');
            cell.className = 'scrabble-cell';
            const pos = `${r},${c}`;

            if (pos === CENTER) cell.classList.add('center');
            else if (TW.includes(pos)) cell.classList.add('tw');
            else if (DW.includes(pos)) cell.classList.add('dw');
            else if (TL.includes(pos)) cell.classList.add('tl');
            else if (DL.includes(pos)) cell.classList.add('dl');

            // Drag and Drop targets
            cell.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!draggedTileInfo) return;
                
                // Cannot drop on an existing committed letter
                if (board[r][c]) return;

                // Cannot drop on another pending tile
                if (pendingPlacements.some(p => p.r === r && p.c === c)) {
                    // Try to swap? For simplicity, just reject.
                    return;
                }

                if (draggedTileInfo.source === 'rack') {
                    if (draggedTileInfo.letter === '*') {
                        // Prompt for Joker
                        pendingJokerDrop = { r: r, c: c, rackIdx: draggedTileInfo.rackIdx };
                        jokerInput.value = '';
                        jokerModal.style.display = 'flex';
                        setTimeout(() => jokerInput.focus(), 50);
                        return; // Wait for modal
                    } else {
                        pendingPlacements.push({
                            r: r, c: c, 
                            letter: draggedTileInfo.letter, 
                            rackIdx: draggedTileInfo.rackIdx
                        });
                    }
                } else if (draggedTileInfo.source === 'board') {
                    // Move existing pending tile
                    const pendingItem = pendingPlacements.find(p => p.r === draggedTileInfo.r && p.c === draggedTileInfo.c);
                    if (pendingItem) {
                        pendingItem.r = r;
                        pendingItem.c = c;
                    }
                }
                renderGame();
            });

            const committedLetter = board[r][c];
            const pendingLetterObj = pendingPlacements.find(p => p.r === r && p.c === c);

            if (committedLetter) {
                // Not draggable
                const t = createTileElement(committedLetter, false);
                if (gameData.lastPlayTiles && gameData.lastPlayTiles.includes(pos)) {
                    t.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.8), inset 0 0 5px rgba(52, 211, 153, 0.5)';
                    t.style.borderColor = 'var(--success)';
                }
                cell.appendChild(t);
            } else if (pendingLetterObj) {
                // Pending tile
                const tile = createTileElement(pendingLetterObj.letter, true);
                tile.addEventListener('dragstart', () => {
                    draggedTileInfo = {source: 'board', r: r, c: c, letter: pendingLetterObj.letter, rackIdx: pendingLetterObj.rackIdx};
                });
                cell.appendChild(tile);
            } else {
                // Empty cell backgrounds
                if (pos === CENTER) cell.innerHTML = '★';
                else if (cell.classList.contains('tw')) cell.innerHTML = 'TW';
                else if (cell.classList.contains('dw')) cell.innerHTML = 'DW';
                else if (cell.classList.contains('tl')) cell.innerHTML = 'TL';
                else if (cell.classList.contains('dl')) cell.innerHTML = 'DL';
                
                if (cell.innerHTML) {
                    cell.style.color = 'rgba(0,0,0,0.4)';
                    cell.style.fontSize = '0.7rem';
                }
            }

            boardDiv.appendChild(cell);
        }
    }
}

// --- Validation ---

function toWikiLower(word) {
    const map = {
        'I': 'ı', 'İ': 'i', 'Ə': 'ə', 'Ö': 'ö', 
        'Ü': 'ü', 'Ğ': 'ğ', 'Ç': 'ç', 'Ş': 'ş'
    };
    return word.replace(/[IİƏÖÜĞÇŞ]/g, m => map[m]).toLowerCase();
}

async function isValidWord(word) {
    if (!word || word.length < 2) return { valid: false, definition: null };
    let url;
    
    // Custom mapping to prevent JS converting 'İ' to 'i\u0307'
    let lowerWord = toWikiLower(word);
    let capitalizedWord = word.charAt(0) + toWikiLower(word.slice(1));
    let definition = null;

    try {
        // Helper to extract definition text from Wiki API response (for Wikipedia)
        const extractDef = (pages) => {
            for (let pageId in pages) {
                const p = pages[pageId];
                if (!p.hasOwnProperty('missing')) {
                    if (p.extract) {
                        let text = p.extract.replace(/\n/g, ' ').trim();
                        if (text.length > 150) text = text.substring(0, 147) + '...';
                        return text;
                    }
                    return true;
                }
            }
            return false;
        };

        // Helper to parse Wiktionary raw wikitext for definitions
        const parseWikitextDef = (pages) => {
            for (let pageId in pages) {
                const p = pages[pageId];
                if (!p.hasOwnProperty('missing')) {
                    try {
                        const wikitext = p.revisions[0].slots.main['*'];
                        const lines = wikitext.split('\n');
                        let inAzSection = false;
                        for (let line of lines) {
                            if (line.includes('{{Dil|Azərbaycan dili}}') || line.includes('==Azərbaycan dili==')) {
                                inAzSection = true;
                                continue;
                            }
                            if (inAzSection && line.match(/^==[^=]/)) {
                                // Hit another language section
                                inAzSection = false;
                            }

                            if (inAzSection && line.trim().startsWith('#') && !line.trim().startsWith('#:')) {
                                let def = line.trim().substring(1).trim();
                                def = def.replace(/\[\[([^\]\|]+\|)?([^\]]+)\]\]/g, '$2'); // remove links
                                def = def.replace(/\{\{[^\}]+\}\}/g, '').trim(); // remove templates
                                if (def.length > 150) def = def.substring(0, 147) + '...';
                                return def || true;
                            }
                        }
                        if (wikitext.includes('{{Dil|Azərbaycan dili}}') || wikitext.includes('==Azərbaycan dili==')) {
                            return true; // Exists in AZ section but couldn't parse definition
                        }
                    } catch(e) {}
                    return false; // Not in AZ dictionary or parse error, let it fall through to Wikipedia check
                }
            }
            return false;
        };

        // 1. Check az.wiktionary.org (with revisions for raw wikitext parsing)
        url = `https://az.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(lowerWord)}|${encodeURIComponent(capitalizedWord)}&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&origin=*`;
        let response = await fetch(url);
        let data = await response.json();
        if (data.query && data.query.pages) {
            let res = parseWikitextDef(data.query.pages);
            if (res !== false) return { valid: true, definition: typeof res === 'string' ? res : null };
        }

        // 2. Check az.wikipedia.org (with extracts)
        url = `https://az.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(lowerWord)}|${encodeURIComponent(capitalizedWord)}&prop=extracts&exintro=true&explaintext=true&redirects=1&format=json&origin=*`;
        response = await fetch(url);
        data = await response.json();
        if (data.query && data.query.pages) {
            let res = extractDef(data.query.pages);
            if (res !== false) return { valid: true, definition: typeof res === 'string' ? res : null };
        }

        // 3. Check en.wiktionary.org for "Azerbaijani" section (fallback)
        url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(lowerWord)}&prop=sections&redirects=1&format=json&origin=*`;
        response = await fetch(url);
        data = await response.json();
        if (data.parse && data.parse.sections && data.parse.sections.some(sec => sec.line.includes('Azerbaijani'))) {
            return { valid: true, definition: "Found in English Wiktionary (Azerbaijani section)." };
        }

        url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(capitalizedWord)}&prop=sections&redirects=1&format=json&origin=*`;
        response = await fetch(url);
        data = await response.json();
        if (data.parse && data.parse.sections && data.parse.sections.some(sec => sec.line.includes('Azerbaijani'))) {
            return { valid: true, definition: "Found in English Wiktionary (Azerbaijani section)." };
        }

        return { valid: false, definition: null };
    } catch (e) {
        console.error("API check failed", e);
        // Fallback to true so the game doesn't break if API is blocked by CORS/network
        return { valid: true, definition: "Network error, but word was accepted." }; 
    }
}

async function handlePassTurn() {
    if (gameData.currentTurn !== playerId) return;
    playBtn.disabled = true;
    passBtn.disabled = true;
    
    pendingPlacements = [];
    
    const turnOrder = gameData.turnOrder;
    const currIdx = turnOrder.indexOf(playerId);
    const nextTurn = turnOrder[(currIdx + 1) % turnOrder.length];
    
    await update(ref(database, `game/scrabble/rooms/${roomName}`), {
        currentTurn: nextTurn
    });
}
async function handlePlayWord() {
    if (gameData.currentTurn !== playerId) return;
    if (pendingPlacements.length === 0) return alert('Place some tiles first!');

    // 1. Verify alignment
    let isHorizontal = true;
    let isVertical = true;
    const firstR = pendingPlacements[0].r;
    const firstC = pendingPlacements[0].c;

    for (let p of pendingPlacements) {
        if (p.r !== firstR) isHorizontal = false;
        if (p.c !== firstC) isVertical = false;
    }

    if (!isHorizontal && !isVertical) {
        return alert('Tiles must be placed in a single straight line.');
    }

    const currentBoard = Array(15).fill().map(() => Array(15).fill(null));
    if (gameData.board) {
        for (let r = 0; r < 15; r++) {
            if (gameData.board[r]) {
                for (let c = 0; c < 15; c++) {
                    if (gameData.board[r][c]) currentBoard[r][c] = gameData.board[r][c];
                }
            }
        }
    }

    // Determine primary axis
    let mainAxis = 'horizontal';
    if (pendingPlacements.length > 1) {
        mainAxis = isHorizontal ? 'horizontal' : 'vertical';
    } else {
        const hasLeft = firstC > 0 && currentBoard[firstR][firstC - 1];
        const hasRight = firstC < 14 && currentBoard[firstR][firstC + 1];
        const hasTop = firstR > 0 && currentBoard[firstR - 1][firstC];
        const hasBottom = firstR < 14 && currentBoard[firstR + 1][firstC];
        if (hasLeft || hasRight) mainAxis = 'horizontal';
        else if (hasTop || hasBottom) mainAxis = 'vertical';
        else mainAxis = 'horizontal'; 
    }

    const tempBoard = JSON.parse(JSON.stringify(currentBoard));
    for (let p of pendingPlacements) {
        tempBoard[p.r][p.c] = p.letter;
    }

    const formedWords = []; // Array of { word, score, isMain }

    // Helper to extract and score a word given start/end coordinates and axis
    function extractAndScoreWord(startR, startC, endR, endC, axis, isMain) {
        let wordStr = '';
        let wordScore = 0;
        let wordMultiplier = 1;

        if (axis === 'horizontal') {
            for (let c = startC; c <= endC; c++) {
                const cellLetter = tempBoard[startR][c];
                wordStr += cellLetter.toLocaleUpperCase('az');
                
                const isJoker = cellLetter === cellLetter.toLowerCase() && cellLetter !== '*';
                let letterScore = isJoker ? 0 : (letterData[cellLetter.toLocaleUpperCase('az')]?.points || 0);
                
                // Only apply multipliers to newly placed tiles
                if (pendingPlacements.some(p => p.r === startR && p.c === c)) {
                    const pos = `${startR},${c}`;
                    if (TL.includes(pos)) letterScore *= 3;
                    if (DL.includes(pos)) letterScore *= 2;
                    if (TW.includes(pos)) wordMultiplier *= 3;
                    if (DW.includes(pos) || pos === CENTER) wordMultiplier *= 2;
                }
                wordScore += letterScore;
            }
        } else {
            for (let r = startR; r <= endR; r++) {
                const cellLetter = tempBoard[r][startC];
                wordStr += cellLetter.toLocaleUpperCase('az');
                
                const isJoker = cellLetter === cellLetter.toLowerCase() && cellLetter !== '*';
                let letterScore = isJoker ? 0 : (letterData[cellLetter.toLocaleUpperCase('az')]?.points || 0);

                if (pendingPlacements.some(p => p.r === r && p.c === startC)) {
                    const pos = `${r},${startC}`;
                    if (TL.includes(pos)) letterScore *= 3;
                    if (DL.includes(pos)) letterScore *= 2;
                    if (TW.includes(pos)) wordMultiplier *= 3;
                    if (DW.includes(pos) || pos === CENTER) wordMultiplier *= 2;
                }
                wordScore += letterScore;
            }
        }

        wordScore *= wordMultiplier;
        return { word: wordStr, score: wordScore, isMain };
    }

    // 3. Extract main word
    let startR = firstR, startC = firstC;
    let endR = firstR, endC = firstC;

    if (mainAxis === 'horizontal') {
        while (startC > 0 && tempBoard[startR][startC - 1]) startC--;
        while (endC < 14 && tempBoard[endR][endC + 1]) endC++;
    } else {
        while (startR > 0 && tempBoard[startR - 1][startC]) startR--;
        while (endR < 14 && tempBoard[endR + 1][endC]) endR++;
    }

    // Always push the main word if it's > 1 letter, OR if it's the only tile placed on the first turn
    const mainWordObj = extractAndScoreWord(startR, startC, endR, endC, mainAxis, true);
    if (mainWordObj.word.length > 1 || (pendingPlacements.length === 1 && currentBoard[7][7] === null)) {
        formedWords.push(mainWordObj);
    }

    // 4. Extract cross words for each placed tile
    for (let p of pendingPlacements) {
        let crStartR = p.r, crStartC = p.c;
        let crEndR = p.r, crEndC = p.c;

        if (mainAxis === 'horizontal') {
            while (crStartR > 0 && tempBoard[crStartR - 1][crStartC]) crStartR--;
            while (crEndR < 14 && tempBoard[crEndR + 1][crEndC]) crEndR++;
            if (crEndR > crStartR) {
                formedWords.push(extractAndScoreWord(crStartR, crStartC, crEndR, crEndC, 'vertical', false));
            }
        } else {
            while (crStartC > 0 && tempBoard[crStartR][crStartC - 1]) crStartC--;
            while (crEndC < 14 && tempBoard[crEndR][crEndC + 1]) crEndC++;
            if (crEndC > crStartC) {
                formedWords.push(extractAndScoreWord(crStartR, crStartC, crEndR, crEndC, 'horizontal', false));
            }
        }
    }

    // Verify connectivity and gaps along the main placement axis
    let isConnected = false;
    let crossesCenter = false;

    // Check bounds of pending placements specifically to detect gaps
    let minR = 15, maxR = -1, minC = 15, maxC = -1;
    for (let p of pendingPlacements) {
        if (p.r < minR) minR = p.r;
        if (p.r > maxR) maxR = p.r;
        if (p.c < minC) minC = p.c;
        if (p.c > maxC) maxC = p.c;
    }

    if (mainAxis === 'horizontal') {
        for (let c = minC; c <= maxC; c++) {
            if (!tempBoard[firstR][c]) return alert('There is a gap in your word!');
        }
    } else {
        for (let r = minR; r <= maxR; r++) {
            if (!tempBoard[r][firstC]) return alert('There is a gap in your word!');
        }
    }

    // Check connectivity for all placed tiles
    for (let p of pendingPlacements) {
        if (p.r === 7 && p.c === 7) crossesCenter = true;
        if (p.r > 0 && currentBoard[p.r - 1][p.c]) isConnected = true;
        if (p.r < 14 && currentBoard[p.r + 1][p.c]) isConnected = true;
        if (p.c > 0 && currentBoard[p.r][p.c - 1]) isConnected = true;
        if (p.c < 14 && currentBoard[p.r][p.c + 1]) isConnected = true;
    }

    const isFirstTurn = currentBoard[7][7] === null;
    if (isFirstTurn && !crossesCenter) {
        return alert('The first word must cross the center star.');
    }
    if (!isFirstTurn && !isConnected) {
        return alert('Your word must connect to existing tiles.');
    }

    if (formedWords.length === 0) return alert('No valid words formed.');

    // Calculate total score
    let totalScore = 0;
    for (let fw of formedWords) {
        totalScore += fw.score;
    }
    if (pendingPlacements.length === 7) totalScore += 50; // Bingo

    // 5. Validation of ALL words
    playBtn.disabled = true;
    playBtn.innerText = 'Checking...';

    let allPlayedWords = [];
    for (let fw of formedWords) {
        const check = await isValidWord(fw.word);
        if (!check.valid) {
            failText.innerText = `The word "${fw.word}" was not found in the dictionary.`;
            // Set pendingCommitData so failRequestBtn has access to the failed play data
            pendingCommitData = {
                wordScore: totalScore,
                tempBoard: tempBoard,
                allWords: formedWords.map(f => ({ word: f.word, definition: "Pending approval" })),
                mainWord: fw.word
            };
            failModal.style.display = 'flex';
            return; // Stops here, button stays disabled until modal is handled
        }
        allPlayedWords.push({
            word: fw.word,
            definition: check.definition || "No definition found."
        });
    }

    pendingCommitData = { 
        wordScore: totalScore, 
        tempBoard: tempBoard,
        allWords: allPlayedWords,
        mainWord: allPlayedWords.length > 0 ? allPlayedWords[0].word : ''
    };

    // If valid, commit directly
    await commitWord();
}

async function commitWord() {
    if (!pendingCommitData) return;
    const { tempBoard, wordScore } = pendingCommitData;

    // 7. Update Firebase
    let bag = [...(gameData.bag || [])];
    const originalRack = gameData.players[playerId].rack || [];
    
    const playedIndices = pendingPlacements.map(p => p.rackIdx).sort((a,b)=>b-a);
    playedIndices.forEach(idx => originalRack.splice(idx, 1));
    
    // 8. Draw new tiles
    while (originalRack.length < 7 && bag.length > 0) {
        const tile = drawBalancedTile(originalRack, bag);
        if (tile) originalRack.push(tile);
    }

    const currentScore = gameData.players[playerId].score || 0;
    const turnOrder = gameData.turnOrder;
    const currIdx = turnOrder.indexOf(playerId);
    const nextTurn = turnOrder[(currIdx + 1) % turnOrder.length];

    const updates = {
        board: tempBoard,
        bag: bag,
        currentTurn: nextTurn,
        approvalRequest: null,
        [`players/${playerId}/rack`]: originalRack,
        [`players/${playerId}/score`]: currentScore + wordScore,
        lastPlay: { allWords: pendingCommitData.allWords },
        lastPlayTiles: pendingPlacements.map(p => `${p.r},${p.c}`)
    };

    try {
        await update(ref(database, `game/scrabble/rooms/${roomName}`), updates);
        pendingPlacements = [];
        playBtn.innerText = 'Play Word';
        pendingCommitData = null;
    } catch (e) {
        console.error(e);
        playBtn.disabled = false;
        playBtn.innerText = 'Play Word';
    }
}

function handleApprovalRequest(req) {
    if (!req) return;

    if (req.status === 'pending') {
        if (req.from === playerId) {
            waitingModal.style.display = 'flex';
            if (failModal) failModal.style.display = 'none';
        } else {
            decisionText.innerText = `Opponent wants to play the word "${req.word}". Allow?`;
            decisionModal.style.display = 'flex';
        }
    } else if (req.status === 'approved') {
        waitingModal.style.display = 'none';
        decisionModal.style.display = 'none';
        if (req.from === playerId && pendingCommitData) {
            commitWord();
        }
    } else if (req.status === 'rejected') {
        waitingModal.style.display = 'none';
        decisionModal.style.display = 'none';
        if (req.from === playerId) {
            alert('Your opponent rejected the word.');
            playBtn.disabled = false;
            playBtn.innerText = 'Play Word';
            pendingCommitData = null;
            // Clear request
            update(ref(database, `game/scrabble/rooms/${roomName}`), { approvalRequest: null });
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const map = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'};
    return String(str).replace(/[&<>"']/g, m => map[m]);
}
