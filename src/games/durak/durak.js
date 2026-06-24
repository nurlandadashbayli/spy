// durak.js
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

// Firebase Configuration (Reused from Scrabble/Azul)
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

// Card Constants
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
const SUIT_ICONS = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
const SUIT_NAMES = { 'H': 'Hearts 🌹', 'D': 'Diamonds 💎', 'C': 'Clubs 🍀', 'S': 'Spades ♠' };
const RANK_VALUES = {
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// DOM Elements
const selectDurak = document.getElementById('select-durak');
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('durak-lobby-screen');
const gameScreen = document.getElementById('durak-game-screen');
const joinSection = document.getElementById('durak-join-section');
const lobbySection = document.getElementById('durak-lobby-section');

const backBtn = document.getElementById('durak-back-btn');
const quitBtn = document.getElementById('durak-quit-btn');
const singleBtn = document.getElementById('durak-single-btn');
const joinBtn = document.getElementById('durak-join-btn');
const startBtn = document.getElementById('durak-start-btn');
const leaveBtn = document.getElementById('durak-leave-btn');

const roomInput = document.getElementById('durak-room-name');
const nameInput = document.getElementById('durak-player-name');
const playersList = document.getElementById('durak-players-list');

const opponentsContainer = document.getElementById('durak-opponents-hands');
const trumpCardPlaceholder = document.getElementById('durak-trump-card-placeholder');
const deckTopCard = document.getElementById('durak-deck-top');
const deckCountBadge = document.getElementById('durak-deck-count');
const trumpSuitIndicator = document.getElementById('durak-trump-suit-indicator');
const tableCardsDiv = document.getElementById('durak-table-cards');
const discardPileDiv = document.getElementById('durak-discard-pile');

const turnMessageDiv = document.getElementById('durak-turn-message');
const playerHandDiv = document.getElementById('durak-player-hand');
const actionBtn = document.getElementById('durak-action-btn');
const sortBtn = document.getElementById('durak-sort-btn');

const scoresList = document.getElementById('durak-scores-list');
const infoTrump = document.getElementById('durak-info-trump');
const infoAttacker = document.getElementById('durak-info-attacker');
const infoDefender = document.getElementById('durak-info-defender');

const htpModal = document.getElementById('durak-htp-modal');
const htpBtn = document.getElementById('durak-how-to-play-btn');
const htpCloseBtn = document.getElementById('durak-htp-close-btn');

// Game State
let isMultiplayer = false;
let roomName = '';
let playerName = '';
let playerId = '';
let players = {};
let gameData = null;
let unsubscribeRoom = null;
let unsubscribePlayers = null;

// Local Single Player State
let isBotGame = false;
const BOT_ID = 'bot-nikolai';
const BOT_NAME = 'Bot Nikolai 🤖';
let localState = null;

// Selection states
let selectedCardIndex = null;
let selectedUnbeatenTableIndex = null;

// Event Listeners
if (selectDurak) {
    selectDurak.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
        document.querySelector('.container').classList.add('wide-container');
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        resetToSelection();
    });
}

if (quitBtn) {
    quitBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to quit the current game?')) {
            if (isMultiplayer) {
                leaveRoom();
            } else {
                resetToSelection();
            }
        }
    });
}

if (singleBtn) {
    singleBtn.addEventListener('click', () => {
        startSinglePlayerGame();
    });
}

if (joinBtn) {
    joinBtn.addEventListener('click', () => {
        joinRoom();
    });
}

if (startBtn) {
    startBtn.addEventListener('click', () => {
        startGame();
    });
}

if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
        leaveRoom();
    });
}

if (sortBtn) {
    sortBtn.addEventListener('click', () => {
        sortHand();
    });
}

if (actionBtn) {
    actionBtn.addEventListener('click', () => {
        handleActionButtonClick();
    });
}

if (htpBtn && htpModal && htpCloseBtn) {
    htpBtn.addEventListener('click', () => {
        htpModal.style.display = 'flex';
    });
    htpCloseBtn.addEventListener('click', () => {
        htpModal.style.display = 'none';
    });
}

// Fisher-Yates Deck Generation (36 cards)
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, value: RANK_VALUES[rank] });
        }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Reset view/state and go back to Hub
function resetToSelection() {
    if (unsubscribePlayers) unsubscribePlayers();
    if (unsubscribeRoom) unsubscribeRoom();
    playerId = '';
    roomName = '';
    players = {};
    gameData = null;
    isMultiplayer = false;
    isBotGame = false;
    localState = null;
    selectedCardIndex = null;
    selectedUnbeatenTableIndex = null;

    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    selectionScreen.classList.add('active');
    joinSection.style.display = 'block';
    lobbySection.style.display = 'none';
    document.querySelector('.container').classList.remove('wide-container');
}

