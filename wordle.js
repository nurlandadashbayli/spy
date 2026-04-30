import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
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

// Reuse Firebase Config from game.js or redefine
const firebaseConfig = {
    apiKey: "AIzaSyBT0StKCiled3K5uAi3lcrJlFALXI5KgvE",
    authDomain: "spy-game-4ce29.firebaseapp.com",
    databaseURL: "https://spy-game-4ce29-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "spy-game-4ce29",
    storageBucket: "spy-game-4ce29.firebasestorage.app",
    messagingSenderId: "20232358549",
    appId: "1:20232358549:web:feb22d19fb56e13ec9699c"
};

// Initialize Firebase safely
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}
const database = getDatabase(app);

// State
let playerId = null;
let opponentId = null;
let secretWord = '';
let gameId = 'wordle_duel';
let players = {};

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('wordle-lobby-screen');
const gameScreen = document.getElementById('wordle-game-screen');
const joinSection = document.getElementById('wordle-join-section');
const setupSection = document.getElementById('wordle-setup-section');
const fullMsg = document.getElementById('wordle-full-msg');

const nameInput = document.getElementById('wordle-player-name');
const joinBtn = document.getElementById('wordle-join-btn');
const secretWordInput = document.getElementById('wordle-secret-word');
const readyBtn = document.getElementById('wordle-ready-btn');
const changeBtn = document.getElementById('wordle-change-btn');
const startBtn = document.getElementById('wordle-start-btn');
const playersList = document.getElementById('wordle-players-list');
const lengthWarning = document.getElementById('wordle-length-warning');


const guessInput = document.getElementById('wordle-guess-input');
const submitGuessBtn = document.getElementById('wordle-submit-guess');
const guessesList = document.getElementById('wordle-guesses-list');
const opponentHistory = document.getElementById('wordle-opponent-history');
const turnIndicator = document.getElementById('wordle-turn-indicator');
const targetLengthDisp = document.getElementById('wordle-target-length');
const newGameBtn = document.getElementById('wordle-new-game-btn');
const inputArea = document.getElementById('wordle-input-area');

// References
const wordleRef = ref(database, 'game/wordle');
const playersRef = ref(database, 'game/wordle/players');
const statusRef = ref(database, 'game/wordle/status');

// Selection Logic
document.getElementById('select-wordle').addEventListener('click', () => {
    selectionScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
});

document.getElementById('wordle-back-btn').addEventListener('click', leaveWordle);
document.getElementById('wordle-full-back-btn').addEventListener('click', leaveWordle);
document.getElementById('wordle-quit-btn').addEventListener('click', leaveWordle);

joinBtn.addEventListener('click', joinWordle);
readyBtn.addEventListener('click', setReady);
changeBtn.addEventListener('click', changeWord);
startBtn.addEventListener('click', startGame);
submitGuessBtn.addEventListener('click', submitGuess);
newGameBtn.addEventListener('click', resetWordleGame);



// Real-time Listeners
onValue(playersRef, (snapshot) => {
    players = snapshot.val() || {};
    updatePlayersUI();

    const playerIds = Object.keys(players);
    if (playerIds.length > 2 && !playerIds.includes(playerId)) {
        joinSection.style.display = 'none';
        fullMsg.style.display = 'block';
    } else if (playerId) {
        opponentId = playerIds.find(id => id !== playerId);
        checkReadyStatus();
    }
});

onValue(statusRef, (snapshot) => {
    const status = snapshot.val();
    if (status === 'playing' && playerId) {
        showGameScreen();
    } else if (status === 'lobby') {
        // Handle reset
    }
});

async function joinWordle() {
    const name = nameInput.value.trim();
    if (!name) return alert('Enter name');

    const snap = await get(playersRef);
    if (Object.keys(snap.val() || {}).length >= 2) {
        joinSection.style.display = 'none';
        fullMsg.style.display = 'block';
        return;
    }

    const newPlayerRef = push(playersRef);
    playerId = newPlayerRef.key;

    await set(newPlayerRef, {
        name,
        ready: false,
        word: '',
        joinedAt: Date.now()
    });

    onDisconnect(newPlayerRef).remove();

    joinSection.style.display = 'none';
    setupSection.style.display = 'block';
}

async function setReady() {
    const word = secretWordInput.value.trim().toLowerCase();
    if (word.length < 3) return alert('Word too short (min 3 letters)');

    secretWord = word;
    await update(ref(database, `game/wordle/players/${playerId}`), {
        ready: true,
        word: secretWord
    });

    readyBtn.disabled = true;
    readyBtn.innerText = 'Word Set!';
    changeBtn.style.display = 'block';
    secretWordInput.disabled = true;
}

async function changeWord() {
    await update(ref(database, `game/wordle/players/${playerId}`), {
        ready: false,
        word: ''
    });

    readyBtn.disabled = false;
    readyBtn.innerText = 'Set Word & Ready';
    changeBtn.style.display = 'none';
    secretWordInput.disabled = false;
    secretWordInput.value = '';
    secretWordInput.focus();
}

function checkReadyStatus() {
    const playerIds = Object.keys(players);
    if (playerIds.length !== 2) {
        startBtn.style.display = 'none';
        return;
    }

    const p1 = players[playerIds[0]];
    const p2 = players[playerIds[1]];

    if (p1.ready && p2.ready) {
        if (p1.word.length === p2.word.length) {
            lengthWarning.style.display = 'none';
            startBtn.style.display = 'block';
        } else {
            lengthWarning.style.display = 'block';
            startBtn.style.display = 'none';
        }
    } else {
        startBtn.style.display = 'none';
    }
}

