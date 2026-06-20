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

// State
let playerId = null;
let opponentId = null;
let myRole = null; // 'drawer' or 'guesser'
let currentWord = '';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pencil'; // 'pencil' or 'eraser'
let players = {};

// Word Pool
const words = ['apple', 'house', 'sun', 'tree', 'car', 'dog', 'cat', 'boat', 'flower', 'mountain', 'cloud', 'fish', 'bird', 'phone', 'pizza', 'hamburger', 'cactus', 'ghost', 'spider', 'robot'];

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('scribble-lobby-screen');
const gameScreen = document.getElementById('scribble-game-screen');
const joinSection = document.getElementById('scribble-join-section');
const setupSection = document.getElementById('scribble-setup-section');


const nameInput = document.getElementById('scribble-player-name');
const joinBtn = document.getElementById('scribble-join-btn');
const playersList = document.getElementById('scribble-players-list');
const startBtn = document.getElementById('scribble-start-btn');

const canvas = document.getElementById('scribble-canvas');
const ctx = canvas.getContext('2d');
const tools = document.getElementById('scribble-tools');
const colorPicker = document.getElementById('scribble-color');
const sizePicker = document.getElementById('scribble-size');
const clearBtn = document.getElementById('scribble-clear-btn');
const pencilBtn = document.getElementById('scribble-pencil-btn');
const eraserBtn = document.getElementById('scribble-eraser-btn');

const guessInput = document.getElementById('scribble-guess-input');
const submitGuessBtn = document.getElementById('scribble-submit-guess');
const guessArea = document.getElementById('scribble-guess-area');
const guessListDisp = document.getElementById('scribble-guess-list');
const roleIndicator = document.getElementById('scribble-role-indicator');
const wordDisplay = document.getElementById('scribble-word-display');
const newGameBtn = document.getElementById('scribble-new-game-btn');

// References
const scribbleRef = ref(database, 'game/scribble');
const playersRef = ref(database, 'game/scribble/players');
const statusRef = ref(database, 'game/scribble/status');
const drawingRef = ref(database, 'game/scribble/drawing');
const guessesRef = ref(database, 'game/scribble/guesses');

// Navigation
document.getElementById('select-scribble').addEventListener('click', () => {
    selectionScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
});

document.getElementById('scribble-back-btn').addEventListener('click', leaveScribble);

document.getElementById('scribble-quit-btn').addEventListener('click', leaveScribble);
document.getElementById('scribble-new-game-btn').addEventListener('click', resetGame);

joinBtn.addEventListener('click', joinScribble);
startBtn.addEventListener('click', startGame);
submitGuessBtn.addEventListener('click', submitGuess);
clearBtn.addEventListener('click', clearCanvas);
pencilBtn.addEventListener('click', () => setTool('pencil'));
eraserBtn.addEventListener('click', () => setTool('eraser'));

// Enter key listeners
nameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinScribble(); });
guessInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') submitGuess(); });

// Canvas Event Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Real-time Listeners
onValue(playersRef, (snapshot) => {
    players = snapshot.val() || {};
    updatePlayersUI();

    const ids = Object.keys(players);
    console.log('Scribble Players Update:', ids.length);
    if (ids.length >= 2 && playerId) {
        startBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'none';
    }
});

onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    console.log('Scribble Status Update:', status);
    if (status === 'playing' && playerId) {
        showGameScreen();
    }
});