// Sort cards: Group by suits, ordered by rank values
function sortHand() {
    let currentHand = [];
    if (isBotGame) {
        currentHand = localState.players[playerId].cards;
    } else if (gameData && playerId && gameData.players[playerId]) {
        currentHand = gameData.players[playerId].cards || [];
    }

    if (currentHand.length === 0) return;

    const trumpSuit = isBotGame ? localState.trumpCard.suit : gameData.trumpCard.suit;

    currentHand.sort((a, b) => {
        const aIsTrump = a.suit === trumpSuit;
        const bIsTrump = b.suit === trumpSuit;
        if (aIsTrump && !bIsTrump) return -1;
        if (!aIsTrump && bIsTrump) return 1;
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return b.value - a.value;
    });

    selectedCardIndex = null;

    if (isBotGame) {
        localState.players[playerId].cards = currentHand;
        renderGame();
    } else {
        update(ref(database, `game/durak/rooms/${roomName}/players/${playerId}`), { cards: currentHand });
    }
}

// Join Multiplayer Room
async function joinRoom() {
    roomName = roomInput.value.trim().toLowerCase();
    playerName = nameInput.value.trim();

    if (!roomName || !playerName) {
        return alert('Please enter both room name and your name');
    }

    try {
        const roomRef = ref(database, `game/durak/rooms/${roomName}`);
        const snap = await get(roomRef);
        const data = snap.val() || {};

        if (data.status === 'started') {
            return alert('Game has already started in this room!');
        }

        const playerRef = ref(database, `game/durak/rooms/${roomName}/players`);
        const newPlayerRef = push(playerRef);
        playerId = newPlayerRef.key;

        await set(newPlayerRef, {
            name: playerName,
            cards: [],
            status: 'playing'
        });

        if (!data.status) {
            await update(roomRef, {
                status: 'lobby',
                hostId: playerId
            });
        }

        onDisconnect(newPlayerRef).remove();

        joinSection.style.display = 'none';
        lobbySection.style.display = 'block';
        isMultiplayer = true;

        setupRealtimeListeners();
    } catch (e) {
        console.error(e);
        alert('Failed to join room.');
    }
}

function setupRealtimeListeners() {
    const playersRef = ref(database, `game/durak/rooms/${roomName}/players`);
    const roomRef = ref(database, `game/durak/rooms/${roomName}`);

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
            renderGame();
        } else {
            gameScreen.classList.remove('active');
            lobbyScreen.classList.add('active');
        }
    });
}

function updateLobbyUI() {
    const pKeys = Object.keys(players);
    playersList.innerHTML = Object.values(players).map(p => `
        <div class="card" style="padding: 0.75rem; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(255,255,255,0.05); background: var(--bg-card);">
            <span>👤 <strong>${escapeHtml(p.name)}</strong></span>
            ${pKeys[0] && players[pKeys[0]].name === p.name ? '<span class="badge" style="background: var(--warning); color: #000; font-weight: bold;">Host</span>' : ''}
        </div>
    `).join('');

    // Only host can start game
    const isHost = gameData && gameData.hostId === playerId;
    if (isHost && pKeys.length >= 2) {
        startBtn.style.display = 'block';
    } else {
        startBtn.style.display = 'none';
    }
}

async function leaveRoom() {
    if (playerId && roomName) {
        await remove(ref(database, `game/durak/rooms/${roomName}/players/${playerId}`));
        const snap = await get(ref(database, `game/durak/rooms/${roomName}/players`));
        if (!snap.exists()) {
            await remove(ref(database, `game/durak/rooms/${roomName}`));
        } else {
            // Assign next player as host
            const remainingPlayers = snap.val();
            const nextHostId = Object.keys(remainingPlayers)[0];
            await update(ref(database, `game/durak/rooms/${roomName}`), { hostId: nextHostId });
        }
    }
    resetToSelection();
}

// Start Multiplayer Match
async function startGame() {
    try {
        const deck = createDeck();
        const pKeys = Object.keys(players);
        const updates = {};

        // Deal 6 cards
        pKeys.forEach(pId => {
            const cards = [];
            for (let i = 0; i < 6; i++) {
                cards.push(deck.pop());
            }
            updates[`players/${pId}/cards`] = cards;
            updates[`players/${pId}/status`] = 'playing';
        });

        // Trump card
        const trumpCard = deck.pop();

        // Find attacker with the lowest trump card
        let initialAttackerId = pKeys[0];
        let lowestTrumpVal = 99;

        pKeys.forEach(pId => {
            const hand = updates[`players/${pId}/cards`];
            hand.forEach(c => {
                if (c.suit === trumpCard.suit && c.value < lowestTrumpVal) {
                    lowestTrumpVal = c.value;
                    initialAttackerId = pId;
                }
            });
        });

        // Set defender as player to the left of attacker
        const attackerIdx = pKeys.indexOf(initialAttackerId);
        const defenderIdx = (attackerIdx + 1) % pKeys.length;
        const initialDefenderId = pKeys[defenderIdx];

        updates.status = 'started';
        updates.deck = deck;
        updates.trumpCard = trumpCard;
        updates.table = [];
        updates.attackerId = initialAttackerId;
        updates.defenderId = initialDefenderId;
        updates.leadAttackerId = initialAttackerId;
        updates.activePlayers = pKeys;
        updates.discardCount = 0;
        updates.doneAttackers = {};
        updates.defenderTook = false;
        updates.gameLogs = ['Game started. Trump suit is ' + SUIT_NAMES[trumpCard.suit]];

        await update(ref(database, `game/durak/rooms/${roomName}`), updates);
    } catch (e) {
        console.error(e);
        alert('Failed to start game.');
    }
}

