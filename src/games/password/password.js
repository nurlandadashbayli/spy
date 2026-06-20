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
import { adjectives as defaultAdjectives, animalNames } from '../../core/constants.js';

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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

// Seed Nouns List (Fallback & Offline-first)
const seedNouns = [
    'ailə', 'alma', 'adam', 'ağac', 'ayaqqabı', 'banan', 'badımcan', 'balıq', 'budaq', 'bazar',
    'cırtdan', 'cavan', 'cihaz', 'cədvəl', 'cənnət', 'çörək', 'çay', 'çanta', 'çiçək', 'çiyələk',
    'dağ', 'dəniz', 'dost', 'dəftər', 'duz', 'ev', 'elm', 'elçi', 'əlcək', 'əsgər',
    'ərik', 'əncir', 'əti', 'əqrəb', 'əfsanə', 'fırça', 'fındıq', 'fil', 'fırtına', 'fikir',
    'gün', 'gecə', 'günəş', 'güzgü', 'gül', 'hava', 'həyat', 'heyvan', 'həkim', 'hədiyyə',
    'xiyar', 'xəstəxana', 'xalça', 'xəritə', 'xəyal', 'ildırım', 'isiq', 'itki', 'inanc', 'idman',
    'insan', 'it', 'inək', 'il', 'ibarə', 'jurnal', 'jilet', 'jest', 'ketçup', 'joker',
    'kitab', 'kompüter', 'kamera', 'kino', 'kənd', 'qadın', 'qapı', 'qəzet', 'qarpız', 'qoyun',
    'limon', 'ləpə', 'lampa', 'layihə', 'ləğv', 'maşın', 'meyvə', 'musiqi', 'məktəb', 'müəllim',
    'nar', 'nəsil', 'nəğmə', 'nəfəs', 'nəzarət', 'otaq', 'ot', 'odun', 'oğru', 'orqan',
    'örpək', 'ördək', 'ölkə', 'ömür', 'öküz', 'paltar', 'papaq', 'pəncərə', 'pendir', 'pomidor',
    'rəsm', 'rəng', 'radio', 'rəqib', 'rəhbər', 'su', 'süd', 'saat', 'sabun', 'soğan',
    'şəhər', 'şəkər', 'şeftali', 'şir', 'şüşə', 'tələbə', 'telefon', 'televizor', 'toyuq', 'teatr',
    'ushaq', 'ulduz', 'un', 'tufan', 'uyğunluq', 'ürək', 'üzüm', 'ütü', 'üzük', 'üzv',
    'vərəq', 'vağzal', 'vətən', 'vulkan', 'vəzifə', 'yemək', 'yol', 'yarpaq', 'yemiş', 'yumurta',
    'zəng', 'zəncir', 'zəfər', 'zolaq', 'zəlzələ'
];

// Seed Adjectives List (Fallback)
const seedAdjectives = [
    'gözəl', 'böyük', 'kiçik', 'yaxşı', 'pis', 'isti', 'soyuq', 'asan', 'çətin', 'yeni',
    'köhne', 'təmiz', 'çirkli', 'quru', 'yaş', 'geniş', 'dar', 'uzun', 'qısa', 'ucuz',
    'bahalı', 'maraqlı', 'darıxdırıcı', 'ağıllı', 'dəli', 'xoşbəxt', 'bədbəxt', 'güclü', 'zəif', 'cəsur',
    'qorxaq', 'sakit', 'səs-küylü', 'hazır', 'məşğul', 'boş', 'şirin', 'acı', 'turş', 'duzlu'
];

// Seed Adverbs List (Fallback)
const seedAdverbs = [
    'yavaş', 'cəld', 'tez', 'gec', 'indi', 'sonra', 'dünən', 'bu gün', 'sabah', 'həmişə',
    'heç vaxt', 'birlikdə', 'tək', 'çox', 'az', 'yaxın', 'uzaq', 'düz', 'səhv', 'asanlıqla',
    'çətinliklə', 'gözəl', 'pis', 'tamamilə', 'qismən', 'yenidən', 'təcili', 'yavaş-yavaş', 'təsadüfən', 'qəsdən'
];

let wiktiNouns = [];
let wiktiAdjectives = [];
let wiktiAdverbs = [];

