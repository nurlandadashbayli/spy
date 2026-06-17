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
    'A': { count: 8, points: 1 },
    'E': { count: 8, points: 1 },
    'Ə': { count: 8, points: 1 },
    'İ': { count: 8, points: 1 },
    'I': { count: 5, points: 1 },
    'N': { count: 6, points: 1 },
    'R': { count: 6, points: 1 },
    'L': { count: 6, points: 1 },
    'T': { count: 5, points: 1 },
    'D': { count: 4, points: 2 },
    'M': { count: 4, points: 2 },
    'S': { count: 4, points: 2 },
    'O': { count: 4, points: 2 },
    'Y': { count: 3, points: 2 },
    'Q': { count: 3, points: 2 },
    'Ş': { count: 3, points: 2 },
    'U': { count: 3, points: 2 },
    'B': { count: 3, points: 3 },
    'K': { count: 3, points: 3 },
    'C': { count: 2, points: 3 },
    'V': { count: 2, points: 3 },
    'Z': { count: 2, points: 3 },
    'X': { count: 1, points: 4 },
    'P': { count: 1, points: 4 },
    'Ç': { count: 1, points: 4 },
    'Ğ': { count: 1, points: 5 },
    'G': { count: 1, points: 5 },
    'Ö': { count: 1, points: 5 },
    'H': { count: 1, points: 5 },
    'Ü': { count: 1, points: 5 },
    'F': { count: 1, points: 8 },
    'J': { count: 1, points: 10 }
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
            // If turn changes or board updates from another player, clear pending to prevent conflicts
            if (!gameData.currentTurn || gameData.currentTurn !== playerId) {
                pendingPlacements = [];
            }
            renderGame();
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

