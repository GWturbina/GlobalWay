/* ========================================
   GlobalWay - Utility Functions
   ======================================== */

window.Utils = {
    // Debounce функция
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle функция
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Форматирование времени до события
    formatTimeUntil(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        
        if (diff <= 0) return i18n.t('utils.expired');
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `${days} ${i18n.t('utils.days')} ${hours} ${i18n.t('utils.hours')}`;
        } else if (hours > 0) {
            return `${hours} ${i18n.t('utils.hours')} ${minutes} ${i18n.t('utils.minutes')}`;
        } else {
            return `${minutes} ${i18n.t('utils.minutes')}`;
        }
    },
    
    // Валидация адреса Ethereum
    isValidAddress(address) {
        if (!address) return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },
    
    // Валидация ID пользователя
    isValidUserId(id) {
        return /^\d{7}$/.test(id.toString());
    },
    
    // Парсинг реферальной ссылки
    parseReferralLink(link) {
        const match = link.match(/ref(\d{7})$/);
        return match ? parseInt(match[1]) : null;
    },
    
    // Генерация QR кода
    async generateQRCode(text, size = 256) {
        try {
            const qrCode = await QRCode.toDataURL(text, {
                width: size,
                margin: 2,
                color: {
                    dark: '#FFD700',
                    light: '#0A1628'
                }
            });
            return qrCode;
        } catch (error) {
            console.error('QR generation error:', error);
            return null;
        }
    },
    
    // Сокращение больших чисел
    abbreviateNumber(number) {
        if (number < 1000) return number.toString();
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const suffixNum = Math.floor(Math.log10(number) / 3);
        const shortValue = (number / Math.pow(1000, suffixNum)).toFixed(1);
        
        return shortValue + suffixes[suffixNum];
    },
    
    // Расчет процента
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return ((value / total) * 100).toFixed(2);
    },
    
    // Группировка данных
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) result[group] = [];
            result[group].push(item);
            return result;
        }, {});
    },
    
    // Сортировка массива объектов
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (order === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            } else {
                return a[key] < b[key] ? 1 : -1;
            }
        });
    },
    
    // Пагинация
    paginate(array, page = 1, perPage = 10) {
        const offset = (page - 1) * perPage;
        const paginatedItems = array.slice(offset, offset + perPage);
        
        return {
            page: page,
            perPage: perPage,
            total: array.length,
            totalPages: Math.ceil(array.length / perPage),
            data: paginatedItems
        };
    },
    
    // Задержка
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Повтор функции с задержкой
    async retry(func, attempts = 3, delay = 1000) {
        for (let i = 0; i < attempts; i++) {
            try {
                return await func();
            } catch (error) {
                if (i === attempts - 1) throw error;
                await this.delay(delay);
            }
        }
    },
    
    // Проверка мобильного устройства
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Проверка iOS
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },
    
    // Проверка Android
    isAndroid() {
        return /Android/.test(navigator.userAgent);
    },
    
    // Получение параметров URL
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },
    
    // Обновление параметров URL
    updateUrlParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] === null) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        window.history.pushState({}, '', url);
    },
    
    // Экспорт в CSV
    exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },
    
    // Проверка поддержки функций браузера
    checkBrowserSupport() {
        const features = {
            serviceWorker: 'serviceWorker' in navigator,
            webGL: !!window.WebGLRenderingContext,
            localStorage: typeof Storage !== 'undefined',
            indexedDB: 'indexedDB' in window,
            webWorker: typeof Worker !== 'undefined',
            fetch: 'fetch' in window,
            promises: typeof Promise !== 'undefined',
            async: (async () => {})().constructor === Promise
        };
        
        const unsupported = Object.entries(features)
            .filter(([_, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (unsupported.length > 0) {
            console.warn('Unsupported features:', unsupported);
        }
        
        return features;
    },
    
    // Хеширование строки
    async hashString(string) {
        const msgBuffer = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    
    // Генерация UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // Глубокое копирование объекта
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    // Проверка пустоты объекта
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },
    
    // Безопасное получение вложенного свойства
    getNestedProperty(obj, path, defaultValue = null) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            result = result?.[key];
            if (result === undefined) return defaultValue;
        }
        
        return result;
    }
};
