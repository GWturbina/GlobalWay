/**
 * Система интернационализации для GlobalWay
 * Поддерживает EN, RU, UK языки с возможностью расширения
 */

class I18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {};
    this.fallbackLanguage = 'en';
    this.initialized = false;
  }

  /**
   * Определение языка пользователя
   */
  detectLanguage() {
    // Проверяем localStorage
    const savedLang = localStorage.getItem('globalway_language');
    if (savedLang && this.isValidLanguage(savedLang)) {
      return savedLang;
    }

    // Проверяем язык браузера
    const browserLang = navigator.language.toLowerCase();
    
    // Маппинг языков браузера на поддерживаемые
    const langMap = {
      'en': 'en',
      'en-us': 'en',
      'en-gb': 'en',
      'ru': 'ru',
      'ru-ru': 'ru',
      'uk': 'uk',
      'uk-ua': 'uk',
      'ua': 'uk'
    };

    return langMap[browserLang] || 'en';
  }

  /**
   * Проверка валидности языка
   */
  isValidLanguage(lang) {
    return ['en', 'ru', 'uk'].includes(lang);
  }

  /**
   * Загрузка всех переводов
   */
  async loadTranslations() {
    const languages = ['en', 'ru', 'uk'];
    
    try {
      const promises = languages.map(async (lang) => {
        const response = await fetch(`/translations/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${lang} translations`);
        }
        const data = await response.json();
        this.translations[lang] = data;
      });

      await Promise.all(promises);
      this.initialized = true;
      this.updateUI();
      
      console.log('🌍 I18n initialized with languages:', languages);
    } catch (error) {
      console.error('❌ Failed to load translations:', error);
      // Загружаем как минимум английский
      await this.loadFallback();
    }
  }

  /**
   * Загрузка резервного языка
   */
  async loadFallback() {
    try {
      const response = await fetch(`/translations/${this.fallbackLanguage}.json`);
      const data = await response.json();
      this.translations[this.fallbackLanguage] = data;
      this.currentLanguage = this.fallbackLanguage;
      this.initialized = true;
      this.updateUI();
    } catch (error) {
      console.error('❌ Failed to load fallback language:', error);
    }
  }

  /**
   * Получение перевода по ключу
   * @param {string} key - Ключ перевода (например, 'dashboard.title')
   * @param {object} params - Параметры для подстановки
   * @returns {string} - Переведенный текст
   */
  t(key, params = {}) {
    if (!this.initialized) {
      return key;
    }

    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    // Поиск значения по вложенным ключам
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Если перевод не найден, пробуем резервный язык
    if (!value && this.currentLanguage !== this.fallbackLanguage) {
      value = this.translations[this.fallbackLanguage];
      for (const k of keys) {
        value = value?.[k];
      }
    }
    
    // Если все еще не найден, возвращаем ключ
    if (!value) {
      console.warn(`🔤 Translation missing for key: ${key}`);
      return key;
    }
    
    // Подстановка параметров
    return this.interpolate(value, params);
  }

  /**
   * Подстановка параметров в строку
   * @param {string} text - Текст с плейсхолдерами
   * @param {object} params - Параметры для подстановки
   * @returns {string} - Текст с подставленными параметрами
   */
  interpolate(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }

  /**
   * Смена языка
   * @param {string} lang - Код языка
   */
  setLanguage(lang) {
    if (!this.isValidLanguage(lang)) {
      console.error(`❌ Invalid language: ${lang}`);
      return;
    }

    if (!this.translations[lang]) {
      console.error(`❌ Language not loaded: ${lang}`);
      return;
    }

    const previousLang = this.currentLanguage;
    this.currentLanguage = lang;
    
    // Сохраняем в localStorage
    localStorage.setItem('globalway_language', lang);
    
    // Обновляем UI
    this.updateUI();
    
    // Диспетчеризируем событие смены языка
    this.dispatchLanguageChange(previousLang, lang);
    
    console.log(`🌍 Language changed from ${previousLang} to ${lang}`);
  }

  /**
   * Получение текущего языка
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Получение списка доступных языков
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  /**
   * Обновление UI с новыми переводами
   */
  updateUI() {
    if (!this.initialized) return;

    // Обновляем все элементы с data-i18n атрибутом
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // Определяем, что обновлять (текст или placeholder)
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Обновляем элементы с data-i18n-html (для HTML контента)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const translation = this.t(key);
      element.innerHTML = translation;
    });

    // Обновляем title и alt атрибуты
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      element.title = translation;
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.getAttribute('data-i18n-alt');
      const translation = this.t(key);
      element.alt = translation;
    });

    // Обновляем активную кнопку языка
    this.updateLanguageButtons();
  }

  /**
   * Обновление кнопок выбора языка
   */
  updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.lang === this.currentLanguage) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Диспетчеризация события смены языка
   */
  dispatchLanguageChange(from, to) {
    const event = new CustomEvent('languageChanged', {
      detail: { from, to }
    });
    window.dispatchEvent(event);
  }

  /**
   * Форматирование чисел согласно локали
   * @param {number} number - Число для форматирования
   * @param {object} options - Опции форматирования
   */
  formatNumber(number, options = {}) {
    const locales = {
      en: 'en-US',
      ru: 'ru-RU',
      uk: 'uk-UA'
    };

    const locale = locales[this.currentLanguage] || locales.en;
    
    try {
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      console.error('❌ Number formatting error:', error);
      return number.toString();
    }
  }

  /**
   * Форматирование даты согласно локали
   * @param {Date|string|number} date - Дата для форматирования
   * @param {object} options - Опции форматирования
   */
  formatDate(date, options = {}) {
    const locales = {
      en: 'en-US',
      ru: 'ru-RU', 
      uk: 'uk-UA'
    };

    const locale = locales[this.currentLanguage] || locales.en;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(locale, options).format(dateObj);
    } catch (error) {
      console.error('❌ Date formatting error:', error);
      return date.toString();
    }
  }

  /**
   * Форматирование валют
   * @param {number} amount - Сумма
   * @param {string} currency - Код валюты (BNB, USD, etc.)
   */
  formatCurrency(amount, currency = 'BNB') {
    const formattedNumber = this.formatNumber(amount, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
    
    return `${formattedNumber} ${currency}`;
  }

  /**
   * Форматирование процентов
   * @param {number} value - Значение (0.15 для 15%)
   */
  formatPercent(value) {
    return this.formatNumber(value, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  /**
   * Получение направления текста для текущего языка
   */
  getTextDirection() {
    // Все поддерживаемые языки используют LTR
    return 'ltr';
  }

  /**
   * Проверка готовности системы
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Добавление нового языка во время выполнения
   * @param {string} langCode - Код языка
   * @param {object} translations - Объект переводов
   */
  addLanguage(langCode, translations) {
    if (typeof translations !== 'object') {
      console.error('❌ Translations must be an object');
      return false;
    }

    this.translations[langCode] = translations;
    console.log(`🌍 Added new language: ${langCode}`);
    return true;
  }

  /**
   * Очистка кеша переводов
   */
  clearCache() {
    localStorage.removeItem('globalway_language');
    this.translations = {};
    this.initialized = false;
    console.log('🗑️ I18n cache cleared');
  }
}

// Создаем глобальный экземпляр
const i18n = new I18n();

// Экспортируем для использования в модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}

// Глобальная доступность
window.i18n = i18n;
