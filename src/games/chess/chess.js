// chess.js - Fully Functional 2 Player Chess Game Module
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getDatabase,
    ref,
    set,
    onValue,
    remove,
    update,
    get,
    onDisconnect
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Firebase Configuration (Reused from app)
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

// -------------------------------------------------------------
// SVG PIECE VECTOR DEFINITIONS
// -------------------------------------------------------------
const PIECE_SVGS = {
    // White Pieces
    'P': `<svg viewBox="0 0 45 45"><path d="M 22.5,9 C 24.15,9 25.5,10.35 25.5,12 C 25.5,13.65 24.15,15 22.5,15 C 20.85,15 19.5,13.65 19.5,12 C 19.5,10.35 20.85,9 22.5,9 z M 24,16.5 C 25,16.5 27.5,18 27.5,21 C 27.5,22.5 26,24.5 25,25.5 L 26,28 C 28.5,28 31,30 31,33 L 14,33 C 14,30 16.5,28 19,28 L 20,25.5 C 19,24.5 17.5,22.5 17.5,21 C 17.5,18 20,16.5 21,16.5 L 24,16.5 z M 12.5,34 L 32.5,34 L 32.5,37 L 12.5,37 L 12.5,34 z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'R': `<svg viewBox="0 0 45 45"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 14,29.5 L 14,17 L 11,14 z M 14,16.5 L 31,16.5 L 31,14 L 14,14 L 14,16.5 z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'N': `<svg viewBox="0 0 45 45"><path d="M 22,10 C 17.5,10 14,12.5 14,16 C 14,17.5 14.5,19 15.5,20 C 14.5,20.5 13,21.5 13,24 C 13,26 14.5,27.5 16,28 C 14,29 13.5,30.5 13.5,32.5 L 31.5,32.5 C 31.5,32.5 33,26.5 28.5,22 C 30,20.5 31,18 31,15.5 C 31,12 27.5,10 22,10 z M 12,34 L 33,34 L 33,37 L 12,37 L 12,34 z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'B': `<svg viewBox="0 0 45 45"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="M 9,36 C 12,36 13,34.5 13,33 C 13,31.5 12,30 9,30 C 6,30 5,31.5 5,33 C 5,34.5 6,36 9,36 z M 36,36 C 39,36 40,34.5 40,33 C 40,31.5 39,30 36,30 C 33,30 32,31.5 32,33 C 32,34.5 33,36 36,36 z M 9,36 L 36,36 L 36,39 L 9,39 L 9,36 z M 15,32 C 18,32 20,31 22.5,27 C 25,31 27,32 30,32 L 15,32 z M 22.5,10 C 24.5,10 27,12 27,17 C 27,21 24,25 22.5,26.5 C 21,25 18,21 18,17 C 18,12 20.5,10 22.5,10 z"/><circle cx="22.5" cy="8" r="1.5"/></g></svg>`,
    'Q': `<svg viewBox="0 0 45 45"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,20 L 22.5,9 L 14,20 L 7,14 L 9,26 z M 9,28 L 36,28 L 36,31 L 9,31 L 9,28 z M 11,32 L 34,32 L 34,35 L 11,35 L 11,32 z M 10,36 L 35,36 L 35,39 L 10,39 L 10,36 z"/><circle cx="6" cy="12" r="2"/><circle cx="13" cy="18" r="2"/><circle cx="22.5" cy="7" r="2"/><circle cx="32" cy="18" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    'K': `<svg viewBox="0 0 45 45"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="M 22.5,11.6 L 22.5,6 M 20,8 M 25,8 M 22.5,25 C 22.5,25 27,17.5 27,14 C 27,11.5 25,10 22.5,10 C 20,10 18,11.5 18,14 C 18,17.5 22.5,25 22.5,25 z M 11.5,37 C 17,37 28,37 33.5,37 M 11.5,37 L 11.5,30 C 15,29 20,28.5 22.5,28.5 C 25,28.5 30,29 33.5,30 L 33.5,37 M 11.5,40 L 33.5,40 M 20,8 L 25,8"/><line x1="22.5" y1="6" x2="22.5" y2="10"/><line x1="20" y1="8" x2="25" y2="8"/></g></svg>`,

    // Black Pieces
    'p': `<svg viewBox="0 0 45 45"><path d="M 22.5,9 C 24.15,9 25.5,10.35 25.5,12 C 25.5,13.65 24.15,15 22.5,15 C 20.85,15 19.5,13.65 19.5,12 C 19.5,10.35 20.85,9 22.5,9 z M 24,16.5 C 25,16.5 27.5,18 27.5,21 C 27.5,22.5 26,24.5 25,25.5 L 26,28 C 28.5,28 31,30 31,33 L 14,33 C 14,30 16.5,28 19,28 L 20,25.5 C 19,24.5 17.5,22.5 17.5,21 C 17.5,18 20,16.5 21,16.5 L 24,16.5 z M 12.5,34 L 32.5,34 L 32.5,37 L 12.5,37 L 12.5,34 z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'r': `<svg viewBox="0 0 45 45"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 31,17 L 31,29.5 L 14,29.5 L 14,17 L 11,14 z M 14,16.5 L 31,16.5 L 31,14 L 14,14 L 14,16.5 z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    'n': `<svg viewBox="0 0 45 45"><path d="M 22,10 C 17.5,10 14,12.5 14,16 C 14,17.5 14.5,19 15.5,20 C 14.5,20.5 13,21.5 13,24 C 13,26 14.5,27.5 16,28 C 14,29 13.5,30.5 13.5,32.5 L 31.5,32.5 C 31.5,32.5 33,26.5 28.5,22 C 30,20.5 31,18 31,15.5 C 31,12 27.5,10 22,10 z M 12,34 L 33,34 L 33,37 L 12,37 L 12,34 z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'b': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"><path d="M 9,36 C 12,36 13,34.5 13,33 C 13,31.5 12,30 9,30 C 6,30 5,31.5 5,33 C 5,34.5 6,36 9,36 z M 36,36 C 39,36 40,34.5 40,33 C 40,31.5 39,30 36,30 C 33,30 32,31.5 32,33 C 32,34.5 33,36 36,36 z M 9,36 L 36,36 L 36,39 L 9,39 L 9,36 z M 15,32 C 18,32 20,31 22.5,27 C 25,31 27,32 30,32 L 15,32 z M 22.5,10 C 24.5,10 27,12 27,17 C 27,21 24,25 22.5,26.5 C 21,25 18,21 18,17 C 18,12 20.5,10 22.5,10 z"/><circle cx="22.5" cy="8" r="1.5"/></g></svg>`,
    'q': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,20 L 22.5,9 L 14,20 L 7,14 L 9,26 z M 9,28 L 36,28 L 36,31 L 9,31 L 9,28 z M 11,32 L 34,32 L 34,35 L 11,35 L 11,32 z M 10,36 L 35,36 L 35,39 L 10,39 L 10,36 z"/><circle cx="6" cy="12" r="2"/><circle cx="13" cy="18" r="2"/><circle cx="22.5" cy="7" r="2"/><circle cx="32" cy="18" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
    'k': `<svg viewBox="0 0 45 45"><g fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"><path d="M 22.5,11.6 L 22.5,6 M 20,8 M 25,8 M 22.5,25 C 22.5,25 27,17.5 27,14 C 27,11.5 25,10 22.5,10 C 20,10 18,11.5 18,14 C 18,17.5 22.5,25 22.5,25 z M 11.5,37 C 17,37 28,37 33.5,37 M 11.5,37 L 11.5,30 C 15,29 20,28.5 22.5,28.5 C 25,28.5 30,29 33.5,30 L 33.5,37 M 11.5,40 L 33.5,40 M 20,8 L 25,8"/><line x1="22.5" y1="6" x2="22.5" y2="10"/><line x1="20" y1="8" x2="25" y2="8"/></g></svg>`
};

