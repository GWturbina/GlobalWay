// cosmic-intro.js
class CosmicIntro {
  constructor() {
    this.currentLang = this.getDefaultLanguage();
    this.autoHideTimer = null;
    this.loadTranslations();
    this.init();
  }
  
  getDefaultLanguage() {
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
      projects: { title: 'Our Projects', text: 'CardGift, GlobalTub, GlobalMarket...' },
      skipButton: { text: 'Go to DApp' }
    };
  }
  
  init() {
    this.createLanguageSelector();
    this.updateButtonTexts(); // Обновляем тексты кнопок
    this.bindEvents();
    this.startAutoHideTimer();
  }
  
  updateButtonTexts() {
    // Обновляем тексты в карточках
    const cards = [
      { selector: '[data-topic="club"] h3', key: 'club' },
      { selector: '[data-topic="mission"] h3', key: 'mission' },
      { selector: '[data-topic="goals"] h3', key: 'goals' },
      { selector: '[data-topic="roadmap"] h3', key: 'roadmap' },
      { selector: '[data-topic="projects"] h3', key: 'projects' }
    ];
    
    cards.forEach(card => {
      const element = document.querySelector(card.selector);
      if (element && this.introData[card.key]) {
        element.textContent = this.introData[card.key].title;
      }
    });
    
    // Обновляем кнопку "Перейти к DApp"
    const skipBtn = document.getElementById('skip-intro');
    if (skipBtn) {
      const buttonTexts = {
        en: 'Go to DApp',
        ru: 'Перейти к DApp',
        uk: 'Перейти до DApp'
      };
      skipBtn.textContent = buttonTexts[this.currentLang] || buttonTexts.en;
    }
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
    this.updateButtonTexts(); // Обновляем тексты кнопок
    
    // Обновляем активную кнопку
    document.querySelectorAll('.intro-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === newLang);
    });
    
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
    document.querySelectorAll('.cosmic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.clearAutoHideTimer();
        const topic = e.currentTarget.dataset.topic;
        this.showModal(topic);
      });
    });
    
    document.getElementById('skip-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
      this.hideIntro();
    });
    
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('modal-back')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('cosmic-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });
    
    document.getElementById('cosmic-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
    });
  }
  
  showModal(topic) {
    const data = this.introData[topic];
    if (!data) return;
    
    this.clearAutoHideTimer();
    
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
    this.startAutoHideTimer();
  }
  
  hideIntro() {
    const intro = document.getElementById('cosmic-intro');
    if (intro) {
      intro.classList.add('hidden');
      
      setTimeout(() => {
        intro.style.display = 'none';
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          appContainer.style.display = 'block';
        }
        
        // ИСПРАВЛЕНО: Используем правильный метод
        if (window.globalWayApp && window.globalWayApp.navigateToPage) {
         window.globalWayApp.navigateToPage('dashboard');
        }
        
        // ИСПРАВЛЕНО: Обновляем язык в основном приложении
        if (window.globalWayApp && window.globalWayApp.switchLanguage) {
          window.globalWayApp.switchLanguage(this.currentLang);
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
