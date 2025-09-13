
class GameStorage {
    constructor() {
        this.storageKeys = {
            SETTINGS: 'wordSearch_settings',
            STATISTICS: 'wordSearch_statistics',
            ACHIEVEMENTS: 'wordSearch_achievements',
            SAVED_GAMES: 'wordSearch_savedGames',
            USER_PROFILE: 'wordSearch_userProfile'
        };
        
        this.initializeStorage();
    }


    initializeStorage() {
        if (!this.getSettings()) {
            this.saveSettings({
                category: 'animals',
                difficulty: 'easy',
                timeLimit: 0,
                soundEnabled: true,
                animationsEnabled: true,
                theme: 'default',
                language: 'es',
                autoSave: true
            });
        }

        if (!this.getStatistics()) {
            this.saveStatistics({
                gamesPlayed: 0,
                gamesCompleted: 0,
                totalScore: 0,
                totalTime: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                longestStreak: 0,
                currentStreak: 0,
                fastestCompletion: 0,
                categoryStats: {
                    animals: { played: 0, completed: 0, bestScore: 0, bestTime: 0 },
                    countries: { played: 0, completed: 0, bestScore: 0, bestTime: 0 },
                    science: { played: 0, completed: 0, bestScore: 0, bestTime: 0 },
                    sports: { played: 0, completed: 0, bestScore: 0, bestTime: 0 }
                },
                difficultyStats: {
                    easy: { played: 0, completed: 0, bestScore: 0, bestTime: 0 },
                    medium: { played: 0, completed: 0, bestScore: 0, bestTime: 0 },
                    hard: { played: 0, completed: 0, bestScore: 0, bestTime: 0 }
                },
                wordsFoundHistory: [],
                lastPlayed: null
            });
        }

        // Logros por defecto
        if (!this.getAchievements()) {
            this.saveAchievements({
                firstWin: false,
                speedDemon: false,      // Completar en menos de 2 minutos
                perfectScore: false,    // Completar sin usar pistas
                categories: {
                    animals: false,
                    countries: false,
                    science: false,
                    sports: false
                },
                difficulties: {
                    easy: false,
                    medium: false,
                    hard: false
                },
                streaks: {
                    streak5: false,
                    streak10: false,
                    streak25: false
                },
                scores: {
                    score1000: false,
                    score5000: false,
                    score10000: false
                },
                special: {
                    noMistakes: false,    // Completar sin selecciones incorrectas
                    allCategories: false, // Completar al menos una vez en cada categoría
                    master: false         // Completar nivel difícil en todas las categorías
                }
            });
        }

        if (!this.getUserProfile()) {
            this.saveUserProfile({
                playerName: 'Jugador',
                createdAt: new Date().toISOString(),
                level: 1,
                experience: 0,
                totalPlayTime: 0,
                favoriteCategory: 'animals',
                preferredDifficulty: 'easy'
            });
        }
    }

    // === CONFIGURACIONES ===
    getSettings() {
        try {
            const settings = localStorage.getItem(this.storageKeys.SETTINGS);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error al cargar configuraciones:', error);
            return null;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error al guardar configuraciones:', error);
            return false;
        }
    }

    updateSetting(key, value) {
        const settings = this.getSettings() || {};
        settings[key] = value;
        return this.saveSettings(settings);
    }

    // === ESTADÍSTICAS ===
    getStatistics() {
        try {
            const stats = localStorage.getItem(this.storageKeys.STATISTICS);
            return stats ? JSON.parse(stats) : null;
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            return null;
        }
    }

    saveStatistics(statistics) {
        try {
            localStorage.setItem(this.storageKeys.STATISTICS, JSON.stringify(statistics));
            return true;
        } catch (error) {
            console.error('Error al guardar estadísticas:', error);
            return false;
        }
    }

