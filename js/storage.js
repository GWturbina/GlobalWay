/* ========================================
   GlobalWay - Storage and ID Management
   ======================================== */

window.StorageManager = {
    // Префикс для ключей localStorage
    PREFIX: 'globalway_',
    
    // База данных ID (IndexedDB)
    db: null,
    DB_NAME: 'GlobalWayDB',
    DB_VERSION: 1,
    
    // Инициализация IndexedDB
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Таблица пользователей
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'address' });
                    userStore.createIndex('id', 'id', { unique: true });
                    userStore.createIndex('sponsor', 'sponsor', { unique: false });
                    userStore.createIndex('registrationTime', 'registrationTime', { unique: false });
                }
                
                // Таблица транзакций
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'hash' });
                    txStore.createIndex('userAddress', 'userAddress', { unique: false });
                    txStore.createIndex('timestamp', 'timestamp', { unique: false });
                    txStore.createIndex('type', 'type', { unique: false });
                }
                
                // Таблица проектов
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'prefix' });
                    projectStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    },
    
    // ========== User ID Management ==========
    
    // Генерация уникального 7-значного ID
    generateUserId() {
        let id;
        do {
            id = Math.floor(1000000 + Math.random() * 9000000);
        } while (this.checkIdExists(id));
        return id;
    },
    
    // Проверка существования ID
    async checkIdExists(id) {
        try {
            const tx = this.db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('id');
            const result = await this.promisifyRequest(index.get(id));
            return !!result;
        } catch (error) {
            console.error('Check ID error:', error);
            return false;
        }
    },
    
    // Сохранение пользователя
    async saveUser(userData) {
        try {
            const tx = this.db.transaction(['users'], 'readwrite');
            const store = tx.objectStore('users');
            
            // Генерируем ID если его нет
            if (!userData.id) {
                userData.id = this.generateUserId();
            }
            
            await this.promisifyRequest(store.put(userData));
            return userData;
        } catch (error) {
            console.error('Save user error:', error);
            throw error;
        }
    },
    
    // Получение пользователя по адресу
    async getUserByAddress(address) {
        try {
            const tx = this.db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            return await this.promisifyRequest(store.get(address.toLowerCase()));
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },
    
    // Получение пользователя по ID
    async getUserById(id) {
        try {
            const tx = this.db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            const index = store.index('id');
            return await this.promisifyRequest(index.get(id));
        } catch (error) {
            console.error('Get user by ID error:', error);
            return null;
        }
    },
    
    // Получение всех пользователей
    async getAllUsers() {
        try {
            const tx = this.db.transaction(['users'], 'readonly');
            const store = tx.objectStore('users');
            return await this.promisifyRequest(store.getAll());
        } catch (error) {
            console.error('Get all users error:', error);
            return [];
        }
    },
    
    // Экспорт базы данных
    async exportDatabase() {
        const users = await this.getAllUsers();
        const transactions = await this.getAllTransactions();
        
        const data = {
            version: this.DB_VERSION,
            timestamp: Date.now(),
            users: users,
            transactions: transactions
        };
        
        return data;
    },
    
    // Скачивание базы данных
    async downloadDatabase() {
        const data = await this.exportDatabase();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `globalway_db_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // ========== Transaction Management ==========
    
    // Сохранение транзакции
    async saveTransaction(txData) {
        try {
            const tx = this.db.transaction(['transactions'], 'readwrite');
            const store = tx.objectStore('transactions');
            
            txData.timestamp = txData.timestamp || Date.now();
            
            await this.promisifyRequest(store.put(txData));
            return txData;
        } catch (error) {
            console.error('Save transaction error:', error);
            throw error;
        }
    },
    
    // Получение транзакций пользователя
    async getUserTransactions(userAddress, limit = 50) {
        try {
            const tx = this.db.transaction(['transactions'], 'readonly');
            const store = tx.objectStore('transactions');
            const index = store.index('userAddress');
            
            const transactions = [];
            const cursor = index.openCursor(IDBKeyRange.only(userAddress.toLowerCase()));
            
            return new Promise((resolve, reject) => {
                cursor.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && transactions.length < limit) {
                        transactions.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(transactions.sort((a, b) => b.timestamp - a.timestamp));
                    }
                };
                cursor.onerror = () => reject(cursor.error);
            });
        } catch (error) {
            console.error('Get user transactions error:', error);
            return [];
        }
    },
    
    // Получение всех транзакций
    async getAllTransactions() {
        try {
            const tx = this.db.transaction(['transactions'], 'readonly');
            const store = tx.objectStore('transactions');
            return await this.promisifyRequest(store.getAll());
        } catch (error) {
            console.error('Get all transactions error:', error);
            return [];
        }
    },
    
    // ========== Project Management ==========
    
    // Сохранение проекта
    async saveProject(projectData) {
        try {
            const tx = this.db.transaction(['projects'], 'readwrite');
            const store = tx.objectStore('projects');
            await this.promisifyRequest(store.put(projectData));
            return projectData;
        } catch (error) {
            console.error('Save project error:', error);
            throw error;
        }
    },
    
    // Получение всех проектов
    async getAllProjects() {
        try {
            const tx = this.db.transaction(['projects'], 'readonly');
            const store = tx.objectStore('projects');
            return await this.promisifyRequest(store.getAll());
        } catch (error) {
            console.error('Get all projects error:', error);
            return [];
        }
    },
    
    // Генерация ID с префиксом проекта
    generateProjectId(userId, projectPrefix) {
        return `${projectPrefix}${userId}`;
    },
    
    // ========== Local Storage Methods ==========
    
    // Сохранение в localStorage
    setItem(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage error:', error);
        }
    },
    
    // Получение из localStorage
    getItem(key) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    },
    
    // Удаление из localStorage
    removeItem(key) {
        localStorage.removeItem(this.PREFIX + key);
    },
    
    // Очистка всех данных GlobalWay из localStorage
    clearStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    },
    
    // ========== Utility Methods ==========
    
    // Промисификация IndexedDB запросов
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Сохранение настроек пользователя
    saveUserSettings(settings) {
        this.setItem('userSettings', settings);
    },
    
    // Получение настроек пользователя
    getUserSettings() {
        return this.getItem('userSettings') || {
            language: 'en',
            notifications: true,
            theme: 'dark'
        };
    },
    
    // Сохранение последнего активного аккаунта
    saveLastAccount(address) {
        this.setItem('lastAccount', address);
    },
    
    // Получение последнего активного аккаунта
    getLastAccount() {
        return this.getItem('lastAccount');
    }
};
