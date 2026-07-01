// towel.js
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

// Load CSS dynamically
const cssLink = document.createElement('link');
cssLink.rel = 'stylesheet';
cssLink.href = 'src/games/towel/towel.css';
document.head.appendChild(cssLink);

// Firebase Config
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

// Game Configurations
const BLOCK_CONFIGS = {
    bath: { w: 85, h: 26, density: 0.0012, friction: 0.65, restitution: 0.15, emoji: '🟦', label: 'Bath Towel' },
    beach: { w: 120, h: 32, density: 0.0016, friction: 0.8, restitution: 0.1, emoji: '🟩', label: 'Beach Towel' },
    hand: { w: 45, h: 22, density: 0.0009, friction: 0.5, restitution: 0.25, emoji: '🟪', label: 'Hand Towel' },
    rolled: { r: 19, density: 0.0014, friction: 0.45, restitution: 0.4, emoji: '🟡', label: 'Rolled Towel' } // Circle
};

const PROJ_CONFIGS = {
    sponge: { r: 16, density: 0.001, friction: 0.3, restitution: 0.6, label: 'Sponge Ball', emoji: '🧽', color: '#facc15' },
    soap: { w: 32, h: 18, density: 0.002, friction: 0.01, restitution: 0.15, label: 'Slippery Soap', emoji: '🧼', color: '#a5f3fc' },
    duck: { r: 18, density: 0.003, friction: 0.4, restitution: 0.3, label: 'Rubber Ducky', emoji: '🦆', color: '#fbbf24', hasExplosion: true }
};

// State Variables
let gameMode = 'local'; // 'local' or 'online'
let roomName = '';
let playerId = '';
let playerName = '';
let opponentId = '';
let players = {};
let currentTurn = '';
let activeBuilder = 1; // 1 or 2 (local mode only)
let p1Tower = []; // template: [{type, relX, relY, angle}]
let p2Tower = [];
let maxBlocks = 8;
let selectedBlockType = 'bath';
let selectedProjType = 'sponge';

// Physics Variables
let buildEngine = null;
let buildWorld = null;
let buildRunner = null;
let buildBlocks = []; // Matter bodies
let buildGround = null;

let combatEngine = null;
let combatWorld = null;
let combatRunner = null;
let p1Bodies = [];
let p2Bodies = [];
let combatProjectile = null;
let groundLeft = null;
let groundRight = null;
let waterSensor = null;
let showerWall = null; // Middle barrier

// Slingshot State
let slingshotState = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    maxPull: 85,
    isDragging: false
};

// Particles (for dust/impacts)
let particles = [];

// Firebase Unsubscribe handles
let unsubscribeRoom = null;

// DOM Cache
let selectTowelBtn = null;
const selectionScreen = document.getElementById('selection-screen');
let lobbyScreen = null;
let gameScreen = null;
let joinSection = null;
let lobbySection = null;
let backBtn = null;
let leaveBtn = null;
let roomInput = null;
let nameInput = null;
let joinBtn = null;
let playersList = null;
let startBtn = null;
let localBtn = null;

// In Game DOM Cache
let rulesBtn = null;
let quitGameBtn = null;
let rulesModal = null;
let rulesCloseBtn = null;

let buildPhaseDiv = null;
let shootPhaseDiv = null;
let buildTitle = null;
let buildDesc = null;
let blocksCountSpan = null;
let buildCanvas = null;
let readyBtn = null;
let undoBtn = null;
let clearBtn = null;

let hudP1Name = null;
let hudP1Int = null;
let barP1 = null;
let hudP2Name = null;
let hudP2Int = null;
let barP2 = null;
let turnIndicator = null;
let shotPrompt = null;
let combatCanvas = null;