    updateGameStatistics(gameResult) {
        const stats = this.getStatistics() || {};
        const { category, difficulty, score, timeElapsed, completed, wordsFound } = gameResult;

        stats.gamesPlayed++;
        stats.totalTime += timeElapsed;
        stats.lastPlayed = new Date().toISOString();

        if (completed) {
            stats.gamesCompleted++;
            stats.totalScore += score;
            stats.currentStreak++;
            
            if (score > stats.bestScore) {
                stats.bestScore = score;
            }

            if (stats.worstScore === 0 || score < stats.worstScore) {
                stats.worstScore = score;
            }

            if (stats.currentStreak > stats.longestStreak) {
                stats.longestStreak = stats.currentStreak;
            }

            if (stats.fastestCompletion === 0 || timeElapsed < stats.fastestCompletion) {
                stats.fastestCompletion = timeElapsed;
            }
        } else {
            stats.currentStreak = 0;
        }

        if (stats.gamesCompleted > 0) {
            stats.averageScore = Math.round(stats.totalScore / stats.gamesCompleted);
        }

        if (!stats.categoryStats[category]) {
            stats.categoryStats[category] = { played: 0, completed: 0, bestScore: 0, bestTime: 0 };
        }
        
        stats.categoryStats[category].played++;
        if (completed) {
            stats.categoryStats[category].completed++;
            if (score > stats.categoryStats[category].bestScore) {
                stats.categoryStats[category].bestScore = score;
            }
            if (stats.categoryStats[category].bestTime === 0 || timeElapsed < stats.categoryStats[category].bestTime) {
                stats.categoryStats[category].bestTime = timeElapsed;
            }
        }

        if (!stats.difficultyStats[difficulty]) {
            stats.difficultyStats[difficulty] = { played: 0, completed: 0, bestScore: 0, bestTime: 0 };
        }
        
        stats.difficultyStats[difficulty].played++;
        if (completed) {
            stats.difficultyStats[difficulty].completed++;
            if (score > stats.difficultyStats[difficulty].bestScore) {
                stats.difficultyStats[difficulty].bestScore = score;
            }
            if (stats.difficultyStats[difficulty].bestTime === 0 || timeElapsed < stats.difficultyStats[difficulty].bestTime) {
                stats.difficultyStats[difficulty].bestTime = timeElapsed;
            }
        }

        if (wordsFound && wordsFound.length > 0) {
            stats.wordsFoundHistory.push({
                date: new Date().toISOString(),
                category: category,
                difficulty: difficulty,
                words: wordsFound,
                score: score
            });

            if (stats.wordsFoundHistory.length > 100) {
                stats.wordsFoundHistory = stats.wordsFoundHistory.slice(-100);
            }
        }

        return this.saveStatistics(stats);
    }

    // === LOGROS ===
    getAchievements() {
        try {
            const achievements = localStorage.getItem(this.storageKeys.ACHIEVEMENTS);
            return achievements ? JSON.parse(achievements) : null;
        } catch (error) {
            console.error('Error al cargar logros:', error);
            return null;
        }
    }

    saveAchievements(achievements) {
        try {
            localStorage.setItem(this.storageKeys.ACHIEVEMENTS, JSON.stringify(achievements));
            return true;
        } catch (error) {
            console.error('Error al guardar logros:', error);
            return false;
        }
    }

