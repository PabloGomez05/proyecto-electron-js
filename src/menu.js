
const { ipcRenderer } = require('electron');

class MenuManager {
    constructor() {
        this.setupEventListeners();
        this.initializeMenu();
    }

    setupEventListeners() {
        // Botón Jugar
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.navigateToGame();
            });
        }

        // Botón Estadísticas
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showStats();
            });
        }

        // Botón Configuración
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Atajos de teclado
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'Enter':
                    if (event.target.classList.contains('menu-btn')) {
                        event.target.click();
                    } else {
                        this.navigateToGame();
                    }
                    break;
                case 's':
                case 'S':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.showStats();
                    }
                    break;
                case ',':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.showSettings();
                    }
                    break;
            }
        });

        // Efectos de hover mejorados
        this.addHoverEffects();
    }

    async navigateToGame() {
        console.log('Navigating to game...');
        
        // Mostrar feedback visual
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            playBtn.disabled = true;
        }

        try {
            // Comunicar con el proceso principal para navegar al juego
            await ipcRenderer.invoke('navigate-to-game');
        } catch (error) {
            console.error('Error al navegar al juego:', error);
            if (playBtn) {
                playBtn.innerHTML = '<i class="fas fa-play"></i> Jugar';
                playBtn.disabled = false;
            }
        }
    }

    async showStats() {
        console.log('Opening stats window...');
        
        try {
            await ipcRenderer.invoke('show-stats');
        } catch (error) {
            console.error('Error al abrir estadísticas:', error);
        }
    }

    async showSettings() {
        console.log('Opening settings window...');
        
        try {
            await ipcRenderer.invoke('show-settings');
        } catch (error) {
            console.error('Error al abrir configuración:', error);
        }
    }

    addHoverEffects() {
        const buttons = document.querySelectorAll('.menu-btn');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-3px) scale(1.02)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0) scale(1)';
            });

            button.addEventListener('mousedown', () => {
                button.style.transform = 'translateY(1px) scale(0.98)';
            });

            button.addEventListener('mouseup', () => {
                button.style.transform = 'translateY(-3px) scale(1.02)';
            });
        });
    }

    initializeMenu() {
        console.log('Menu initialized');
        
        // Cargar configuración guardada si existe
        this.loadUserPreferences();
        
        // Animación de entrada
        this.playEntryAnimation();
    }

    loadUserPreferences() {
        try {
            const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
            if (settings.playerName) {
                const subtitle = document.querySelector('.game-subtitle');
                if (subtitle) {
                    subtitle.textContent = `¡Hola ${settings.playerName}! Un desafío para tu mente`;
                }
            }
        } catch (error) {
            console.error('Error loading user preferences:', error);
        }
    }

    playEntryAnimation() {
        const container = document.querySelector('.menu-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                container.style.transition = 'all 0.8s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
        }

        // Animar botones con delay
        const buttons = document.querySelectorAll('.menu-btn');
        buttons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'translateX(-50px)';
            
            setTimeout(() => {
                button.style.transition = 'all 0.6s ease';
                button.style.opacity = '1';
                button.style.transform = 'translateX(0)';
            }, 300 + (index * 150));
        });
    }
}

// Inicializar el menú cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.menuManager = new MenuManager();
});

// Manejar eventos desde el proceso principal
ipcRenderer.on('menu-action', (event, action) => {
    switch(action) {
        case 'play':
            window.menuManager.navigateToGame();
            break;
        case 'stats':
            window.menuManager.showStats();
            break;
        case 'settings':
            window.menuManager.showSettings();
            break;
    }
});