// Screen elements insertion to DOM dynamically
function injectHTML() {
    // 1. Add game-card to selection grid if not already present
    const gameGrid = document.querySelector('.game-grid');
    if (gameGrid && !document.getElementById('select-towel')) {
        const durakCard = document.getElementById('select-durak');
        const cardHtml = `
            <div class="game-card" id="select-towel">
                <div class="game-card-icon">🗼</div>
                <div class="game-card-content">
                    <h3>Towel Topple</h3>
                    <p>Build towel stacks & crash your opponent's tower! Physics battle.</p>
                    <span class="badge" style="background: var(--success);">Local & Online</span>
                </div>
            </div>
        `;
        if (durakCard) {
            durakCard.insertAdjacentHTML('afterend', cardHtml);
        } else {
            gameGrid.insertAdjacentHTML('beforeend', cardHtml);
        }
    }

    // 2. Inject lobby & game screen HTML at the bottom of the container
    const container = document.querySelector('.container');
    if (container) {
        const screensHtml = `
            <!-- Towel Lobby Screen -->
            <div id="towel-lobby-screen" class="screen">
                <div class="game-header">
                    <button id="towel-back-btn" class="back-btn">← Back to Hub</button>
                    <h1 class="game-title">🗼 Towel Topple</h1>
                    <p class="game-subtitle">Physics-based Towel Stacking & Slingshot Destruction!</p>
                </div>

                <div style="max-width: 500px; margin: 0 auto;">
                    <!-- Join Game Section -->
                    <div id="towel-join-section" class="card">
                        <!-- Local Game Option -->
                        <button id="towel-local-btn" class="btn btn-primary" style="margin-bottom: 1.5rem; background: var(--success); width: 100%; font-weight: bold; border: none; padding: 0.75rem 1rem; border-radius: 12px;">👥 Local 2-Player (Pass & Play)</button>
                        
                        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem; position: relative;">
                            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-card); padding: 0 10px; font-size: 0.8rem; color: var(--text-muted);">OR PLAY ONLINE</span>
                        </div>

                        <div class="input-group">
                            <label for="towel-room-name">Enter Room Name</label>
                            <input type="text" id="towel-room-name" placeholder="e.g. towel123" maxlength="15" autocomplete="off" style="width: 100%; padding: 0.6rem 1rem; border-radius: 8px; background: var(--bg-elevated); border: 1px solid rgba(255,255,255,0.1); color: white; margin-top: 0.25rem;">
                        </div>
                        <div class="input-group" style="margin-top: 1rem;">
                            <label for="towel-player-name">Enter Your Name</label>
                            <input type="text" id="towel-player-name" placeholder="Your name..." maxlength="20" autocomplete="off" style="width: 100%; padding: 0.6rem 1rem; border-radius: 8px; background: var(--bg-elevated); border: 1px solid rgba(255,255,255,0.1); color: white; margin-top: 0.25rem;">
                        </div>
                        <button id="towel-join-btn" class="btn btn-primary" style="margin-top: 1rem; width: 100%; font-weight: bold; padding: 0.75rem 1rem; border-radius: 12px;">Join / Create Room</button>
                    </div>

                    <!-- Online Lobby Section -->
                    <div id="towel-lobby-section" class="card" style="display: none;">
                        <h3>Players in Room:</h3>
                        <div id="towel-players-list" style="margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem;"></div>
                        <button id="towel-start-btn" class="btn btn-primary" style="display: none; margin-bottom: 1rem; width: 100%; font-weight: bold; padding: 0.75rem 1rem; border-radius: 12px;">Start Game</button>
                        <button id="towel-leave-btn" class="btn btn-secondary" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px;">Leave Room</button>
                    </div>
                </div>
            </div>

            <!-- Towel Game Screen -->
            <div id="towel-game-screen" class="screen">
                <div class="towel-game-container">
                    <!-- Header with Status Info -->
                    <div class="towel-header card" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; border-radius: 16px;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 0.5rem;">🗼 Towel Topple</h2>
                        </div>
                        <div id="towel-status-text" style="font-weight: 600; color: var(--primary-light);">Setting up game...</div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button id="towel-rules-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin: 0; border: none; background: rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; color: white;">❓ Rules</button>
                            <button id="towel-quit-game-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin: 0; border: none; background: var(--danger); border-radius: 8px; color: white; cursor: pointer;">Exit</button>
                        </div>
                    </div>

                    <!-- Main Arena Area -->
                    <div class="towel-arena-card card" style="padding: 1.5rem; position: relative;">
                        <!-- Game Phase: Stacking/Building -->
                        <div id="towel-build-phase" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <div class="towel-phase-instructions" style="text-align: center; margin-bottom: 0.5rem;">
                                <h3 id="towel-build-title">Player 1: Build Your Towel Tower!</h3>
                                <p id="towel-build-desc" style="color: var(--text-secondary); font-size: 0.95rem;">Select towel blocks and drop them into your zone. Build a stable tower! (<span id="towel-blocks-count">0</span> / 8 blocks)</p>
                            </div>

                            <!-- Blocks Selection Bar -->
                            <div class="towel-block-selector" style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-bottom: 0.5rem;">
                                <button class="towel-block-btn active" data-type="bath">
                                    <span class="btn-icon">🟦</span>
                                    <div class="btn-label">
                                        <strong>Bath Towel</strong>
                                        <span>Medium & Balanced</span>
                                    </div>
                                </button>
                                <button class="towel-block-btn" data-type="beach">
                                    <span class="btn-icon">🟩</span>
                                    <div class="btn-label">
                                        <strong>Beach Towel</strong>
                                        <span>Heavy & Stable</span>
                                    </div>
                                </button>
                                <button class="towel-block-btn" data-type="hand">
                                    <span class="btn-icon">🟪</span>
                                    <div class="btn-label">
                                        <strong>Hand Towel</strong>
                                        <span>Light & Small</span>
                                    </div>
                                </button>
                                <button class="towel-block-btn" data-type="rolled">
                                    <span class="btn-icon">🟡</span>
                                    <div class="btn-label">
                                        <strong>Rolled Towel</strong>
                                        <span>Bouncy & Circular</span>
                                    </div>
                                </button>
                            </div>

                            <!-- Build Canvas Wrapper -->
                            <div style="position: relative; border: 2px dashed rgba(255, 255, 255, 0.15); border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.3);">
                                <canvas id="towel-build-canvas" width="600" height="400" style="display: block; cursor: crosshair;"></canvas>
                                <!-- Construction Zone Outline -->
                                <div id="towel-build-zone" style="position: absolute; bottom: 40px; left: 150px; right: 150px; height: 320px; border: 2px dashed rgba(76, 175, 80, 0.4); border-bottom: none; pointer-events: none;">
                                    <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; color: rgba(76, 175, 80, 0.8); font-weight: 700; background: rgba(0,0,0,0.6); padding: 3px 10px; border-radius: 6px; white-space: nowrap;">CONSTRUCTION ZONE</div>
                                </div>
                            </div>

                            <!-- Build Controls -->
                            <div style="display: flex; gap: 1rem; width: 100%; max-width: 600px; justify-content: space-between; margin-top: 0.5rem;">
                                <div style="display: flex; gap: 0.5rem;">
                                    <button id="towel-undo-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; border-radius: 8px;">↩ Undo</button>
                                    <button id="towel-clear-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; border-radius: 8px;">🗑 Clear</button>
                                </div>
                                <button id="towel-ready-btn" class="btn btn-primary" style="background: var(--success); padding: 0.5rem 1.5rem; font-weight: bold; border-radius: 8px;" disabled>Finish Stacking</button>
                            </div>
                        </div>

                        <!-- Game Phase: Combat/Shooting -->
                        <div id="towel-shoot-phase" style="display: none; flex-direction: column; align-items: center; gap: 1rem;">
                            <!-- Match HUD -->
                            <div class="towel-hud" style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 900px; gap: 1.5rem; background: rgba(0,0,0,0.4); padding: 0.75rem 1.25rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px);">
                                <!-- Player 1 Status -->
                                <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                        <strong id="towel-hud-p1-name" style="color: var(--primary-light);">Player 1</strong>
                                        <span id="towel-hud-p1-int" style="font-weight: bold;">100% Stable</span>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                                        <div id="towel-bar-p1" style="background: var(--primary); height: 100%; width: 100%; transition: width 0.3s;"></div>
                                    </div>
                                </div>

                                <!-- Mid VS/Turn Indicator -->
                                <div style="text-align: center; padding: 0 0.5rem; min-width: 170px;">
                                    <div id="towel-turn-indicator" style="font-weight: 800; font-size: 1.15rem; color: var(--accent); letter-spacing: 0.5px;">P1's Turn!</div>
                                    <div id="towel-shot-prompt" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">Drag from slingshot to shoot</div>
                                </div>

                                <!-- Player 2 Status -->
                                <div style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
                                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                        <span id="towel-hud-p2-int" style="font-weight: bold;">100% Stable</span>
                                        <strong id="towel-hud-p2-name" style="color: var(--secondary);">Player 2</strong>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; display: flex; justify-content: flex-end;">
                                        <div id="towel-bar-p2" style="background: var(--secondary); height: 100%; width: 100%; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Projectiles Selection Bar -->
                            <div class="towel-proj-selector" style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-bottom: 0.25rem;">
                                <button class="towel-proj-btn active" data-type="sponge">
                                    🧽 Sponge Ball
                                </button>
                                <button class="towel-proj-btn" data-type="soap">
                                    🧼 Soap Bar (Frictionless)
                                </button>
                                <button class="towel-proj-btn" data-type="duck">
                                    🦆 Rubber Ducky (Explosive!)
                                </button>
                            </div>

                            <!-- Combat Canvas Wrapper -->
                            <div style="border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; background: linear-gradient(to bottom, #11131e, #07080c); box-shadow: var(--shadow-lg);">
                                <canvas id="towel-combat-canvas" width="1000" height="500" style="display: block;"></canvas>
                            </div>

                            <!-- Shooter controls/status -->
                            <div style="display: flex; justify-content: center; width: 100%;">
                                <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">💡 Tip: Projectiles spawn in the active slingshot. Drag and aim carefully over the center shower partition!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Towel Rules Modal -->
            <div id="towel-rules-modal" class="scrabble-modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center;">
                <div class="card" style="width: 100%; max-width: 550px; max-height: 80vh; overflow-y: auto; border-radius: 20px; margin: auto; padding: 1.5rem; text-align: left; background: var(--bg-card); position: relative; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                        <h3 style="color: var(--primary-light); margin: 0; display: flex; align-items: center; gap: 0.5rem;">🗼 Towel Topple Rules</h3>
                        <button id="towel-rules-close-btn" class="btn btn-secondary" style="padding: 0.25rem 0.6rem; margin: 0; border: none; background: rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer; color: white;">✕</button>
                    </div>
                    <div style="line-height: 1.6; color: var(--text-primary); font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <p>Welcome to <strong>Towel Topple: Bathroom Battle</strong>! Two players build sturdier towel stacks and topple their opponent's tower using physics-based bathroom projectile launchers.</p>
                        
                        <h4 style="color: var(--accent); margin-top: 0.5rem; font-weight: bold;">🧱 Phase 1: Stacking</h4>
                        <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem;">
                            <li>Each player builds their tower inside their construction zone.</li>
                            <li>Blocks are dropped from the cursor position. Since there's <strong>active gravity</strong>, you must build carefully! If you stack too unevenly, your tower will fall before the battle begins.</li>
                            <li>Choose from four block types:
                                <ul>
                                    <li><strong>🟦 Bath Towel:</strong> Balanced weight and dimensions.</li>
                                    <li><strong>🟩 Beach Towel:</strong> Extra wide and heavy. Ideal for bases.</li>
                                    <li><strong>🟪 Hand Towel:</strong> Small, square, and light.</li>
                                    <li><strong>🟡 Rolled Towel:</strong> Circular towel. Bouncy, rolls around, and adds chaos.</li>
                                </ul>
                            </li>
                            <li>Stack exactly <strong>8 blocks</strong>, then click <strong>Finish Stacking</strong>.</li>
                        </ul>

                        <h4 style="color: var(--accent); margin-top: 0.5rem; font-weight: bold;">🎯 Phase 2: Combat</h4>
                        <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem;">
                            <li>Both towers are set on platforms on opposite sides of a bathroom arena.</li>
                            <li>Players take turns aiming and launching a projectile from their slingshot.</li>
                            <li>Choose your ammunition wisely:
                                <ul>
                                    <li><strong>🧽 Sponge Ball:</strong> Standard projectile. Bouncy.</li>
                                    <li><strong>🧼 Soap Bar:</strong> Rectangular, high velocity, low friction. Excellent for sliding.</li>
                                    <li><strong>🦆 Rubber Ducky:</strong> Heavy and causes a <strong>shower explosion</strong> upon impact, blowing nearby towels away!</li>
                                </ul>
                            </li>
                            <li>To fire, <strong>drag back</strong> the projectile on the active slingshot, aim, and release!</li>
                            <li>A block is considered "destroyed" if it falls off its platform or plunges into the bottom water.</li>
                            <li>The player whose tower stability falls to 0% first (or who has the lowest stability after 5 rounds of turns) loses.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', screensHtml);
    }
}

// Draw a rounded rectangle helper
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Generate unique player ID
function generatePlayerId() {
    return 'towel_' + Math.random().toString(36).substring(2, 11);
}

// Setup DOM elements cache & Listeners
function setupDOMReferences() {
    selectTowelBtn = document.getElementById('select-towel');
    lobbyScreen = document.getElementById('towel-lobby-screen');
    gameScreen = document.getElementById('towel-game-screen');
    joinSection = document.getElementById('towel-join-section');
    lobbySection = document.getElementById('towel-lobby-section');
    backBtn = document.getElementById('towel-back-btn');
    leaveBtn = document.getElementById('towel-leave-btn');
    roomInput = document.getElementById('towel-room-name');
    nameInput = document.getElementById('towel-player-name');
    joinBtn = document.getElementById('towel-join-btn');
    playersList = document.getElementById('towel-players-list');
    startBtn = document.getElementById('towel-start-btn');
    localBtn = document.getElementById('towel-local-btn');

    rulesBtn = document.getElementById('towel-rules-btn');
    quitGameBtn = document.getElementById('towel-quit-game-btn');
    rulesModal = document.getElementById('towel-rules-modal');
    rulesCloseBtn = document.getElementById('towel-rules-close-btn');

    buildPhaseDiv = document.getElementById('towel-build-phase');
    shootPhaseDiv = document.getElementById('towel-shoot-phase');
    buildTitle = document.getElementById('towel-build-title');
    buildDesc = document.getElementById('towel-build-desc');
    blocksCountSpan = document.getElementById('towel-blocks-count');
    buildCanvas = document.getElementById('towel-build-canvas');
    readyBtn = document.getElementById('towel-ready-btn');
    undoBtn = document.getElementById('towel-undo-btn');
    clearBtn = document.getElementById('towel-clear-btn');

    hudP1Name = document.getElementById('towel-hud-p1-name');
    hudP1Int = document.getElementById('towel-hud-p1-int');
    barP1 = document.getElementById('towel-bar-p1');
    hudP2Name = document.getElementById('towel-hud-p2-name');
    hudP2Int = document.getElementById('towel-hud-p2-int');
    barP2 = document.getElementById('towel-bar-p2');
    turnIndicator = document.getElementById('towel-turn-indicator');
    shotPrompt = document.getElementById('towel-shot-prompt');
    combatCanvas = document.getElementById('towel-combat-canvas');
}

function bindEvents() {
    // Menu navigation
    if (selectTowelBtn) {
        selectTowelBtn.addEventListener('click', () => {
            selectionScreen.classList.remove('active');
            lobbyScreen.classList.add('active');

            const savedName = localStorage.getItem('towel_playerName');
            if (savedName && nameInput) {
                nameInput.value = savedName;
            }
        });
    }

    if (backBtn) backBtn.addEventListener('click', leaveLobby);
    if (leaveBtn) leaveBtn.addEventListener('click', leaveRoom);
    if (quitGameBtn) quitGameBtn.addEventListener('click', quitGameToLobby);
    
    if (localBtn) localBtn.addEventListener('click', startLocalGame);
    if (joinBtn) joinBtn.addEventListener('click', joinOnlineRoom);
    if (startBtn) startBtn.addEventListener('click', startOnlineGame);

    if (rulesBtn) rulesBtn.addEventListener('click', () => rulesModal.style.display = 'flex');
    if (rulesCloseBtn) rulesCloseBtn.addEventListener('click', () => rulesModal.style.display = 'none');

    // Build controls
    if (undoBtn) undoBtn.addEventListener('click', undoLastBlock);
    if (clearBtn) clearBtn.addEventListener('click', clearBuildTower);
    if (readyBtn) readyBtn.addEventListener('click', finishStacking);

    // Build block selection click listener
    document.querySelectorAll('.towel-block-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.towel-block-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            selectedBlockType = targetBtn.dataset.type;
        });
    });

    // Combat projectile selection click listener
    document.querySelectorAll('.towel-proj-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.towel-proj-btn').forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            selectedProjType = targetBtn.dataset.type;
            
            // Re-create slingshot projectile with new type if slingshot is active and idle
            resetCombatProjectile();
        });
    });

    // Build Canvas Interaction
    if (buildCanvas) {
        buildCanvas.addEventListener('mousedown', handleBuildCanvasClick);
        buildCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = buildCanvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            placeBlock(x, y);
        });
    }

    // Combat Canvas Interaction (Slingshot drag/release)
    if (combatCanvas) {
        combatCanvas.addEventListener('mousedown', handleCombatMouseDown);
        combatCanvas.addEventListener('mousemove', handleCombatMouseMove);
        window.addEventListener('mouseup', handleCombatMouseUp);

        combatCanvas.addEventListener('touchstart', handleCombatTouchStart, { passive: false });
        combatCanvas.addEventListener('touchmove', handleCombatTouchMove, { passive: false });
        combatCanvas.addEventListener('touchend', handleCombatTouchEnd);
    }
}

// Leave lobby back to selection hub
function leaveLobby() {
    lobbyScreen.classList.remove('active');
    selectionScreen.classList.add('active');
}

// ── BUILD PHASE LOGIC ────────────────────────────────────────────────────────

function initBuildPhysics() {
    const { Engine, World, Bodies, Runner } = window.Matter;
    
    if (buildEngine) {
        Engine.clear(buildEngine);
    }

    buildEngine = Engine.create();
    buildWorld = buildEngine.world;
    buildWorld.gravity.y = 0.85;

    // Ground platform
    buildGround = Bodies.rectangle(300, 390, 600, 20, { 
        isStatic: true,
        friction: 0.9,
        label: 'ground'
    });

    World.add(buildWorld, buildGround);
    buildBlocks = [];

    if (buildRunner) {
        Runner.stop(buildRunner);
    }
    buildRunner = Runner.create();
    Runner.run(buildRunner, buildEngine);

    // Custom animation frame loop for build canvas
    requestAnimationFrame(renderBuildLoop);
}

function handleBuildCanvasClick(e) {
    const rect = buildCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    placeBlock(x, y);
}

function placeBlock(x, y) {
    if (buildBlocks.length >= maxBlocks) return;

    // Constrain drop within Construction Zone
    // Left = 150, Right = 450, Top = 50, Bottom = 350
    if (x < 150 || x > 450 || y < 30 || y > 350) {
        showStatusText("⚠️ Please drop blocks inside the dashed Construction Zone!", true);
        return;
    }

    const { Bodies, World } = window.Matter;
    const conf = BLOCK_CONFIGS[selectedBlockType];
    let body;

    if (selectedBlockType === 'rolled') {
        body = Bodies.circle(x, y, conf.r, {
            density: conf.density,
            friction: conf.friction,
            restitution: conf.restitution,
            label: 'block',
            plugin: { blockType: selectedBlockType }
        });
    } else {
        body = Bodies.rectangle(x, y, conf.w, conf.h, {
            density: conf.density,
            friction: conf.friction,
            restitution: conf.restitution,
            label: 'block',
            plugin: { blockType: selectedBlockType }
        });
    }

    World.add(buildWorld, body);
    buildBlocks.push(body);

    blocksCountSpan.innerText = buildBlocks.length;
    readyBtn.disabled = buildBlocks.length !== maxBlocks;
    showStatusText(`Stacked ${buildBlocks.length} / ${maxBlocks} blocks.`);
}

function undoLastBlock() {
    if (buildBlocks.length === 0) return;
    const { World } = window.Matter;
    const last = buildBlocks.pop();
    World.remove(buildWorld, last);

    blocksCountSpan.innerText = buildBlocks.length;
    readyBtn.disabled = buildBlocks.length !== maxBlocks;
    showStatusText(`Undone. Stacked ${buildBlocks.length} / ${maxBlocks} blocks.`);
}

function clearBuildTower() {
    const { World } = window.Matter;
    buildBlocks.forEach(b => World.remove(buildWorld, b));
    buildBlocks = [];

    blocksCountSpan.innerText = buildBlocks.length;
    readyBtn.disabled = true;
    showStatusText("Cleared construction board.");
}

function renderBuildLoop() {
    if (!gameScreen.classList.contains('active') || shootPhaseDiv.style.display === 'flex') {
        // Stop building render loop if not in building phase
        return;
    }

    const ctx = buildCanvas.getContext('2d');
    ctx.clearRect(0, 0, buildCanvas.width, buildCanvas.height);

    // 1. Draw decorative tiled bathroom wall background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, buildCanvas.width, buildCanvas.height);
    
    // Draw tiles pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    const tileSize = 40;
    for (let x = 0; x < buildCanvas.width; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, buildCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < buildCanvas.height; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(buildCanvas.width, y); ctx.stroke();
    }

    // Draw Construction Zone limits overlay
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(150, 40, 300, 340);
    ctx.setLineDash([]);

    // 2. Draw ground platform (Bathroom marble shelf)
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 0, 380, 600, 20, 4);
    ctx.fill();
    ctx.stroke();

    // 3. Draw blocks with towel textures
    buildBlocks.forEach(body => {
        const type = body.plugin.blockType;
        const conf = BLOCK_CONFIGS[type];
        const pos = body.position;
        const angle = body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        drawTowelBlock(ctx, type, conf);

        ctx.restore();
    });

    requestAnimationFrame(renderBuildLoop);
}

// Draw customized towel blocks
function drawTowelBlock(ctx, type, conf) {
    if (type === 'bath') {
        ctx.fillStyle = '#3b82f6'; // Deep Blue
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -conf.w/2, -conf.h/2, conf.w, conf.h, 6);
        ctx.fill();
        ctx.stroke();

        // Towel folds / stripes
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-conf.w/2 + 10, -conf.h/4); ctx.lineTo(conf.w/2 - 10, -conf.h/4);
        ctx.moveTo(-conf.w/2 + 10, conf.h/4); ctx.lineTo(conf.w/2 - 10, conf.h/4);
        ctx.stroke();

        // Fringe details on sides
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 1.5;
        for (let i = -conf.h/2 + 4; i <= conf.h/2 - 4; i += 5) {
            ctx.beginPath(); ctx.moveTo(-conf.w/2, i); ctx.lineTo(-conf.w/2 - 4, i); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(conf.w/2, i); ctx.lineTo(conf.w/2 + 4, i); ctx.stroke();
        }
    } else if (type === 'beach') {
        ctx.fillStyle = '#10b981'; // Green
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -conf.w/2, -conf.h/2, conf.w, conf.h, 8);
        ctx.fill();
        ctx.stroke();

        // Red & Yellow Stripes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-conf.w/4 - 6, -conf.h/2 + 2, 12, conf.h - 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(conf.w/4 - 6, -conf.h/2 + 2, 12, conf.h - 4);

        // Border stripes
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.5;
        for (let i = -conf.h/2 + 4; i <= conf.h/2 - 4; i += 6) {
            ctx.beginPath(); ctx.moveTo(-conf.w/2, i); ctx.lineTo(-conf.w/2 - 5, i); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(conf.w/2, i); ctx.lineTo(conf.w/2 + 5, i); ctx.stroke();
        }
    } else if (type === 'hand') {
        ctx.fillStyle = '#ec4899'; // Hot Pink
        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 2.5;
        drawRoundedRect(ctx, -conf.w/2, -conf.h/2, conf.w, conf.h, 4);
        ctx.fill();
        ctx.stroke();

        // Print emoji flower in center
        ctx.fillStyle = '#fbcfe8';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌸', 0, 0);
    } else if (type === 'rolled') {
        ctx.fillStyle = '#f59e0b'; // Amber / Yellow
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, conf.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Towel spiral pattern
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let theta = 0; theta < Math.PI * 4; theta += 0.1) {
            let r = (theta / (Math.PI * 4)) * (conf.r - 3);
            let sx = r * Math.cos(theta);
            let sy = r * Math.sin(theta);
            if (theta === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
    }
}

// ── TRANSITION FROM BUILDING TO COMBAT ────────────────────────────────────────

function finishStacking() {
    // Collect the stabilized block layouts
    // RelX and RelY relative to shelf center (300, 380)
    const towerLayout = buildBlocks.map(body => {
        return {
            type: body.plugin.blockType,
            relX: body.position.x - 300,
            relY: body.position.y - 380,
            angle: body.angle
        };
    });

    if (gameMode === 'local') {
        if (activeBuilder === 1) {
            p1Tower = towerLayout;
            activeBuilder = 2;
            clearBuildTower();
            initBuildPhysics();
            buildTitle.innerText = "Player 2: Build Your Towel Tower!";
            buildDesc.innerHTML = "Select towel blocks and stack them in your zone. Keep it stable! (<span id='towel-blocks-count'>0</span> / 8 blocks)";
            blocksCountSpan.innerText = "0";
            readyBtn.disabled = true;
            showStatusText("Player 1 finished. Now Player 2's turn to build.");
        } else {
            p2Tower = towerLayout;
            showStatusText("Both towers built. Preparing combat arena!");
            setTimeout(startLocalCombat, 800);
        }
    } else {
        // Online Stacking Submission
        submitOnlineTower(towerLayout);
    }
}

// ── COMBAT PHASE LOGIC ────────────────────────────────────────────────────────

function initCombatPhysics() {
    const { Engine, World, Bodies, Runner } = window.Matter;

    if (combatEngine) {
        Engine.clear(combatEngine);
    }

    combatEngine = Engine.create();
    combatWorld = combatEngine.world;
    combatWorld.gravity.y = 0.85;

    // Platform 1 (Left Shelf): X=200, Y=450, W=300, H=40
    groundLeft = Bodies.rectangle(200, 450, 280, 40, { 
        isStatic: true, 
        friction: 0.9, 
        label: 'shelf_left' 
    });

    // Platform 2 (Right Shelf): X=800, Y=450, W=300, H=40
    groundRight = Bodies.rectangle(800, 450, 280, 40, { 
        isStatic: true, 
        friction: 0.9, 
        label: 'shelf_right' 
    });

    // Glass Shower partition in middle: X=500, Y=330, W=20, H=280
    showerWall = Bodies.rectangle(500, 335, 20, 270, { 
        isStatic: true, 
        label: 'divider' 
    });

    // Water level sensor at bottom: triggers block destruction
    waterSensor = Bodies.rectangle(500, 515, 1200, 30, {
        isStatic: true,
        isSensor: true,
        label: 'water'
    });

    World.add(combatWorld, [groundLeft, groundRight, showerWall, waterSensor]);

    p1Bodies = [];
    p2Bodies = [];

    // Spawn Player 1's Tower on groundLeft
    p1Tower.forEach(tmpl => {
        const conf = BLOCK_CONFIGS[tmpl.type];
        const sx = 200 + tmpl.relX;
        const sy = 430 + tmpl.relY; // Spawn relative to the shelf top
        let body;
        
        if (tmpl.type === 'rolled') {
            body = Bodies.circle(sx, sy, conf.r, {
                density: conf.density, friction: conf.friction, restitution: conf.restitution,
                label: 'block', plugin: { blockType: tmpl.type, owner: 1 }
            });
        } else {
            body = Bodies.rectangle(sx, sy, conf.w, conf.h, {
                density: conf.density, friction: conf.friction, restitution: conf.restitution,
                label: 'block', plugin: { blockType: tmpl.type, owner: 1 }
            });
        }
        Body.setAngle(body, tmpl.angle);
        World.add(combatWorld, body);
        p1Bodies.push(body);
    });

    // Spawn Player 2's Tower on groundRight
    p2Tower.forEach(tmpl => {
        const conf = BLOCK_CONFIGS[tmpl.type];
        const sx = 800 + tmpl.relX;
        const sy = 430 + tmpl.relY;
        let body;
        
        if (tmpl.type === 'rolled') {
            body = Bodies.circle(sx, sy, conf.r, {
                density: conf.density, friction: conf.friction, restitution: conf.restitution,
                label: 'block', plugin: { blockType: tmpl.type, owner: 2 }
            });
        } else {
            body = Bodies.rectangle(sx, sy, conf.w, conf.h, {
                density: conf.density, friction: conf.friction, restitution: conf.restitution,
                label: 'block', plugin: { blockType: tmpl.type, owner: 2 }
            });
        }
        Body.setAngle(body, tmpl.angle);
        World.add(combatWorld, body);
        p2Bodies.push(body);
    });

    particles = [];

    // Setup collision listener for screen shakes & particles
    window.Matter.Events.on(combatEngine, 'collisionStart', handleCollisions);

    if (combatRunner) {
        Runner.stop(combatRunner);
    }
    combatRunner = Runner.create();
    Runner.run(combatRunner, combatEngine);

    // Initial setup of slingshot projectile
    resetCombatProjectile();

    // Start render loop
    requestAnimationFrame(renderCombatLoop);
}

function resetCombatProjectile() {
    const { World, Bodies } = window.Matter;
    
    if (combatProjectile) {
        World.remove(combatWorld, combatProjectile);
        combatProjectile = null;
    }

    // Determine position based on active turn
    // P1 slingshot center at X=80, Y=350. P2 slingshot center at X=920, Y=350.
    const isP1 = currentTurn === (gameMode === 'local' ? 'p1' : playerId);
    const startX = isP1 ? 80 : 920;
    const startY = 350;

    slingshotState.startX = startX;
    slingshotState.startY = startY;
    slingshotState.currentX = startX;
    slingshotState.currentY = startY;
    slingshotState.active = true;

    const conf = PROJ_CONFIGS[selectedProjType];

    // Projectile body is created inside the world only after release
    // Until then, it is drawn statically at slingshot coordinates
}

// Handle Matter.js physics collisions to spawn sparks / water splashes
function handleCollisions(event) {
    const pairs = event.pairs;
    pairs.forEach(pair => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if hitting water sensor
        if (bodyA === waterSensor || bodyB === waterSensor) {
            const blockBody = bodyA === waterSensor ? bodyB : bodyA;
            if (blockBody.label === 'block') {
                spawnSplash(blockBody.position.x, blockBody.position.y);
            }
            return;
        }

        // Particle generation on collision
        if (pair.collision.depth > 1.5) {
            const contacts = pair.activeContacts;
            if (contacts && contacts.length > 0) {
                const contact = contacts[0];
                spawnImpactParticles(contact.vertex.x, contact.vertex.y);
            }
        }

        // Ducky Explosion Check
        if (bodyA.label === 'projectile' || bodyB.label === 'projectile') {
            const projBody = bodyA.label === 'projectile' ? bodyA : bodyB;
            if (projBody.plugin && projBody.plugin.type === 'duck' && !projBody.plugin.exploded) {
                projBody.plugin.exploded = true;
                triggerDuckyExplosion(projBody.position.x, projBody.position.y);
            }
        }
    });
}

// Spawn water bubbles/splash particles
function spawnSplash(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: 490,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 6 - 2,
            radius: Math.random() * 5 + 3,
            color: 'rgba(56, 189, 248, 0.8)',
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015,
            isSplash: true
        });
    }
}

// Spawn dry dust particles on Jenga blocks collisions
function spawnImpactParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: Math.random() * 3 + 1,
            color: 'rgba(255, 255, 255, 0.4)',
            alpha: 0.8,
            decay: 0.03
        });
    }
}

// Exploding ducky shoots outwards shockwave forces on nearby rigid bodies
function triggerDuckyExplosion(ex, ey) {
    const { Composite, Body, Vector } = window.Matter;
    
    // Blast visual particles (bubbles, sparkles!)
    for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 4;
        particles.push({
            x: ex,
            y: ey,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 6 + 3,
            color: i % 2 === 0 ? 'rgba(254, 240, 138, 0.9)' : 'rgba(249, 115, 22, 0.9)', // Yellow/Orange
            alpha: 1,
            decay: 0.025
        });
    }

    // Apply radial force to all non-static bodies in range
    const bodies = Composite.allBodies(combatWorld);
    const explosionRadius = 160;
    const forceMagnitude = 0.08;

    bodies.forEach(body => {
        if (body.isStatic || body.label === 'projectile') return;

        const distance = Vector.magnitude(Vector.sub(body.position, { x: ex, y: ey }));
        if (distance < explosionRadius) {
            // Direction vector from explosion to body center
            const dir = Vector.normalise(Vector.sub(body.position, { x: ex, y: ey }));
            // Dropoff force with distance
            const factor = (explosionRadius - distance) / explosionRadius;
            const force = Vector.mult(dir, forceMagnitude * factor * body.mass);
            Body.applyForce(body, body.position, force);
        }
    });

    showStatusText("💥 BOOM! Rubber Ducky exploded!");
}

// Calculate base integrity for both players
function updateBaseIntegrity() {
    // Integrity is based on how many blocks of each player are still "alive" on their side platform
    // Player 1 platform bounds: X in [50, 350], height Y < 440
    // Player 2 platform bounds: X in [650, 950], height Y < 440
    let p1Alive = 0;
    p1Bodies.forEach(body => {
        const x = body.position.x;
        const y = body.position.y;
        if (x >= 40 && x <= 360 && y < 440) {
            p1Alive++;
        }
    });

    let p2Alive = 0;
    p2Bodies.forEach(body => {
        const x = body.position.x;
        const y = body.position.y;
        if (x >= 640 && x <= 960 && y < 440) {
            p2Alive++;
        }
    });

    // Calculate percentage
    const p1Percent = Math.round((p1Alive / maxBlocks) * 100);
    const p2Percent = Math.round((p2Alive / maxBlocks) * 100);

    p1Stability = p1Percent;
    p2Stability = p2Percent;

    // Update UI
    hudP1Int.innerText = `${p1Percent}% Stable`;
    barP1.style.width = `${p1Percent}%`;

    hudP2Int.innerText = `${p2Percent}% Stable`;
    barP2.style.width = `${p2Percent}%`;

    // Visual indicators: damage color changes
    barP1.style.background = p1Percent < 35 ? 'var(--danger)' : p1Percent < 65 ? 'var(--warning)' : 'var(--primary)';
    barP2.style.background = p2Percent < 35 ? 'var(--danger)' : p2Percent < 65 ? 'var(--warning)' : 'var(--secondary)';
}

// Check for game-over state
function checkGameStatus() {
    if (p1Stability <= 0 || p2Stability <= 0) {
        endGame();
    }
}

function endGame() {
    let winnerName = '';
    
    if (p1Stability === p2Stability) {
        winnerName = "It's a Draw! Both towers are equally damaged.";
        declareWinner('draw');
    } else if (p1Stability < p2Stability) {
        winnerName = gameMode === 'local' ? '🏆 Player 2 Wins!' : (currentTurn === playerId ? 'Opponent Wins!' : '🏆 You Win!');
        declareWinner(gameMode === 'local' ? 'p2' : (players[playerId]?.name || 'Player 2'));
    } else {
        winnerName = gameMode === 'local' ? '🏆 Player 1 Wins!' : (currentTurn === playerId ? '🏆 You Win!' : 'Opponent Wins!');
        declareWinner(gameMode === 'local' ? 'p1' : (players[playerId]?.name || 'Player 1'));
    }

    showStatusText(`Game Ended! ${winnerName}`);
}

// Draw combat canvas loop
function renderCombatLoop() {
    if (!gameScreen.classList.contains('active') || buildPhaseDiv.style.display === 'flex') {
        return;
    }

    const ctx = combatCanvas.getContext('2d');
    ctx.clearRect(0, 0, combatCanvas.width, combatCanvas.height);

    // 1. Draw tiled background (Bathroom wall)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, combatCanvas.width, combatCanvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 1;
    const tileSize = 50;
    for (let x = 0; x < combatCanvas.width; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, combatCanvas.height); ctx.stroke();
    }
    for (let y = 0; y < combatCanvas.height; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(combatCanvas.width, y); ctx.stroke();
    }

    // 2. Draw Soap shelves / Grounds
    // Shelf Left: X=200, Y=450, W=280, H=40
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, 60, 430, 280, 40, 8);
    ctx.fill();
    ctx.stroke();

    // Shelf Right: X=800, Y=450, W=280, H=40
    drawRoundedRect(ctx, 660, 430, 280, 40, 8);
    ctx.fill();
    ctx.stroke();

    // 3. Draw Shower partition wall
    // X=500, Y=335, W=20, H=270
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)'; // Glass shader
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 490, 200, 20, 270, 6);
    ctx.fill();
    ctx.stroke();
    // Glass shine stripe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(495, 210); ctx.lineTo(495, 460);
    ctx.stroke();

    // 4. Draw Bath Water at the bottom
    // We animate a small sine wave for the water!
    const time = Date.now() * 0.003;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    for (let x = 0; x <= combatCanvas.width; x += 20) {
        let waveY = 480 + Math.sin(x * 0.02 + time) * 5;
        ctx.lineTo(x, waveY);
    }
    ctx.lineTo(combatCanvas.width, combatCanvas.height);
    ctx.lineTo(0, combatCanvas.height);
    ctx.closePath();
    ctx.fill();

    // Draw Water bubbles
    if (Math.random() < 0.1) {
        particles.push({
            x: Math.random() * combatCanvas.width,
            y: 500,
            vx: (Math.random() - 0.5) * 1,
            vy: -Math.random() * 2 - 0.5,
            radius: Math.random() * 3 + 1,
            color: 'rgba(255, 255, 255, 0.3)',
            alpha: 0.6,
            decay: 0.01
        });
    }

    // 5. Draw active launchers / slingshots
    drawSlingshot(ctx, 80, 350, true);
    drawSlingshot(ctx, 920, 350, false);

    // 6. Draw Slingshot bands & Projectiles during dragging
    const isP1 = currentTurn === (gameMode === 'local' ? 'p1' : playerId);
    if (slingshotState.active && isP1) {
        const startX = slingshotState.startX;
        const startY = slingshotState.startY;
        
        if (slingshotState.isDragging) {
            const dragX = slingshotState.currentX;
            const dragY = slingshotState.currentY;

            // Draw back band
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(startX - 10, startY - 8);
            ctx.lineTo(dragX, dragY);
            ctx.moveTo(startX + 10, startY - 8);
            ctx.lineTo(dragX, dragY);
            ctx.stroke();

            // Draw Aiming trajectory dots
            drawTrajectory(ctx, startX, startY, dragX, dragY);

            // Draw the projectile in hands
            ctx.save();
            ctx.translate(dragX, dragY);
            drawProjectileGraphic(ctx, selectedProjType, false);
            ctx.restore();
        } else {
            // Idle projectile inside slingshot
            ctx.save();
            ctx.translate(startX, startY);
            drawProjectileGraphic(ctx, selectedProjType, false);
            ctx.restore();
        }
    }

    // 7. Draw rigid blocks
    [...p1Bodies, ...p2Bodies].forEach(body => {
        const type = body.plugin.blockType;
        const conf = BLOCK_CONFIGS[type];
        const pos = body.position;
        const angle = body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        drawTowelBlock(ctx, type, conf);

        ctx.restore();
    });

    // 8. Draw active shot projectile body flying
    if (combatProjectile) {
        const pos = combatProjectile.position;
        const angle = combatProjectile.angle;
        const type = combatProjectile.plugin.type;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        drawProjectileGraphic(ctx, type, combatProjectile.plugin.exploded);

        ctx.restore();

        // Check if projectile is dead (fell below water or stopped)
        const vel = combatProjectile.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        
        if (pos.y > 510) {
            // Splash and destroy
            spawnSplash(pos.x, pos.y);
            destroyCombatProjectile();
        } else if (speed < 0.12 && pos.y > 400 && !slingshotState.isDragging) {
            // Projectile settled, destroy it
            destroyCombatProjectile();
        }
    }

    // 9. Draw visual particles
    renderParticles(ctx);

    // 10. Integrity Updates
    updateBaseIntegrity();

    // 11. Check if everything came to rest during physics simulations
    checkRestingState();

    requestAnimationFrame(renderCombatLoop);
}

// Draw slingshot fork
function drawSlingshot(ctx, sx, sy, isP1) {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle = '#64748b';
    ctx.lineWidth = 5;

    // Y Fork (representing a cool metallic bathroom hook)
    ctx.beginPath();
    ctx.moveTo(sx, sy + 60);
    ctx.lineTo(sx, sy + 15);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, 12, 0, Math.PI, true);
    ctx.stroke();

    // Small hooks
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(sx - 10, sy - 8, 3, 0, Math.PI * 2);
    ctx.arc(sx + 10, sy - 8, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw trajectories dots like Angry Birds
function drawTrajectory(ctx, startX, startY, dragX, dragY) {
    const pullX = startX - dragX;
    const pullY = startY - dragY;
    const vx = pullX * 0.12;
    const vy = pullY * 0.12;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.7)'; // Cyan trajectory dots
    let px = startX;
    let py = startY;
    let velX = vx;
    let velY = vy;
    const steps = 25;

    for (let i = 0; i < steps; i++) {
        ctx.beginPath();
        ctx.arc(px, py, 3.5 - (i / steps) * 2, 0, Math.PI * 2);
        ctx.fill();

        velY += 0.85; // Gravity acceleration
        px += velX;
        py += velY;

        // Clip drawing if it goes below water line
        if (py > 480) break;
    }
}

// Draw different projectile models
function drawProjectileGraphic(ctx, type, exploded) {
    if (exploded) return; // Hide if exploded

    const conf = PROJ_CONFIGS[type];

    if (type === 'sponge') {
        ctx.fillStyle = conf.color;
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, conf.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sponge pores texture
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(4, 5, 2, 0, Math.PI * 2);
        ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(-3, 6, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'soap') {
        ctx.fillStyle = conf.color;
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2.5;
        drawRoundedRect(ctx, -conf.w/2, -conf.h/2, conf.w, conf.h, 5);
        ctx.fill();
        ctx.stroke();

        // shine line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-conf.w/4, -conf.h/4, 3, Math.PI, Math.PI * 1.5);
        ctx.stroke();
    } else if (type === 'duck') {
        // Yellow Circle Base
        ctx.fillStyle = conf.color;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, conf.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Duck wing
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(-3, 2, 7, 4, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = conf.color;
        ctx.beginPath();
        ctx.arc(7, -10, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Beak
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(15, -12);
        ctx.lineTo(21, -10);
        ctx.lineTo(15, -8);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, -12, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle rendering updates
function renderParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        
        if (p.isSplash) {
            p.vy += 0.25; // Splash gravity
        }
        
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.radius <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Destroy projectile once it lands/stops
function destroyCombatProjectile() {
    if (combatProjectile) {
        window.Matter.World.remove(combatWorld, combatProjectile);
        combatProjectile = null;
    }
}

// ── TURN TRANSITIONS & DRAG EVENTS ───────────────────────────────────────────

let physicsWaiting = false; // Waiting for blocks to stop moving before changing turn

function checkRestingState() {
    if (slingshotState.isDragging || combatProjectile || !physicsWaiting) return;

    // Check if any block body is moving
    const bodies = [...p1Bodies, ...p2Bodies];
    let allResting = true;

    bodies.forEach(body => {
        const speed = body.speed;
        if (speed > 0.08) {
            allResting = false;
        }
    });

    if (allResting) {
        physicsWaiting = false;
        
        // Update integrity and proceed to next turn or end game
        updateBaseIntegrity();
        checkGameStatus();

        if (p1Stability > 0 && p2Stability > 0) {
            toggleTurn();
        }
    }
}

function toggleTurn() {
    if (gameMode === 'local') {
        currentTurn = currentTurn === 'p1' ? 'p2' : 'p1';
        const displayTurn = currentTurn === 'p1' ? "Player 1's Turn" : "Player 2's Turn";
        turnIndicator.innerText = displayTurn;
        turnIndicator.style.color = currentTurn === 'p1' ? 'var(--accent)' : 'var(--secondary)';
        
        resetCombatProjectile();
        showStatusText(`${displayTurn} to shoot.`);
    } else {
        // Online: active player uploads state to database
        const isMyTurn = currentTurn === playerId;
        if (isMyTurn) {
            syncRestingStateOnline();
        }
    }
}

// Handles starting drag on slingshot
function handleCombatMouseDown(e) {
    if (!slingshotState.active) return;
    const isP1 = currentTurn === (gameMode === 'local' ? 'p1' : playerId);
    if (!isP1 && gameMode === 'online') return; // Cannot play during opponent's turn

    const rect = combatCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - slingshotState.startX;
    const dy = my - slingshotState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 35) {
        slingshotState.isDragging = true;
        slingshotState.currentX = mx;
        slingshotState.currentY = my;
    }
}

function handleCombatMouseMove(e) {
    if (!slingshotState.isDragging) return;
    const rect = combatCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - slingshotState.startX;
    const dy = my - slingshotState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= slingshotState.maxPull) {
        slingshotState.currentX = mx;
        slingshotState.currentY = my;
    } else {
        const angle = Math.atan2(dy, dx);
        slingshotState.currentX = slingshotState.startX + Math.cos(angle) * slingshotState.maxPull;
        slingshotState.currentY = slingshotState.startY + Math.sin(angle) * slingshotState.maxPull;
    }
}

function handleCombatMouseUp() {
    if (!slingshotState.isDragging) return;
    slingshotState.isDragging = false;
    slingshotState.active = false;

    // Fire Projectile!
    const pullX = slingshotState.startX - slingshotState.currentX;
    const pullY = slingshotState.startY - slingshotState.currentY;
    const vx = pullX * 0.12;
    const vy = pullY * 0.12;

    fireProjectile(vx, vy);
}

// Touch controls mappings
function handleCombatTouchStart(e) {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = combatCanvas.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;

    const dx = mx - slingshotState.startX;
    const dy = my - slingshotState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 35) {
        e.preventDefault();
        slingshotState.isDragging = true;
        slingshotState.currentX = mx;
        slingshotState.currentY = my;
    }
}

function handleCombatTouchMove(e) {
    if (!slingshotState.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = combatCanvas.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;

    const dx = mx - slingshotState.startX;
    const dy = my - slingshotState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= slingshotState.maxPull) {
        slingshotState.currentX = mx;
        slingshotState.currentY = my;
    } else {
        const angle = Math.atan2(dy, dx);
        slingshotState.currentX = slingshotState.startX + Math.cos(angle) * slingshotState.maxPull;
        slingshotState.currentY = slingshotState.startY + Math.sin(angle) * slingshotState.maxPull;
    }
}

function handleCombatTouchEnd(e) {
    if (slingshotState.isDragging) {
        e.preventDefault();
        slingshotState.isDragging = false;
        slingshotState.active = false;

        const pullX = slingshotState.startX - slingshotState.currentX;
        const pullY = slingshotState.startY - slingshotState.currentY;
        const vx = pullX * 0.12;
        const vy = pullY * 0.12;

        fireProjectile(vx, vy);
    }
}

function fireProjectile(vx, vy) {
    const { World, Bodies } = window.Matter;
    
    // Spawn projectile in world
    const conf = PROJ_CONFIGS[selectedProjType];
    const sx = slingshotState.startX;
    const sy = slingshotState.startY;

    if (selectedProjType === 'soap') {
        combatProjectile = Bodies.rectangle(sx, sy, conf.w, conf.h, {
            density: conf.density, friction: conf.friction, restitution: conf.restitution,
            label: 'projectile', plugin: { type: selectedProjType }
        });
    } else {
        combatProjectile = Bodies.circle(sx, sy, conf.r, {
            density: conf.density, friction: conf.friction, restitution: conf.restitution,
            label: 'projectile', plugin: { type: selectedProjType }
        });
    }

    World.add(combatWorld, combatProjectile);
    
    // Apply shot force
    window.Matter.Body.setVelocity(combatProjectile, { x: vx, y: vy });

    physicsWaiting = true;
    showStatusText("🚀 Projectile launched! Simulating physics...");

    if (gameMode === 'online') {
        const isMyTurn = currentTurn === playerId;
        if (isMyTurn) {
            submitOnlineShot(vx, vy, selectedProjType);
        }
    }
}

// ── LOCAL GAME LAUNCHERS ─────────────────────────────────────────────────────

function startLocalGame() {
    gameMode = 'local';
    roomName = '';
    playerId = 'p1';
    opponentId = 'p2';
    
    // Show screens
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // UI state setup
    buildPhaseDiv.style.display = 'flex';
    shootPhaseDiv.style.display = 'none';

    activeBuilder = 1;
    buildTitle.innerText = "Player 1: Build Your Towel Tower!";
    blocksCountSpan.innerText = "0";
    readyBtn.disabled = true;

    initBuildPhysics();
    showStatusText("Local 2-Player game started! Stack your towels.");
}

function startLocalCombat() {
    buildPhaseDiv.style.display = 'none';
    shootPhaseDiv.style.display = 'flex';

    hudP1Name.innerText = "Player 1 (Left)";
    hudP2Name.innerText = "Player 2 (Right)";
    turnIndicator.innerText = "Player 1's Turn";
    currentTurn = 'p1';

    initCombatPhysics();
}

// ── ONLINE FIREBASE MATCHMAKING ──────────────────────────────────────────────

async function joinOnlineRoom() {
    roomName = roomInput.value.trim().toLowerCase();
    playerName = nameInput.value.trim();

    if (!roomName || !playerName) {
        alert('Please enter both Room Name and Player Name.');
        return;
    }

    gameMode = 'online';
    localStorage.setItem('towel_playerName', playerName);

    playerId = generatePlayerId();

    joinSection.style.display = 'none';
    lobbySection.style.display = 'block';

    const playerRoomRef = ref(database, `game/towel/rooms/${roomName}/players/${playerId}`);
    await set(playerRoomRef, {
        id: playerId,
        name: playerName,
        joinedAt: Date.now(),
        ready: false,
        tower: null
    });

    onDisconnect(playerRoomRef).remove();

    // Check if room is empty to set initial statuses
    const currentPlayersSnap = await get(ref(database, `game/towel/rooms/${roomName}/players`));
    const count = currentPlayersSnap.exists() ? Object.keys(currentPlayersSnap.val()).length : 0;
    
    if (count <= 1) {
        await update(ref(database, `game/towel/rooms/${roomName}`), {
            status: 'waiting',
            currentTurn: null,
            shot: null,
            restingState: null,
            winner: null
        });
    }

    subscribeToOnlineRoom();
}

function subscribeToOnlineRoom() {
    const roomRef = ref(database, `game/towel/rooms/${roomName}`);
    
    unsubscribeRoom = onValue(roomRef, (snap) => {
        const data = snap.val();
        if (!data) return;

        players = data.players || {};
        const pIds = Object.keys(players);

        // Update lobby list
        updateOnlineLobbyUI();

        // Match opponents ID
        opponentId = pIds.find(id => id !== playerId) || '';

        // Start button visibility for host (first player joined)
        const hostId = pIds.sort()[0];
        if (playerId === hostId && pIds.length === 2 && data.status === 'waiting') {
            startBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'none';
        }

        // Handle states transitions
        if (data.status === 'building') {
            handleOnlineBuildingPhase();
        } else if (data.status === 'playing') {
            handleOnlinePlayingPhase(data);
        } else if (data.status === 'ended') {
            handleOnlineEndedPhase(data);
        }
    });
}

function updateOnlineLobbyUI() {
    playersList.innerHTML = '';
    Object.values(players).forEach(p => {
        const row = document.createElement('div');
        row.className = 'towel-player-row';
        row.innerHTML = `
            <span class="name">${p.name} ${p.id === playerId ? '(You)' : ''}</span>
            <span class="status ${p.ready ? 'ready' : 'waiting'}">${p.ready ? 'Ready' : 'Stacking...'}</span>
        `;
        playersList.appendChild(row);
    });
}

async function startOnlineGame() {
    await update(ref(database, `game/towel/rooms/${roomName}`), {
        status: 'building'
    });
}

function handleOnlineBuildingPhase() {
    lobbyScreen.classList.remove('active');
    gameScreen.classList.add('active');

    buildPhaseDiv.style.display = 'flex';
    shootPhaseDiv.style.display = 'none';

    buildTitle.innerText = "Build Your Towel Tower!";
    buildDesc.innerHTML = "Select towel blocks and stack them in your zone. Once both are ready, combat begins!";

    if (!buildEngine) {
        initBuildPhysics();
    }
}

async function submitOnlineTower(towerLayout) {
    // Upload tower data and set ready status
    await update(ref(database, `game/towel/rooms/${roomName}/players/${playerId}`), {
        ready: true,
        tower: towerLayout
    });

    readyBtn.disabled = true;
    readyBtn.innerText = "Waiting for opponent...";
    undoBtn.disabled = true;
    clearBtn.disabled = true;
    showStatusText("Tower uploaded! Waiting for opponent to finish stacking.");

    // Host checks if both players ready to trigger battle
    const pIds = Object.keys(players);
    const hostId = pIds.sort()[0];
    if (playerId === hostId) {
        // Listen once to verify
        const snap = await get(ref(database, `game/towel/rooms/${roomName}/players`));
        const currentP = snap.val() || {};
        const readyCount = Object.values(currentP).filter(p => p.ready).length;
        if (readyCount === 2) {
            // Trigger combat phase
            await update(ref(database, `game/towel/rooms/${roomName}`), {
                status: 'playing',
                currentTurn: hostId
            });
        }
    }
}

// Setup Online Combat layout
function handleOnlinePlayingPhase(roomData) {
    if (buildPhaseDiv.style.display === 'none' && combatEngine) {
        // We are already inside combat! Sync other states (Turn / Shot / Resting)
        syncOnlineCombatState(roomData);
        return;
    }

    // Move from building to combat
    buildPhaseDiv.style.display = 'none';
    shootPhaseDiv.style.display = 'flex';

    // Set player names in HUD
    const pIds = Object.keys(players);
    const hostId = pIds.sort()[0];
    const guestId = pIds.find(id => id !== hostId);

    // Host is on left side (P1), Guest on right side (P2)
    p1Tower = players[hostId]?.tower || [];
    p2Tower = players[guestId]?.tower || [];

    hudP1Name.innerText = players[hostId]?.name || 'P1';
    hudP2Name.innerText = players[guestId]?.name || 'P2';

    // Set colors
    hudP1Name.style.color = 'var(--primary-light)';
    hudP2Name.style.color = 'var(--secondary)';

    currentTurn = roomData.currentTurn;

    initCombatPhysics();
}

function syncOnlineCombatState(roomData) {
    // 1. Turn indicator
    currentTurn = roomData.currentTurn;
    const activePlayerName = players[currentTurn]?.name || 'Opponent';
    
    if (currentTurn === playerId) {
        turnIndicator.innerText = "🏆 Your Turn!";
        turnIndicator.style.color = 'var(--accent)';
        shotPrompt.innerText = "Drag from slingshot to shoot";
    } else {
        turnIndicator.innerText = `${activePlayerName}'s Turn`;
        turnIndicator.style.color = 'var(--text-secondary)';
        shotPrompt.innerText = "Waiting for opponent's shot...";
    }

    // 2. Projectiles shot sync
    if (roomData.shot && currentTurn !== playerId) {
        // Trigger opponent shot rendering locally
        const shot = roomData.shot;
        // Verify we haven't fired this shot already
        if (!combatProjectile && slingshotState.active) {
            slingshotState.active = false;
            fireProjectile(shot.vx, shot.vy);
            showStatusText(`Opponent fired a ${shot.ballType}!`);
        }
    }

    // 3. restingState sync (self-correcting drift positions)
    if (roomData.restingState && currentTurn === playerId) {
        applyOnlineRestingState(roomData.restingState);
    }
}

