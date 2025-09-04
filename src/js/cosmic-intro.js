// cosmic-intro.js
class CosmicIntro {
  constructor() {
    this.currentLang = localStorage.getItem('selectedLanguage') || 'ru';
    this.loadTranslations();
    this.init();
  }
  
  loadTranslations() {
    // Проверяем доступность переводов
    if (typeof cosmicIntroTranslations !== 'undefined') {
      this.introData = cosmicIntroTranslations[this.currentLang] || cosmicIntroTranslations.ru;
    } else {
      // Fallback если переводы не загружены
      this.introData = this.getDefaultTexts();
    }
  }
  
  getDefaultTexts() {
    return {
      club: {
        title: 'Клуб GlobalWay',
        text: 'GlobalWay объединяет поколение опытных людей, готовых взять свою жизнь в свои руки.'
      },
      mission: {
        title: 'Наша Миссия',
        text: 'Построить справедливую экономическую модель для всех участников экосистемы.'
      },
      goals: {
        title: 'Цели Клуба',
        text: 'Создание личной экосистемы дохода и инструменты саморазвития.'
      },
      roadmap: {
        title: 'Дорожная Карта',
        text: '2025: Запуск платформы и 8 революционных проектов.'
      },
      projects: {
        title: 'Наши Проекты',
        text: 'KardGift, GlobalTub, GlobalMarket и другие проекты экосистемы.'
      }
    };
  }
  
  // Новый метод для обновления языка
  updateLanguage(newLang) {
    this.currentLang = newLang;
    this.loadTranslations();
    this.updateIntroTexts();
  }
  
  updateIntroTexts() {
    // Обновляем тексты в карточках (пока модальное окно не открыто)
    // Если модальное окно открыто, обновляем и его
    const modal = document.getElementById('cosmic-modal');
    if (modal && modal.classList.contains('active')) {
      const currentTopic = modal.dataset.currentTopic;
      if (currentTopic) {
        this.showModal(currentTopic);
      }
    }
  }
  
  // Обновленный метод showModal
  showModal(topic) {
    const data = this.introData[topic];
    if (!data) return;
    
    const titleElement = document.getElementById('modal-title');
    const textElement = document.getElementById('modal-text');
    const modalElement = document.getElementById('cosmic-modal');
    
    if (titleElement) titleElement.textContent = data.title;
    if (textElement) textElement.textContent = data.text;
    if (modalElement) {
      modalElement.classList.add('active');
      modalElement.dataset.currentTopic = topic; // Запоминаем текущую тему
    }
  }
  
  hideModal() {
    const modalElement = document.getElementById('cosmic-modal');
    if (modalElement) {
      modalElement.classList.remove('active');
      delete modalElement.dataset.currentTopic;
    }
  }
  
  // Остальные методы остаются без изменений...
  init() {
    this.bindEvents();
    this.createStarsAnimation();
    this.setupLanguageListener();
  }
  
  // Новый метод для прослушивания смены языка
  setupLanguageListener() {
    // Слушаем событие смены языка из основного приложения
    document.addEventListener('languageChanged', (event) => {
      this.updateLanguage(event.detail.language);
    });
    
    // Также можем слушать изменения в localStorage
    window.addEventListener('storage', (event) => {
      if (event.key === 'selectedLanguage') {
        this.updateLanguage(event.newValue);
      }
    });
  }
  
  bindEvents() {
    document.querySelectorAll('.cosmic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const topic = e.currentTarget.dataset.topic;
        this.showModal(topic);
      });
    });
    
    document.getElementById('skip-intro')?.addEventListener('click', () => {
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
        
        if (window.globalWayApp && typeof window.globalWayApp.afterIntroHidden === 'function') {
          window.globalWayApp.afterIntroHidden();
        }
      }, 1000);
    }
  }
  
  createStarsAnimation() {
    const starsContainer = document.querySelector('.stars-background');
    if (!starsContainer) return;
    
    for (let i = 0; i < 50; i++) {
      const star = document.createElement('div');
      star.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: white;
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: twinkle ${2 + Math.random() * 3}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
      `;
      starsContainer.appendChild(star);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cosmic-intro')) {
    window.cosmicIntro = new CosmicIntro();
  }
});