// Generic sequential category crawler from Wiktionary API
async function crawlCategory(categoryName, targetArray, label) {
    try {
        console.log(`🔄 Crawling deep pages of Category:${label} (A-Z)...`);
        let allItems = [];
        let cmcontinue = '';

        for (let page = 0; page < 6; page++) {
            const url = `https://en.wiktionary.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryName)}&cmlimit=500&format=json&origin=*${cmcontinue ? `&cmcontinue=${encodeURIComponent(cmcontinue)}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.query && data.query.categorymembers) {
                const pageItems = data.query.categorymembers
                    .map(m => m.title.toLowerCase())
                    .filter(title => {
                        const clean = title.trim();
                        // Exclude multi-word/compounds, namespaces, and subcategories
                        return !clean.includes(':') && 
                               !clean.includes('/') && 
                               !clean.includes(' ') && 
                               !clean.includes('-') && 
                               clean.length > 1;
                    });
                allItems = allItems.concat(pageItems);
            }

            if (data.continue && data.continue.cmcontinue) {
                cmcontinue = data.continue.cmcontinue;
            } else {
                break;
            }
        }

        const uniqueItems = [...new Set(allItems)];
        if (uniqueItems.length > 30) {
            targetArray.push(...uniqueItems);
            console.log(`✅ Loaded ${uniqueItems.length} unique words for ${label}!`);
        }
    } catch (err) {
        console.warn(`⚠️ Crawling category ${label} failed, using fallbacks.`, err);
    }
}

// Crawl all categories concurrently at load time
async function fetchAllCategories() {
    await Promise.all([
        crawlCategory('Category:Azerbaijani_nouns', wiktiNouns, 'Nouns'),
        crawlCategory('Category:Azerbaijani_adjectives', wiktiAdjectives, 'Adjectives'),
        crawlCategory('Category:Azerbaijani_adverbs', wiktiAdverbs, 'Adverbs')
    ]);
}

fetchAllCategories();

// Game State
let roomName = '';
let playerId = '';
let playerName = '';
let players = {};
let gameStatus = 'lobby';
let unsubscribePlayers = null;
let unsubscribeRoom = null;
let unsubscribeActiveRooms = null;

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const selectPassword = document.getElementById('select-password');
const lobbyScreen = document.getElementById('password-lobby-screen');
const gameScreen = document.getElementById('password-game-screen');
const joinSection = document.getElementById('password-join-section');
const lobbySection = document.getElementById('password-lobby-section');
const playersList = document.getElementById('password-players-list');
const gamePlayersList = document.getElementById('password-game-players-list');
const nounsGrid = document.getElementById('password-nouns-grid');

const activeRoomsSection = document.getElementById('password-active-rooms-section');
const activeRoomsList = document.getElementById('password-active-rooms-list');

// Category Checkboxes
const checkboxNouns = document.getElementById('filter-nouns');
const checkboxAdjectives = document.getElementById('filter-adjectives');
const checkboxAdverbs = document.getElementById('filter-adverbs');
const filterErrorMsg = document.getElementById('filter-error-msg');

// Buttons
const joinBtn = document.getElementById('password-join-btn');
const startBtn = document.getElementById('password-start-btn');
const leaveBtn = document.getElementById('password-leave-btn');
const backBtn = document.getElementById('password-back-btn');
const quitBtn = document.getElementById('password-quit-btn');
const skipBtn = document.getElementById('password-skip-btn');

// Room Name and Player Inputs
const roomInput = document.getElementById('password-room-name');
const nameInput = document.getElementById('password-player-name');

// Set Screen Navigation
if (selectPassword) {
    selectPassword.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
        startActiveRoomsListener();
    });
}

if (backBtn) backBtn.addEventListener('click', leavePasswordLobby);
if (quitBtn) quitBtn.addEventListener('click', leavePasswordLobby);
if (leaveBtn) leaveBtn.addEventListener('click', leavePasswordLobby);
if (joinBtn) joinBtn.addEventListener('click', joinPasswordRoom);
if (startBtn) startBtn.addEventListener('click', startPasswordGame);
if (skipBtn) skipBtn.addEventListener('click', skipNouns);

