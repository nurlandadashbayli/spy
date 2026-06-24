export class AzulUI {
    constructor(containerElement, callbacks) {
        this.container = containerElement;
        this.callbacks = callbacks || {};
        /* 
        Callbacks expected:
        - onFactoryTileClick: (factoryIdx, color)
        - onPatternLineClick: (lineIdx) -> lineIdx from 0 to 4
        - onFloorLineClick: ()
        */
        this.localPlayerId = null;
        this.gameState = null;
        this.players = null;
        
        // Selection state
        this.selectedFactoryIdx = null;
        this.selectedColor = null;

        // Emoji mapping for tiles (for now, eventually replace with CSS styling)
        this.COLOR_EMOJIS = {
            'blue': '🟦', 'yellow': '🟨', 'red': '🟥', 'green': '🟩', 'white': '⬜', 'first': '1️⃣'
        };

        // Cache elements
        this.initElements();
    }

    initElements() {
        this.opponentArea = this.container.querySelector('.azul-opponent-area');
        this.centerArea = this.container.querySelector('.azul-center-area');
        this.playerArea = this.container.querySelector('.azul-player-area');
    }

    updateState(gameState, players, localPlayerId) {
        this.gameState = gameState;
        this.players = players;
        this.localPlayerId = localPlayerId;
        this.updateHeader();
        this.render();
    }

    updateHeader() {
        if (!this.gameState) return;
        const roundEl = document.getElementById('azul-round-indicator');
        if (roundEl) roundEl.textContent = `Round ${this.gameState.round || 1}`;

        const statusEl = document.getElementById('azul-status-text');
        if (statusEl) {
            if (this.gameState.phase === 'game_over') {
                const winnerName = this.players[this.gameState.winner]?.name || 'Draw';
                statusEl.textContent = `🏆 Game Over! Winner: ${winnerName}`;
                statusEl.style.color = 'var(--warning)';
            } else if (this.gameState.turn === this.localPlayerId) {
                statusEl.textContent = `👉 Your turn — pick a tile!`;
                statusEl.style.color = 'var(--success)';
            } else {
                const activePlayer = this.players[this.gameState.turn];
                statusEl.textContent = `⏳ Waiting for ${activePlayer?.name || 'opponent'}...`;
                statusEl.style.color = 'var(--text-secondary)';
            }
        }
    }

    setSelection(factoryIdx, color) {
        this.selectedFactoryIdx = factoryIdx;
        this.selectedColor = color;
        // Re-render both factories (highlight selection) AND player board (show valid rows)
        this.renderFactories();
        this.renderPlayerBoard();
    }

    getSelectedTilesCount() {
        if (this.selectedFactoryIdx === null || !this.selectedColor) return 0;

        if (this.selectedFactoryIdx === -1) {
            return this.gameState.center.filter(t => t === this.selectedColor).length;
        } else {
            const f = this.gameState.factories[this.selectedFactoryIdx];
            return f ? f.filter(t => t === this.selectedColor).length : 0;
        }
    }

    render() {
        if (!this.gameState || !this.players) return;

        this.renderOpponentBoards();
        this.renderFactories();
        this.renderPlayerBoard();
    }

    renderOpponentBoards() {
        if (!this.opponentArea) return;
        this.opponentArea.innerHTML = '';
        
        const opponentIds = Object.keys(this.players).filter(id => id !== this.localPlayerId);
        
        opponentIds.forEach(oppId => {
            const oppBoard = this.createBoardElement(oppId, false);
            this.opponentArea.appendChild(oppBoard);
        });
    }

    renderFactories() {
        if (!this.centerArea) return;
        this.centerArea.innerHTML = '';

        // Render circular factories
        const factoriesContainer = document.createElement('div');
        factoriesContainer.className = 'azul-factories-circle-container';

        if (this.gameState.factories) {
            this.gameState.factories.forEach((factory, idx) => {
                const factoryEl = this.createFactoryElement(factory, idx);
                factoriesContainer.appendChild(factoryEl);
            });
        }

        // Render center pile
        const centerPileEl = this.createFactoryElement(this.gameState.center || [], -1, true);
        
        this.centerArea.appendChild(factoriesContainer);
        this.centerArea.appendChild(centerPileEl);
    }

    renderPlayerBoard() {
        if (!this.playerArea) return;
        this.playerArea.innerHTML = '';

        const playerBoard = this.createBoardElement(this.localPlayerId, true);
        this.playerArea.appendChild(playerBoard);
    }

    createFactoryElement(tiles, idx, isCenter = false) {
        const factoryEl = document.createElement('div');
        factoryEl.className = isCenter ? 'azul-center-pile' : 'azul-factory-circle';

        if (tiles && tiles.length > 0) {
            tiles.forEach(color => {
                const tileEl = document.createElement('div');
                tileEl.className = `azul-tile ${color}`;
                // For now use emoji, later use CSS
                // tileEl.textContent = this.COLOR_EMOJIS[color] || '';
                
                if (this.selectedFactoryIdx === idx && this.selectedColor === color) {
                    tileEl.classList.add('selected');
                }

                // Interaction
                const isMyTurn = this.gameState.turn === this.localPlayerId;
                if (isMyTurn && this.gameState.phase === 'drafting' && color !== 'first') {
                    tileEl.style.cursor = 'pointer';
                    tileEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (this.callbacks.onFactoryTileClick) {
                            this.callbacks.onFactoryTileClick(idx, color);
                        }
                    });
                }

                factoryEl.appendChild(tileEl);
            });
        }

        return factoryEl;
    }

    createBoardElement(playerId, isLocalPlayer) {
        const boardData = this.gameState[`players/${playerId}/board`] || this.players[playerId]?.board;
        if (!boardData) return document.createElement('div');

        const boardContainer = document.createElement('div');
        boardContainer.className = `azul-board-container ${isLocalPlayer ? 'local-player' : 'opponent'}`;

        const isMyTurn = this.gameState.turn === playerId;
        if (isMyTurn) {
            boardContainer.classList.add('is-turn');
        }

        // Header (Avatar, Name, Score)
        const header = document.createElement('div');
        header.className = 'azul-board-header';
        
        const pName = this.players[playerId]?.name || 'Unknown';
        const pScore = boardData.score || 0;
        
        // Calculate Horizontal, Vertical, Color bonuses for display
        let hCount = 0;
        let vCount = 0;
        let cCount = 0;
        
        if (boardData.wall) {
            // Horizontal
            for (let r = 0; r < 5; r++) {
                if (boardData.wall[r] && boardData.wall[r].every(x => x === true)) hCount++;
            }
            
            // Vertical
            for (let c = 0; c < 5; c++) {
                let isComplete = true;
                for (let r = 0; r < 5; r++) {
                    if (!boardData.wall[r] || boardData.wall[r][c] !== true) {
                        isComplete = false;
                        break;
                    }
                }
                if (isComplete) vCount++;
            }
            
            // Colors
            const WALL_COLORS = [
                ['blue', 'yellow', 'red', 'green', 'white'],
                ['white', 'blue', 'yellow', 'red', 'green'],
                ['green', 'white', 'blue', 'yellow', 'red'],
                ['red', 'green', 'white', 'blue', 'yellow'],
                ['yellow', 'red', 'green', 'white', 'blue']
            ];
            const COLORS = ['blue', 'yellow', 'red', 'green', 'white'];
            COLORS.forEach(color => {
                let isComplete = true;
                for (let r = 0; r < 5; r++) {
                    const colIdx = WALL_COLORS[r].indexOf(color);
                    if (!boardData.wall[r] || boardData.wall[r][colIdx] !== true) {
                        isComplete = false;
                        break;
                    }
                }
                if (isComplete) cCount++;
            });
        }

        header.innerHTML = `
            <div class="azul-avatar"></div>
            <div class="azul-name-score">
                <span class="azul-name">${pName}</span>
                <div class="azul-score-label">Score: <span class="azul-score">${pScore}</span></div>
            </div>
            <div class="azul-stats">
                H ${hCount} V ${vCount} C ${cCount}
            </div>
        `;

        // Board Main Grid (Pattern Lines + Wall)
        const boardMain = document.createElement('div');
        boardMain.className = 'azul-board-main';

        const patternLinesEl = this.createPatternLines(boardData.patternLines, isLocalPlayer, boardData.wall);
        const wallEl = this.createWall(boardData.wall);

        boardMain.appendChild(patternLinesEl);
        boardMain.appendChild(wallEl);

        // Floor Line
        const floorLineEl = this.createFloorLine(boardData.floor, isLocalPlayer);

        if (isLocalPlayer) {
            // Re-order based on screenshot: 
            // Player board: pattern/wall, floor, header at bottom?
            // Wait, screenshot shows:
            // Opponent: Header, Pattern/Wall, Floor
            // Player: Pattern/Wall, Floor, Header
            boardContainer.appendChild(boardMain);
            boardContainer.appendChild(floorLineEl);
            boardContainer.appendChild(header);
        } else {
            boardContainer.appendChild(header);
            boardContainer.appendChild(boardMain);
            boardContainer.appendChild(floorLineEl);
        }

        return boardContainer;
    }

    createPatternLines(patternLines, isLocalPlayer, wall) {
        const container = document.createElement('div');
        container.className = 'azul-pattern-lines';

        for (let i = 0; i < 5; i++) {
            const lineData = patternLines ? patternLines[i] : { color: null, count: 0 };
            const capacity = i + 1;
            
            const lineEl = document.createElement('div');
            lineEl.className = 'azul-pattern-line-row';

            // Add cells right-to-left visual
            for (let j = capacity - 1; j >= 0; j--) {
                const cell = document.createElement('div');
                cell.className = 'azul-pattern-cell';
                
                if (j < lineData.count && lineData.color) {
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${lineData.color}`;
                    cell.appendChild(tile);
                }
                
                lineEl.appendChild(cell);
            }

            // Interaction for local player
            const isMyTurn = this.gameState.turn === this.localPlayerId;
            if (isLocalPlayer && isMyTurn && this.selectedColor) {
                // Determine validity
                const wallColorsInRow = [
                    ['blue', 'yellow', 'red', 'green', 'white'],
                    ['white', 'blue', 'yellow', 'red', 'green'],
                    ['green', 'white', 'blue', 'yellow', 'red'],
                    ['red', 'green', 'white', 'blue', 'yellow'],
                    ['yellow', 'red', 'green', 'white', 'blue']
                ][i];
                const colIdx = wallColorsInRow.indexOf(this.selectedColor);
                const hasTileOnWall = wall && wall[i] && wall[i][colIdx] === true;
                const emptyOrMatches = lineData.count === 0 || lineData.color === this.selectedColor;
                const isNotFull = lineData.count < capacity;

                if (!hasTileOnWall && emptyOrMatches && isNotFull) {
                    lineEl.style.cursor = 'pointer';
                    lineEl.addEventListener('click', () => {
                        // Capture state at click time before anything changes
                        const clickedFactoryIdx = this.selectedFactoryIdx;
                        const clickedColor = this.selectedColor;
                        const count = this.getSelectedTilesCount();
                        const tilesToMove = Array(count).fill(clickedColor);

                        // Fire placement IMMEDIATELY — do not wait for animation
                        if (this.callbacks.onPatternLineClick) {
                            this.callbacks.onPatternLineClick(i);
                        }

                        // Run animation as purely visual feedback (non-blocking)
                        let sourceEl = null;
                        if (clickedFactoryIdx === -1) {
                            sourceEl = this.container.querySelector('.azul-center-pile');
                        } else {
                            sourceEl = this.container.querySelectorAll('.azul-factory-circle')[clickedFactoryIdx];
                        }
                        if (sourceEl && count > 0) {
                            this.animateTileDrafting(sourceEl, lineEl, tilesToMove, null);
                        }
                    });
                    
                    // Hover effect logic
                    lineEl.addEventListener('mouseenter', () => {
                        lineEl.classList.add('highlight-target');
                    });
                    lineEl.addEventListener('mouseleave', () => {
                        lineEl.classList.remove('highlight-target');
                    });
                } else {
                    lineEl.style.opacity = '0.5'; // Dim invalid rows visually
                    lineEl.style.cursor = 'not-allowed';
                }
            }

            container.appendChild(lineEl);
        }

        return container;
    }

    createWall(wall) {
        const container = document.createElement('div');
        container.className = 'azul-wall-grid';

        const WALL_PATTERN = [
            ['blue', 'yellow', 'red', 'green', 'white'],
            ['white', 'blue', 'yellow', 'red', 'green'],
            ['green', 'white', 'blue', 'yellow', 'red'],
            ['red', 'green', 'white', 'blue', 'yellow'],
            ['yellow', 'red', 'green', 'white', 'blue']
        ];

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const color = WALL_PATTERN[r][c];
                const isFilled = wall && wall[r] && wall[r][c];
                
                const cell = document.createElement('div');
                cell.className = `azul-wall-cell color-${color} ${isFilled ? 'filled' : 'empty'}`;
                
                if (isFilled) {
                    const tile = document.createElement('div');
                    tile.className = `azul-tile ${color}`;
                    cell.appendChild(tile);
                }
                
                container.appendChild(cell);
            }
        }

        return container;
    }

    createFloorLine(floorLine, isLocalPlayer) {
        const container = document.createElement('div');
        container.className = 'azul-floor-line';

        const penalties = [-1, -1, -2, -2, -2, -3, -3];
        const currentCount = floorLine ? floorLine.length : 0;

        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'azul-floor-cell';
            
            // Penalty number overlay
            const penaltyNum = document.createElement('span');
            penaltyNum.className = 'penalty-num';
            penaltyNum.textContent = penalties[i];
            cell.appendChild(penaltyNum);

            if (i < currentCount) {
                const color = floorLine[i];
                const tile = document.createElement('div');
                tile.className = `azul-tile ${color}`;
                cell.appendChild(tile);
            }

            container.appendChild(cell);
        }

        // Interaction for local player to dump to floor explicitly
        const isMyTurn = this.gameState.turn === this.localPlayerId;
        if (isLocalPlayer && isMyTurn && this.selectedColor) {
            container.style.cursor = 'pointer';
            container.addEventListener('click', () => {
                // Capture state at click time
                const clickedFactoryIdx = this.selectedFactoryIdx;
                const clickedColor = this.selectedColor;
                const count = this.getSelectedTilesCount();
                const tilesToMove = Array(count).fill(clickedColor);

                // Fire placement IMMEDIATELY — do not wait for animation
                if (this.callbacks.onFloorLineClick) {
                    this.callbacks.onFloorLineClick();
                }

                // Run animation as purely visual feedback (non-blocking)
                let sourceEl = null;
                if (clickedFactoryIdx === -1) {
                    sourceEl = this.container.querySelector('.azul-center-pile');
                } else {
                    sourceEl = this.container.querySelectorAll('.azul-factory-circle')[clickedFactoryIdx];
                }
                if (sourceEl && count > 0) {
                    this.animateTileDrafting(sourceEl, container, tilesToMove, null);
                }
            });
            container.addEventListener('mouseenter', () => {
                container.classList.add('highlight-target');
            });
            container.addEventListener('mouseleave', () => {
                container.classList.remove('highlight-target');
            });
        }

        return container;
    }

    animateTileDrafting(fromElement, toElementContainer, tilesToMove, onComplete) {
        // Implementation for drafting animation
        // We will do a generic flying animation
        
        // 1. Get bounding boxes
        const fromRect = fromElement.getBoundingClientRect();
        const toRect = toElementContainer.getBoundingClientRect();
        
        // Create flying copies
        const flyingTiles = [];
        tilesToMove.forEach((color, i) => {
            const flyer = document.createElement('div');
            flyer.className = `azul-tile ${color} flying-tile`;
            flyer.style.position = 'fixed';
            flyer.style.left = `${fromRect.left + (i * 10)}px`; // slight offset
            flyer.style.top = `${fromRect.top + (i * 5)}px`;
            flyer.style.zIndex = '9999';
            flyer.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            document.body.appendChild(flyer);
            flyingTiles.push(flyer);
        });

        // Trigger reflow
        if (flyingTiles.length > 0) {
            void flyingTiles[0].offsetWidth;
        }

        // Animate
        flyingTiles.forEach((flyer, i) => {
            flyer.style.left = `${toRect.left + (i * 30)}px`;
            flyer.style.top = `${toRect.top}px`;
            flyer.style.transform = 'scale(0.8)';
            flyer.style.opacity = '0.5';
        });

        // Cleanup
        setTimeout(() => {
            flyingTiles.forEach(f => f.remove());
            if (onComplete) onComplete();
        }, 600);
    }
}