async function submitOnlineShot(vx, vy, type) {
    await update(ref(database, `game/towel/rooms/${roomName}`), {
        shot: { vx, vy, ballType: type, timestamp: Date.now() }
    });
}

// Upload final rest positions of blocks at turn end
async function syncRestingStateOnline() {
    const pIds = Object.keys(players);
    const hostId = pIds.sort()[0];
    const guestId = pIds.find(id => id !== hostId);

    // Export current coordinates of both towers
    const p1State = p1Bodies.map(body => ({
        x: body.position.x, y: body.position.y, angle: body.angle
    }));

    const p2State = p2Bodies.map(body => ({
        x: body.position.x, y: body.position.y, angle: body.angle
    }));

    // Check if anyone lost all blocks to declare winner
    let winner = null;
    if (p1Stability <= 0 && p2Stability <= 0) {
        winner = 'draw';
    } else if (p1Stability <= 0) {
        winner = guestId; // P2 wins
    } else if (p2Stability <= 0) {
        winner = hostId; // P1 wins
    }

    const updates = {
        shot: null,
        currentTurn: opponentId,
        restingState: { p1State, p2State, timestamp: Date.now() }
    };

    if (winner) {
        updates.status = 'ended';
        updates.winner = winner;
    }

    await update(ref(database, `game/towel/rooms/${roomName}`), { ...updates });
    resetCombatProjectile();
}