// Toggle Filters Handler
const filterInputs = [checkboxNouns, checkboxAdjectives, checkboxAdverbs];
filterInputs.forEach(input => {
    if (input) {
        input.addEventListener('change', async () => {
            const activeFilters = filterInputs.filter(inp => inp.checked);
            
            // Prevent deselecting all filters
            if (activeFilters.length === 0) {
                input.checked = true;
                if (filterErrorMsg) filterErrorMsg.style.display = 'block';
                setTimeout(() => {
                    if (filterErrorMsg) filterErrorMsg.style.display = 'none';
                }, 3000);
                return;
            }

            // Sync with Firebase if we are joined in a room
            if (roomName && playerId) {
                try {
                    const roomRef = ref(database, `game/password/${roomName}`);
                    await update(roomRef, {
                        categories: {
                            nouns: !!checkboxNouns.checked,
                            adjectives: !!checkboxAdjectives.checked,
                            adverbs: !!checkboxAdverbs.checked
                        }
                    });
                } catch (err) {
                    console.error('Error syncing filters:', err);
                }
            }
        });
    }
});

// Active Rooms Listener for Password Game
function startActiveRoomsListener() {
    if (unsubscribeActiveRooms) return;

    if (activeRoomsSection) {
        activeRoomsSection.style.display = 'block';
    }

    const roomsRef = ref(database, 'game/password');
    unsubscribeActiveRooms = onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val() || {};
        const activeRooms = [];

        for (const [rName, roomData] of Object.entries(rooms)) {
            const players = roomData.players || {};
            const playerCount = Object.keys(players).length;

            if (playerCount > 0 && roomData.status === 'lobby') {
                activeRooms.push({
                    name: rName,
                    count: playerCount
                });
            }
        }

        // Always display default quick-join rooms "Otaq 1" and "Otaq 2"
        const defaultRooms = ['Otaq 1', 'Otaq 2'];
        defaultRooms.forEach(defRoom => {
            const lowerName = defRoom.toLowerCase();
            const exists = activeRooms.some(r => r.name.toLowerCase() === lowerName);
            if (!exists) {
                const roomData = rooms[lowerName] || {};
                const players = roomData.players || {};
                const count = Object.keys(players).length;
                const status = roomData.status || 'lobby';

                // Display if lobby state or doesn't exist yet
                if (status === 'lobby') {
                    activeRooms.push({
                        name: defRoom,
                        count: count
                    });
                }
            }
        });

        if (activeRoomsList) {
            activeRoomsList.innerHTML = activeRooms.map(room => `
                <button class="btn btn-secondary password-active-room-btn" data-room="${escapeHtml(room.name)}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; width: 100%;">
                    <span>${escapeHtml(room.name)}</span>
                    <span class="badge" style="background: var(--primary);">${room.count} player${room.count > 1 ? 's' : ''}</span>
                </button>
            `).join('');

            // Click listeners for active room buttons
            document.querySelectorAll('.password-active-room-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetRoom = e.currentTarget.getAttribute('data-room');
                    quickJoinRoom(targetRoom);
                });
            });
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
    if (roomInput) roomInput.value = targetRoom;

    // Generate cool random name
    const randomAdjective = defaultAdjectives[Math.floor(Math.random() * defaultAdjectives.length)];
    const randomAnimalStr = animalNames[Math.floor(Math.random() * animalNames.length)];
    const [, ...animalParts] = randomAnimalStr.split(' ');
    const randomAnimal = animalParts.join('');

    const randomName = `${randomAdjective}${randomAnimal}`;
    if (nameInput) nameInput.value = randomName;

    joinPasswordRoom();
}

async function joinPasswordRoom() {
    roomName = roomInput.value.trim().toLowerCase();
    playerName = nameInput.value.trim();

    if (!roomName) return alert('Enter room name');
    if (!playerName) return alert('Enter name');

    try {
        const playerRef = ref(database, `game/password/${roomName}/players`);
        const roomRef = ref(database, `game/password/${roomName}`);

        // Get snapshot to check status
        const snap = await get(roomRef);
        const roomData = snap.val() || {};

        if (roomData.status === 'started') {
            return alert('Game has already started in this room!');
        }

        const newPlayerRef = push(playerRef);
        playerId = newPlayerRef.key;

        await set(newPlayerRef, {
            name: playerName,
            joinedAt: Date.now()
        });

        // Set status and default categories if they don't exist
        const updates = {};
        if (!roomData.status) updates.status = 'lobby';
        if (!roomData.categories) {
            updates.categories = {
                nouns: !!checkboxNouns.checked,
                adjectives: !!checkboxAdjectives.checked,
                adverbs: !!checkboxAdverbs.checked
            };
        }
        
        if (Object.keys(updates).length > 0) {
            await update(roomRef, updates);
        }

        onDisconnect(newPlayerRef).remove();

        joinSection.style.display = 'none';
        lobbySection.style.display = 'block';

        // Keep active rooms listener running in lobby!
        startActiveRoomsListener();
        setupRealtimeListeners();
    } catch (err) {
        console.error(err);
        alert('Failed to join room: ' + err.message);
    }
}

