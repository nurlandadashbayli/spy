import { CrosswordGenerator, fetchWordsFromWikipedia, FALLBACK_WORDS } from './crossword-generator.js';

let crosswordData = [];
let ROWS = 0;
let COLS = 0;
let wordPool = [];

let currentDirection = 'across';
let currentWordId = null;
let allClues = []; // ordered list of { num, dir, hint }
let _clueClickInProgress = false;
let _lastFocusedCell = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('crossword-refresh-btn')?.addEventListener('click', () => {
        initCrossword(true);
    });

    document.getElementById('select-crossword')?.addEventListener('click', () => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelector('.container').classList.add('wide-container');
        document.getElementById('crossword-game-screen').classList.add('active');
        initCrossword();
    });

    document.getElementById('crossword-back-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelector('.container').classList.remove('wide-container');
        document.getElementById('selection-screen').classList.add('active');
    });

    // Active clue bar navigation
    document.getElementById('clue-prev-btn')?.addEventListener('click', () => navigateClue(-1));
    document.getElementById('clue-next-btn')?.addEventListener('click', () => navigateClue(1));

    // Reveal answers
    document.getElementById('crossword-reveal-btn')?.addEventListener('click', revealAnswers);
});

async function initCrossword(forceNew = false) {
    const loadingEl = document.getElementById('crossword-loading');
    const boardPanel = document.querySelector('.crossword-board-panel');
    const cluesPanel = document.querySelector('.crossword-clues-panel');

    // Show loading, hide board
    if (loadingEl) loadingEl.style.display = 'flex';
    if (boardPanel) boardPanel.style.opacity = '0.3';
    if (cluesPanel) cluesPanel.style.opacity = '0.3';

    try {
        if (forceNew || wordPool.length < 15) {
            const fetched = await fetchWordsFromWikipedia();
            if (fetched.length >= 10) {
                wordPool = fetched;
            } else {
                // Mix fetched with fallback
                wordPool = [...fetched, ...FALLBACK_WORDS];
            }
        }

        const gen = new CrosswordGenerator(wordPool);
        const result = gen.generate(20);
        crosswordData = result.layout;
        ROWS = result.rows;
        COLS = result.cols;
    } catch (e) {
        console.warn('Generation failed, using fallback:', e);
        const gen = new CrosswordGenerator(FALLBACK_WORDS);
        const result = gen.generate(15);
        crosswordData = result.layout;
        ROWS = result.rows;
        COLS = result.cols;
    }

    renderBoard();
    renderClues();
    updateActiveClueBar(null);

    if (loadingEl) loadingEl.style.display = 'none';
    if (boardPanel) boardPanel.style.opacity = '1';
    if (cluesPanel) cluesPanel.style.opacity = '1';
}

function renderBoard() {
    const board = document.getElementById('crossword-board');
    board.innerHTML = '';
    board.style.setProperty('--cw-rows', ROWS);
    board.style.setProperty('--cw-cols', COLS);

    // Build grid map
    const gridMap = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    crosswordData.forEach(item => {
        for (let i = 0; i < item.word.length; i++) {
            const r = item.dir === 'across' ? item.r : item.r + i;
            const c = item.dir === 'across' ? item.c + i : item.c;

            if (!gridMap[r][c]) {
                gridMap[r][c] = {
                    letter: item.word[i],
                    num: i === 0 ? item.num : null,
                    acrossId: item.dir === 'across' ? item.num : null,
                    downId: item.dir === 'down' ? item.num : null
                };
            } else {
                if (i === 0 && !gridMap[r][c].num) gridMap[r][c].num = item.num;
                if (item.dir === 'across') gridMap[r][c].acrossId = item.num;
                if (item.dir === 'down') gridMap[r][c].downId = item.num;
            }
        }
    });

    // Render cells
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = gridMap[r][c];
            const el = document.createElement('div');
            el.className = 'cw-cell';

            if (cell) {
                el.classList.add('cw-active');
                el.dataset.r = r;
                el.dataset.c = c;
                if (cell.acrossId) el.dataset.across = cell.acrossId;
                if (cell.downId) el.dataset.down = cell.downId;

                if (cell.num) {
                    const numSpan = document.createElement('span');
                    numSpan.className = 'cw-num';
                    numSpan.textContent = cell.num;
                    el.appendChild(numSpan);
                }

                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.className = 'cw-input';
                input.dataset.correct = cell.letter;
                input.autocomplete = 'off';
                input.setAttribute('autocapitalize', 'characters');

                input.addEventListener('focus', () => handleCellFocus(r, c));
                input.addEventListener('input', (e) => handleCellInput(e, r, c));
                input.addEventListener('keydown', (e) => handleCellKeydown(e, r, c));

                el.appendChild(input);
            } else {
                el.classList.add('cw-black');
            }
            board.appendChild(el);
        }
    }
}