const UNICODE_PIECES = {
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
    'p': '♟', 'r': '♜', 'n': '➞', 'b': '♝', 'q': '♛', 'k': '♚'
};

const PIECE_VALUES = {
    'p': 1, 'n': 3, 'b': 3.25, 'r': 5, 'q': 9, 'k': 200,
    'P': 1, 'N': 3, 'B': 3.25, 'R': 5, 'Q': 9, 'K': 200
};

// -------------------------------------------------------------
// WEB AUDIO SYNTHESIZER FOR SOUND EFFECTS
// -------------------------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;

        if (type === 'move') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'capture') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'check') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(800, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'win') {
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0.3, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.4);
            });
        }
    } catch (e) {
        console.warn('Audio playback error', e);
    }
}

// -------------------------------------------------------------
// CORE CHESS ENGINE & RULES
// -------------------------------------------------------------
function isWhite(piece) {
    return piece && piece === piece.toUpperCase();
}
function isBlack(piece) {
    return piece && piece === piece.toLowerCase();
}
function isSameColor(p1, p2) {
    if (!p1 || !p2) return false;
    return (isWhite(p1) && isWhite(p2)) || (isBlack(p1) && isBlack(p2));
}

function createInitialBoard() {
    return [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
}

function copyBoard(board) {
    return board.map(row => [...row]);
}

// Find square of King of specified color ('w' or 'b')
function findKing(board, color) {
    const targetKing = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === targetKing) return { r, c };
        }
    }
    return null;
}

// Check if square (r, c) is under attack by opponent color
function isSquareAttacked(board, r, c, attackerColor) {
    // 1. Pawn attacks
    const pawnDir = attackerColor === 'w' ? 1 : -1; // Attacking pawn direction towards (r, c)
    const attackerPawn = attackerColor === 'w' ? 'P' : 'p';
    for (const dc of [-1, 1]) {
        const ar = r + pawnDir;
        const ac = c + dc;
        if (ar >= 0 && ar < 8 && ac >= 0 && ac < 8) {
            if (board[ar][ac] === attackerPawn) return true;
        }
    }

    // 2. Knight attacks
    const attackerKnight = attackerColor === 'w' ? 'N' : 'n';
    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
        const ar = r + dr;
        const ac = c + dc;
        if (ar >= 0 && ar < 8 && ac >= 0 && ac < 8) {
            if (board[ar][ac] === attackerKnight) return true;
        }
    }

    // 3. King attacks (1 square away)
    const attackerKing = attackerColor === 'w' ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const ar = r + dr;
            const ac = c + dc;
            if (ar >= 0 && ar < 8 && ac >= 0 && ac < 8) {
                if (board[ar][ac] === attackerKing) return true;
            }
        }
    }

    // 4. Straight line attacks (Rook & Queen)
    const attackerRook = attackerColor === 'w' ? 'R' : 'r';
    const attackerQueen = attackerColor === 'w' ? 'Q' : 'q';
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of straightDirs) {
        let ar = r + dr;
        let ac = c + dc;
        while (ar >= 0 && ar < 8 && ac >= 0 && ac < 8) {
            const piece = board[ar][ac];
            if (piece) {
                if (piece === attackerRook || piece === attackerQueen) return true;
                break; // blocked by another piece
            }
            ar += dr;
            ac += dc;
        }
    }

    // 5. Diagonal attacks (Bishop & Queen)
    const attackerBishop = attackerColor === 'w' ? 'B' : 'b';
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
        let ar = r + dr;
        let ac = c + dc;
        while (ar >= 0 && ar < 8 && ac >= 0 && ac < 8) {
            const piece = board[ar][ac];
            if (piece) {
                if (piece === attackerBishop || piece === attackerQueen) return true;
                break;
            }
            ar += dr;
            ac += dc;
        }
    }

    return false;
}

function isKingInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    const attackerColor = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(board, kingPos.r, kingPos.c, attackerColor);
}

// Generate pseudo-legal moves for piece at (r, c)
function getPseudoMoves(board, r, c, castlingRights, enPassantTarget) {
    const piece = board[r][c];
    if (!piece) return [];

    const moves = [];
    const color = isWhite(piece) ? 'w' : 'b';
    const opponentColor = color === 'w' ? 'b' : 'w';
    const type = piece.toUpperCase();

    if (type === 'P') {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;

        // 1 step forward
        const nr = r + dir;
        if (nr >= 0 && nr < 8 && !board[nr][c]) {
            moves.push({ from: { r, c }, to: { r: nr, c }, isPromotion: (color === 'w' && nr === 0) || (color === 'b' && nr === 7) });
            // 2 steps forward from start
            const nr2 = r + 2 * dir;
            if (r === startRow && !board[nr2][c]) {
                moves.push({ from: { r, c }, to: { r: nr2, c }, isEnPassantDouble: true });
            }
        }

        // Standard captures
        for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board[nr][nc];
                if (targetPiece && !isSameColor(piece, targetPiece)) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, isPromotion: (color === 'w' && nr === 0) || (color === 'b' && nr === 7) });
                }
                // En Passant capture
                if (enPassantTarget && enPassantTarget.r === nr && enPassantTarget.c === nc) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc }, isEnPassant: true });
                }
            }
        }
    } else if (type === 'N') {
        const knightOffsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightOffsets) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (!board[nr][nc] || !isSameColor(piece, board[nr][nc])) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                }
            }
        }
    } else if (type === 'B' || type === 'R' || type === 'Q') {
        const dirs = [];
        if (type === 'B' || type === 'Q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        if (type === 'R' || type === 'Q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

        for (const [dr, dc] of dirs) {
            let nr = r + dr;
            let nc = c + dc;
            while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = board[nr][nc];
                if (!target) {
                    moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                } else {
                    if (!isSameColor(piece, target)) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
    } else if (type === 'K') {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    if (!board[nr][nc] || !isSameColor(piece, board[nr][nc])) {
                        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
                    }
                }
            }
        }

        // Castling
        const rights = castlingRights[color];
        const kingRow = color === 'w' ? 7 : 0;
        if (r === kingRow && c === 4 && !isSquareAttacked(board, r, c, opponentColor)) {
            // Kingside (O-O)
            if (rights.k && !board[kingRow][5] && !board[kingRow][6]) {
                if (!isSquareAttacked(board, kingRow, 5, opponentColor) && !isSquareAttacked(board, kingRow, 6, opponentColor)) {
                    moves.push({ from: { r, c }, to: { r: kingRow, c: 6 }, isCastle: 'k' });
                }
            }
            // Queenside (O-O-O)
            if (rights.q && !board[kingRow][1] && !board[kingRow][2] && !board[kingRow][3]) {
                if (!isSquareAttacked(board, kingRow, 3, opponentColor) && !isSquareAttacked(board, kingRow, 2, opponentColor)) {
                    moves.push({ from: { r, c }, to: { r: kingRow, c: 2 }, isCastle: 'q' });
                }
            }
        }
    }

    return moves;
}

// Filter moves that would leave own king in check
function getLegalMoves(board, color, castlingRights, enPassantTarget) {
    const legal = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            if ((color === 'w' && isWhite(piece)) || (color === 'b' && isBlack(piece))) {
                const candidates = getPseudoMoves(board, r, c, castlingRights, enPassantTarget);
                for (const move of candidates) {
                    const simBoard = copyBoard(board);
                    // Apply move on simulated board
                    simBoard[move.to.r][move.to.c] = simBoard[move.from.r][move.from.c];
                    simBoard[move.from.r][move.from.c] = null;
                    if (move.isEnPassant) {
                        const pawnCapturedRow = move.from.r;
                        simBoard[pawnCapturedRow][move.to.c] = null;
                    }
                    if (!isKingInCheck(simBoard, color)) {
                        legal.push(move);
                    }
                }
            }
        }
    }
    return legal;
}

// -------------------------------------------------------------
// CHESS BOT AI (MINIMAX WITH ALPHA-BETA PRUNING)
// -------------------------------------------------------------
const PST_PAWN = [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
];

const PST_KNIGHT = [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
];

function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            const val = PIECE_VALUES[piece] || 0;
            const type = piece.toUpperCase();
            let pstVal = 0;
            if (type === 'P') pstVal = PST_PAWN[isWhite(piece) ? r : 7 - r][c] * 0.1;
            if (type === 'N') pstVal = PST_KNIGHT[isWhite(piece) ? r : 7 - r][c] * 0.1;

            if (isWhite(piece)) {
                score += val + pstVal;
            } else {
                score -= val + pstVal;
            }
        }
    }
    return score;
}