async function startGame() {
    await set(statusRef, 'playing');
    // Set initial turn
    const firstPlayer = Object.keys(players).sort()[0];
    await update(wordleRef, {
        currentTurn: firstPlayer,
        wordLength: secretWord.length
    });
}

function showGameScreen() {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // Listen for guesses
    onValue(ref(database, 'game/wordle/guesses'), (snap) => {
        const guesses = snap.val() || {};
        updateGuessesUI(guesses);
    });

    onValue(wordleRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        const myData = players[playerId] || {};
        const oppData = players[opponentId] || {};

        if (myData.winner) {
            turnIndicator.innerHTML = '<span style="color: var(--success);">🏆 YOU WON!</span>';
            submitGuessBtn.disabled = true;
            inputArea.style.display = 'none';
        } else if (oppData.winner) {
            turnIndicator.innerHTML = `<span style="color: var(--danger);">💀 ${oppData.name} WON!</span>`;
            // Keep my input area visible so I can try to finish
        } else if (data.currentTurn === playerId) {
            turnIndicator.innerText = 'Your Turn';
            submitGuessBtn.disabled = false;
        } else {
            turnIndicator.innerText = "Opponent's Turn";
            submitGuessBtn.disabled = true;
        }

        targetLengthDisp.innerText = `Length: ${data.wordLength}`;

        // Show New Game button if anyone finished or it's just available
        newGameBtn.style.display = 'block';
    });
}

async function submitGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (guess.length !== secretWord.length) {
        return alert(`Guess must be ${secretWord.length} letters long!`);
    }

    const opponent = players[opponentId];
    const feedback = calculateFeedback(guess, opponent.word);

    const guessRef = push(ref(database, 'game/wordle/guesses'));
    await set(guessRef, {
        playerId,
        word: guess,
        plus: feedback.plus,
        minus: feedback.minus,
        timestamp: Date.now()
    });

    // Switch turn
    await update(wordleRef, {
        currentTurn: opponentId
    });

    guessInput.value = '';

    if (feedback.plus === opponent.word.length) {
        await update(ref(database, `game/wordle/players/${playerId}`), {
            winner: true
        });
    }
}

function calculateFeedback(guess, target) {
    let plus = 0;
    let minus = 0;

    const targetArr = target.split('');
    const guessArr = guess.split('');
    const targetUsed = new Array(targetArr.length).fill(false);
    const guessUsed = new Array(guessArr.length).fill(false);

    // Find pluses
    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] === targetArr[i]) {
            plus++;
            targetUsed[i] = true;
            guessUsed[i] = true;
        }
    }

    // Find minuses
    for (let i = 0; i < guessArr.length; i++) {
        if (guessUsed[i]) continue;
        for (let j = 0; j < targetArr.length; j++) {
            if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
                minus++;
                targetUsed[j] = true;
                break;
            }
        }
    }

    return { plus, minus };
}

function updatePlayersUI() {
    playersList.innerHTML = Object.entries(players).map(([id, p]) => {
        const isMe = id === playerId;
        const statusText = p.ready ? (p.word ? `${p.word.length} Letters` : 'Ready') : 'Choosing...';
        return `
            <div class="player-item">
                <span class="player-icon">👤</span>
                <div class="player-info" style="flex: 1;">
                    <span class="player-name">${p.name} ${isMe ? '(You)' : ''}</span>
                    <span class="player-status" style="display: block; font-size: 0.8rem; color: var(--text-muted);">${statusText}</span>
                </div>
                <span class="badge ${p.ready ? '' : 'secondary'}">${p.ready ? '✓' : '...'}</span>
            </div>
        `;
    }).join('');
}

function updateGuessesUI(guesses) {
    const guessArray = Object.values(guesses).sort((a, b) => b.timestamp - a.timestamp);

    const myGuesses = guessArray.filter(g => g.playerId === playerId);
    const oppGuesses = guessArray.filter(g => g.playerId !== playerId);

    guessesList.innerHTML = myGuesses.map(g => `
        <div class="guess-item">
            <span class="guess-word">${g.word}</span>
            <div class="feedback-container">
                <span class="feedback-badge feedback-plus">${g.plus}+</span>
                <span class="feedback-badge feedback-minus">${g.minus}-</span>
            </div>
        </div>
    `).join('');

    opponentHistory.innerHTML = oppGuesses.map(g => `
        <div class="guess-item">
            <span class="guess-word">${g.word}</span>
            <div class="feedback-container">
                <span class="feedback-badge feedback-plus">${g.plus}+</span>
                <span class="feedback-badge feedback-minus">${g.minus}-</span>
            </div>
        </div>
    `).join('');
}

async function resetWordleGame() {
    // Reset room state
    await set(statusRef, 'lobby');
    await remove(ref(database, 'game/wordle/guesses'));

    // Reset turn and word length
    await update(wordleRef, {
        currentTurn: null,
        wordLength: null
    });

    // Reset all players
    const updates = {};
    Object.keys(players).forEach(id => {
        updates[`players/${id}/ready`] = false;
        updates[`players/${id}/word`] = '';
        updates[`players/${id}/winner`] = null;
    });
    await update(wordleRef, updates);

    // Return to setup
    gameScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
    setupSection.style.display = 'block';

    // Reset local inputs
    readyBtn.disabled = false;
    readyBtn.innerText = 'Set Word & Ready';
    changeBtn.style.display = 'none';
    secretWordInput.disabled = false;
    secretWordInput.value = '';
    secretWord = '';

    // Refresh page or just ensure UI reflects changes
    // location.reload() is a bit harsh, let's just use state
}

async function leaveWordle() {
    if (playerId) {
        await remove(ref(database, `game/wordle/players/${playerId}`));
    }

    const snap = await get(playersRef);
    if (!snap.exists()) {
        await remove(wordleRef);
    }

    location.reload();
}
