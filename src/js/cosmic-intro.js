// cosmic-intro.js
class CosmicIntro {
  constructor() {
    this.introData = {
      club: {
        title: 'Клуб GlobalWay',
        text: 'GlobalWay - это децентрализованная экосистема, объединяющая технологии блокчейн с реальными возможностями для развития и заработка. Наш клуб создает глобальное сообщество единомышленников, стремящихся к финансовой свободе и технологическому прогрессу.'
      },
      mission: {
        title: 'Миссия Клуба',
        text: 'Наша миссия - сделать блокчейн технологии доступными каждому, создать справедливую экономическую модель, где каждый участник может развиваться и получать вознаграждение за свой вклад в экосистему. Мы строим мост между традиционными финансами и децентрализованным будущим.'
      },
      goals: {
        title: 'Цели клуба',
        text: 'Создание устойчивой экосистемы с матричной структурой вознаграждений, развитие 8 ключевых проектов, формирование глобального сообщества активных участников, внедрение инновационных DeFi решений и обеспечение долгосрочной стабильности платформы.'
      },
      roadmap: {
        title: 'Дорожная карта',
        text: 'Q1 2025: Запуск основной платформы и матричной системы. Q2 2025: Развертывание первых 3 проектов экосистемы. Q3 2025: Интеграция DeFi инструментов и стейкинга. Q4 2025: Глобальная экспансия и партнерства. 2026: Полная децентрализация управления.'
      },
      projects: {
        title: 'Проекты',
        text: 'В разработке 8 революционных проектов: KardGift (подарочные карты), GlobalTub (видеоплатформа), GlobalMarket (маркетплейс), GlobalPay (платежи), GlobalAI (ИИ решения), GlobalVPN, GlobalCloud и GlobalExchange. Каждый проект интегрирован с токеном GWT.'
      }
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.createStarsAnimation();
  }
  
  bindEvents() {
    // Клики по космическим карточкам
    document.querySelectorAll('.cosmic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const topic = e.currentTarget.dataset.topic;
        this.showModal(topic);
      });
    });
    
    // Пропуск интро
    document.getElementById('skip-intro')?.addEventListener('click', () => {
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
  }
  
  showModal(topic) {
    const data = this.introData[topic];
    if (!data) return;
    
    const titleElement = document.getElementById('modal-title');
    const textElement = document.getElementById('modal-text');
    const modalElement = document.getElementById('cosmic-modal');
    
    if (titleElement) titleElement.textContent = data.title;
    if (textElement) textElement.textContent = data.text;
    if (modalElement) modalElement.classList.add('active');
  }
  
  hideModal() {
    const modalElement = document.getElementById('cosmic-modal');
    if (modalElement) {
      modalElement.classList.remove('active');
    }
  }
  
  hideIntro() {
    const intro = document.getElementById('cosmic-intro');
    if (intro) {
      intro.classList.add('hidden');
      
      setTimeout(() => {
        intro.style.display = 'none';
        // Показать основное приложение
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          appContainer.style.display = 'block';
        }
        
        // Запустить основное приложение после скрытия интро
        if (window.globalWayApp && typeof window.globalWayApp.afterIntroHidden === 'function') {
          window.globalWayApp.afterIntroHidden();
        }
      }, 1000);
    }
  }
  
  createStarsAnimation() {
    // Создание дополнительных анимированных звезд
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Проверяем наличие элементов космического интро
  if (document.getElementById('cosmic-intro')) {
    window.cosmicIntro = new CosmicIntro();
  }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CosmicIntro;
}