onValue(drawingRef, (snapshot) => {
    if (myRole === 'guesser') {
        const drawingData = snapshot.val();
        if (!drawingData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        renderDrawing(drawingData);
    }
});

onValue(guessesRef, (snapshot) => {
    const guesses = snapshot.val() || {};
    updateGuessesUI(guesses);
});

onValue(ref(database, 'game/scribble/word'), (snap) => {
    currentWord = snap.val() || '';
    if (myRole === 'drawer') {
        wordDisplay.innerText = currentWord.toUpperCase();
    } else {
        wordDisplay.innerText = currentWord.split('').map(() => '•').join('');
    }
});

onValue(ref(database, 'game/scribble/roles'), (snap) => {
    const roles = snap.val() || {};
    if (playerId && roles[playerId]) {
        myRole = roles[playerId];
        setupRoleUI();
    }
});

async function joinScribble() {
    const name = nameInput.value.trim();
    if (!name) return alert('Enter name');

    console.log('Joining Scribble as:', name);
    // Removed 2-player limit


    const newPlayerRef = push(playersRef);
    playerId = newPlayerRef.key;

    await set(newPlayerRef, {
        name,
        joinedAt: Date.now()
    });

    onDisconnect(newPlayerRef).remove();

    joinSection.style.display = 'none';
    setupSection.style.display = 'block';

    // Reset stale game status if it was left on 'playing'
    const statusSnap = await get(statusRef);
    if (statusSnap.val() === 'playing') {
        await set(statusRef, 'lobby');
    }
}

async function startGame() {
    console.log('Starting Scribble Game...');
    const ids = Object.keys(players).sort();
    if (ids.length < 2) return alert('Wait for more players');

    try {
        const drawerId = ids[Math.floor(Math.random() * ids.length)];

        const roles = {};
        ids.forEach(id => {
            roles[id] = (id === drawerId) ? 'drawer' : 'guesser';
        });

        const randomWord = words[Math.floor(Math.random() * words.length)];

        // Clear old game data first
        await remove(drawingRef);
        await remove(guessesRef);

        // Reset status first to ensure the listener fires when we set 'playing'
        await set(statusRef, 'lobby');

        // Set game state
        await set(ref(database, 'game/scribble/word'), randomWord);
        await set(ref(database, 'game/scribble/roles'), roles);
        await set(ref(database, 'game/scribble/winner'), null);
        await set(statusRef, 'playing');

        console.log('Game started! Word:', randomWord, 'Drawer:', drawerId);
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game: ' + error.message);
    }
}

function showGameScreen() {
    console.log('Showing Scribble Game Screen');
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');
}

function setupRoleUI() {
    console.log('Setting up Role UI:', myRole);
    if (myRole === 'drawer') {
        roleIndicator.innerText = '🎨 YOU ARE DRAWING';
        tools.style.display = 'block';
        guessArea.style.display = 'none';
        setTool('pencil'); // Default to pencil
    } else {
        roleIndicator.innerText = '🕵️ GUESS THE WORD';
        tools.style.display = 'none';
        guessArea.style.display = 'block';
    }
}

function setTool(tool) {
    currentTool = tool;
    if (tool === 'pencil') {
        pencilBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    } else {
        eraserBtn.classList.add('active');
        pencilBtn.classList.remove('active');
    }
}

// Canvas Logic
function startDrawing(e) {
    if (myRole !== 'drawer') return;
    isDrawing = true;
    [lastX, lastY] = getMousePos(e);
}

function draw(e) {
    if (!isDrawing || myRole !== 'drawer') return;

    const [x, y] = getMousePos(e);
    const color = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
    const size = sizePicker.value;

    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Sync to Firebase
    const segmentRef = push(drawingRef);
    set(segmentRef, {
        x0: lastX,
        y0: lastY,
        x1: x,
        y1: y,
        color,
        size
    });

    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    isDrawing = false;
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
    ];
}

function renderDrawing(drawingData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.values(drawingData).forEach(seg => {
        ctx.beginPath();
        ctx.moveTo(seg.x0, seg.y0);
        ctx.lineTo(seg.x1, seg.y1);
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = seg.size;
        ctx.lineCap = 'round';
        ctx.stroke();
    });
}

async function clearCanvas() {
    if (myRole !== 'drawer') return;
    await remove(drawingRef);
}

// Guessing Logic
async function submitGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    const guessRef = push(guessesRef);
    await set(guessRef, {
        playerId,
        name: players[playerId].name,
        text: guess,
        timestamp: Date.now()
    });

    if (guess === currentWord.toLowerCase()) {
        await update(scribbleRef, {
            winner: playerId
        });
        alert('🎉 CORRECT GUESS!');
        newGameBtn.style.display = 'block';
    }

    guessInput.value = '';
}

function updateGuessesUI(guesses) {
    const guessArray = Object.values(guesses).sort((a, b) => b.timestamp - a.timestamp);
    guessListDisp.innerHTML = guessArray.map(g => {
        const isCorrect = g.text.toLowerCase() === currentWord.toLowerCase();
        return `
            <div class="guess-item" style="${isCorrect ? 'border-color: var(--success); background: rgba(34, 197, 94, 0.1);' : ''}">
                <span style="font-weight: bold; color: var(--primary-light);">${g.name}:</span>
                <span>${g.text}</span>
                ${isCorrect ? '<span style="color: var(--success); font-weight: bold; margin-left: 0.5rem;">✓</span>' : ''}
            </div>
        `;
    }).join('');
}

async function resetGame() {
    await startGame();
    newGameBtn.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function leaveScribble() {
    if (playerId) {
        await remove(ref(database, `game/scribble/players/${playerId}`));
    }
    const snap = await get(playersRef);
    if (!snap.exists()) {
        // No players left — clean up entire game state
        await remove(scribbleRef);
    } else {
        // Reset status so remaining players aren't stuck
        await set(statusRef, 'lobby');
    }
    location.reload();
}

function updatePlayersUI() {
    console.log('Updating Scribble Players UI:', players);
    if (!playersList) {
        console.error('Scribble Players List element NOT FOUND!');
        return;
    }

    const playerEntries = Object.entries(players);
    if (playerEntries.length === 0) {
        playersList.innerHTML = '<p class="waiting-text">No players in lobby yet.</p>';
        return;
    }

    playersList.innerHTML = playerEntries.map(([id, p]) => {
        return `
            <div class="player-item">
                <span class="player-icon">👤</span>
                <span class="player-name">${p.name || 'Unknown'} ${id === playerId ? '(You)' : ''}</span>
                <span class="badge">Joined</span>
            </div>
        `;
    }).join('');
}
