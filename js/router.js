/* ========================================
   GlobalWay - SPA Router
   ======================================== */

window.Router = {
    // Текущая страница
    currentPage: null,
    
    // История навигации
    history: [],
    
    // Роуты
    routes: {
        dashboard: {
            title: 'Dashboard',
            component: 'dashboard.html',
            requiresAuth: true
        },
        partners: {
            title: 'Partners',
            component: 'partners.html',
            requiresAuth: true
        },
        matrix: {
            title: 'Matrix',
            component: 'matrix.html',
            requiresAuth: true
        },
        tokens: {
            title: 'Tokens',
            component: 'tokens.html',
            requiresAuth: true
        },
        projects: {
            title: 'Projects',
            component: 'projects.html',
            requiresAuth: false
        },
        admin: {
            title: 'Admin',
            component: 'admin.html',
            requiresAuth: true,
            requiresAdmin: true
        }
    },
    
    // Инициализация роутера
    init() {
        // Обработчик кнопки назад
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.navigate(event.state.page, false);
            }
        });
        
        // Обработчик кликов по навигации
        this.setupNavigationHandlers();
        
        // Загружаем начальную страницу
        const initialPage = this.getInitialPage();
        this.navigate(initialPage);
    },
    
    // Получение начальной страницы
    getInitialPage() {
        const hash = window.location.hash.slice(1);
        return hash && this.routes[hash] ? hash : 'dashboard';
    },
    
    // Настройка обработчиков навигации
    setupNavigationHandlers() {
        document.addEventListener('click', (event) => {
            const navItem = event.target.closest('.nav-item[data-page]');
            if (navItem) {
                event.preventDefault();
                const page = navItem.getAttribute('data-page');
                this.navigate(page);
            }
        });
    },
    
    // Навигация
    async navigate(page, pushState = true) {
        // Проверяем существование роута
        const route = this.routes[page];
        if (!route) {
            console.error('Route not found:', page);
            return;
        }
        
        // Проверяем права доступа
        if (route.requiresAuth && !Web3Manager.isConnected) {
            UI.showNotification('Please connect your wallet', 'warning');
            return;
        }
        
        if (route.requiresAdmin) {
            const isAdmin = await ContractManager.hasAdminAccess(Web3Manager.currentAccount);
            if (!isAdmin) {
                UI.showNotification('Access denied', 'error');
                return;
            }
        }
        
        // Сохраняем текущую страницу
        this.currentPage = page;
        
        // Обновляем историю браузера
        if (pushState) {
            window.history.pushState({ page }, route.title, `#${page}`);
        }
        
        // Обновляем активный пункт навигации
        this.updateActiveNav(page);
        
        // Загружаем компонент
        await this.loadComponent(route.component);
        
        // Обновляем заголовок
        document.title = `GlobalWay - ${i18n.t(`nav.${page}`)}`;
        
        // Вызываем событие навигации
        window.dispatchEvent(new CustomEvent('pageChanged', { detail: { page } }));
    },
    
    // Обновление активного пункта навигации
    updateActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    },
    
    // Загрузка компонента
    async loadComponent(componentPath) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        try {
            // Показываем загрузку
            mainContent.innerHTML = `
                <div class="loading-container">
                    <div class="loading"></div>
                    <p>${i18n.t('messages.loading')}</p>
                </div>
            `;
            
            // Загружаем HTML компонента
            const response = await fetch(`components/${componentPath}`);
            if (!response.ok) throw new Error('Component not found');
            
            const html = await response.text();
            mainContent.innerHTML = html;
            
            // Инициализируем компонент
            await this.initializeComponent(this.currentPage);
            
            // Применяем переводы
            i18n.applyLanguage(i18n.currentLang);
            
        } catch (error) {
            console.error('Component loading error:', error);
            mainContent.innerHTML = `
                <div class="error-container">
                    <h2>Error loading page</h2>
                    <p>Please try again later</p>
                </div>
            `;
        }
    },
    
    // Инициализация компонента
    async initializeComponent(page) {
        switch (page) {
            case 'dashboard':
                await DashboardController.init();
                break;
            case 'partners':
                await PartnersController.init();
                break;
            case 'matrix':
                await MatrixController.init();
                break;
            case 'tokens':
                await TokensController.init();
                break;
            case 'projects':
                await ProjectsController.init();
                break;
            case 'admin':
                await AdminController.init();
                break;
        }
    },
    
    // Обновление текущей страницы
    async refresh() {
        if (this.currentPage) {
            await this.navigate(this.currentPage, false);
        }
    },
    
    // Переход назад
    goBack() {
        window.history.back();
    },
    
    // Проверка текущей страницы
    isCurrentPage(page) {
        return this.currentPage === page;
    }
};