// Start Single Player Bot Game
function startSinglePlayerGame() {
    isBotGame = true;
    isMultiplayer = false;
    playerId = 'player-human';
    playerName = 'You';

    const deck = createDeck();
    const humanHand = [];
    const botHand = [];

    // Deal 6 cards
    for (let i = 0; i < 6; i++) {
        humanHand.push(deck.pop());
        botHand.push(deck.pop());
    }

    const trumpCard = deck.pop();

    // Determine who starts
    let attackerId = playerId;
    let lowestTrumpVal = 99;

    humanHand.forEach(c => {
        if (c.suit === trumpCard.suit && c.value < lowestTrumpVal) {
            lowestTrumpVal = c.value;
            attackerId = playerId;
        }
    });

    botHand.forEach(c => {
        if (c.suit === trumpCard.suit && c.value < lowestTrumpVal) {
            lowestTrumpVal = c.value;
            attackerId = BOT_ID;
        }
    });

    const defenderId = attackerId === playerId ? BOT_ID : playerId;

    localState = {
        status: 'started',
        players: {
            [playerId]: { name: playerName, cards: humanHand, status: 'playing' },
            [BOT_ID]: { name: BOT_NAME, cards: botHand, status: 'playing' }
        },
        deck: deck,
        trumpCard: trumpCard,
        table: [],
        attackerId: attackerId,
        defenderId: defenderId,
        leadAttackerId: attackerId,
        activePlayers: [playerId, BOT_ID],
        discardCount: 0,
        doneAttackers: {},
        defenderTook: false,
        gameLogs: ['Local game started against Bot Nikolai. Trump suit is ' + SUIT_NAMES[trumpCard.suit]]
    };

    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');
    document.querySelector('.container').classList.add('wide-container');

    renderGame();

    // Trigger Bot turn if Bot starts
    if (attackerId === BOT_ID) {
        setTimeout(playBotAttack, 1000);
    }
}

