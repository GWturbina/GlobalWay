class CosmicIntro {
    constructor() {
        this.currentLang = 'ru';
        this.translations = window.cosmicIntroTranslations;
        this.init();
    }

    init() {
        this.createCosmicHTML();
        this.setupEventListeners();
        this.detectLanguage();
    }

    createCosmicHTML() {
        const cosmicIntro = document.getElementById('cosmic-intro');
        if (!cosmicIntro) return;

        cosmicIntro.innerHTML = `
            <div class="stars-background"></div>
            
            <!-- GWT центр -->
            <div class="gwt-center">GWT</div>
            
            <!-- Планеты -->
            <div class="cosmic-planet planet-club" data-topic="club"></div>
            <div class="cosmic-planet planet-mission" data-topic="mission"></div>
            <div class="cosmic-planet planet-goals" data-topic="goals"></div>
            <div class="cosmic-planet planet-roadmap" data-topic="roadmap"></div>
            <div class="cosmic-planet planet-projects" data-topic="projects"></div>
            
            <!-- Кнопка входа -->
            <button class="enter-dapp-btn" id="enterDapp">Войти в DApp</button>
            
            <!-- Modal для планет -->
            <div class="planet-modal" id="planetModal">
                <div class="planet-modal-content">
                    <h2 id="modalTitle"></h2>
                    <p id="modalText"></p>
                    <button class="modal-close-btn" id="modalClose">Закрыть</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Клики по планетам
        document.querySelectorAll('.cosmic-planet').forEach(planet => {
            planet.addEventListener('click', (e) => {
                const topic = e.target.dataset.topic;
                this.showPlanetInfo(topic);
            });
        });

        // Кнопка входа в DApp
        document.getElementById('enterDapp')?.addEventListener('click', () => {
            this.enterDApp();
        });

        // Закрытие modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closePlanetModal();
        });

        // Закрытие по клику вне modal
        document.getElementById('planetModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'planetModal') {
                this.closePlanetModal();
            }
        });
    }

    detectLanguage() {
        const lang = localStorage.getItem('language') || 'ru';
        this.currentLang = lang;
        this.updateLanguage();
    }

    updateLanguage() {
        const enterBtn = document.getElementById('enterDapp');
        if (enterBtn) {
            const texts = {
                en: 'Enter DApp',
                ru: 'Войти в DApp', 
                uk: 'Увійти в DApp'
            };
            enterBtn.textContent = texts[this.currentLang] || texts.ru;
        }
    }

    showPlanetInfo(topic) {
        const modal = document.getElementById('planetModal');
        const title = document.getElementById('modalTitle');
        const text = document.getElementById('modalText');
        
        if (!this.translations || !this.translations[this.currentLang]) {
            console.error('Translations not loaded');
            return;
        }

        const content = this.translations[this.currentLang][topic];
        if (content) {
            title.textContent = content.title;
            text.textContent = content.text;
            modal.classList.add('active');
        }
    }

    closePlanetModal() {
        const modal = document.getElementById('planetModal');
        modal.classList.remove('active');
    }

    enterDApp() {
        const cosmicIntro = document.getElementById('cosmic-intro');
        const app = document.getElementById('app');
        const loadingScreen = document.getElementById('loading-screen');

        // Скрываем интро
        cosmicIntro.classList.remove('active');
        
        // Показываем загрузку
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }

        // Через 2 секунды показываем приложение
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            if (app) {
                app.style.display = 'block';
            }
            
            // Инициализируем приложение
            if (window.app && window.app.init) {
                window.app.init();
            }
        }, 2000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.cosmicIntro = new CosmicIntro();
});