function minimax(board, depth, alpha, beta, isMaximizing, castlingRights, enPassantTarget) {
    const color = isMaximizing ? 'w' : 'b';
    const moves = getLegalMoves(board, color, castlingRights, enPassantTarget);

    if (moves.length === 0) {
        if (isKingInCheck(board, color)) {
            return isMaximizing ? -10000 + (3 - depth) : 10000 - (3 - depth); // Checkmate
        }
        return 0; // Stalemate
    }

    if (depth === 0) {
        return evaluateBoard(board);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const simBoard = copyBoard(board);
            simBoard[move.to.r][move.to.c] = simBoard[move.from.r][move.from.c];
            simBoard[move.from.r][move.from.c] = null;
            const evalScore = minimax(simBoard, depth - 1, alpha, beta, false, castlingRights, null);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const simBoard = copyBoard(board);
            simBoard[move.to.r][move.to.c] = simBoard[move.from.r][move.from.c];
            simBoard[move.from.r][move.from.c] = null;
            const evalScore = minimax(simBoard, depth - 1, alpha, beta, true, castlingRights, null);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getBestBotMove(board, color, difficulty, castlingRights, enPassantTarget) {
    const moves = getLegalMoves(board, color, castlingRights, enPassantTarget);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        // Easy: Pick random move or simple capture
        const captures = moves.filter(m => board[m.to.r][m.to.c] !== null);
        if (captures.length > 0 && Math.random() < 0.6) {
            return captures[Math.floor(Math.random() * captures.length)];
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    const depth = difficulty === 'medium' ? 2 : 3;
    let bestMove = null;
    let isMaximizing = color === 'w';
    let bestEval = isMaximizing ? -Infinity : Infinity;

    for (const move of moves) {
        const simBoard = copyBoard(board);
        simBoard[move.to.r][move.to.c] = simBoard[move.from.r][move.from.c];
        simBoard[move.from.r][move.from.c] = null;
        if (move.isPromotion) {
            simBoard[move.to.r][move.to.c] = color === 'w' ? 'Q' : 'q';
        }
        const evalScore = minimax(simBoard, depth - 1, -Infinity, Infinity, !isMaximizing, castlingRights, null);
        if (isMaximizing) {
            if (evalScore > bestEval) {
                bestEval = evalScore;
                bestMove = move;
            }
        } else {
            if (evalScore < bestEval) {
                bestEval = evalScore;
                bestMove = move;
            }
        }
    }
    return bestMove || moves[0];
}

// -------------------------------------------------------------
// UI CONTROLLER & APPLICATION STATE
// -------------------------------------------------------------

// DOM Elements
const selectChessCard = document.getElementById('select-chess');
const selectionScreen = document.getElementById('selection-screen');
const chessLobbyScreen = document.getElementById('chess-lobby-screen');
const chessGameScreen = document.getElementById('chess-game-screen');

const chessBackBtn = document.getElementById('chess-back-btn');
const chessGameBackBtn = document.getElementById('chess-game-back-btn');

const chessLocalBtn = document.getElementById('chess-local-btn');
const chessBotBtn = document.getElementById('chess-bot-btn');
const chessOnlineToggleBtn = document.getElementById('chess-online-toggle-btn');
const chessBotOptions = document.getElementById('chess-bot-options');
const chessStartBotBtn = document.getElementById('chess-start-bot-btn');
const chessDiffBtns = document.querySelectorAll('.chess-diff-btn');

const chessJoinSection = document.getElementById('chess-join-section');
const chessLobbySection = document.getElementById('chess-lobby-section');
const chessRoomInput = document.getElementById('chess-room-name');
const chessNameInput = document.getElementById('chess-player-name');
const chessJoinBtn = document.getElementById('chess-join-btn');
const chessPlayersList = document.getElementById('chess-players-list');
const chessStartBtn = document.getElementById('chess-start-btn');
const chessLeaveBtn = document.getElementById('chess-leave-btn');

const chessBoardElem = document.getElementById('chess-board');
const chessStatusText = document.getElementById('chess-status-text');
const chessModeBadge = document.getElementById('chess-mode-badge');
const chessTopName = document.getElementById('chess-top-name');
const chessBottomName = document.getElementById('chess-bottom-name');
const chessTopCaptured = document.getElementById('chess-top-captured');
const chessBottomCaptured = document.getElementById('chess-bottom-captured');
const chessTopScore = document.getElementById('chess-top-score');
const chessBottomScore = document.getElementById('chess-bottom-score');
const chessTopClock = document.getElementById('chess-top-clock');
const chessBottomClock = document.getElementById('chess-bottom-clock');

const chessFlipBtn = document.getElementById('chess-flip-btn');
const chessUndoBtn = document.getElementById('chess-undo-btn');
const chessResignBtn = document.getElementById('chess-resign-btn');
const chessDrawBtn = document.getElementById('chess-draw-btn');
const chessSoundBtn = document.getElementById('chess-sound-btn');
const chessThemeBtn = document.getElementById('chess-theme-btn');
const chessRulesBtn = document.getElementById('chess-rules-btn');
const chessRulesModal = document.getElementById('chess-rules-modal');
const chessRulesCloseBtn = document.getElementById('chess-rules-close-btn');

const chessTimerSelect = document.getElementById('chess-timer-select');
const chessMoveLog = document.getElementById('chess-move-log');

const chessPromoModal = document.getElementById('chess-promotion-modal');
const chessPromoChoices = document.getElementById('chess-promotion-choices');

const chessGameOverModal = document.getElementById('chess-gameover-modal');
const chessGameOverTitle = document.getElementById('chess-gameover-title');
const chessGameOverDesc = document.getElementById('chess-gameover-desc');
const chessGameOverIcon = document.getElementById('chess-gameover-icon');
const chessRematchBtn = document.getElementById('chess-rematch-btn');
const chessLobbyReturnBtn = document.getElementById('chess-lobby-return-btn');

// Game Session State
let gameMode = 'local'; // 'local', 'bot', 'online'
let botDifficulty = 'easy';
let isFlipped = false;
let boardTheme = 'emerald'; // 'emerald', 'wood', 'cyber'

let boardState = createInitialBoard();
let currentTurn = 'w';
let selectedSquare = null;
let legalMovesForSelected = [];
let lastMove = null;

let castlingRights = {
    w: { k: true, q: true },
    b: { k: true, q: true }
};
let enPassantTarget = null;
let moveHistory = []; // Snapshots for undo and log
let isGameOver = false;

// Clock Timers
let timerSeconds = 300; // 5 min default
let whiteTime = 300;
let blackTime = 300;
let clockInterval = null;

// Firebase Multiplayer State
let roomName = '';
let playerName = '';
let playerColor = 'w'; // 'w' for host, 'b' for guest
let unsubscribeRoom = null;

// -------------------------------------------------------------
// INITIALIZATION & EVENT HANDLERS
// -------------------------------------------------------------
if (selectChessCard) {
    selectChessCard.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        chessLobbyScreen.classList.add('active');
        document.querySelector('.container').classList.add('wide-container');
    });
}

if (chessBackBtn) {
    chessBackBtn.addEventListener('click', () => {
        chessLobbyScreen.classList.remove('active');
        selectionScreen.classList.add('active');
        document.querySelector('.container').classList.remove('wide-container');
    });
}

if (chessGameBackBtn) {
    chessGameBackBtn.addEventListener('click', () => {
        stopClocks();
        if (unsubscribeRoom) unsubscribeRoom();
        chessGameScreen.classList.remove('active');
        chessLobbyScreen.classList.add('active');
    });
}

// Mode Selection
if (chessLocalBtn) {
    chessLocalBtn.addEventListener('click', () => {
        gameMode = 'local';
        startNewGame();
    });
}

if (chessBotBtn) {
    chessBotBtn.addEventListener('click', () => {
        chessBotOptions.style.display = chessBotOptions.style.display === 'none' ? 'block' : 'none';
        chessJoinSection.style.display = 'none';
    });
}

if (chessDiffBtns) {
    chessDiffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chessDiffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            botDifficulty = btn.dataset.diff;
        });
    });
}