function applyOnlineRestingState(state) {
    const { Body } = window.Matter;

    // Snapping P1 bodies
    if (state.p1State) {
        state.p1State.forEach((s, idx) => {
            const body = p1Bodies[idx];
            if (body) {
                Body.setPosition(body, { x: s.x, y: s.y });
                Body.setAngle(body, s.angle);
                Body.setVelocity(body, { x: 0, y: 0 });
                Body.setAngularVelocity(body, 0);
            }
        });
    }

    // Snapping P2 bodies
    if (state.p2State) {
        state.p2State.forEach((s, idx) => {
            const body = p2Bodies[idx];
            if (body) {
                Body.setPosition(body, { x: s.x, y: s.y });
                Body.setAngle(body, s.angle);
                Body.setVelocity(body, { x: 0, y: 0 });
                Body.setAngularVelocity(body, 0);
            }
        });
    }

    // Clear active projectile
    destroyCombatProjectile();
    resetCombatProjectile();
}

function handleOnlineEndedPhase(roomData) {
    const winnerId = roomData.winner;
    let text = '';
    
    if (winnerId === 'draw') {
        text = "It's a Draw! Both towel towers are completely ruined.";
    } else if (winnerId === playerId) {
        text = "🏆 Victory! You have successfully toppled the opponent's tower!";
    } else {
        const oppName = players[winnerId]?.name || 'Opponent';
        text = `💀 Defeat! ${oppName} has demolished your towel base.`;
    }

    showGameOverModal(text);
}