// RENDER GAME BOARD
function renderGame() {
    const state = isBotGame ? localState : gameData;
    if (!state || state.status !== 'started') return;

    const myHand = state.players[playerId]?.cards || [];
    const myStatus = state.players[playerId]?.status || 'playing';
    const trumpSuit = state.trumpCard.suit;

    // Trump card bottom placement
    if (state.deck.length > 0) {
        const trump = state.trumpCard;
        trumpCardPlaceholder.innerHTML = `
            <div class="durak-card durak-trump-card-under suit-${trump.suit}">
                <div class="card-corner top-left">
                    <span>${trump.rank}</span>
                    <span>${SUIT_ICONS[trump.suit]}</span>
                </div>
                <div class="card-center">${SUIT_ICONS[trump.suit]}</div>
            </div>
        `;
        deckTopCard.style.display = 'block';
        deckCountBadge.innerText = `Deck: ${state.deck.length + 1}`;
        deckTopCard.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:rgba(255,255,255,0.8); font-size:1.5rem; font-weight:bold;">${state.deck.length + 1}</div>`;
    } else {
        // Deck empty, show horizontal trump suit indicators
        trumpCardPlaceholder.innerHTML = `
            <div style="font-size: 1.8rem; border: 2px dashed rgba(255,255,255,0.1); border-radius: 8px; width:72px; height:108px; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.1);">
                ${SUIT_ICONS[state.trumpCard.suit]}
            </div>
        `;
        deckTopCard.style.display = 'none';
        deckCountBadge.innerText = 'Deck: Empty';
    }

    trumpSuitIndicator.innerHTML = `Trump:<br><span style="font-size: 2rem; color: ${trumpSuit === 'H' || trumpSuit === 'D' ? 'var(--danger)' : 'var(--text-primary)'}">${SUIT_ICONS[trumpSuit]}</span>`;

    // Discard pile
    if (state.discardCount > 0) {
        discardPileDiv.style.display = 'block';
    } else {
        discardPileDiv.style.display = 'none';
    }

    // Render Opponents
    const opponents = Object.keys(state.players).filter(id => id !== playerId);
    opponentsContainer.innerHTML = opponents.map(oppId => {
        const opp = state.players[oppId];
        const cardCount = opp.cards ? opp.cards.length : 0;
        const isAttacker = state.attackerId === oppId;
        const isDefender = state.defenderId === oppId;
        const isTurn = state.attackerId === oppId || (isDefender && state.table.length > 0 && !state.defenderTook);

        let roleBadge = '';
        if (isAttacker) roleBadge = ' ⚔️';
        if (isDefender) roleBadge = ' 🛡️';

        return `
            <div class="durak-opponent-card ${isTurn ? 'is-turn' : ''}">
                <div style="font-weight: bold; color: var(--text-primary); font-size: 0.9rem;">
                    ${escapeHtml(opp.name)}${roleBadge}
                </div>
                <div class="card-count-badge">🎴 ${cardCount} cards</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                    Status: ${opp.status.toUpperCase()}
                </div>
            </div>
        `;
    }).join('');

    // Render Table Cards
    tableCardsDiv.innerHTML = '';
    state.table.forEach((pair, idx) => {
        const isUnbeaten = !pair.defense;
        const isSelected = selectedUnbeatenTableIndex === idx;

        const pairDiv = document.createElement('div');
        pairDiv.className = `durak-card-pair ${isUnbeaten ? 'unbeaten' : ''} ${isSelected ? 'selected-target' : ''}`;
        pairDiv.dataset.index = idx;

        // Attack card
        const att = pair.attack;
        const attCard = document.createElement('div');
        attCard.className = `durak-card attack-card suit-${att.suit}`;
        attCard.innerHTML = `
            <div class="card-corner top-left">
                <span>${att.rank}</span>
                <span>${SUIT_ICONS[att.suit]}</span>
            </div>
            <div class="card-center">${SUIT_ICONS[att.suit]}</div>
        `;
        pairDiv.appendChild(attCard);

        // Defense card
        if (pair.defense) {
            const def = pair.defense;
            const defCard = document.createElement('div');
            defCard.className = `durak-card defense-card suit-${def.suit}`;
            defCard.innerHTML = `
                <div class="card-corner top-left">
                    <span>${def.rank}</span>
                    <span>${SUIT_ICONS[def.suit]}</span>
                </div>
                <div class="card-center">${SUIT_ICONS[def.suit]}</div>
            `;
            pairDiv.appendChild(defCard);
        }

        // Click target to defend
        if (state.defenderId === playerId && isUnbeaten && myStatus === 'playing') {
            pairDiv.style.cursor = 'pointer';
            pairDiv.addEventListener('click', () => {
                selectedUnbeatenTableIndex = idx;
                renderGame();
            });
        }

        tableCardsDiv.appendChild(pairDiv);
    });

    // Render Player Hand
    playerHandDiv.innerHTML = '';
    myHand.forEach((card, idx) => {
        const isSelected = selectedCardIndex === idx;
        const isTrump = card.suit === trumpSuit;

        // Visual validation: Highlight playable cards
        let isPlayable = false;
        const isMyTurn = state.attackerId === playerId || state.defenderId === playerId;
        if (isMyTurn && myStatus === 'playing') {
            if (state.attackerId === playerId) {
                // Attacker validation
                if (state.table.length === 0) {
                    isPlayable = true;
                } else {
                    const tableRanks = [];
                    state.table.forEach(p => {
                        tableRanks.push(p.attack.rank);
                        if (p.defense) tableRanks.push(p.defense.rank);
                    });
                    isPlayable = tableRanks.includes(card.rank);
                }
            } else if (state.defenderId === playerId) {
                if (selectedUnbeatenTableIndex !== null) {
                    // Defender validation against selected attack card
                    const attCard = state.table[selectedUnbeatenTableIndex].attack;
                    isPlayable = canBeat(card, attCard, trumpSuit);
                } else {
                    // See if it can beat ANY unbeaten table card
                    for (let p of state.table) {
                        if (!p.defense && canBeat(card, p.attack, trumpSuit)) {
                            isPlayable = true;
                            break;
                        }
                    }
                }
            }
        }

        const cardEl = document.createElement('div');
        cardEl.className = `durak-card suit-${card.suit} ${isSelected ? 'selected' : ''} ${isPlayable ? 'playable' : ''}`;
        cardEl.innerHTML = `
            <div class="card-corner top-left">
                <span>${card.rank}</span>
                <span>${SUIT_ICONS[card.suit]}</span>
            </div>
            <div class="card-center">${SUIT_ICONS[card.suit]}</div>
            <div class="card-corner bottom-right">
                <span>${card.rank}</span>
                <span>${SUIT_ICONS[card.suit]}</span>
            </div>
        `;

        if (isTrump) {
            cardEl.style.border = '2px solid var(--warning)';
        }

        cardEl.addEventListener('click', () => {
            if (myStatus !== 'playing') return;
            handleHandCardClick(idx);
        });

        playerHandDiv.appendChild(cardEl);
    });

    // Sidebar & Info rendering
    infoTrump.innerText = SUIT_NAMES[trumpSuit];
    infoAttacker.innerText = state.players[state.attackerId]?.name || '--';
    infoDefender.innerText = state.players[state.defenderId]?.name || '--';

    scoresList.innerHTML = Object.keys(state.players).map(pId => {
        const p = state.players[pId];
        const isAttacker = state.attackerId === pId;
        const isDefender = state.defenderId === pId;
        let role = '';
        if (isAttacker) role = ' [Attacker]';
        if (isDefender) role = ' [Defender]';
        return `
            <div class="durak-player-row ${pId === state.attackerId || pId === state.defenderId ? 'is-turn' : ''} ${isAttacker ? 'is-attacker' : ''} ${isDefender ? 'is-defender' : ''}">
                <span>👤 <strong>${escapeHtml(p.name)}</strong>${role}</span>
                <span class="badge" style="background: var(--bg-elevated);">${p.cards ? p.cards.length : 0} cards (${p.status})</span>
            </div>
        `;
    }).join('');

    // Update Turn message and buttons
    const isAttacker = state.attackerId === playerId;
    const isDefender = state.defenderId === playerId;

    if (myStatus !== 'playing') {
        turnMessageDiv.innerHTML = `<span style="color: var(--success); font-weight: bold;">🎉 You are safe!</span>`;
        actionBtn.style.display = 'none';
        return;
    }

    actionBtn.style.display = 'block';

    if (isAttacker) {
        const unbeatenCount = state.table.filter(p => !p.defense).length;
        if (state.table.length === 0) {
            turnMessageDiv.innerText = 'Attack! Play any card from your hand to begin.';
            actionBtn.innerText = 'Pass Turn';
            actionBtn.disabled = true; // Must play first card
        } else if (unbeatenCount === 0) {
            turnMessageDiv.innerText = 'All attacks defended. Add more cards or Pass.';
            actionBtn.innerText = 'Done Attacking';
            actionBtn.disabled = false;
        } else {
            turnMessageDiv.innerText = 'Waiting for defender to play cards...';
            actionBtn.innerText = 'Done Attacking';
            actionBtn.disabled = false;
        }
    } else if (isDefender) {
        const unbeatenCount = state.table.filter(p => !p.defense).length;
        if (unbeatenCount > 0) {
            turnMessageDiv.innerHTML = `Defend! Select an attack card on the table, then click a card in hand to beat it.`;
            actionBtn.innerText = 'Take Cards';
            actionBtn.disabled = false;
            actionBtn.style.background = 'var(--danger)';
        } else {
            turnMessageDiv.innerText = 'Wait for more attacks or for attacker to pass.';
            actionBtn.innerText = 'Done';
            actionBtn.disabled = true;
            actionBtn.style.background = 'var(--success)';
        }
    } else {
        // Multi player helper attacker
        const isHelper = state.table.length > 0 && !isDefender;
        if (isHelper) {
            turnMessageDiv.innerText = 'Throw-in: Play any card matching table ranks.';
            actionBtn.innerText = 'Pass';
            actionBtn.disabled = false;
        } else {
            turnMessageDiv.innerText = 'Waiting for attacker to start...';
            actionBtn.innerText = 'Pass';
            actionBtn.disabled = true;
        }
    }
}