if (chessStartBotBtn) {
    chessStartBotBtn.addEventListener('click', () => {
        gameMode = 'bot';
        startNewGame();
    });
}

if (chessOnlineToggleBtn) {
    chessOnlineToggleBtn.addEventListener('click', () => {
        chessJoinSection.style.display = chessJoinSection.style.display === 'none' ? 'block' : 'none';
        chessBotOptions.style.display = 'none';
    });
}

// Sound & Theme Controls
if (chessSoundBtn) {
    chessSoundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        chessSoundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    });
}

if (chessThemeBtn) {
    const themes = ['emerald', 'wood', 'cyber'];
    chessThemeBtn.addEventListener('click', () => {
        const currentIdx = themes.indexOf(boardTheme);
        boardTheme = themes[(currentIdx + 1) % themes.length];
        const boardOuter = document.querySelector('.chess-board-outer');
        if (boardOuter) {
            boardOuter.className = `chess-board-outer theme-${boardTheme}`;
        }
        renderBoard();
    });
}

if (chessFlipBtn) {
    chessFlipBtn.addEventListener('click', () => {
        isFlipped = !isFlipped;
        renderBoard();
    });
}

if (chessUndoBtn) {
    chessUndoBtn.addEventListener('click', () => {
        if (gameMode === 'online') {
            alert('Undo is only available in Local or Bot mode!');
            return;
        }
        undoLastMove();
    });
}

if (chessResignBtn) {
    chessResignBtn.addEventListener('click', () => {
        if (isGameOver) return;
        if (confirm('Are you sure you want to resign?')) {
            const winner = currentTurn === 'w' ? 'Black' : 'White';
            endGame(`${winner} wins by Resignation!`, winner === 'White' ? '♔' : '♚');
        }
    });
}

if (chessDrawBtn) {
    chessDrawBtn.addEventListener('click', () => {
        if (isGameOver) return;
        if (confirm('Agree to a Draw?')) {
            endGame('Game ended in a Mutual Draw! 🤝', '🤝');
        }
    });
}

if (chessRulesBtn) {
    chessRulesBtn.addEventListener('click', () => {
        chessRulesModal.style.display = 'flex';
    });
}
if (chessRulesCloseBtn) {
    chessRulesCloseBtn.addEventListener('click', () => {
        chessRulesModal.style.display = 'none';
    });
}

if (chessRematchBtn) {
    chessRematchBtn.addEventListener('click', () => {
        chessGameOverModal.style.display = 'none';
        startNewGame();
    });
}

if (chessLobbyReturnBtn) {
    chessLobbyReturnBtn.addEventListener('click', () => {
        chessGameOverModal.style.display = 'none';
        chessGameScreen.classList.remove('active');
        chessLobbyScreen.classList.add('active');
    });
}