function setupRealtimeListeners() {
    const roomRef = ref(database, `game/password/${roomName}`);
    const playersRef = ref(database, `game/password/${roomName}/players`);

    unsubscribePlayers = onValue(playersRef, (snap) => {
        players = snap.val() || {};
        const pArray = Object.keys(players);

        // If we were kicked or removed
        if (playerId && !players[playerId]) {
            resetToSelection();
            return;
        }

        updateLobbyUI();
        updateGamePlayersUI();

        // Show Start button if we have at least 1 player
        if (startBtn) {
            startBtn.style.display = pArray.length >= 1 ? 'block' : 'none';
        }
    });

    unsubscribeRoom = onValue(roomRef, (snap) => {
        const data = snap.val() || {};
        gameStatus = data.status || 'lobby';

        // Real-time synchronization of Categories Filters
        if (data.categories) {
            checkboxNouns.checked = !!data.categories.nouns;
            checkboxAdjectives.checked = !!data.categories.adjectives;
            checkboxAdverbs.checked = !!data.categories.adverbs;
        }

        // Checkboxes remain enabled at all times, including during active game play!
        filterInputs.forEach(input => {
            if (input) input.disabled = false;
        });

        if (gameStatus === 'started') {
            showGameScreen(data);
        } else {
            showLobbyScreen();
        }
    });
}

function updateLobbyUI() {
    if (!playersList) return;
    playersList.innerHTML = Object.values(players).map(p => `
        <div class="player-item">
            <span class="player-icon">👤</span>
            <span class="player-name">${escapeHtml(p.name)}</span>
        </div>
    `).join('');
}

function updateGamePlayersUI() {
    if (!gamePlayersList) return;
    gamePlayersList.innerHTML = Object.values(players).map(p => `
        <div class="player-item">
            <span class="player-icon">👤</span>
            <span class="player-name">${escapeHtml(p.name)}</span>
        </div>
    `).join('');
}

function showLobbyScreen() {
    gameScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
    joinSection.style.display = 'none';
    lobbySection.style.display = 'block';
    
    // Ensure active rooms remain visible while in lobby
    startActiveRoomsListener();
}

function showGameScreen(roomData) {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Hide active rooms list only during actual gameplay
    stopActiveRoomsListener();

    // Display the nouns
    const currentNouns = roomData.currentNouns || [];
    const highlights = roomData.highlights || {};
    const playerArray = Object.entries(players).sort((a, b) => a[1].joinedAt - b[1].joinedAt);

    // Make nouns grid interactive
    nounsGrid.innerHTML = currentNouns.map((noun, index) => {
        const nounHighlights = highlights[index] || {};
        const highlightedPlayers = Object.keys(nounHighlights);

        let highlightClass = '';
        let badgeHTML = '';

        if (highlightedPlayers.length > 0) {
            const isP1Highlighted = playerArray[0] && nounHighlights[playerArray[0][0]];
            const isP2Highlighted = playerArray[1] && nounHighlights[playerArray[1][0]];

            if (isP1Highlighted && isP2Highlighted) {
                highlightClass = 'highlighted-both';
            } else if (isP1Highlighted) {
                highlightClass = 'highlighted-p1';
            } else if (isP2Highlighted) {
                highlightClass = 'highlighted-p2';
            } else {
                highlightClass = 'highlighted-p1'; // fallback/multiplayer
            }

            badgeHTML = `<div class="noun-badges">` + highlightedPlayers.map(pId => {
                const name = players[pId] ? players[pId].name : 'User';
                const pClass = playerArray[0] && pId === playerArray[0][0] ? 'p1' : 'p2';
                return `<span class="noun-badge ${pClass}">${escapeHtml(name)}</span>`;
            }).join('') + `</div>`;
        }

        return `
            <div class="noun-card ${highlightClass}" data-index="${index}">
                <span>${escapeHtml(noun)}</span>
                ${badgeHTML}
            </div>
        `;
    }).join('');

    // Attach click listeners to nouns
    document.querySelectorAll('.noun-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            toggleHighlight(index);
        });
    });
}