function renderClues() {
    const acrossList = document.getElementById('crossword-clues-across');
    const downList = document.getElementById('crossword-clues-down');
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    allClues = [];

    crosswordData.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cw-clue';
        li.dataset.num = item.num;
        li.dataset.dir = item.dir;
        li.innerHTML = `<strong>${item.num}.</strong> ${item.hint}`;

        li.addEventListener('click', () => {
            _clueClickInProgress = true;
            currentDirection = item.dir;
            currentWordId = item.num;
            highlightWord(currentWordId, currentDirection);
            updateActiveClueBar(currentWordId, currentDirection);
            const cell = document.querySelector(`.cw-cell[data-${item.dir}="${item.num}"] input`);
            if (cell) cell.focus();
            setTimeout(() => { _clueClickInProgress = false; }, 50);
        });

        if (item.dir === 'across') {
            acrossList.appendChild(li);
        } else {
            downList.appendChild(li);
        }
        allClues.push({ num: item.num, dir: item.dir, hint: item.hint });
    });
}

function updateActiveClueBar(wordId, dir) {
    const bar = document.getElementById('clue-text');
    if (!bar) return;

    if (wordId == null) {
        bar.textContent = 'Bir xananı seçin...';
        return;
    }

    const item = crosswordData.find(d => d.num == wordId && d.dir === dir);
    if (item) {
        const dirLabel = dir === 'across' ? 'Eninə' : 'Uzununa';
        bar.textContent = `${item.num} ${dirLabel}: ${item.hint}`;
    }
}

function navigateClue(step) {
    if (allClues.length === 0) return;

    let idx = allClues.findIndex(c => c.num == currentWordId && c.dir === currentDirection);
    if (idx === -1) idx = 0;
    else idx = (idx + step + allClues.length) % allClues.length;

    const clue = allClues[idx];
    _clueClickInProgress = true;
    currentDirection = clue.dir;
    currentWordId = clue.num;
    highlightWord(currentWordId, currentDirection);
    updateActiveClueBar(currentWordId, currentDirection);
    const cell = document.querySelector(`.cw-cell[data-${clue.dir}="${clue.num}"] input`);
    if (cell) cell.focus();
    setTimeout(() => { _clueClickInProgress = false; }, 50);
}

function handleCellFocus(r, c) {
    // If focus was triggered by a clue click, skip direction logic
    if (_clueClickInProgress) return;

    const wrapper = document.querySelector(`.cw-cell[data-r="${r}"][data-c="${c}"]`);
    if (!wrapper) return;

    const cellKey = `${r},${c}`;

    // Toggle direction ONLY when clicking the same cell again (intersection toggle)
    if (wrapper.dataset.across && wrapper.dataset.down) {
        if (_lastFocusedCell === cellKey) {
            // Same cell clicked again — toggle direction
            currentDirection = currentDirection === 'across' ? 'down' : 'across';
        }
        // else: new cell at intersection — keep current direction if valid
        else if (!wrapper.dataset[currentDirection]) {
            currentDirection = wrapper.dataset.across ? 'across' : 'down';
        }
    } else {
        currentDirection = wrapper.dataset.across ? 'across' : 'down';
    }

    _lastFocusedCell = cellKey;
    currentWordId = wrapper.dataset[currentDirection];
    highlightWord(currentWordId, currentDirection);
    updateActiveClueBar(currentWordId, currentDirection);
}