if (chessTimerSelect) {
    chessTimerSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'none') {
            timerSeconds = 0;
        } else {
            timerSeconds = parseInt(val, 10);
        }
        resetClocks();
    });
}

// -------------------------------------------------------------
// GAMEPLAY ACTIONS & MOVES
// -------------------------------------------------------------
function startNewGame() {
    boardState = createInitialBoard();
    currentTurn = 'w';
    selectedSquare = null;
    legalMovesForSelected = [];
    lastMove = null;
    castlingRights = { w: { k: true, q: true }, b: { k: true, q: true } };
    enPassantTarget = null;
    moveHistory = [];
    isGameOver = false;
    isFlipped = gameMode === 'online' && playerColor === 'b';

    chessLobbyScreen.classList.remove('active');
    chessGameScreen.classList.add('active');

    if (chessModeBadge) {
        chessModeBadge.textContent = gameMode === 'local' ? 'Local 2P' : (gameMode === 'bot' ? `vs Bot (${botDifficulty})` : 'Online 2P');
    }

    if (chessTopName) chessTopName.textContent = gameMode === 'bot' ? `Bot ${botDifficulty.toUpperCase()} 🤖` : (gameMode === 'online' ? 'Opponent' : 'Player 2 (Black)');
    if (chessBottomName) chessBottomName.textContent = gameMode === 'online' ? (playerName || 'Player 1') : 'Player 1 (White)';

    resetClocks();
    renderBoard();
    updateUIInfo();
    playSound('move');
}

function resetClocks() {
    stopClocks();
    whiteTime = timerSeconds;
    blackTime = timerSeconds;
    updateClockDisplay();
    if (timerSeconds > 0 && !isGameOver) {
        startClocks();
    }
}

function startClocks() {
    stopClocks();
    clockInterval = setInterval(() => {
        if (isGameOver || timerSeconds === 0) return;
        if (currentTurn === 'w') {
            whiteTime--;
            if (whiteTime <= 0) {
                endGame('Black wins on Time! ⏱️', '♚');
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                endGame('White wins on Time! ⏱️', '♔');
            }
        }
        updateClockDisplay();
    }, 1000);
}

function stopClocks() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
}

function updateClockDisplay() {
    if (timerSeconds === 0) {
        if (chessTopClock) chessTopClock.textContent = '∞';
        if (chessBottomClock) chessBottomClock.textContent = '∞';
        return;
    }

    const formatTime = (s) => {
        const m = Math.floor(Math.max(0, s) / 60);
        const sec = Math.max(0, s) % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (chessTopClock) {
        chessTopClock.textContent = formatTime(blackTime);
        if (blackTime < 30) chessTopClock.classList.add('low-time');
        else chessTopClock.classList.remove('low-time');
    }
    if (chessBottomClock) {
        chessBottomClock.textContent = formatTime(whiteTime);
        if (whiteTime < 30) chessBottomClock.classList.add('low-time');
        else chessBottomClock.classList.remove('low-time');
    }
}

function onSquareClick(r, c) {
    if (isGameOver) return;

    // In online mode, restrict move if not your turn
    if (gameMode === 'online') {
        if ((currentTurn === 'w' && playerColor !== 'w') || (currentTurn === 'b' && playerColor !== 'b')) {
            return;
        }
    }
    // In bot mode, restrict if it's bot's turn (black)
    if (gameMode === 'bot' && currentTurn === 'b') {
        return;
    }

    const piece = boardState[r][c];

    // If square clicked is a legal move target
    const targetMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
    if (targetMove) {
        executeMove(targetMove);
        return;
    }

    // Otherwise select piece of current turn color
    if (piece && ((currentTurn === 'w' && isWhite(piece)) || (currentTurn === 'b' && isBlack(piece)))) {
        selectedSquare = { r, c };
        legalMovesForSelected = getLegalMoves(boardState, currentTurn, castlingRights, enPassantTarget)
            .filter(m => m.from.r === r && m.from.c === c);
    } else {
        selectedSquare = null;
        legalMovesForSelected = [];
    }

    renderBoard();
}

function executeMove(move) {
    const fromPiece = boardState[move.from.r][move.from.c];
    const targetPiece = boardState[move.to.r][move.to.c];
    const isCapture = targetPiece !== null || move.isEnPassant;

    // Check Pawn Promotion
    if (move.isPromotion) {
        promptPromotion(move, (promotedPiece) => {
            finalizeMove(move, promotedPiece, isCapture);
        });
        return;
    }

    finalizeMove(move, null, isCapture);
}

function finalizeMove(move, promotedPiece = null, isCapture = false) {
    const fromPiece = boardState[move.from.r][move.from.c];
    
    // Save snapshot for undo log
    const snapshot = {
        board: copyBoard(boardState),
        turn: currentTurn,
        castlingRights: JSON.parse(JSON.stringify(castlingRights)),
        enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        move
    };

    // Update board
    boardState[move.to.r][move.to.c] = promotedPiece || fromPiece;
    boardState[move.from.r][move.from.c] = null;

    // En Passant capture removal
    if (move.isEnPassant) {
        const capturedPawnRow = move.from.r;
        boardState[capturedPawnRow][move.to.c] = null;
    }

    // Castling rook repositioning
    if (move.isCastle) {
        const row = move.from.r;
        if (move.isCastle === 'k') {
            boardState[row][5] = boardState[row][7];
            boardState[row][7] = null;
        } else if (move.isCastle === 'q') {
            boardState[row][3] = boardState[row][0];
            boardState[row][0] = null;
        }
    }

    // Update En Passant Target
    if (move.isEnPassantDouble) {
        enPassantTarget = { r: (move.from.r + move.to.r) / 2, c: move.from.c };
    } else {
        enPassantTarget = null;
    }

    // Update Castling Rights
    if (fromPiece === 'K') { castlingRights.w.k = false; castlingRights.w.q = false; }
    if (fromPiece === 'k') { castlingRights.b.k = false; castlingRights.b.q = false; }
    if (fromPiece === 'R' && move.from.r === 7 && move.from.c === 0) castlingRights.w.q = false;
    if (fromPiece === 'R' && move.from.r === 7 && move.from.c === 7) castlingRights.w.k = false;
    if (fromPiece === 'r' && move.from.r === 0 && move.from.c === 0) castlingRights.b.q = false;
    if (fromPiece === 'r' && move.from.r === 0 && move.from.c === 7) castlingRights.b.k = false;

    // Format Algebraic Notation (PGN)
    const san = generateSAN(snapshot.board, move, promotedPiece);
    snapshot.san = san;
    moveHistory.push(snapshot);

    lastMove = move;
    selectedSquare = null;
    legalMovesForSelected = [];

    // Switch Turn
    currentTurn = currentTurn === 'w' ? 'b' : 'w';

    // Play Sound Effect
    const inCheck = isKingInCheck(boardState, currentTurn);
    if (inCheck) {
        playSound('check');
    } else if (isCapture) {
        playSound('capture');
    } else {
        playSound('move');
    }

    // Check Win / Draw condition
    const nextLegalMoves = getLegalMoves(boardState, currentTurn, castlingRights, enPassantTarget);
    if (nextLegalMoves.length === 0) {
        if (inCheck) {
            const winner = currentTurn === 'w' ? 'Black' : 'White';
            endGame(`Checkmate! ${winner} wins! 🏆`, winner === 'White' ? '♔' : '♚');
        } else {
            endGame('Stalemate! Game is a Draw. 🤝', '🤝');
        }
    }

    renderBoard();
    updateUIInfo();

    // Trigger Bot Move if applicable
    if (gameMode === 'bot' && currentTurn === 'b' && !isGameOver) {
        setTimeout(() => {
            const botMove = getBestBotMove(boardState, 'b', botDifficulty, castlingRights, enPassantTarget);
            if (botMove) {
                executeMove(botMove);
            }
        }, 400);
    }
}

function promptPromotion(move, callback) {
    chessPromoChoices.innerHTML = '';
    const promoPieces = currentTurn === 'w' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

    promoPieces.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'chess-promo-btn';
        btn.innerHTML = PIECE_SVGS[p];
        btn.addEventListener('click', () => {
            chessPromoModal.style.display = 'none';
            callback(p);
        });
        chessPromoChoices.appendChild(btn);
    });

    chessPromoModal.style.display = 'flex';
}

