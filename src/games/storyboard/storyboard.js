// storyboard.js
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    remove
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const storyboardsRef = ref(database, 'storyboards');

const selectStoryboard = document.getElementById('select-storyboard');
const storyboardScreen = document.getElementById('storyboard-screen');
const selectionScreen = document.getElementById('selection-screen');
const backBtn = document.getElementById('storyboard-back-btn');

const canvas = document.getElementById('storyboard-canvas');
const pencilBtn = document.getElementById('storyboard-pencil-btn');
const eraserBtn = document.getElementById('storyboard-eraser-btn');
const colorInput = document.getElementById('storyboard-color');
const sizeInput = document.getElementById('storyboard-size');
const clearBtn = document.getElementById('storyboard-clear-btn');

const titleInput = document.getElementById('storyboard-title');
const saveBtn = document.getElementById('storyboard-save-btn');
const scriptArea = document.getElementById('storyboard-script');
const boardsList = document.getElementById('saved-boards-list');

let ctx = null;
if (canvas) {
    ctx = canvas.getContext('2d', { willReadFrequently: true });
}

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentMode = 'pencil';
let drawingColor = '#000000';
let currentBoardId = null;

if (selectStoryboard) {
    selectStoryboard.addEventListener('click', () => {
        selectionScreen.classList.remove('active');
        storyboardScreen.classList.add('active');
        // Make background white
        document.body.style.background = 'white';
        // Initialize canvas context
        clearCanvas();
        titleInput.value = '';
        scriptArea.value = '';
        currentBoardId = null;
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        storyboardScreen.classList.remove('active');
        selectionScreen.classList.add('active');
        // Restore background
        document.body.style.background = '';
    });
}

function clearCanvas() {
    if(!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
        return [
            (e.touches[0].clientX - rect.left) * scaleX,
            (e.touches[0].clientY - rect.top) * scaleY
        ];
    }
    return [
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top) * scaleY
    ];
}

function startDrawing(e) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const [currentX, currentY] = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);

    if (currentMode === 'eraser') {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = sizeInput.value * 2; 
    } else {
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = sizeInput.value;
    }

    ctx.stroke();
    [lastX, lastY] = [currentX, currentY];
}

function stopDrawing() {
    isDrawing = false;
}

if (canvas) {
    // Mouse Events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch Events
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);
}

if (pencilBtn) {
    pencilBtn.addEventListener('click', () => {
        currentMode = 'pencil';
        pencilBtn.classList.add('active');
        eraserBtn.classList.remove('active');
        canvas.style.cursor = 'crosshair';
    });
}

if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
        currentMode = 'eraser';
        eraserBtn.classList.add('active');
        pencilBtn.classList.remove('active');
        canvas.style.cursor = 'cell';
    });
}

if (colorInput) {
    colorInput.addEventListener('input', (e) => {
        drawingColor = e.target.value;
        if (currentMode === 'eraser') {
            pencilBtn.click();
        }
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        clearCanvas();
        currentBoardId = null;
        titleInput.value = '';
        scriptArea.value = '';
    });
}

// Firebase logic
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        const title = titleInput.value.trim() || 'Untitled Board';
        const script = scriptArea.value;
        const canvasData = canvas.toDataURL('image/png'); // Base64 string

        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

        try {
            if (currentBoardId) {
                // Update existing
                const boardRef = ref(database, `storyboards/${currentBoardId}`);
                await set(boardRef, {
                    title,
                    script,
                    canvasData,
                    updatedAt: Date.now()
                });
            } else {
                // Create new
                const newBoardRef = push(storyboardsRef);
                currentBoardId = newBoardRef.key;
                await set(newBoardRef, {
                    title,
                    script,
                    canvasData,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }
            alert('Storyboard saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save storyboard.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Save';
        }
    });
}

// Listen to saved boards
onValue(storyboardsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        boardsList.innerHTML = '<p style="color: #666; font-style: italic;">No saved boards.</p>';
        return;
    }

    const boardsArray = Object.entries(data).map(([id, board]) => ({
        id,
        ...board
    })).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));

    boardsList.innerHTML = boardsArray.map(board => `
        <div class="saved-board-item" data-id="${board.id}">
            <span class="saved-board-title" title="${escapeHtml(board.title)}">${escapeHtml(board.title)}</span>
            <button class="delete-board-btn" data-id="${board.id}" title="Delete">🗑️</button>
        </div>
    `).join('');

    // Attach load listeners
    document.querySelectorAll('.saved-board-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Ignore if delete button was clicked
            if (e.target.classList.contains('delete-board-btn')) return;
            const id = item.dataset.id;
            loadBoard(id, data[id]);
        });
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-board-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Are you sure you want to delete this storyboard?')) {
                try {
                    await remove(ref(database, `storyboards/${id}`));
                    if (currentBoardId === id) {
                        clearCanvas();
                        titleInput.value = '';
                        scriptArea.value = '';
                        currentBoardId = null;
                    }
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete.');
                }
            }
        });
    });
});

function loadBoard(id, boardData) {
    currentBoardId = id;
    titleInput.value = boardData.title || '';
    scriptArea.value = boardData.script || '';

    if (boardData.canvasData) {
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = boardData.canvasData;
    } else {
        clearCanvas();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const stringText = String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return stringText.replace(/[&<>"']/g, m => map[m]);
}
