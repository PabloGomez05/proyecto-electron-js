// Verificar si estamos en el contexto correcto
if (typeof require !== 'undefined') {
    try {
        const { ipcRenderer } = require('electron');
        
        class WordSearchRenderer {
            constructor() {
                // Solo inicializar si estamos en la página de juego
                if (document.getElementById('word-grid')) {
                    this.game = new WordSearchGame();
                    this.storage = new GameStorage();
                    
                    this.elements = {};
                    this.initializeElements();
                    this.isMouseDown = false;
                    this.currentSelection = [];
                    this.selectionStartCell = null;
                    
                    this.timerInterval = null;
                    
                    this.setupEventListeners();
                    this.setupIPCListeners();
                    
                    this.loadSettings();
                    this.startNewGame();
                } else {
                    console.log('Game elements not found, skipping game initialization');
                }
            }

            initializeElements() {
                this.elements = {
                    // Header
                    currentCategory: document.getElementById('current-category'),
                    currentDifficulty: document.getElementById('current-difficulty'),
                    timer: document.getElementById('timer'),
                    score: document.getElementById('score'),
                    foundCounter: document.getElementById('found-counter'),
                    
                    // Controles
                    pauseBtn: document.getElementById('pause-btn'),
                    newGameBtn: document.getElementById('new-game-btn'),
                    settingsBtn: document.getElementById('settings-btn'),
                    
                    // Juego
                    wordGrid: document.getElementById('word-grid'),
                    wordsList: document.getElementById('words-list'),
                    progressFill: document.getElementById('progress-fill'),
                    selectionOverlay: document.getElementById('selection-overlay'),
                    gameMessage: document.getElementById('game-message'),
                    
                    // Configuración rápida
                    quickSettings: document.getElementById('quick-settings'),
                    categorySelect: document.getElementById('category-select'),
                    difficultySelect: document.getElementById('difficulty-select'),
                    timeLimitSelect: document.getElementById('time-limit-select'),
                    applySettings: document.getElementById('apply-settings'),
                    closeSettings: document.getElementById('close-settings'),
                    
                    // Loading
                    loading: document.getElementById('loading'),
                    
                    // Mensaje
                    messageIcon: document.querySelector('.message-icon'),
                    messageTitle: document.querySelector('.message-title'),
                    messageText: document.querySelector('.message-text'),
                    messageAction: document.getElementById('message-action')
                };
            }

            setupEventListeners() {
                if (!this.elements.newGameBtn) return;

                // Controles principales
                this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
                if (this.elements.pauseBtn) {
                    this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
                }
                if (this.elements.settingsBtn) {
                    this.elements.settingsBtn.addEventListener('click', () => this.showQuickSettings());
                }
                
                // Configuración rápida
                if (this.elements.applySettings) {
                    this.elements.applySettings.addEventListener('click', () => this.applySettings());
                }
                if (this.elements.closeSettings) {
                    this.elements.closeSettings.addEventListener('click', () => this.hideQuickSettings());
                }
                
                // Atajos de teclado
                document.addEventListener('keydown', (event) => this.handleKeyboard(event));
                
                // Eventos del juego
                if (this.elements.messageAction) {
                    this.elements.messageAction.addEventListener('click', () => this.handleMessageAction());
                }
                
                // Prevenir menú contextual en la grilla
                if (this.elements.wordGrid) {
                    this.elements.wordGrid.addEventListener('contextmenu', (e) => e.preventDefault());
                }
            }

            setupIPCListeners() {
                // Comandos desde el menú
                ipcRenderer.on('new-game', () => this.startNewGame());
                ipcRenderer.on('toggle-pause', () => this.togglePause());
                ipcRenderer.on('change-category', (event, category) => this.changeCategory(category));
                ipcRenderer.on('change-difficulty', (event, difficulty) => this.changeDifficulty(difficulty));
                ipcRenderer.on('save-game', (event, filePath) => this.saveGameToFile(filePath));
                ipcRenderer.on('load-game', (event, filePath) => this.loadGameFromFile(filePath));
            }

            loadSettings() {
                const settings = this.storage.getSettings();
                if (settings && this.elements.categorySelect) {
                    this.elements.categorySelect.value = settings.category;
                    this.elements.difficultySelect.value = settings.difficulty;
                    this.elements.timeLimitSelect.value = settings.timeLimit.toString();
                    
                    this.updateDisplays();
                }
            }

            async startNewGame() {
                this.showLoading();
                
                try {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const settings = this.storage.getSettings();
                    const gameData = this.game.initializeGame(
                        settings.category,
                        settings.difficulty,
                        settings.timeLimit
                    );
                    
                    this.generateGridHTML(gameData);
                    this.generateWordsListHTML(gameData.words);
                    this.updateDisplays();
                    this.setupGridEvents();
                    this.startTimer();
                    
                    ipcRenderer.invoke('show-notification', 
                        'Nueva partida', 
                        `Sopa de letras de ${settings.category} - ${settings.difficulty}`,
                        'success'
                    );
                    
                } catch (error) {
                    console.error('Error al iniciar juego:', error);
                    this.showMessage('error', 'Error', 'No se pudo iniciar el juego');
                } finally {
                    this.hideLoading();
                }
            }

            generateGridHTML(gameData) {
                const { grid, size } = gameData;
                
                if (!this.elements.wordGrid) return;
                
                this.elements.wordGrid.innerHTML = '';
                this.elements.wordGrid.className = `word-grid ${this.storage.getSettings().difficulty}`;
                
                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        const cell = document.createElement('div');
                        cell.className = 'grid-cell';
                        cell.dataset.row = row;
                        cell.dataset.col = col;
                        cell.textContent = grid[row][col].letter;
                        
                        this.elements.wordGrid.appendChild(cell);
                    }
                }
            }

            generateWordsListHTML(words) {
                if (!this.elements.wordsList) return;
                
                this.elements.wordsList.innerHTML = '';
                
                words.forEach((word, index) => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'word-item';
                    wordItem.dataset.wordIndex = index;
                    wordItem.textContent = word;
                    
                    wordItem.addEventListener('click', () => this.showWordHint(index));
                    
                    this.elements.wordsList.appendChild(wordItem);
                });
            }

            setupGridEvents() {
                if (!this.elements.wordGrid) return;
                
                const cells = this.elements.wordGrid.querySelectorAll('.grid-cell');
                
                cells.forEach(cell => {
                    // Mouse events
                    cell.addEventListener('mousedown', (e) => this.handleGridMouseDown(e));
                    cell.addEventListener('mouseenter', (e) => this.handleGridMouseEnter(e));
                    cell.addEventListener('mouseup', (e) => this.handleGridMouseUp(e));
                    
                    // Touch events para móviles
                    cell.addEventListener('touchstart', (e) => this.handleGridTouchStart(e));
                    cell.addEventListener('touchmove', (e) => this.handleGridTouchMove(e));
                    cell.addEventListener('touchend', (e) => this.handleGridTouchEnd(e));
                });
                
                // Eventos globales
                document.addEventListener('mouseup', () => this.endSelection());
                document.addEventListener('mouseleave', () => this.endSelection());
            }

            handleGridMouseDown(event) {
                event.preventDefault();
                const row = parseInt(event.target.dataset.row);
                const col = parseInt(event.target.dataset.col);
                
                if (this.game.startSelection(row, col)) {
                    this.isMouseDown = true;
                    this.updateSelection([{row, col}]);
                }
            }

            handleGridMouseEnter(event) {
                if (!this.isMouseDown) return;
                
                const row = parseInt(event.target.dataset.row);
                const col = parseInt(event.target.dataset.col);
                
                const selection = this.game.updateSelection(row, col);
                this.updateSelection(selection);
            }

            handleGridMouseUp(event) {
                if (!this.isMouseDown) return;
                this.endSelection();
            }

            handleGridTouchStart(event) {
                event.preventDefault();
                const touch = event.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.classList.contains('grid-cell')) {
                    const row = parseInt(element.dataset.row);
                    const col = parseInt(element.dataset.col);
                    this.game.startSelection(row, col);
                    this.updateSelection([{row, col}]);
                }
            }

            handleGridTouchMove(event) {
                event.preventDefault();
                const touch = event.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                if (element && element.classList.contains('grid-cell')) {
                    const row = parseInt(element.dataset.row);
                    const col = parseInt(element.dataset.col);
                    const selection = this.game.updateSelection(row, col);
                    this.updateSelection(selection);
                }
            }

            handleGridTouchEnd(event) {
                event.preventDefault();
                this.endSelection();
            }

            updateSelection(selection) {
                // Limpiar selección anterior
                document.querySelectorAll('.grid-cell.selecting').forEach(cell => {
                    cell.classList.remove('selecting');
                });

                // Aplicar nueva selección
                selection.forEach(pos => {
                    const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                    if (cell) {
                        cell.classList.add('selecting');
                    }
                });

                this.currentSelection = selection;
            }

            endSelection() {
                if (!this.isMouseDown) return;
                
                this.isMouseDown = false;
                const result = this.game.endSelection();
                
                // Limpiar selección visual
                document.querySelectorAll('.grid-cell.selecting').forEach(cell => {
                    cell.classList.remove('selecting');
                });

                if (result) {
                    this.handleWordFound(result);
                }
                
                this.currentSelection = [];
            }

            handleWordFound(wordInfo) {
                // Marcar palabra como encontrada
                const wordItem = document.querySelector(`[data-word-index="${this.game.words.indexOf(wordInfo.word)}"]`);
                if (wordItem) {
                    wordItem.classList.add('found');
                }

                // Marcar celdas como encontradas
                wordInfo.positions.forEach(pos => {
                    const cell = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                    if (cell) {
                        cell.classList.add('found');
                    }
                });

                this.updateDisplays();

                // Verificar si el juego está completo
                if (this.game.isCompleted) {
                    this.handleGameComplete();
                }
            }

            handleGameComplete() {
                const finalStats = this.game.getGameState();
                this.storage.updateGameStatistics({
                    category: finalStats.category,
                    difficulty: finalStats.difficulty,
                    score: finalStats.score,
                    timeElapsed: finalStats.currentTime,
                    completed: true,
                    wordsFound: Array.from(this.game.foundWords)
                });

                this.showMessage('success', 'Felicidades', 
                    `Has completado la sopa de letras con ${finalStats.score} puntos`);
            }

            updateDisplays() {
                if (!this.game) return;
                
                const gameState = this.game.getGameState();
                const settings = this.storage.getSettings();

                // Actualizar información del juego
                if (this.elements.currentCategory) {
                    this.elements.currentCategory.textContent = this.getCategoryName(gameState.category);
                }
                if (this.elements.currentDifficulty) {
                    this.elements.currentDifficulty.textContent = this.getDifficultyName(gameState.difficulty);
                }
                if (this.elements.score) {
                    this.elements.score.textContent = gameState.score;
                }
                if (this.elements.foundCounter) {
                    this.elements.foundCounter.textContent = `${gameState.foundWords.length}/${gameState.words.length}`;
                }

                // Actualizar barra de progreso
                if (this.elements.progressFill) {
                    this.elements.progressFill.style.width = `${gameState.progress}%`;
                    const progressText = document.querySelector('.progress-text');
                    if (progressText) {
                        progressText.textContent = `${Math.round(gameState.progress)}% completado`;
                    }
                }
            }

            startTimer() {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }

                const startTime = Date.now();
                this.timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    
                    if (this.elements.timer) {
                        this.elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            togglePause() {
                const isPaused = this.game.togglePause();
                const pauseBtn = this.elements.pauseBtn;
                
                if (pauseBtn) {
                    if (isPaused) {
                        pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        pauseBtn.title = 'Reanudar';
                    } else {
                        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        pauseBtn.title = 'Pausar';
                    }
                }

                // Mostrar/ocultar overlay de pausa
                const gameContainer = document.querySelector('.game-grid-container');
                if (gameContainer) {
                    if (isPaused) {
                        gameContainer.classList.add('game-paused');
                    } else {
                        gameContainer.classList.remove('game-paused');
                    }
                }
            }

            showQuickSettings() {
                if (this.elements.quickSettings) {
                    this.elements.quickSettings.classList.remove('hidden');
                }
            }

            hideQuickSettings() {
                if (this.elements.quickSettings) {
                    this.elements.quickSettings.classList.add('hidden');
                }
            }

            applySettings() {
                if (!this.elements.categorySelect) return;
                
                const newSettings = {
                    category: this.elements.categorySelect.value,
                    difficulty: this.elements.difficultySelect.value,
                    timeLimit: parseInt(this.elements.timeLimitSelect.value),
                    soundEnabled: true,
                    animationsEnabled: true,
                    theme: 'default',
                    language: 'es',
                    autoSave: true
                };

                this.storage.saveSettings(newSettings);
                this.hideQuickSettings();
                this.startNewGame();
            }

            handleKeyboard(event) {
                switch(event.code) {
                    case 'Space':
                        event.preventDefault();
                        this.togglePause();
                        break;
                    case 'KeyN':
                        if (event.ctrlKey) {
                            event.preventDefault();
                            this.startNewGame();
                        }
                        break;
                    case 'Escape':
                        this.hideQuickSettings();
                        break;
                }
            }

            showMessage(type, title, text) {
                if (!this.elements.gameMessage) return;
                
                const iconMap = {
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-triangle',
                    info: 'fas fa-info-circle'
                };

                if (this.elements.messageIcon) {
                    this.elements.messageIcon.className = `message-icon ${iconMap[type] || iconMap.info}`;
                }
                if (this.elements.messageTitle) {
                    this.elements.messageTitle.textContent = title;
                }
                if (this.elements.messageText) {
                    this.elements.messageText.textContent = text;
                }
                if (this.elements.messageAction) {
                    this.elements.messageAction.textContent = type === 'success' ? 'Nueva Partida' : 'Cerrar';
                }

                this.elements.gameMessage.classList.remove('hidden');
            }

            handleMessageAction() {
                if (this.elements.gameMessage) {
                    this.elements.gameMessage.classList.add('hidden');
                }
                
                // Si el mensaje es de éxito, iniciar nueva partida
                const actionBtn = this.elements.messageAction;
                if (actionBtn && actionBtn.textContent === 'Nueva Partida') {
                    this.startNewGame();
                }
            }

            showLoading() {
                if (this.elements.loading) {
                    this.elements.loading.classList.remove('hidden');
                }
            }

            hideLoading() {
                if (this.elements.loading) {
                    this.elements.loading.classList.add('hidden');
                }
            }

            getCategoryName(category) {
                const names = {
                    'animals': 'Animales',
                    'countries': 'Países',
                    'science': 'Ciencias',
                    'sports': 'Deportes'
                };
                return names[category] || category;
            }

            getDifficultyName(difficulty) {
                const names = {
                    'easy': 'Fácil',
                    'medium': 'Medio',
                    'hard': 'Difícil'
                };
                return names[difficulty] || difficulty;
            }

            showWordHint(wordIndex) {
                const hint = this.game.getHint(wordIndex);
                if (hint) {
                    // Destacar primera y última letra
                    const firstCell = document.querySelector(`[data-row="${hint.firstLetter.row}"][data-col="${hint.firstLetter.col}"]`);
                    const lastCell = document.querySelector(`[data-row="${hint.lastLetter.row}"][data-col="${hint.lastLetter.col}"]`);
                    
                    if (firstCell) firstCell.classList.add('highlighted');
                    if (lastCell) lastCell.classList.add('highlighted');
                    
                    setTimeout(() => {
                        if (firstCell) firstCell.classList.remove('highlighted');
                        if (lastCell) lastCell.classList.remove('highlighted');
                    }, 2000);
                }
            }
        }

        // Inicializar cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('word-grid')) {
                window.wordSearchRenderer = new WordSearchRenderer();
            }
        });

    } catch (error) {
        console.error('Error initializing renderer:', error);
    }
} else {
    console.log('Electron renderer context not available');
}