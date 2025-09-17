/* ========================================
   GlobalWay - Authorization Management
   ======================================== */

window.Auth = {
    // Роли пользователей
    ROLES: {
        GUEST: 'guest',
        USER: 'user',
        FOUNDER: 'founder',
        BOARD: 'board',
        OWNER: 'owner'
    },
    
    // Текущая роль
    currentRole: 'guest',
    
    // Инициализация
    async init() {
        // Проверяем роль при изменении аккаунта
        window.addEventListener('accountChanged', async (event) => {
            if (event.detail.account) {
                await this.checkUserRole(event.detail.account);
            } else {
                this.currentRole = this.ROLES.GUEST;
            }
        });
    },
    
    // Проверка роли пользователя
    async checkUserRole(address) {
        if (!address) {
            this.currentRole = this.ROLES.GUEST;
            return;
        }
        
        // Проверяем владельца
        if (await ContractManager.isOwner(address)) {
            this.currentRole = this.ROLES.OWNER;
            return;
        }
        
        // Проверяем основателя
        if (await ContractManager.isFounder(address)) {
            this.currentRole = this.ROLES.FOUNDER;
            return;
        }
        
        // Проверяем члена правления
        if (await ContractManager.isBoardMember(address)) {
            this.currentRole = this.ROLES.BOARD;
            return;
        }
        
        // Проверяем зарегистрированного пользователя
        const userData = await ContractManager.getUserData(address);
        if (userData && userData.isRegistered) {
            this.currentRole = this.ROLES.USER;
            return;
        }
        
        // По умолчанию - гость
        this.currentRole = this.ROLES.GUEST;
    },
    
    // Проверка прав доступа
    hasRole(requiredRole) {
        const roleHierarchy = {
            [this.ROLES.GUEST]: 0,
            [this.ROLES.USER]: 1,
            [this.ROLES.BOARD]: 2,
            [this.ROLES.FOUNDER]: 3,
            [this.ROLES.OWNER]: 4
        };
        
        const currentLevel = roleHierarchy[this.currentRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return currentLevel >= requiredLevel;
    },
    
    // Проверка админского доступа
    isAdmin() {
        return this.hasRole(this.ROLES.BOARD);
    },
    
    // Проверка владельца
    isOwner() {
        return this.currentRole === this.ROLES.OWNER;
    },
    
    // Проверка основателя
    isFounder() {
        return this.currentRole === this.ROLES.FOUNDER;
    },
    
    // Проверка зарегистрированного пользователя
    isRegistered() {
        return this.hasRole(this.ROLES.USER);
    },
    
    // Требование подключения кошелька
    requireWallet() {
        if (!Web3Manager.isConnected) {
            UI.showNotification(i18n.t('messages.noWallet'), 'warning');
            return false;
        }
        return true;
    },
    
    // Требование регистрации
    requireRegistration() {
        if (!this.requireWallet()) return false;
        
        if (!this.isRegistered()) {
            UI.createModal(
                i18n.t('auth.registrationRequired'),
                `<p>${i18n.t('auth.pleaseRegister')}</p>`,
                [
                    {
                        text: i18n.t('buttons.close'),
                        onclick: 'UI.closeModal()'
                    }
                ]
            );
            return false;
        }
        return true;
    },
    
    // Требование админского доступа
    requireAdmin() {
        if (!this.requireWallet()) return false;
        
        if (!this.isAdmin()) {
            UI.showNotification(i18n.t('auth.accessDenied'), 'error');
            return false;
        }
        return true;
    },
    
    // Получение текущей роли
    getCurrentRole() {
        return this.currentRole;
    },
    
    // Получение прав доступа для UI
    getPermissions() {
        return {
            canViewDashboard: this.requireWallet(),
            canViewPartners: this.isRegistered(),
            canViewMatrix: this.isRegistered(),
            canViewTokens: this.isRegistered(),
            canViewProjects: true, // Доступно всем
            canViewAdmin: this.isAdmin(),
            canBuyLevels: this.isRegistered(),
            canInvitePartners: this.isRegistered(),
            canWithdraw: this.isAdmin(),
            canManageUsers: this.isAdmin(),
            canManageProjects: this.hasRole(this.ROLES.FOUNDER),
            canDelegate: this.hasRole(this.ROLES.FOUNDER),
            canVote: this.hasRole(this.ROLES.BOARD)
        };
    }
};