function undoLastMove() {
    if (moveHistory.length === 0 || isGameOver) return;

    // Undo 2 moves if in bot mode
    const popCount = (gameMode === 'bot' && moveHistory.length >= 2) ? 2 : 1;

    for (let i = 0; i < popCount; i++) {
        const lastSnapshot = moveHistory.pop();
        if (!lastSnapshot) break;
        boardState = copyBoard(lastSnapshot.board);
        currentTurn = lastSnapshot.turn;
        castlingRights = JSON.parse(JSON.stringify(lastSnapshot.castlingRights));
        enPassantTarget = lastSnapshot.enPassantTarget;
    }

    lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1].move : null;
    selectedSquare = null;
    legalMovesForSelected = [];
    renderBoard();
    updateUIInfo();
    playSound('move');
}

function generateSAN(board, move, promotedPiece) {
    const piece = board[move.from.r][move.from.c];
    const type = piece.toUpperCase();
    const isCapture = board[move.to.r][move.to.c] !== null || move.isEnPassant;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    if (move.isCastle === 'k') return 'O-O';
    if (move.isCastle === 'q') return 'O-O-O';

    let notation = '';
    if (type !== 'P') {
        notation += type;
    } else if (isCapture) {
        notation += files[move.from.c];
    }

    if (isCapture) notation += 'x';
    notation += `${files[move.to.c]}${8 - move.to.r}`;

    if (promotedPiece) {
        notation += `=${promotedPiece.toUpperCase()}`;
    }
    return notation;
}

function endGame(message, icon = '🏆') {
    isGameOver = true;
    stopClocks();
    playSound('win');

    if (chessGameOverTitle) chessGameOverTitle.textContent = message.includes('Checkmate') ? 'Checkmate!' : 'Game Over';
    if (chessGameOverDesc) chessGameOverDesc.textContent = message;
    if (chessGameOverIcon) chessGameOverIcon.textContent = icon;
    if (chessGameOverModal) chessGameOverModal.style.display = 'flex';
}