// Check if card a beats card b
function canBeat(a, b, trumpSuit) {
    if (a.suit === b.suit) {
        return a.value > b.value;
    }
    return a.suit === trumpSuit;
}

// Handle Hand Card Clicks
function handleHandCardClick(index) {
    const state = isBotGame ? localState : gameData;
    if (!state) return;

    const myHand = state.players[playerId].cards;
    const card = myHand[index];
    const isAttacker = state.attackerId === playerId;
    const isDefender = state.defenderId === playerId;
    const trumpSuit = state.trumpCard.suit;

    if (isAttacker) {
        // PLAY ATTACK
        if (state.table.length === 0) {
            // First attack card
            playCardToTable(index);
        } else {
            // Validate throwing in
            const tableRanks = [];
            state.table.forEach(p => {
                tableRanks.push(p.attack.rank);
                if (p.defense) tableRanks.push(p.defense.rank);
            });
            if (tableRanks.includes(card.rank)) {
                // Defender card limit check
                const defenderCardsCount = state.players[state.defenderId].cards.length;
                const currentUnbeatenCount = state.table.filter(p => !p.defense).length;
                if (state.table.length < 6 && state.table.length < defenderCardsCount + currentUnbeatenCount) {
                    playCardToTable(index);
                } else {
                    alert('You cannot attack with more cards than the defender has!');
                }
            } else {
                alert('You can only attack with card ranks already on the table.');
            }
        }
    } else if (isDefender) {
        // PLAY DEFENSE
        let targetIndex = selectedUnbeatenTableIndex;

        if (targetIndex === null) {
            // Find an unbeaten card that we can beat with this card
            for (let i = 0; i < state.table.length; i++) {
                if (!state.table[i].defense && canBeat(card, state.table[i].attack, trumpSuit)) {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex === null) {
            alert('Please select a valid attack card to defend against, or play a card that can beat an unbeaten card on the table.');
            return;
        }

        const targetAttackCard = state.table[targetIndex].attack;
        if (canBeat(card, targetAttackCard, trumpSuit)) {
            playDefenseCard(index, targetIndex);
        } else {
            alert('This card cannot beat the selected attack card!');
        }
    } else {
        // Multi player helper attacker
        if (state.table.length > 0) {
            const tableRanks = [];
            state.table.forEach(p => {
                tableRanks.push(p.attack.rank);
                if (p.defense) tableRanks.push(p.defense.rank);
            });
            if (tableRanks.includes(card.rank)) {
                playCardToTable(index);
            }
        }
    }
}

// Attack card play execution
async function playCardToTable(handIdx) {
    const state = isBotGame ? localState : gameData;
    const myHand = [...state.players[playerId].cards];
    const card = myHand.splice(handIdx, 1)[0];

    const updatedTable = [...state.table, { attack: card, defense: null }];

    if (isBotGame) {
        localState.players[playerId].cards = myHand;
        localState.table = updatedTable;
        selectedCardIndex = null;
        renderGame();

        // Bot responds to defense
        if (localState.defenderId === BOT_ID) {
            setTimeout(playBotDefense, 1000);
        }
    } else {
        const roomRef = ref(database, `game/durak/rooms/${roomName}`);
        await update(roomRef, {
            table: updatedTable,
            [`players/${playerId}/cards`]: myHand
        });
    }
}

// Defense card play execution
async function playDefenseCard(handIdx, tableIdx) {
    const state = isBotGame ? localState : gameData;
    const myHand = [...state.players[playerId].cards];
    const card = myHand.splice(handIdx, 1)[0];

    const updatedTable = [...state.table];
    updatedTable[tableIdx].defense = card;

    selectedCardIndex = null;
    selectedUnbeatenTableIndex = null;

    if (isBotGame) {
        localState.players[playerId].cards = myHand;
        localState.table = updatedTable;
        renderGame();

        // If bot is attacker, bot might throw in more or pass
        if (localState.attackerId === BOT_ID) {
            setTimeout(playBotAttack, 1200);
        }
    } else {
        const roomRef = ref(database, `game/durak/rooms/${roomName}`);
        await update(roomRef, {
            table: updatedTable,
            [`players/${playerId}/cards`]: myHand
        });
    }
}

// Handles Pass / Take button
function handleActionButtonClick() {
    const state = isBotGame ? localState : gameData;
    if (!state) return;

    const isAttacker = state.attackerId === playerId;
    const isDefender = state.defenderId === playerId;

    if (isAttacker) {
        // Attacker clicks Done / Pass
        endRound(false);
    } else if (isDefender) {
        // Defender chooses to Take Cards
        endRound(true);
    } else {
        // Helper attacker passes
        endRound(false);
    }
}

// End of round processing
async function endRound(defenderTookCards) {
    const state = isBotGame ? localState : gameData;
    if (!state) return;

    if (defenderTookCards) {
        // Defender decides to take
        if (isBotGame) {
            localState.defenderTook = true;
            renderGame();
            // Let bot throw in final cards if matching rank
            setTimeout(() => {
                botThrowInFinal();
            }, 800);
        } else {
            await update(ref(database, `game/durak/rooms/${roomName}`), { defenderTook: true });
        }
    } else {
        // Attacker clicks Done / Pass
        if (isBotGame) {
            executeNextRoundState(false);
        } else {
            // Multiplayer - attacker clicked Done.
            // Mark player as done
            const doneUpdates = { ...state.doneAttackers };
            doneUpdates[playerId] = true;

            const roomRef = ref(database, `game/durak/rooms/${roomName}`);
            await update(roomRef, { doneAttackers: doneUpdates });

            // Evaluate if all active players (except defender) have clicked Done
            const playersKeys = Object.keys(state.players);
            const activeAttackers = playersKeys.filter(pId => pId !== state.defenderId && state.players[pId].status === 'playing');
            const allDone = activeAttackers.every(pId => doneUpdates[pId]);

            if (allDone) {
                // All attackers finished. Resolve round
                executeNextRoundState(state.defenderTook);
            }
        }
    }
}

// Refill hands from deck up to 6 cards
function refillHands(state) {
    const deck = state.deck;
    const playersKeys = Object.keys(state.players);

    // Turn order starting from attacker, then helper attackers, defender last
    const order = [];
    let currentIdx = playersKeys.indexOf(state.attackerId);
    for (let i = 0; i < playersKeys.length; i++) {
        const pId = playersKeys[currentIdx];
        if (state.players[pId].status === 'playing') {
            order.push(pId);
        }
        currentIdx = (currentIdx + 1) % playersKeys.length;
    }

    // Refill logic
    order.forEach(pId => {
        const hand = state.players[pId].cards || [];
        while (hand.length < 6 && (deck.length > 0 || state.trumpCard)) {
            if (deck.length > 0) {
                hand.push(deck.pop());
            } else {
                // Take trump card
                hand.push(state.trumpCard);
                state.trumpCard = null; // empty
            }
        }
        state.players[pId].cards = hand;
    });
}

// Check player win/losses and rotate roles
function executeNextRoundState(defenderTook) {
    const state = isBotGame ? localState : { ...gameData };
    const tableCards = [...state.table];

    if (defenderTook) {
        // Defender takes all cards on table
        const defenderHand = state.players[state.defenderId].cards || [];
        tableCards.forEach(pair => {
            if (pair.attack) defenderHand.push(pair.attack);
            if (pair.defense) defenderHand.push(pair.defense);
        });
        state.players[state.defenderId].cards = defenderHand;
    } else {
        // Successful defense
        state.discardCount += tableCards.length * 2;
    }

    // Clear table
    state.table = [];
    state.doneAttackers = {};
    state.defenderTook = false;
    selectedUnbeatenTableIndex = null;
    selectedCardIndex = null;

    // Refill hands
    refillHands(state);

    // Check if players are safe (0 cards left and deck is empty)
    const deckEmpty = state.deck.length === 0 && !state.trumpCard;
    const pKeys = Object.keys(state.players);

    pKeys.forEach(pId => {
        const hand = state.players[pId].cards || [];
        if (hand.length === 0 && deckEmpty) {
            state.players[pId].status = 'safe';
        }
    });

    // Check remaining playing players
    const activePlayers = pKeys.filter(pId => state.players[pId].status === 'playing');

    if (activePlayers.length <= 1) {
        // Game Over!
        state.status = 'ended';
        if (activePlayers.length === 1) {
            state.players[activePlayers[0]].status = 'durak';
            const loserName = state.players[activePlayers[0]].name;
            state.gameLogs.push(`Game ended! ${loserName} is the Durak 🤡!`);
            alert(`Game Over! ${loserName} is the Durak!`);
        } else {
            state.gameLogs.push('Game ended in a tie!');
            alert('Game Over! It is a tie!');
        }

        if (isBotGame) {
            localState = state;
            renderGame();
        } else {
            set(ref(database, `game/durak/rooms/${roomName}`), state);
        }
        return;
    }

    // Determine next Attacker and Defender
    const nextAttackerIdx = determineNextAttackerIndex(state, defenderTook);
    const nextAttackerId = activePlayers[nextAttackerIdx];
    const nextDefenderId = activePlayers[(nextAttackerIdx + 1) % activePlayers.length];

    state.attackerId = nextAttackerId;
    state.defenderId = nextDefenderId;

    if (isBotGame) {
        localState = state;
        renderGame();

        // If Bot's turn next, trigger Bot action
        if (state.attackerId === BOT_ID) {
            setTimeout(playBotAttack, 1000);
        } else if (state.defenderId === BOT_ID && state.table.length > 0) {
            setTimeout(playBotDefense, 1000);
        }
    } else {
        set(ref(database, `game/durak/rooms/${roomName}`), state);
    }
}

// Find turn position for next round
function determineNextAttackerIndex(state, defenderTook) {
    const activePlayers = Object.keys(state.players).filter(pId => state.players[pId].status === 'playing');
    const currentDefenderIdx = activePlayers.indexOf(state.defenderId);

    if (defenderTook) {
        // Defender skips attack turn. Attacker is player after defender
        return (currentDefenderIdx + 1) % activePlayers.length;
    } else {
        // Defender defended successfully. Defender attacks next
        return currentDefenderIdx;
    }
}

// Bot throws in final cards if defender picks up
function botThrowInFinal() {
    if (!isBotGame) return;
    const botHand = [...localState.players[BOT_ID].cards];
    const table = [...localState.table];

    // Build ranks on table
    const tableRanks = [];
    table.forEach(p => {
        tableRanks.push(p.attack.rank);
        if (p.defense) tableRanks.push(p.defense.rank);
    });

    const defenderCardsCount = localState.players[playerId].cards.length;
    const currentUnbeatenCount = table.filter(p => !p.defense).length;

    let cardPlayed = false;
    for (let i = botHand.length - 1; i >= 0; i--) {
        const card = botHand[i];
        if (tableRanks.includes(card.rank) && table.length < 6 && table.length < defenderCardsCount + currentUnbeatenCount) {
            // Throw in
            botHand.splice(i, 1);
            table.push({ attack: card, defense: null });
            cardPlayed = true;
        }
    }

    localState.players[BOT_ID].cards = botHand;
    localState.table = table;

    if (cardPlayed) {
        renderGame();
    }

    // Conclude round
    setTimeout(() => {
        executeNextRoundState(true);
    }, 1000);
}

// BOT AI ENGINE (Single Player)
function playBotAttack() {
    if (!isBotGame || localState.status !== 'started') return;
    if (localState.attackerId !== BOT_ID) return;

    const botHand = [...localState.players[BOT_ID].cards];
    const table = [...localState.table];
    const trumpSuit = localState.trumpCard.suit;

    if (table.length === 0) {
        // Choose lowest rank non-trump to attack
        let targetIdx = -1;
        let lowestVal = 99;

        botHand.forEach((c, idx) => {
            const isTrump = c.suit === trumpSuit;
            // Prefer non-trump
            const val = isTrump ? c.value + 100 : c.value;
            if (val < lowestVal) {
                lowestVal = val;
                targetIdx = idx;
            }
        });

        if (targetIdx !== -1) {
            const attackCard = botHand.splice(targetIdx, 1)[0];
            localState.players[BOT_ID].cards = botHand;
            localState.table.push({ attack: attackCard, defense: null });
            renderGame();
        }
    } else {
        // Throw in: find lowest matching card rank
        const tableRanks = [];
        table.forEach(p => {
            tableRanks.push(p.attack.rank);
            if (p.defense) tableRanks.push(p.defense.rank);
        });

        const defenderCardsCount = localState.players[playerId].cards.length;
        const currentUnbeatenCount = table.filter(p => !p.defense).length;

        let bestThrowIdx = -1;
        let lowestVal = 99;

        botHand.forEach((c, idx) => {
            if (tableRanks.includes(c.rank)) {
                const isTrump = c.suit === trumpSuit;
                const val = isTrump ? c.value + 100 : c.value;
                if (val < lowestVal) {
                    lowestVal = val;
                    bestThrowIdx = idx;
                }
            }
        });

        // Throw in if within limits
        if (bestThrowIdx !== -1 && table.length < 6 && table.length < defenderCardsCount + currentUnbeatenCount) {
            const attackCard = botHand.splice(bestThrowIdx, 1)[0];
            localState.players[BOT_ID].cards = botHand;
            localState.table.push({ attack: attackCard, defense: null });
            renderGame();
        } else {
            // Bot passes / finished attacking
            executeNextRoundState(localState.defenderTook);
            return;
        }
    }

    // If human is defender, human plays defense next
}

function playBotDefense() {
    if (!isBotGame || localState.status !== 'started') return;
    if (localState.defenderId !== BOT_ID) return;

    const botHand = [...localState.players[BOT_ID].cards];
    const table = [...localState.table];
    const trumpSuit = localState.trumpCard.suit;

    // Find the first unbeaten card on the table
    const unbeatenIdx = table.findIndex(p => !p.defense);
    if (unbeatenIdx === -1) {
        // All defended. Attacker needs to throw more or pass
        setTimeout(playBotAttack, 1000);
        return;
    }

    const attCard = table[unbeatenIdx].attack;

    // Find lowest valid defense card
    let bestDefIdx = -1;
    let lowestVal = 999;

    botHand.forEach((c, idx) => {
        if (canBeat(c, attCard, trumpSuit)) {
            const isTrump = c.suit === trumpSuit;
            const val = isTrump ? c.value + 100 : c.value;
            if (val < lowestVal) {
                lowestVal = val;
                bestDefIdx = idx;
            }
        }
    });

    if (bestDefIdx !== -1) {
        // Play defense card
        const defCard = botHand.splice(bestDefIdx, 1)[0];
        localState.players[BOT_ID].cards = botHand;
        localState.table[unbeatenIdx].defense = defCard;
        renderGame();

        // Continue defending remaining cards if any
        setTimeout(playBotDefense, 800);
    } else {
        // Bot cannot defend, must pick up all cards
        botTakeAllCards();
    }
}

function botTakeAllCards() {
    const table = [...localState.table];
    const botHand = [...localState.players[BOT_ID].cards];

    // Bot takes table
    table.forEach(pair => {
        if (pair.attack) botHand.push(pair.attack);
        if (pair.defense) botHand.push(pair.defense);
    });

    localState.players[BOT_ID].cards = botHand;
    localState.table = [];
    localState.defenderTook = false;

    // Clear table and let player attack again if matching cards
    refillHands(localState);

    // Bot skipped turn. Attacker shifts to player on left of defender.
    const pKeys = Object.keys(localState.players);
    const activePlayers = pKeys.filter(pId => localState.players[pId].status === 'playing');
    const nextAttackerIdx = (activePlayers.indexOf(BOT_ID) + 1) % activePlayers.length;

    localState.attackerId = activePlayers[nextAttackerIdx];
    localState.defenderId = activePlayers[(nextAttackerIdx + 1) % activePlayers.length];

    renderGame();

    if (localState.attackerId === BOT_ID) {
        setTimeout(playBotAttack, 1000);
    }
}

// Utility to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