    // Verificar y desbloquear logros
    checkAndUnlockAchievements(gameResult) {
        const achievements = this.getAchievements() || {};
        const stats = this.getStatistics() || {};
        const newAchievements = [];
        
        const { category, difficulty, score, timeElapsed, completed, perfectGame, noMistakes } = gameResult;

        if (completed) {
            // Primera victoria
            if (!achievements.firstWin) {
                achievements.firstWin = true;
                newAchievements.push({
                    id: 'firstWin',
                    title: '¡Primera Victoria!',
                    description: 'Completa tu primera sopa de letras',
                    icon: 'trophy'
                });
            }

            // Logro Demonio de la velocidad (menos de 2 minutos)
            if (timeElapsed < 120 && !achievements.speedDemon) {
                achievements.speedDemon = true;
                newAchievements.push({
                    id: 'speedDemon',
                    title: 'Demonio de la Velocidad',
                    description: 'Completa una sopa de letras en menos de 2 minutos',
                    icon: 'bolt'
                });
            }

            // Juego perfecto
            if (perfectGame && !achievements.perfectScore) {
                achievements.perfectScore = true;
                newAchievements.push({
                    id: 'perfectScore',
                    title: 'Puntuación Perfecta',
                    description: 'Completa una sopa sin usar pistas',
                    icon: 'star'
                });
            }

            // Sin errores
            if (noMistakes && !achievements.special.noMistakes) {
                achievements.special.noMistakes = true;
                newAchievements.push({
                    id: 'noMistakes',
                    title: 'Sin Errores',
                    description: 'Completa una sopa sin selecciones incorrectas',
                    icon: 'check-circle'
                });
            }

            // Logros por categoría
            if (!achievements.categories[category]) {
                achievements.categories[category] = true;
                newAchievements.push({
                    id: `category_${category}`,
                    title: `Maestro de ${category}`,
                    description: `Completa una sopa de letras de ${category}`,
                    icon: 'bookmark'
                });
            }

            // Logros por dificultad
            if (!achievements.difficulties[difficulty]) {
                achievements.difficulties[difficulty] = true;
                newAchievements.push({
                    id: `difficulty_${difficulty}`,
                    title: `${difficulty === 'easy' ? 'Principiante' : difficulty === 'medium' ? 'Intermedio' : 'Experto'}`,
                    description: `Completa una sopa de letras en dificultad ${difficulty}`,
                    icon: 'medal'
                });
            }

            // Logros por racha
            if (stats.currentStreak >= 5 && !achievements.streaks.streak5) {
                achievements.streaks.streak5 = true;
                newAchievements.push({
                    id: 'streak5',
                    title: 'Racha de 5',
                    description: 'Completa 5 sopas consecutivas',
                    icon: 'fire'
                });
            }

            if (stats.currentStreak >= 10 && !achievements.streaks.streak10) {
                achievements.streaks.streak10 = true;
                newAchievements.push({
                    id: 'streak10',
                    title: 'Racha de 10',
                    description: 'Completa 10 sopas consecutivas',
                    icon: 'fire'
                });
            }

            if (stats.currentStreak >= 25 && !achievements.streaks.streak25) {
                achievements.streaks.streak25 = true;
                newAchievements.push({
                    id: 'streak25',
                    title: 'Racha Legendaria',
                    description: 'Completa 25 sopas consecutivas',
                    icon: 'crown'
                });
            }

            // Logros por puntuación
            if (score >= 1000 && !achievements.scores.score1000) {
                achievements.scores.score1000 = true;
                newAchievements.push({
                    id: 'score1000',
                    title: 'Mil Puntos',
                    description: 'Obtén 1000 puntos en una sopa',
                    icon: 'target'
                });
            }

            if (score >= 5000 && !achievements.scores.score5000) {
                achievements.scores.score5000 = true;
                newAchievements.push({
                    id: 'score5000',
                    title: 'Cinco Mil Puntos',
                    description: 'Obtén 5000 puntos en una sopa',
                    icon: 'bullseye'
                });
            }

            if (score >= 10000 && !achievements.scores.score10000) {
                achievements.scores.score10000 = true;
                newAchievements.push({
                    id: 'score10000',
                    title: 'Diez Mil Puntos',
                    description: 'Obtén 10000 puntos en una sopa',
                    icon: 'gem'
                });
            }

            // Todas las categorías
            const allCategoriesCompleted = Object.values(achievements.categories).every(val => val === true);
            if (allCategoriesCompleted && !achievements.special.allCategories) {
                achievements.special.allCategories = true;
                newAchievements.push({
                    id: 'allCategories',
                    title: 'Explorador Completo',
                    description: 'Completa al menos una sopa en cada categoría',
                    icon: 'compass'
                });
            }

            //  Logro Maestro total
            const allDifficultiesCompleted = Object.values(achievements.difficulties).every(val => val === true);
            if (allCategoriesCompleted && allDifficultiesCompleted && !achievements.special.master) {
                achievements.special.master = true;
                newAchievements.push({
                    id: 'master',
                    title: 'Gran Maestro',
                    description: 'Completa todas las categorías en todas las dificultades',
                    icon: 'crown'
                });
            }
        }

        this.saveAchievements(achievements);
        return newAchievements;
    }

