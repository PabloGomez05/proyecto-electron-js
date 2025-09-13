
const WORD_DATABASE = {
    animals: ['PERRO', 'GATO', 'LEON', 'TIGRE', 'ELEFANTE', 'JIRAFA', 'MONO', 'OSO', 'LOBO', 'ZORRO', 'CABALLO', 'VACA', 'CERDO', 'OVEJA', 'CONEJO'],
    countries: ['FRANCIA', 'ESPAÑA', 'BRASIL', 'JAPON', 'ITALIA', 'MEXICO', 'CANADA', 'CHINA', 'RUSIA', 'INDIA', 'ALEMANIA', 'PERU', 'CHILE', 'COLOMBIA', 'ARGENTINA'],
    science: ['ATOMO', 'CELULA', 'ENERGIA', 'MOLECULA', 'PROTON', 'ELECTRON', 'NEUTRON', 'GRAVEDAD', 'OXIGENO', 'CARBONO', 'HIDROGENO', 'CALCIO', 'HIERRO', 'PLATA', 'ORO'],
    sports: ['FUTBOL', 'TENIS', 'NATACION', 'ATLETISMO', 'CICLISMO', 'BOXEO', 'GOLF', 'RUGBY', 'HOCKEY', 'KARATE', 'JUDO', 'ESGRIMA', 'POLO', 'SURF', 'ESQUI']
};


const GAME_CONFIG = {
    easy: { size: 10, wordCount: 8, timeBonus: 50 },
    medium: { size: 12, wordCount: 10, timeBonus: 75 },
    hard: { size: 15, wordCount: 12, timeBonus: 100 }
};

const DIRECTIONS = [
    { dx: 1, dy: 0, name: 'horizontal' },      // →
    { dx: -1, dy: 0, name: 'horizontal-reverse' }, // ←
    { dx: 0, dy: 1, name: 'vertical' },        // ↓
    { dx: 0, dy: -1, name: 'vertical-reverse' }, // ↑
    { dx: 1, dy: 1, name: 'diagonal-down' },   // ↘
    { dx: -1, dy: -1, name: 'diagonal-up' },   // ↖
    { dx: 1, dy: -1, name: 'diagonal-up-right' }, // ↗
    { dx: -1, dy: 1, name: 'diagonal-down-left' }  // ↙
];

class WordSearchGame {
    constructor() {
        this.grid = [];
        this.words = [];
        this.foundWords = new Set();
        this.placedWords = [];
        this.size = 10;
        this.category = 'animals';
        this.difficulty = 'easy';
        this.score = 0;
        this.startTime = null;
        this.timeLimit = 0; 
        this.isPaused = false;
        this.isCompleted = false;
        this.timer = null;
        
        this.isSelecting = false;
        this.startCell = null;
        this.currentSelection = [];
        this.selectionDirection = null;
    }

    initializeGame(category = 'animals', difficulty = 'easy', timeLimit = 0) {
        this.category = category;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        
        const config = GAME_CONFIG[difficulty];
        this.size = config.size;
        this.foundWords.clear();
        this.placedWords = [];
        this.score = 0;
        this.isCompleted = false;
        this.isPaused = false;
        
        this.selectRandomWords(category, config.wordCount);
        
        this.generateGrid();
        
        this.placeWords();
        
        this.fillEmptySpaces();
        
        this.startTimer();
        
        return {
            grid: this.grid,
            words: this.words,
            size: this.size
        };
    }


    selectRandomWords(category, count) {
        const availableWords = [...WORD_DATABASE[category]];
        this.words = [];
        
        for (let i = 0; i < count && availableWords.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            this.words.push(availableWords.splice(randomIndex, 1)[0]);
        }
    }

    generateGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = {
                    letter: '',
                    isWordPart: false,
                    wordId: null,
                    row: i,
                    col: j
                };
            }
        }
    }

    placeWords() {
        this.placedWords = [];
        
        for (let wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
            const word = this.words[wordIndex];
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
                const startRow = Math.floor(Math.random() * this.size);
                const startCol = Math.floor(Math.random() * this.size);

                if (this.canPlaceWord(word, startRow, startCol, direction)) {
                    this.placeWord(word, startRow, startCol, direction, wordIndex);
                    placed = true;
                }
                attempts++;
            }

            if (!placed) {
                console.warn(`No se pudo colocar la palabra: ${word}`);
            }
        }
    }

    canPlaceWord(word, startRow, startCol, direction) {
        const { dx, dy } = direction;
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * dy;
            const col = startCol + i * dx;
            
            if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
                return false;
            }
            
            if (this.grid[row][col].letter !== '' && 
                this.grid[row][col].letter !== word[i]) {
                return false;
            }
        }
        
        return true;
    }


    placeWord(word, startRow, startCol, direction, wordId) {
        const { dx, dy } = direction;
        const wordInfo = {
            word: word,
            startRow: startRow,
            startCol: startCol,
            direction: direction,
            positions: [],
            id: wordId
        };

        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * dy;
            const col = startCol + i * dx;
            
            this.grid[row][col].letter = word[i];
            this.grid[row][col].isWordPart = true;
            this.grid[row][col].wordId = wordId;
            
            wordInfo.positions.push({ row, col });
        }

        this.placedWords.push(wordInfo);
    }

    fillEmptySpaces() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j].letter === '') {
                    this.grid[i][j].letter = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }


    startSelection(row, col) {
        if (this.isPaused || this.isCompleted) return false;
        
        this.isSelecting = true;
        this.startCell = { row, col };
        this.currentSelection = [{ row, col }];
        this.selectionDirection = null;
        
        return true;
    }

    updateSelection(row, col) {
        if (!this.isSelecting || this.isPaused || this.isCompleted) return [];
        
        const { row: startRow, col: startCol } = this.startCell;
        
        const deltaRow = row - startRow;
        const deltaCol = col - startCol;
        
        if (deltaRow === 0 && deltaCol === 0) {
            this.currentSelection = [this.startCell];
            return this.currentSelection;
        }

        let direction = null;
        if (deltaRow === 0) {
            direction = { dx: Math.sign(deltaCol), dy: 0 };
        } else if (deltaCol === 0) {
            direction = { dx: 0, dy: Math.sign(deltaRow) };
        } else if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
            direction = { dx: Math.sign(deltaCol), dy: Math.sign(deltaRow) };
        }

        if (direction) {
            this.selectionDirection = direction;
            this.currentSelection = this.getSelectionPath(startRow, startCol, row, col, direction);
        }

        return this.currentSelection;
    }

    // Obtener ruta de selección
    getSelectionPath(startRow, startCol, endRow, endCol, direction) {
        const path = [];
        const { dx, dy } = direction;
        
        let currentRow = startRow;
        let currentCol = startCol;
        
        while ((dx > 0 ? currentCol <= endCol : dx < 0 ? currentCol >= endCol : currentCol === endCol) &&
               (dy > 0 ? currentRow <= endRow : dy < 0 ? currentRow >= endRow : currentRow === endRow) &&
               currentRow >= 0 && currentRow < this.size &&
               currentCol >= 0 && currentCol < this.size) {
            
            path.push({ row: currentRow, col: currentCol });
            
            if (currentRow === endRow && currentCol === endCol) break;
            
            currentRow += dy;
            currentCol += dx;
        }
        
        return path;
    }

    endSelection() {
        if (!this.isSelecting) return null;
        
        this.isSelecting = false;
        
        if (this.currentSelection.length < 2) {
            this.currentSelection = [];
            return null;
        }

        const selectedWord = this.currentSelection
            .map(pos => this.grid[pos.row][pos.col].letter)
            .join('');
        const foundWord = this.checkValidWord(selectedWord, this.currentSelection);
        
        if (foundWord) {
            this.foundWords.add(foundWord.word);
            this.updateScore(foundWord);
            
            if (this.foundWords.size === this.words.length) {
                this.completeGame();
            }
            
            return foundWord;
        }

        this.currentSelection = [];
        return null;
    }

    
    checkValidWord(selectedWord, positions) {
        for (const placedWord of this.placedWords) {
            if (placedWord.word === selectedWord && !this.foundWords.has(selectedWord)) {
                if (this.positionsMatch(positions, placedWord.positions)) {
                    return placedWord;
                }
            }
        }

        const reversedWord = selectedWord.split('').reverse().join('');
        for (const placedWord of this.placedWords) {
            if (placedWord.word === reversedWord && !this.foundWords.has(reversedWord)) {
                const reversedPositions = [...placedWord.positions].reverse();
                if (this.positionsMatch(positions, reversedPositions)) {
                    return { ...placedWord, word: reversedWord };
                }
            }
        }

        return null;
    }

    positionsMatch(selected, wordPositions) {
        if (selected.length !== wordPositions.length) return false;
        
        return selected.every((pos, index) => 
            pos.row === wordPositions[index].row && 
            pos.col === wordPositions[index].col
        );
    }


    updateScore(foundWord) {
        const baseScore = foundWord.word.length * 10;
        const timeBonus = this.getTimeBonus();
        const difficultyMultiplier = this.difficulty === 'easy' ? 1 : this.difficulty === 'medium' ? 1.5 : 2;
        
        const wordScore = Math.round(baseScore * difficultyMultiplier + timeBonus);
        this.score += wordScore;
        
        return wordScore;
    }


    getTimeBonus() {
        if (!this.startTime || this.timeLimit === 0) return 0;
        
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, this.timeLimit - elapsed);
        const config = GAME_CONFIG[this.difficulty];
        
        return Math.round((remaining / this.timeLimit) * config.timeBonus);
    }


    completeGame() {
        this.isCompleted = true;
        this.stopTimer();
        
        const finalTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        const completionBonus = Math.round(this.score * 0.2); // 20% bonus
        this.score += completionBonus;
        
        return {
            completed: true,
            finalScore: this.score,
            totalTime: finalTime,
            completionBonus: completionBonus,
            wordsFound: this.foundWords.size,
            totalWords: this.words.length
        };
    }


    startTimer() {
        this.startTime = Date.now();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            if (!this.isPaused && !this.isCompleted) {
                const elapsed = (Date.now() - this.startTime) / 1000;
                
                if (this.timeLimit > 0 && elapsed >= this.timeLimit) {
                    this.timeOut();
                }
                
                if (typeof window !== 'undefined' && window.updateTimer) {
                    window.updateTimer(elapsed);
                }
            }
        }, 100);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }


    timeOut() {
        this.stopTimer();
        this.isCompleted = true;
        
        return {
            timeOut: true,
            finalScore: this.score,
            wordsFound: this.foundWords.size,
            totalWords: this.words.length
        };
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Pausado
            this.pauseTime = Date.now();
        } else {
            // Reanudado - ajustar tiempo de inicio
            const pauseDuration = Date.now() - this.pauseTime;
            this.startTime += pauseDuration;
        }
        
        return this.isPaused;
    }

    getGameState() {
        return {
            grid: this.grid,
            words: this.words,
            foundWords: Array.from(this.foundWords),
            score: this.score,
            category: this.category,
            difficulty: this.difficulty,
            isCompleted: this.isCompleted,
            isPaused: this.isPaused,
            timeLimit: this.timeLimit,
            currentTime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
            progress: (this.foundWords.size / this.words.length) * 100
        };
    }

    getHint(wordIndex) {
        if (wordIndex >= 0 && wordIndex < this.placedWords.length) {
            const wordInfo = this.placedWords[wordIndex];
            if (!this.foundWords.has(wordInfo.word)) {
                const firstPos = wordInfo.positions[0];
                const lastPos = wordInfo.positions[wordInfo.positions.length - 1];
                
                return {
                    word: wordInfo.word,
                    firstLetter: { row: firstPos.row, col: firstPos.col },
                    lastLetter: { row: lastPos.row, col: lastPos.col },
                    direction: wordInfo.direction.name
                };
            }
        }
        return null;
    }
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordSearchGame;
} else {
    window.WordSearchGame = WordSearchGame;
}