// -------------------------------------------------------------
// RENDERING BOARD & UI
// -------------------------------------------------------------
function renderBoard() {
    if (!chessBoardElem) return;
    chessBoardElem.innerHTML = '';

    const kingInCheckPos = isKingInCheck(boardState, currentTurn) ? findKing(boardState, currentTurn) : null;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let i = 0; i < 64; i++) {
        let r = Math.floor(i / 8);
        let c = i % 8;

        // Rotate board if flipped for Black
        if (isFlipped) {
            r = 7 - r;
            c = 7 - c;
        }

        const square = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        square.className = `chess-square ${isLight ? 'light-sq' : 'dark-sq'}`;
        square.dataset.r = r;
        square.dataset.c = c;

        // Highlighting
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
            square.classList.add('selected-sq');
        }

        if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
            square.classList.add('last-move-sq');
        }

        if (kingInCheckPos && kingInCheckPos.r === r && kingInCheckPos.c === c) {
            square.classList.add('in-check-sq');
        }

        // Move dot or capture ring
        const legalMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
        if (legalMove) {
            const isCaptureTarget = boardState[r][c] !== null || legalMove.isEnPassant;
            if (isCaptureTarget) {
                const ring = document.createElement('div');
                ring.className = 'capture-ring';
                square.appendChild(ring);
            } else {
                const dot = document.createElement('div');
                dot.className = 'move-dot';
                square.appendChild(dot);
            }
        }

        // Coordinate notation labels
        if ((!isFlipped && c === 0) || (isFlipped && c === 7)) {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'coord-rank';
            rankLabel.textContent = 8 - r;
            square.appendChild(rankLabel);
        }
        if ((!isFlipped && r === 7) || (isFlipped && r === 0)) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'coord-file';
            fileLabel.textContent = files[c];
            square.appendChild(fileLabel);
        }

        // Piece rendering
        const piece = boardState[r][c];
        if (piece) {
            const pieceElem = document.createElement('div');
            pieceElem.className = 'chess-piece';
            pieceElem.innerHTML = PIECE_SVGS[piece] || UNICODE_PIECES[piece];
            square.appendChild(pieceElem);
        }

        square.addEventListener('click', () => onSquareClick(r, c));
        chessBoardElem.appendChild(square);
    }
}

function updateUIInfo() {
    // Status message
    if (chessStatusText) {
        if (isGameOver) {
            chessStatusText.textContent = 'Game Ended';
        } else {
            const inCheck = isKingInCheck(boardState, currentTurn);
            const turnName = currentTurn === 'w' ? 'White' : 'Black';
            chessStatusText.textContent = inCheck ? `⚠️ ${turnName} is in CHECK!` : `${turnName}'s Turn`;
        }
    }

    // Active player highlight
    const topBar = document.getElementById('chess-player-top');
    const bottomBar = document.getElementById('chess-player-bottom');

    const isBottomWhite = !isFlipped;
    const isWhiteTurn = currentTurn === 'w';

    if (topBar && bottomBar) {
        if ((isWhiteTurn && isBottomWhite) || (!isWhiteTurn && !isBottomWhite)) {
            bottomBar.classList.add('active-turn');
            topBar.classList.remove('active-turn');
        } else {
            topBar.classList.add('active-turn');
            bottomBar.classList.remove('active-turn');
        }
    }

    // Captured pieces & Material evaluation
    let whiteMaterial = 0;
    let blackMaterial = 0;
    const capturedWhite = [];
    const capturedBlack = [];

    const initialCounts = { 'P': 8, 'N': 2, 'B': 2, 'R': 2, 'Q': 1, 'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1 };
    const currentCounts = { 'P': 0, 'N': 0, 'B': 0, 'R': 0, 'Q': 0, 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0 };

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = boardState[r][c];
            if (p) {
                if (currentCounts[p] !== undefined) currentCounts[p]++;
                if (isWhite(p)) whiteMaterial += PIECE_VALUES[p];
                else blackMaterial += PIECE_VALUES[p];
            }
        }
    }

    for (const [p, init] of Object.entries(initialCounts)) {
        const diff = init - (currentCounts[p] || 0);
        for (let i = 0; i < diff; i++) {
            if (isWhite(p)) capturedWhite.push(p);
            else capturedBlack.push(p);
        }
    }

    const whiteScoreDiff = Math.max(0, whiteMaterial - blackMaterial);
    const blackScoreDiff = Math.max(0, blackMaterial - whiteMaterial);

    if (chessBottomCaptured) chessBottomCaptured.textContent = capturedBlack.map(p => UNICODE_PIECES[p]).join(' ');
    if (chessTopCaptured) chessTopCaptured.textContent = capturedWhite.map(p => UNICODE_PIECES[p]).join(' ');

    if (chessBottomScore) chessBottomScore.textContent = whiteScoreDiff > 0 ? `+${whiteScoreDiff}` : '';
    if (chessTopScore) chessTopScore.textContent = blackScoreDiff > 0 ? `+${blackScoreDiff}` : '';

    // Move Log Table
    if (chessMoveLog) {
        chessMoveLog.innerHTML = '';
        for (let i = 0; i < moveHistory.length; i += 2) {
            const moveRow = document.createElement('div');
            moveRow.className = 'chess-move-row';

            const numSpan = document.createElement('span');
            numSpan.className = 'chess-move-num';
            numSpan.textContent = `${Math.floor(i / 2) + 1}.`;

            const whiteSpan = document.createElement('span');
            whiteSpan.className = 'chess-move-white';
            whiteSpan.textContent = moveHistory[i].san || '';

            const blackSpan = document.createElement('span');
            blackSpan.className = 'chess-move-black';
            blackSpan.textContent = moveHistory[i + 1] ? moveHistory[i + 1].san : '';

            moveRow.appendChild(numSpan);
            moveRow.appendChild(whiteSpan);
            moveRow.appendChild(blackSpan);
            chessMoveLog.appendChild(moveRow);
        }
        chessMoveLog.scrollTop = chessMoveLog.scrollHeight;
    }
}