    // === PARTIDAS GUARDADAS ===
    getSavedGames() {
        try {
            const savedGames = localStorage.getItem(this.storageKeys.SAVED_GAMES);
            return savedGames ? JSON.parse(savedGames) : [];
        } catch (error) {
            console.error('Error al cargar partidas guardadas:', error);
            return [];
        }
    }

    saveGame(gameState, slotName = null) {
        try {
            const savedGames = this.getSavedGames();
            const gameData = {
                id: Date.now(),
                name: slotName || `Partida ${new Date().toLocaleString()}`,
                savedAt: new Date().toISOString(),
                gameState: gameState
            };

            savedGames.push(gameData);

            if (savedGames.length > 10) {
                savedGames.shift();
            }

            localStorage.setItem(this.storageKeys.SAVED_GAMES, JSON.stringify(savedGames));
            return gameData.id;
        } catch (error) {
            console.error('Error al guardar partida:', error);
            return null;
        }
    }

    loadGame(gameId) {
        try {
            const savedGames = this.getSavedGames();
            const gameData = savedGames.find(game => game.id === gameId);
            return gameData ? gameData.gameState : null;
        } catch (error) {
            console.error('Error al cargar partida:', error);
            return null;
        }
    }

    deleteGame(gameId) {
        try {
            const savedGames = this.getSavedGames();
            const filteredGames = savedGames.filter(game => game.id !== gameId);
            localStorage.setItem(this.storageKeys.SAVED_GAMES, JSON.stringify(filteredGames));
            return true;
        } catch (error) {
            console.error('Error al eliminar partida:', error);
            return false;
        }
    }

    // === PERFIL DE USUARIO ===
    getUserProfile() {
        try {
            const profile = localStorage.getItem(this.storageKeys.USER_PROFILE);
            return profile ? JSON.parse(profile) : null;
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            return null;
        }
    }

    saveUserProfile(profile) {
        try {
            localStorage.setItem(this.storageKeys.USER_PROFILE, JSON.stringify(profile));
            return true;
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            return false;
        }
    }

    updateUserProfile(updates) {
        const profile = this.getUserProfile() || {};
        Object.assign(profile, updates);
        return this.saveUserProfile(profile);
    }

    // === UTILIDADES ===
    exportData() {
        try {
            const data = {
                settings: this.getSettings(),
                statistics: this.getStatistics(),
                achievements: this.getAchievements(),
                userProfile: this.getUserProfile(),
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error al exportar datos:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.settings) this.saveSettings(data.settings);
            if (data.statistics) this.saveStatistics(data.statistics);
            if (data.achievements) this.saveAchievements(data.achievements);
            if (data.userProfile) this.saveUserProfile(data.userProfile);
            
            return true;
        } catch (error) {
            console.error('Error al importar datos:', error);
            return false;
        }
    }

    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }

    getStorageUsage() {
        let totalSize = 0;
        const usage = {};

        Object.entries(this.storageKeys).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            const size = data ? new Blob([data]).size : 0;
            usage[name] = size;
            totalSize += size;
        });

        return {
            total: totalSize,
            breakdown: usage,
            totalFormatted: this.formatBytes(totalSize)
        };
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStorage;
} else {
    window.GameStorage = GameStorage;
}