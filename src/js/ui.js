// src/js/ui.js

const UI = {
    // Текущая активная страница
    currentPage: 'dashboard',
    
    // Переводы
    translations: {},
    currentLanguage: 'en',
    
    // Флаги состояния
    isLoading: false,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    
    // PWA состояние
    pwa: {
        deferredPrompt: null,
        isInstalled: false,
        isStandalone: false,
        serviceWorkerReady: false
    },

    // Инициализация UI
    async init() {
        console.log('UI: Initializing...');
        
        // Загрузка переводов
        await this.loadTranslations();
        
        // Определение типа устройства
        this.detectDevice();
        
        // Инициализация PWA
        await this.initPWA();
        
        // Загрузка сохраненного языка
        const savedLanguage = localStorage.getItem('language') || 'en';
        this.setLanguage(savedLanguage);
        
        // Загрузка HTML компонентов
        await this.loadComponents();
        
        // Установка обработчиков событий
        this.setupEventListeners();
        
        // Обработка URL параметров
        this.handleUrlParams();
        
        // Показ начальной страницы
        this.showPage('dashboard');
        
        // Проверка темы
        this.initTheme();
        
        // Скрытие загрузочного экрана
        this.hideLoadingScreen();
        
        console.log('UI: Initialized successfully');
    },

    // Инициализация PWA функций
    async initPWA() {
        console.log('UI: Initializing PWA...');
        
        // Проверка поддержки Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Обновление Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
                this.pwa.serviceWorkerReady = true;
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }

        // Проверка standalone режима
        this.pwa.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                               window.navigator.standalone ||
                               document.referrer.includes('android-app://');

        // Обработчик для установки PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.pwa.deferredPrompt = e;
            this.showInstallButton();
        });

        // Обработчик успешной установки
        window.addEventListener('appinstalled', () => {
            this.pwa.isInstalled = true;
            this.hideInstallButton();
            this.showNotification('App installed successfully!', 'success');
        });

        // Слушатель сообщений от Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
        }
    },

    // Обработка сообщений от Service Worker
    handleServiceWorkerMessage(data) {
        switch (data.type) {
            case 'CACHE_UPDATED':
                this.showNotification('App updated! Refresh to see changes.', 'info');
                break;
            case 'CACHE_CLEARED':
                this.showNotification('Cache cleared successfully', 'info');
                break;
            case 'SYNC_COMPLETE':
                console.log('Background sync completed:', data.data);
                break;
            case 'BACKGROUND_SYNC_COMPLETE':
                console.log('Background sync completed at:', new Date(data.timestamp));
                break;
        }
    },

    // Показ кнопки установки PWA
    showInstallButton() {
        const installBtn = document.getElementById('installPWA');
        if (installBtn && !this.pwa.isInstalled) {
            installBtn.style.display = 'block';
            installBtn.onclick = () => this.installPWA();
        }
    },

    // Скрытие кнопки установки
    hideInstallButton() {
        const installBtn = document.getElementById('installPWA');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    },

    // Установка PWA
    async installPWA() {
        if (this.pwa.deferredPrompt) {
            this.pwa.deferredPrompt.prompt();
            const { outcome } = await this.pwa.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('PWA installation accepted');
            } else {
                console.log('PWA installation dismissed');
            }
            
            this.pwa.deferredPrompt = null;
            this.hideInstallButton();
        }
    },

    // Показ уведомления об обновлении
    showUpdateNotification() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>New version available!</span>
                <button onclick="UI.updateApp()">Update</button>
                <button onclick="this.parentElement.parentElement.remove()">Later</button>
            </div>
        `;
        document.body.appendChild(updateBanner);
    },

    // Обновление приложения
    updateApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            });
        }
    },

    // Определение устройства
    detectDevice() {
        const width = window.innerWidth;
        this.isMobile = width < 768;
        this.isTablet = width >= 768 && width < 1024;
        this.isDesktop = width >= 1024;
        
        // Обновление класса body
        document.body.className = document.body.className.replace(/\b(mobile|tablet|desktop)\b/g, '');
        if (this.isMobile) {
            document.body.classList.add('mobile');
        } else if (this.isTablet) {
            document.body.classList.add('tablet');
        } else {
            document.body.classList.add('desktop');
        }
        
        // Адаптация навигации
        this.adaptNavigation();
        
        // Слушатель изменения размера окна
        window.addEventListener('resize', debounce(() => {
            const oldIsMobile = this.isMobile;
            this.detectDevice();
            
            // Если изменился тип устройства
            if (oldIsMobile !== this.isMobile) {
                this.handleDeviceChange();
            }
        }, 250));
    },

    // Адаптация навигации под устройство
    adaptNavigation() {
        const nav = document.getElementById('mainNavigation');
        if (!nav) return;

        if (this.isMobile) {
            nav.classList.add('bottom-nav', 'mobile-nav');
            nav.classList.remove('top-nav', 'desktop-nav');
            
            // Добавление hamburger меню если нужно
            this.addHamburgerMenu();
        } else {
            nav.classList.add('top-nav', 'desktop-nav');
            nav.classList.remove('bottom-nav', 'mobile-nav');
            
            this.removeHamburgerMenu();
        }
    },

    // Добавление hamburger меню
    addHamburgerMenu() {
        if (document.querySelector('.hamburger-menu')) return;

        const hamburger = document.createElement('div');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = `
            <div class="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        hamburger.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        const nav = document.getElementById('mainNavigation');
        if (nav) {
            nav.insertBefore(hamburger, nav.firstChild);
        }
    },

    // Удаление hamburger меню
    removeHamburgerMenu() {
        const hamburger = document.querySelector('.hamburger-menu');
        if (hamburger) {
            hamburger.remove();
        }
    },

    // Переключение мобильного меню
    toggleMobileMenu() {
        const nav = document.getElementById('mainNavigation');
        if (nav) {
            nav.classList.toggle('menu-open');
        }
    },

    // Обработка изменения устройства
    handleDeviceChange() {
        console.log('Device changed:', this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop');
        
        // Принудительное обновление компонентов
        this.refreshCurrentPage();
    },

    // Обновление текущей страницы
    refreshCurrentPage() {
        this.loadPageData(this.currentPage);
    },

    // Загрузка переводов
    async loadTranslations() {
        try {
            const languages = ['en', 'ru', 'uk'];
            for (const lang of languages) {
                const response = await fetch(`/translations/${lang}.json`);
                if (response.ok) {
                    this.translations[lang] = await response.json();
                } else {
                    console.warn(`Failed to load ${lang} translations`);
                }
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    },

    // Установка языка
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = lang;
        }
        
        this.updatePageTranslations();
        
        // Установка атрибута языка для HTML
        document.documentElement.lang = lang;
    },

    // Обновление переводов на странице
    updatePageTranslations() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });
        
        // Обновление placeholder'ов
        const placeholders = document.querySelectorAll('[data-translate-placeholder]');
        placeholders.forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    },

    // Получение перевода
    getTranslation(key) {
        return this.translations[this.currentLanguage]?.[key] || 
               this.translations['en']?.[key] || 
               key;
    },

    // Инициализация темы
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
        
        // Автоматическое переключение темы по системным настройкам
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    // Установка темы
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
        
        // Обновление цвета статус бара для мобильных устройств
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1a1a2e' : '#ffffff';
        }
    },

    // Переключение темы
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    // Загрузка HTML компонентов
    async loadComponents() {
        const pages = ['dashboard', 'partners', 'matrix', 'tokens', 'settings', 'projects', 'admin'];
        
        const loadPromises = pages.map(async (page) => {
            try {
                const response = await fetch(`/components/${page}.html`);
                if (response.ok) {
                    const html = await response.text();
                    const pageElement = document.getElementById(page);
                    if (pageElement) {
                        pageElement.innerHTML = html;
                    }
                } else {
                    console.warn(`Failed to load ${page} component`);
                }
            } catch (error) {
                console.error(`Error loading ${page} component:`, error);
            }
        });
        
        await Promise.all(loadPromises);
        console.log('Components loaded');
    },

    // Обработка URL параметров
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page');
        const ref = urlParams.get('ref');
        
        // Если есть реферальная ссылка, она уже обработана в Web3Module
        if (ref) {
            console.log('Referral link detected:', ref);
        }
        
        // Если указана страница в URL
        if (page && this.isValidPage(page)) {
            this.currentPage = page;
        }
    },

    // Проверка валидности страницы
    isValidPage(page) {
        const validPages = ['dashboard', 'partners', 'matrix', 'tokens', 'settings', 'projects', 'admin'];
        return validPages.includes(page);
    },

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопка подключения кошелька
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                await this.connectWallet();
            });
        }

        // Кнопка отключения кошелька
        const disconnectBtn = document.getElementById('disconnectWallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                Web3Module.disconnect();
            });
        }

        // Навигация
        document.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                const page = navBtn.getAttribute('data-page');
                if (page) {
                    this.showPage(page);
                    // Закрытие мобильного меню
                    if (this.isMobile) {
                        document.getElementById('mainNavigation')?.classList.remove('menu-open');
                    }
                }
            }
        });

        // Смена языка
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }

        // Переключение темы
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                this.toggleTheme();
            });
        }

        // Закрытие модальных окон
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close, .cancel-btn')) {
                this.closeAllModals();
            }
            
            // Клик вне модального окна
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Escape для закрытия модалок
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Обработка форм
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e);
        });

        // Копирование в буфер обмена
        document.addEventListener('click', (e) => {
            if (e.target.matches('.copy-btn, [data-copy]')) {
                const text = e.target.getAttribute('data-copy') || 
                           e.target.previousElementSibling?.textContent ||
                           e.target.textContent;
                this.copyToClipboard(text);
            }
        });

        // Pull-to-refresh для мобильных устройств
        if (this.isMobile && 'serviceWorker' in navigator) {
            this.setupPullToRefresh();
        }

        // Свайп навигация для мобильных устройств
        if (this.isMobile) {
            this.setupSwipeNavigation();
        }
    },

    // Pull-to-refresh функционал
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (pulling) {
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > 100) {
                    // Показать индикатор обновления
                    this.showPullToRefreshIndicator();
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (pulling && (currentY - startY) > 100) {
                this.refreshApp();
            }
            pulling = false;
            this.hidePullToRefreshIndicator();
        });
    },

    // Индикатор pull-to-refresh
    showPullToRefreshIndicator() {
        let indicator = document.getElementById('pullToRefreshIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pullToRefreshIndicator';
            indicator.className = 'pull-to-refresh-indicator';
            indicator.textContent = 'Release to refresh';
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    },

    hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pullToRefreshIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    },

    // Обновление приложения
    async refreshApp() {
        this.showNotification('Refreshing...', 'info');
        
        try {
            // Обновление данных пользователя
            if (Web3Module.state.isConnected) {
                await ContractsModule.loadUserData(true);
            }
            
            // Обновление кэша Service Worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                registration.active?.postMessage({ type: 'UPDATE_CACHE' });
            }
            
            this.refreshCurrentPage();
            this.showNotification('Refreshed successfully', 'success');
        } catch (error) {
            console.error('Refresh error:', error);
            this.showNotification('Refresh failed', 'error');
        }
    },

    // Свайп навигация
    setupSwipeNavigation() {
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            // Если горизонтальный свайп больше вертикального
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Свайп вправо - назад
                    this.navigateBack();
                } else {
                    // Свайп влево - вперед
                    this.navigateForward();
                }
            }
        });
    },

    // Навигация назад
    navigateBack() {
        // Логика навигации назад по страницам
        const pages = ['dashboard', 'partners', 'matrix', 'tokens', 'settings', 'projects'];
        const currentIndex = pages.indexOf(this.currentPage);
        if (currentIndex > 0) {
            this.showPage(pages[currentIndex - 1]);
        }
    },

    // Навигация вперед
    navigateForward() {
        // Логика навигации вперед по страницам
        const pages = ['dashboard', 'partners', 'matrix', 'tokens', 'settings', 'projects'];
        const currentIndex = pages.indexOf(this.currentPage);
        if (currentIndex < pages.length - 1) {
            this.showPage(pages[currentIndex + 1]);
        }
    }

    // Подключение кошелька с улучшенной обработкой
    async connectWallet() {
        try {
            this.showLoading();
            const success = await Web3Module.connect();
            
            if (success) {
                // Показ приветственного сообщения
                const userId = Web3Module.getUserId();
                this.showNotification(`Welcome! Your ID: GW${userId}`, 'success');
                
                // Обработка pending sponsor из реферальной ссылки
                const pendingSponsor = localStorage.getItem('pendingSponsor');
                if (pendingSponsor && Web3Module.state.account) {
                    this.showSponsorConfirmation(pendingSponsor);
                }
            }
        } catch (error) {
            console.error('Connect wallet error:', error);
            this.showNotification('Failed to connect wallet', 'error');
        } finally {
            this.hideLoading();
        }
    },

    // Подтверждение спонсора из реферальной ссылки
    showSponsorConfirmation(sponsorAddress) {
        const modal = this.createModal('sponsor-confirmation', {
            title: 'Sponsor Detected',
            content: `
                <div class="sponsor-info">
                    <p>You came from a referral link!</p>
                    <p><strong>Sponsor:</strong> ${this.formatAddress(sponsorAddress)}</p>
                    <p>Register with this sponsor?</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="UI.registerWithSponsor('${sponsorAddress}')">
                        Register
                    </button>
                    <button class="btn-secondary" onclick="UI.closeModal('sponsor-confirmation')">
                        Skip
                    </button>
                </div>
            `
        });
        this.showModal('sponsor-confirmation');
    },

    // Регистрация со спонсором
    async registerWithSponsor(sponsorAddress) {
        this.closeModal('sponsor-confirmation');
        
        if (ContractsModule.initialized) {
            const success = await ContractsModule.register(sponsorAddress);
            if (success) {
                localStorage.removeItem('pendingSponsor');
                localStorage.removeItem('referralPrefix');
                localStorage.removeItem('referralId');
            }
        } else {
            this.showNotification('Contracts not ready, please try again', 'warning');
        }
    },

    // Показ страницы
    showPage(pageName) {
        // Проверка доступа к админке
        if (pageName === 'admin' && !Web3Module.isOwner()) {
            this.showNotification('Access denied', 'error');
            return;
        }

        // Обновление URL без перезагрузки
        const url = new URL(window.location);
        url.searchParams.set('page', pageName);
        window.history.pushState({}, '', url);

        // Скрытие всех страниц
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });

        // Показ выбранной страницы
        const page = document.getElementById(pageName);
        if (page) {
            page.classList.add('active');
            page.classList.remove('hidden');
            this.currentPage = pageName;

            // Обновление активной кнопки навигации
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-page') === pageName) {
                    btn.classList.add('active');
                }
            });

            // Анимация появления страницы
            this.animatePageTransition(page);

            // Загрузка данных страницы
            this.loadPageData(pageName);

            // Аналитика (если нужна)
            this.trackPageView(pageName);
        }
    },

    // Анимация перехода страницы
    animatePageTransition(page) {
        page.style.opacity = '0';
        page.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            page.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            page.style.opacity = '1';
            page.style.transform = 'translateY(0)';
        });
    },

    // Отслеживание просмотров страниц
    trackPageView(pageName) {
        // Сохранение в localStorage для аналитики
        const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
        pageViews[pageName] = (pageViews[pageName] || 0) + 1;
        pageViews.lastVisit = Date.now();
        localStorage.setItem('pageViews', JSON.stringify(pageViews));
    },

    // Загрузка данных для страницы
    async loadPageData(pageName) {
        if (!Web3Module.state.isConnected) {
            this.showWalletRequired(pageName);
            return;
        }

        this.showPageLoading(pageName);

        try {
            switch (pageName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'partners':
                    await this.loadPartnersData();
                    break;
                case 'matrix':
                    await this.loadMatrixData();
                    break;
                case 'tokens':
                    await this.loadTokensData();
                    break;
                case 'settings':
                    await this.loadSettingsData();
                    break;
                case 'projects':
                    await this.loadProjectsData();
                    break;
                case 'admin':
                    await this.loadAdminData();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${pageName} data:`, error);
            this.showPageError(pageName, error.message);
        } finally {
            this.hidePageLoading(pageName);
        }
    },

    // Загрузка данных Dashboard
    async loadDashboardData() {
        const userData = await ContractsModule.loadUserData();
        if (!userData) return;

        // Обновление основной информации
        this.updateElement('userAddress', this.formatAddress(Web3Module.state.account));
        this.updateElement('userBalance', `${await this.getBalance()} BNB`);
        this.updateElement('userId', userData.userId || 'Not generated');
        this.updateElement('userRank', this.getRankName(userData.leaderRank));
        this.updateElement('sponsorId', userData.sponsor !== '0x0000000000000000000000000000000000000000' ? 
            this.formatAddress(userData.sponsor) : 'No sponsor');

        // Реферальная ссылка
        if (userData.isRegistered) {
            const refLink = Web3Module.getReferralLink();
            this.updateElement('referralLink', refLink);
            
            // QR код для реферальной ссылки
            this.generateQRCode('referralQR', refLink);
        }

        // Обновление уровней
        this.updateLevels(userData.activeLevels);

        // Квартальная активность
        this.updateQuarterlyStatus(userData.quarterlyStatus);

        // Доходы
        this.updateEarnings(userData.earnings);

        // Статистика контракта
        await this.updateContractStats();
    },

    // Генерация QR кода
    generateQRCode(elementId, text) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Простая реализация QR кода через API
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
        element.innerHTML = `<img src="${qrUrl}" alt="QR Code" class="qr-code">`;
    },

    // Получение баланса
    async getBalance() {
        try {
            const balance = await Web3Module.state.web3.eth.getBalance(Web3Module.state.account);
            return parseFloat(Web3Module.fromWei(balance)).toFixed(4);
        } catch (error) {
            return '0.0000';
        }
    },

    // Получение названия ранга
    getRankName(rank) {
        const ranks = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Royal'];
        return ranks[parseInt(rank)] || 'None';
    },

    // Обновление элемента
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            
            // Анимация изменения значения
            element.classList.add('value-updated');
            setTimeout(() => {
                element.classList.remove('value-updated');
            }, 1000);
        }
    },

    // Обновление уровней с анимацией
    updateLevels(activeLevels) {
        for (let i = 1; i <= 12; i++) {
            const levelBtn = document.querySelector(`[data-level="${i}"]`);
            if (levelBtn) {
                const isActive = activeLevels.includes(i);
                
                levelBtn.classList.toggle('active', isActive);
                levelBtn.classList.toggle('inactive', !isActive);
                
                // Добавление обработчика покупки уровня
                if (!isActive) {
                    levelBtn.onclick = () => this.buyLevel(i);
                }
                
                // Показ цены
                const priceElement = levelBtn.querySelector('.level-price');
                if (priceElement) {
                    priceElement.textContent = `${ContractsModule.levelPrices[i]} BNB`;
                }
            }
        }

        // Обновление кнопок быстрой покупки
        this.updateQuickBuyButtons(activeLevels);
    },

    // Обновление кнопок быстрой покупки
    async updateQuickBuyButtons(activeLevels) {
        const quickBuyLevels = [4, 7, 10, 12];
        
        for (const maxLevel of quickBuyLevels) {
            const btn = document.getElementById(`quickBuy${maxLevel}`);
            if (btn) {
                const price = await ContractsModule.calculateQuickBuyPrice(maxLevel, activeLevels);
                const priceElement = btn.querySelector('.quick-buy-price');
                
                if (priceElement) {
                    priceElement.textContent = `${price} BNB`;
                }
                
                // Деактивация если все уровни куплены
                const hasAllLevels = Array.from({length: maxLevel}, (_, i) => i + 1)
                    .every(level => activeLevels.includes(level));
                
                btn.disabled = hasAllLevels;
                btn.onclick = hasAllLevels ? null : () => this.buyMultipleLevels(maxLevel);
            }
        }
    },

    // Покупка одного уровня
    async buyLevel(level) {
        const confirmResult = await this.showConfirmDialog(
            'Buy Level',
            `Buy level ${level} for ${ContractsModule.levelPrices[level]} BNB?`
        );
        
        if (confirmResult) {
            await ContractsModule.buyLevel(level);
        }
    },

    // Покупка нескольких уровней
    async buyMultipleLevels(maxLevel) {
        const userData = await ContractsModule.loadUserData();
        const price = await ContractsModule.calculateQuickBuyPrice(maxLevel, userData?.activeLevels || []);
        
        const confirmResult = await this.showConfirmDialog(
            'Quick Buy',
            `Buy levels 1-${maxLevel} for ${price} BNB?`
        );
        
        if (confirmResult) {
            await ContractsModule.buyMultipleLevels(maxLevel);
        }
    },

    // Обновление квартальной активности
    updateQuarterlyStatus(status) {
        if (!status) return;

        this.updateElement('quarterlyStatus', status.isPaid ? 'Active' : 'Inactive');
        this.updateElement('quarterNumber', `Quarter ${status.quarterNumber}`);
        
        if (status.nextPaymentDate) {
            this.updateElement('nextPaymentDate', status.nextPaymentDate.toLocaleDateString());
        }

        // Предупреждение за 10 дней
        if (status.needsPayment && status.daysLeft <= 10) {
            this.showQuarterlyWarning(status.daysLeft);
        }
    },

    // Предупреждение о квартальной оплате
    showQuarterlyWarning(daysLeft) {
        const warningElement = document.getElementById('quarterlyWarning');
        if (warningElement) {
            warningElement.style.display = 'block';
            warningElement.innerHTML = `
                <div class="warning-content">
                    <strong>⚠️ Payment Due!</strong>
                    <p>Quarterly payment due in ${daysLeft} days</p>
                    <button onclick="UI.payQuarterly()" class="btn-warning">Pay Now</button>
                </div>
            `;
        }
    },

    // Оплата квартальной активности
    async payQuarterly() {
        const confirmResult = await this.showConfirmDialog(
            'Quarterly Payment',
            'Pay quarterly fee of 0.001 BNB?'
        );
        
        if (confirmResult) {
            await ContractsModule.payQuarterly();
        }
    },

    // Обновление доходов
    updateEarnings(earnings) {
        if (!earnings) return;

        const earningsMap = {
            'personalBonus': 'Personal Bonus',
            'referralBonus': 'Referral Bonus', 
            'matrixBonus': 'Matrix Bonus',
            'leaderBonus': 'Leader Bonus',
            'investmentReturns': 'Investment Returns'
        };

        Object.entries(earningsMap).forEach(([key, label]) => {
            const element = document.querySelector(`[data-earnings="${key}"]`);
            if (element) {
                element.textContent = `${parseFloat(earnings[key]).toFixed(4)} BNB`;
            }
        });

        this.updateElement('totalEarnings', `${parseFloat(earnings.totalEarned).toFixed(4)} BNB`);
    },

    // Обновление статистики контракта
    async updateContractStats() {
        const stats = await ContractsModule.getContractStats();
        if (!stats) return;

        this.updateElement('totalUsers', stats.totalUsers);
        this.updateElement('activeUsers', stats.activeUsers);
        this.updateElement('totalVolume', `${parseFloat(stats.totalVolume).toFixed(4)} BNB`);
        this.updateElement('contractBalance', `${parseFloat(stats.contractBalance).toFixed(4)} BNB`);
    },

    // Обновление UI кошелька
    updateWalletUI(address, balance, walletType, userId) {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        
        if (address) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (walletInfo) walletInfo.classList.remove('hidden');
            
            this.updateElement('walletAddress', address);
            this.updateElement('walletBalance', `${balance} BNB`);
            this.updateElement('walletType', walletType);
            
            if (userId) {
                this.updateElement('walletUserId', `GW${userId}`);
            }
            
            // Показ админ функций
            if (Web3Module.hasAdminAccess()) {
                this.showAdminAccess();
            }
        } else {
            if (connectBtn) connectBtn.style.display = 'block';
            if (walletInfo) walletInfo.classList.add('hidden');
            this.hideAdminAccess();
        }
    },

    // Показ админ доступа
    showAdminAccess() {
        const adminBtn = document.querySelector('[data-page="admin"]');
        if (adminBtn) {
            adminBtn.classList.remove('hidden');
        }

        // Показ индикатора роли
        const roleIndicator = document.getElementById('roleIndicator');
        if (roleIndicator) {
            let role = 'User';
            if (Web3Module.isOwner()) role = 'Owner';
            else if (Web3Module.isFounder()) role = 'Founder';
            else if (Web3Module.isBoard()) role = 'Board';
            
            roleIndicator.textContent = role;
            roleIndicator.classList.remove('hidden');
        }
    },

    // Скрытие админ доступа
    hideAdminAccess() {
        const adminBtn = document.querySelector('[data-page="admin"]');
        if (adminBtn) {
            adminBtn.classList.add('hidden');
        }
        
        const roleIndicator = document.getElementById('roleIndicator');
        if (roleIndicator) {
            roleIndicator.classList.add('hidden');
        }
    },

    // Показ/скрытие загрузки страницы
    showPageLoading(pageName) {
        const page = document.getElementById(pageName);
        if (page) {
            let loader = page.querySelector('.page-loader');
            if (!loader) {
                loader = document.createElement('div');
                loader.className = 'page-loader';
                loader.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
                page.appendChild(loader);
            }
            loader.style.display = 'block';
        }
    },

    hidePageLoading(pageName) {
        const page = document.getElementById(pageName);
        const loader = page?.querySelector('.page-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    // Показ ошибки страницы
    showPageError(pageName, message) {
        const page = document.getElementById(pageName);
        if (page) {
            let errorEl = page.querySelector('.page-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'page-error';
                page.appendChild(errorEl);
            }
            
            errorEl.innerHTML = `
                <div class="error-content">
                    <h3>Error loading page</h3>
                    <p>${message}</p>
                    <button onclick="UI.loadPageData('${pageName}')" class="btn-primary">
                        Retry
                    </button>
                </div>
            `;
            errorEl.style.display = 'block';
        }
    },

    // Создание модального окна
    createModal(id, options) {
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${options.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${options.content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    },

    // Показ диалога подтверждения
    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const modal = this.createModal('confirmDialog', {
                title: title,
                content: `
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn-primary" onclick="UI.resolveConfirm(true)">Confirm</button>
                        <button class="btn-secondary" onclick="UI.resolveConfirm(false)">Cancel</button>
                    </div>
                `
            });
            
            this._confirmResolve = resolve;
            this.showModal('confirmDialog');
        });
    },

    resolveConfirm(result) {
        if (this._confirmResolve) {
            this._confirmResolve(result);
            this._confirmResolve = null;
        }
        this.closeModal('confirmDialog');
    },

    // Показ уведомления с улучшенной анимацией
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type} notification-enter`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Анимация появления
        requestAnimationFrame(() => {
            notification.classList.add('notification-visible');
        });
        
        // Автоматическое удаление
        const timeoutId = setTimeout(() => {
            this.hideNotification(notification);
        }, duration);
        
        // Клик для закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.hideNotification(notification);
        });

        // Прогресс бар
        if (duration > 0) {
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            notification.appendChild(progressBar);
            
            progressBar.style.animation = `notification-progress ${duration}ms linear`;
        }
    },

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications-container';
        document.body.appendChild(container);
        return container;
    },

    getNotificationIcon(type) {
        const icons = {
            'success': '✓',
            'error': '✕',
            'warning': '⚠',
            'info': 'ℹ'
        };
        return icons[type] || icons.info;
    },

    hideNotification(notification) {
        notification.classList.add('notification-exit');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    // Показ/скрытие модального окна
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
            
            // Фокус на первом input'е
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    },

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.classList.remove('modal-open');
    },

    // Обработка форм
    handleFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Определение типа формы по ID или классу
        if (form.id === 'registrationForm') {
            this.handleRegistration(data);
        } else if (form.id === 'levelPurchaseForm') {
            this.handleLevelPurchase(data);
        }
        // Добавить другие формы по необходимости
    },

    // Копирование в буфер обмена
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard', 'success', 2000);
        } catch (error) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showNotification('Copied to clipboard', 'success', 2000);
        }
    },

    // Форматирование адреса
    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },

    // Показ/скрытие загрузки
    showLoading(element) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            // Глобальный лоадер
            let loader = document.getElementById('globalLoader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'globalLoader';
                loader.className = 'global-loader';
                loader.innerHTML = '<div class="spinner"></div>';
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex';
        }
        this.isLoading = true;
    },

    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        } else {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.style.display = 'none';
            }
        }
        this.isLoading = false;
    },

    // Скрытие загрузочного экрана
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    if (loadingScreen.parentNode) {
                        loadingScreen.parentNode.removeChild(loadingScreen);
                    }
                }, 500);
            }, 1000);
        }
    },

    // Показ сообщения о необходимости подключения кошелька
    showWalletRequired(pageName) {
        const page = document.getElementById(pageName);
        if (page) {
            let walletRequired = page.querySelector('.wallet-required');
            if (!walletRequired) {
                walletRequired = document.createElement('div');
                walletRequired.className = 'wallet-required';
                walletRequired.innerHTML = `
                    <div class="wallet-required-content">
                        <h3>Wallet Required</h3>
                        <p>Please connect your SafePal wallet to continue</p>
                        <button onclick="UI.connectWallet()" class="btn-primary">
                            Connect Wallet
                        </button>
                    </div>
                `;
                page.appendChild(walletRequired);
            }
            walletRequired.style.display = 'block';
        }
    }
};

// Утилитарные функции
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Экспорт
window.UI = UI;
