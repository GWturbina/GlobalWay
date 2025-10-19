const Utils = {
  // Форматирование адреса
  formatAddress(address) {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  // Форматирование чисел
  formatNumber(num, decimals = 2) {
    if (!num) return '0';
    const n = parseFloat(num);
    if (n >= 1000000) return (n / 1000000).toFixed(decimals) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(decimals) + 'K';
    return n.toFixed(decimals);
  },

  // Форматирование BNB
  formatBNB(value, decimals = 4) {
    if (!value) return '0';
    return parseFloat(value).toFixed(decimals);
  },

  // Форматирование даты
  formatDate(timestamp) {
    if (!timestamp || timestamp == 0) return '-';
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  },

  // Форматирование даты и времени
  formatDateTime(timestamp) {
    if (!timestamp || timestamp == 0) return '-';
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  },

  // Валидация адреса
  validateAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  // Копирование в буфер
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Copied to clipboard!', 'success');
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      return false;
    }
  },

  // Уведомления
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // Лоадер
  showLoader(show = true) {
    let loader = document.getElementById('globalLoader');
    if (!loader && show) {
      loader = document.createElement('div');
      loader.id = 'globalLoader';
      loader.className = 'global-loader';
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
    }
    if (loader) {
      loader.style.display = show ? 'flex' : 'none';
    }
  },

  // Генерация ID (GW + 7 цифр)
  formatUserId(id) {
    if (!id || id == 0) return '-';
    return `GW${String(id).padStart(7, '0')}`;
  },

  // Парсинг ID из строки
  parseUserId(str) {
    if (!str) return 0;
    const match = str.match(/GW(\d{7})/);
    return match ? parseInt(match[1]) : 0;
  },

  // Генерация QR кода
  async generateQR(text, elementId) {
    const qrcode = new QRCode(document.getElementById(elementId), {
      text: text,
      width: CONFIG.QR_CONFIG.size,
      height: CONFIG.QR_CONFIG.size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    return qrcode;
  },

  // Конвертация timestamp в "через X дней"
  getDaysUntil(timestamp) {
    if (!timestamp || timestamp == 0) return 0;
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    return Math.ceil(diff / 86400);
  },

  // Получение статуса по квалификации
  getRankName(rank) {
    const ranks = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum'];
    return ranks[rank] || 'None';
  },

  // Получение статуса проекта
  getProjectStatus(status) {
    const statuses = {
      'active': 'Active',
      'development': 'In Development',
      'coming': 'Coming Soon',
      'planning': 'Planning'
    };
    return statuses[status] || status;
  },

  // Открытие в Explorer
  openInExplorer(hash, type = 'tx') {
    const url = type === 'tx' 
      ? `${CONFIG.NETWORK.explorer}/tx/${hash}`
      : `${CONFIG.NETWORK.explorer}/address/${hash}`;
    window.open(url, '_blank');
  },

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

  // Проверка мобильного устройства
  isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  },

  // Получить параметры из URL
  getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      ref: params.get('ref'),
      page: params.get('page'),
      id: params.get('id')
    };
  },

  // Установить параметры в URL
  setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
  },

  // Удалить параметр из URL
  removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
  },

  // Безопасное получение значения
  safeGet(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return defaultValue;
      }
    }
    return result;
  },

  // Форматирование процентов
  formatPercent(value, decimals = 2) {
    return `${parseFloat(value).toFixed(decimals)}%`;
  },

  // Задержка
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

window.Utils = Utils;
console.log('✅ Utils loaded')