// Generate unique non-repeating words choosing from combined selected category pools
async function getUniqueNouns(count) {
    const roomRef = ref(database, `game/password/${roomName}`);
    const roomSnap = await get(roomRef);
    const roomData = roomSnap.val() || {};
    const usedNouns = roomData.usedNouns || {};
    
    // Check room selected categories
    const categories = roomData.categories || { nouns: true, adjectives: false, adverbs: false };
    
    // Build the combined active pool
    let activePool = [];
    if (categories.nouns) {
        activePool = activePool.concat(wiktiNouns.length > 20 ? wiktiNouns : seedNouns);
    }
    if (categories.adjectives) {
        activePool = activePool.concat(wiktiAdjectives.length > 20 ? wiktiAdjectives : seedAdjectives);
    }
    if (categories.adverbs) {
        activePool = activePool.concat(wiktiAdverbs.length > 20 ? wiktiAdverbs : seedAdverbs);
    }

    // Fallback if empty
    if (activePool.length === 0) {
        activePool = seedNouns;
    }
    
    // Filter out used nouns
    let availableNouns = activePool.filter(word => !usedNouns[word]);
    
    // If pool is too small, reset used nouns history for this room
    if (availableNouns.length < count) {
        console.log('🔄 Word pool exhausted, resetting used nouns history...');
        availableNouns = activePool;
        await set(ref(database, `game/password/${roomName}/usedNouns`), {});
    }
    
    const chosenNouns = [];
    const tempPool = [...availableNouns];
    for (let i = 0; i < count; i++) {
        if (tempPool.length === 0) break;
        const randIndex = Math.floor(Math.random() * tempPool.length);
        chosenNouns.push(tempPool.splice(randIndex, 1)[0]);
    }
    
    return chosenNouns;
}

async function startPasswordGame() {
    try {
        const chosenNouns = await getUniqueNouns(5);

        const updates = {
            status: 'started',
            currentNouns: chosenNouns,
            highlights: {},
            skips: null
        };
        // Atomically save used words
        chosenNouns.forEach(noun => {
            updates[`usedNouns/${noun}`] = true;
        });

        const roomRef = ref(database, `game/password/${roomName}`);
        await update(roomRef, updates);
    } catch (err) {
        console.error(err);
        alert('Failed to start game: ' + err.message);
    }
}

async function toggleHighlight(nounIndex) {
    try {
        const highlightsRef = ref(database, `game/password/${roomName}/highlights/${nounIndex}/${playerId}`);
        const snap = await get(highlightsRef);

        if (snap.exists()) {
            await remove(highlightsRef);
        } else {
            await set(highlightsRef, true);
        }
    } catch (err) {
        console.error(err);
    }
}

async function skipNouns() {
    try {
        const chosenNouns = await getUniqueNouns(5);

        const updates = {
            currentNouns: chosenNouns,
            highlights: {},
            skips: null
        };
        // Atomically save skipped words
        chosenNouns.forEach(noun => {
            updates[`usedNouns/${noun}`] = true;
        });

        const roomRef = ref(database, `game/password/${roomName}`);
        await update(roomRef, updates);
    } catch (err) {
        console.error(err);
    }
}

async function leavePasswordLobby() {
    if (playerId && roomName) {
        try {
            await remove(ref(database, `game/password/${roomName}/players/${playerId}`));
            
            // If room is empty, clear the room
            const playersRef = ref(database, `game/password/${roomName}/players`);
            const playersSnap = await get(playersRef);
            if (!playersSnap.exists()) {
                await remove(ref(database, `game/password/${roomName}`));
            }
        } catch (err) {
            console.error(err);
        }
    }
    resetToSelection();
}

function resetToSelection() {
    if (unsubscribePlayers) {
        unsubscribePlayers();
        unsubscribePlayers = null;
    }
    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }
    stopActiveRoomsListener();

    playerId = '';
    roomName = '';
    players = {};
    gameStatus = 'lobby';

    lobbyScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    selectionScreen.classList.add('active');

    // Reset UI fields
    joinSection.style.display = 'block';
    lobbySection.style.display = 'none';
    roomInput.value = '';
    nameInput.value = '';

    // Reset checkboxes to default
    if (checkboxNouns) checkboxNouns.checked = true;
    if (checkboxAdjectives) checkboxAdjectives.checked = false;
    if (checkboxAdverbs) checkboxAdverbs.checked = false;
    filterInputs.forEach(input => {
        if (input) input.disabled = false;
    });
}

function escapeHtml(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}