function highlightWord(wordId, dir) {
    // Clear all highlights
    document.querySelectorAll('.cw-cell').forEach(w => w.classList.remove('cw-highlighted'));
    document.querySelectorAll('.cw-clue').forEach(li => li.classList.remove('cw-clue-active'));

    if (!wordId) return;

    // Highlight cells
    document.querySelectorAll(`.cw-cell[data-${dir}="${wordId}"]`).forEach(w => {
        w.classList.add('cw-highlighted');
    });

    // Highlight clue
    const clue = document.querySelector(`.cw-clue[data-num="${wordId}"][data-dir="${dir}"]`);
    if (clue) {
        clue.classList.add('cw-clue-active');
        clue.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function handleCellInput(e, r, c) {
    let val = e.target.value;

    // Azerbaijani uppercase handling
    if (val.length > 0) {
        val = val.toLocaleUpperCase('az');
        // Handle İ/I for Azerbaijani
        if (val === 'I' && e.data === 'i') val = 'İ';
        e.target.value = val;
    }

    if (val) {
        // Check correctness → green if right
        if (val === e.target.dataset.correct) {
            e.target.style.color = '#16a34a';
        } else {
            e.target.style.color = '';
        }
        moveFocus(r, c, 1);
        checkWinCondition();
    } else {
        e.target.style.color = '';
    }
}

function handleCellKeydown(e, r, c) {
    if (e.key === 'Backspace') {
        if (!e.target.value) {
            moveFocus(r, c, -1);
        } else {
            e.target.value = '';
            e.target.style.color = '';
        }
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentDirection !== 'across') {
            currentDirection = 'across';
            handleCellFocus(r, c);
        } else {
            moveFocus(r, c, 1);
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentDirection !== 'across') {
            currentDirection = 'across';
            handleCellFocus(r, c);
        } else {
            moveFocus(r, c, -1);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentDirection !== 'down') {
            currentDirection = 'down';
            handleCellFocus(r, c);
        } else {
            moveFocus(r, c, 1);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentDirection !== 'down') {
            currentDirection = 'down';
            handleCellFocus(r, c);
        } else {
            moveFocus(r, c, -1);
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        navigateClue(e.shiftKey ? -1 : 1);
    }
}

function moveFocus(r, c, step) {
    const wrapper = document.querySelector(`.cw-cell[data-r="${r}"][data-c="${c}"]`);
    if (!wrapper) return;
    const wordId = wrapper.dataset[currentDirection];
    if (!wordId) return;

    const cells = Array.from(document.querySelectorAll(`.cw-cell[data-${currentDirection}="${wordId}"]`));
    const index = cells.indexOf(wrapper);
    const next = cells[index + step];
    if (next) {
        next.querySelector('input')?.focus();
    }
}

function checkWinCondition() {
    let allCorrect = true;
    const activeCells = document.querySelectorAll('.cw-cell.cw-active');
    for (const cell of activeCells) {
        const input = cell.querySelector('input');
        if (!input || input.value !== input.dataset.correct) {
            allCorrect = false;
            break;
        }
    }

    if (allCorrect && activeCells.length > 0) {
        setTimeout(() => {
            // Victory animation
            activeCells.forEach((cell, i) => {
                setTimeout(() => cell.classList.add('cw-solved'), i * 30);
            });
            setTimeout(() => alert('Təbriklər! Krossvord həll olundu! 🎉'), activeCells.length * 30 + 200);
        }, 100);
    }
}

function revealAnswers() {
    if (confirm('Bütün cavabları görmək istədiyinizə əminsiniz?')) {
        const activeCells = document.querySelectorAll('.cw-cell.cw-active');
        activeCells.forEach(cell => {
            const input = cell.querySelector('input');
            if (input) {
                input.value = input.dataset.correct;
                input.style.color = '#16a34a'; // mark as correct green
            }
        });
        checkWinCondition();
    }
}