async function startGame() {
    try {
        let bag = createBag();
        const pKeys = Object.keys(players);
        const updates = {};
        
        function isVowel(letter) {
            return ['A', 'E', 'Ə', 'İ', 'I', 'O', 'Ö', 'U', 'Ü'].includes(letter);
        }
        
        pKeys.forEach(pId => {
            let rack = [];
            let valid = false;
            for (let attempts = 0; attempts < 10; attempts++) {
                rack = [];
                for (let i=0; i<7; i++) {
                    if (bag.length > 0) rack.push(bag.pop());
                }
                if (rack.filter(isVowel).length >= 2) {
                    valid = true;
                    break;
                }
                // Return to bag and shuffle
                bag.push(...rack);
                for (let i = bag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bag[i], bag[j]] = [bag[j], bag[i]];
                }
            }
            // Fallback
            if (!valid) {
                 rack = [];
                 for (let i=0; i<7; i++) {
                    if (bag.length > 0) rack.push(bag.pop());
                 }
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
    tile.innerHTML = `
        ${letter}
        <span class="points">${letterData[letter]?.points || 0}</span>
    `;
    return tile;
}

function renderRack() {
    rackDiv.innerHTML = '';
    const myRack = gameData.players[playerId]?.rack || [];
    
    // Find which rack indices are currently pending on the board
    const pendingIndices = pendingPlacements.map(p => p.rackIdx);

    myRack.forEach((letter, idx) => {
        if (!pendingIndices.includes(idx)) {
            const tile = createTileElement(letter, true); // true just for draggability logic
            tile.addEventListener('dragstart', () => {
                draggedTileInfo = {source: 'rack', rackIdx: idx, letter: letter};
            });
            rackDiv.appendChild(tile);
        } else {
            // Placeholder to preserve rack layout
            const placeholder = document.createElement('div');
            placeholder.style.width = '45px';
            placeholder.style.height = '45px';
            rackDiv.appendChild(placeholder);
        }
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
                    pendingPlacements.push({
                        r: r, c: c, 
                        letter: draggedTileInfo.letter, 
                        rackIdx: draggedTileInfo.rackIdx
                    });
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
                cell.appendChild(createTileElement(committedLetter, false));
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
        // Only 1 tile placed. Determine axis by adjacent existing tiles
        const hasLeft = firstC > 0 && currentBoard[firstR][firstC - 1];
        const hasRight = firstC < 14 && currentBoard[firstR][firstC + 1];
        const hasTop = firstR > 0 && currentBoard[firstR - 1][firstC];
        const hasBottom = firstR < 14 && currentBoard[firstR + 1][firstC];
        if (hasLeft || hasRight) mainAxis = 'horizontal';
        else if (hasTop || hasBottom) mainAxis = 'vertical';
        else mainAxis = 'horizontal'; 
    }

    // 2. Build temporary board
    const tempBoard = JSON.parse(JSON.stringify(currentBoard));
    for (let p of pendingPlacements) {
        tempBoard[p.r][p.c] = p.letter;
    }

    // 3. Extract main word
    let word = '';
    let startR = firstR, startC = firstC;
    let endR = firstR, endC = firstC;

    if (mainAxis === 'horizontal') {
        while (startC > 0 && tempBoard[startR][startC - 1]) startC--;
        while (endC < 14 && tempBoard[endR][endC + 1]) endC++;
        for (let c = startC; c <= endC; c++) word += tempBoard[startR][c];
    } else {
        while (startR > 0 && tempBoard[startR - 1][startC]) startR--;
        while (endR < 14 && tempBoard[endR + 1][endC]) endR++;
        for (let r = startR; r <= endR; r++) word += tempBoard[r][startC];
    }

    // 4. Verify gaps and connectivity
    let isConnected = false;
    let crossesCenter = false;
    let newTilesInWord = 0;

    if (mainAxis === 'horizontal') {
        for (let c = startC; c <= endC; c++) {
            if (!tempBoard[startR][c]) return alert('There is a gap in your word!');
            if (startR === 7 && c === 7) crossesCenter = true;
            if (pendingPlacements.some(p => p.r === startR && p.c === c)) newTilesInWord++;
            else isConnected = true; 

            if (startR > 0 && currentBoard[startR - 1] && currentBoard[startR - 1][c]) isConnected = true;
            if (startR < 14 && currentBoard[startR + 1] && currentBoard[startR + 1][c]) isConnected = true;
        }
    } else {
        for (let r = startR; r <= endR; r++) {
            if (!tempBoard[r][startC]) return alert('There is a gap in your word!');
            if (r === 7 && startC === 7) crossesCenter = true;
            if (pendingPlacements.some(p => p.r === r && p.c === startC)) newTilesInWord++;
            else isConnected = true;

            if (startC > 0 && currentBoard[r][startC - 1]) isConnected = true;
            if (startC < 14 && currentBoard[r][startC + 1]) isConnected = true;
        }
    }

    if (newTilesInWord !== pendingPlacements.length) {
         return alert('All placed tiles must be part of the same contiguous word.');
    }

    const isFirstTurn = currentBoard[7][7] === null;
    if (isFirstTurn && !crossesCenter) {
        return alert('The first word must cross the center star.');
    }
    if (!isFirstTurn && !isConnected) {
        return alert('Your word must connect to existing tiles.');
    }

    if (word.length < 2) return alert('Word must be at least 2 letters.');

    // 5. Validation bypassed (User requested no Wikipedia validation)
    // The word is accepted directly.

    // 6. Scoring
    let wordScore = 0;
    let wordMultiplier = 1;

    if (mainAxis === 'horizontal') {
        for (let c = startC; c <= endC; c++) {
            let letterScore = letterData[tempBoard[startR][c]]?.points || 0;
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
            let letterScore = letterData[tempBoard[r][startC]]?.points || 0;
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
    if (pendingPlacements.length === 7) wordScore += 50;

    // 7. Update Firebase
    let bag = [...(gameData.bag || [])];
    const originalRack = gameData.players[playerId].rack || [];
    
    const playedIndices = pendingPlacements.map(p => p.rackIdx).sort((a,b)=>b-a);
    playedIndices.forEach(idx => originalRack.splice(idx, 1));

    while (originalRack.length < 7 && bag.length > 0) {
        originalRack.push(bag.pop());
    }

    const currentScore = gameData.players[playerId].score || 0;
    const turnOrder = gameData.turnOrder;
    const currIdx = turnOrder.indexOf(playerId);
    const nextTurn = turnOrder[(currIdx + 1) % turnOrder.length];

    const updates = {
        board: tempBoard,
        bag: bag,
        currentTurn: nextTurn,
        [`players/${playerId}/rack`]: originalRack,
        [`players/${playerId}/score`]: currentScore + wordScore
    };

    try {
        await update(ref(database, `game/scrabble/rooms/${roomName}`), updates);
        pendingPlacements = [];
        playBtn.innerText = 'Play Word';
    } catch (e) {
        console.error(e);
        playBtn.disabled = false;
        playBtn.innerText = 'Play Word';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const map = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#039;'};
    return String(str).replace(/[&<>"']/g, m => map[m]);
}
