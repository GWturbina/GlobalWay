// cosmic-intro.js
class CosmicIntro {
  constructor() {
    this.currentLang = this.getDefaultLanguage();
    this.autoHideTimer = null;
    this.loadTranslations();
    this.init();
  }
  
  getDefaultLanguage() {
    // Английский по умолчанию
    const saved = localStorage.getItem('selectedLanguage');
    return saved || 'en';
  }
  
  loadTranslations() {
    if (typeof cosmicIntroTranslations !== 'undefined') {
      this.introData = cosmicIntroTranslations[this.currentLang] || cosmicIntroTranslations.en;
    } else {
      this.introData = this.getDefaultTexts();
    }
  }
  
  getDefaultTexts() {
    return {
      club: { title: 'GlobalWay Club', text: 'Living ecosystem where generations connect...' },
      mission: { title: 'Our Mission', text: 'Building fair economy for everyone...' },
      goals: { title: 'Club Goals', text: 'Creating personal income sources...' },
      roadmap: { title: 'Roadmap', text: '2025 — platform launch and 8 projects...' },
      projects: { title: 'Our Projects', text: 'CardGift, GlobalTub, GlobalMarket...' }
    };
  }
  
  init() {
    this.createLanguageSelector();
    this.bindEvents();
    this.startAutoHideTimer();
  }
  
  createLanguageSelector() {
    const intro = document.getElementById('cosmic-intro');
    if (!intro) return;
    
    const langSelector = document.createElement('div');
    langSelector.className = 'intro-language-selector';
    langSelector.innerHTML = `
      <button class="intro-lang-btn ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
      <button class="intro-lang-btn ${this.currentLang === 'ru' ? 'active' : ''}" data-lang="ru">RU</button>
      <button class="intro-lang-btn ${this.currentLang === 'uk' ? 'active' : ''}" data-lang="uk">UK</button>
    `;
    
    intro.appendChild(langSelector);
    
    // Привязываем события для кнопок языков
    langSelector.querySelectorAll('.intro-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newLang = e.target.dataset.lang;
        this.switchLanguage(newLang);
      });
    });
  }
  
  switchLanguage(newLang) {
    this.currentLang = newLang;
    localStorage.setItem('selectedLanguage', newLang);
    this.loadTranslations();
    
    // Обновляем активную кнопку
    document.querySelectorAll('.intro-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === newLang);
    });
    
    // Если модальное окно открыто, обновляем его
    this.updateModalIfOpen();
  }
  
  updateModalIfOpen() {
    const modal = document.getElementById('cosmic-modal');
    if (modal && modal.classList.contains('active')) {
      const currentTopic = modal.dataset.currentTopic;
      if (currentTopic) {
        this.showModal(currentTopic);
      }
    }
  }
  
  startAutoHideTimer() {
    // Автоматически скрыть интро через 8 секунд если не взаимодействуют
    this.autoHideTimer = setTimeout(() => {
      this.hideIntro();
    }, 8000);
  }
  
  clearAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
  
  bindEvents() {
    // Клики по космическим карточкам
    document.querySelectorAll('.cosmic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.clearAutoHideTimer(); // Останавливаем автоскрытие при взаимодействии
        const topic = e.currentTarget.dataset.topic;
        this.showModal(topic);
      });
    });
    
    // Пропуск интро
    document.getElementById('skip-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
      this.hideIntro();
    });
    
    // Закрытие модального окна
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('modal-back')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    // Закрытие по клику вне модального окна
    document.getElementById('cosmic-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });
    
    // Останавливаем автоскрытие при любом взаимодействии с интро
    document.getElementById('cosmic-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
    });
  }
  
  showModal(topic) {
    const data = this.introData[topic];
    if (!data) return;
    
    this.clearAutoHideTimer(); // Останавливаем автоскрытие
    
    const titleElement = document.getElementById('modal-title');
    const textElement = document.getElementById('modal-text');
    const modalElement = document.getElementById('cosmic-modal');
    
    if (titleElement) titleElement.textContent = data.title;
    if (textElement) textElement.textContent = data.text;
    if (modalElement) {
      modalElement.classList.add('active');
      modalElement.dataset.currentTopic = topic;
    }
  }
  
  hideModal() {
    const modalElement = document.getElementById('cosmic-modal');
    if (modalElement) {
      modalElement.classList.remove('active');
      delete modalElement.dataset.currentTopic;
    }
    
    // Возобновляем автоскрытие после закрытия модального окна
    this.startAutoHideTimer();
  }
  
  hideIntro() {
    const intro = document.getElementById('cosmic-intro');
    if (intro) {
      intro.classList.add('hidden');
      
      setTimeout(() => {
        intro.style.display = 'none';
        
        // Показываем основное приложение и переходим на Dashboard
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          appContainer.style.display = 'block';
        }
        
        // Переключаемся на Dashboard
        if (window.globalWayApp) {
          window.globalWayApp.showPage('dashboard');
        }
        
        // Обновляем язык в основном приложении
        if (window.globalWayApp && window.globalWayApp.changeLanguage) {
          window.globalWayApp.changeLanguage(this.currentLang);
        }
      }, 1000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cosmic-intro')) {
    window.cosmicIntro = new CosmicIntro();
  }
});