// ── UTILITIES & MODALS ───────────────────────────────────────────────────────

function declareWinner(w) {
    let message = '';
    if (w === 'draw') {
        message = "Draw Match! Stacks are equally destroyed.";
    } else if (gameMode === 'local') {
        message = w === 'p1' ? "🏆 Player 1 Wins the Battle!" : "🏆 Player 2 Wins the Battle!";
    } else {
        message = w === playerId ? "🏆 Victory is Yours!" : `💀 Defeat! Opponent Wins.`;
    }
    
    showGameOverModal(message);
}

function showGameOverModal(message) {
    // Stop physics simulations
    if (combatRunner) {
        window.Matter.Runner.stop(combatRunner);
    }
    
    // Display sweet Alert Modal
    const overlay = document.createElement('div');
    overlay.className = 'scrabble-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.85)';
    overlay.style.zIndex = '1000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.maxWidth = '400px';
    card.style.width = '90%';
    card.style.padding = '2rem';
    card.style.textAlign = 'center';
    card.style.borderRadius = '24px';
    card.style.border = '1px solid rgba(255,255,255,0.1)';
    card.style.boxShadow = 'var(--shadow-lg)';

    card.innerHTML = `
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem;">🏁</h1>
        <h2 style="color: var(--primary-light); margin-bottom: 0.5rem; font-size: 1.8rem; font-weight: 800;">Battle Over</h2>
        <p style="color: var(--text-primary); font-size: 1.1rem; line-height: 1.5; margin-bottom: 1.5rem; font-weight: 500;">${message}</p>
        <button id="towel-modal-exit-btn" class="btn btn-primary" style="width: 100%; font-weight: bold; padding: 0.75rem; border-radius: 10px;">Return to Lobby</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('towel-modal-exit-btn').addEventListener('click', () => {
        document.body.removeChild(overlay);
        quitGameToLobby();
    });
}

function showStatusText(text, isAlert = false) {
    const el = document.getElementById('towel-status-text');
    if (el) {
        el.innerText = text;
        el.style.color = isAlert ? 'var(--danger)' : 'var(--primary-light)';
    }
}

// Leave game lobby / room completely
async function leaveRoom() {
    if (roomName && playerId) {
        await remove(ref(database, `game/towel/rooms/${roomName}/players/${playerId}`));
        // Check if room is empty to delete
        const snap = await get(ref(database, `game/towel/rooms/${roomName}/players`));
        if (!snap.exists() || Object.keys(snap.val()).length === 0) {
            await remove(ref(database, `game/towel/rooms/${roomName}`));
        }
    }

    if (unsubscribeRoom) {
        unsubscribeRoom();
        unsubscribeRoom = null;
    }

    roomName = '';
    playerId = '';
    players = {};

    lobbySection.style.display = 'none';
    joinSection.style.display = 'block';

    lobbyScreen.classList.remove('active');
    selectionScreen.classList.add('active');
}

function quitGameToLobby() {
    // Clear physics loops
    if (buildRunner) window.Matter.Runner.stop(buildRunner);
    if (combatRunner) window.Matter.Runner.stop(combatRunner);
    
    if (gameMode === 'local') {
        gameScreen.classList.remove('active');
        lobbyScreen.classList.add('active');
    } else {
        leaveRoom();
    }
}

// Initialise module
injectHTML();
setupDOMReferences();
bindEvents();
